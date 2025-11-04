from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from core.db import get_db
from models import Pet, PetState, PetLifeStatus, User, Wallet
import logging
from datetime import datetime, timedelta
from config.settings import STAGE_TRANSITION_INTERVAL, STAGE_ORDER, HEALTH_MAX, INITIAL_COINS
from cache.redis_client import get_cached_summary, set_cached_summary, get_cached_pets, set_cached_pets, invalidate_pets_cache, invalidate_summary_cache
from config.settings import get_redis_config
import hashlib
from typing import Any
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/summary", tags=["Pet"])

# Получаем конфигурацию кеша
_redis_config = get_redis_config()

def generate_etag(data: Any) -> str:
    """Генерирует ETag для данных."""
    import json
    if isinstance(data, (dict, list)):
        data_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
    else:
        data_str = str(data)
    return hashlib.md5(data_str.encode('utf-8')).hexdigest()

async def get_cached_data(key: str):
    """Получает данные из кеша по ключу."""
    # Разбираем ключ для использования существующих функций
    parts = key.split(":")
    if len(parts) >= 3:
        key_type = parts[1]  # summary или pets
        user_id = parts[2] if len(parts) > 2 else parts[-1]
        
        if key_type == "summary":
            if "all" in key:
                # Это summary:all
                cached = await get_cached_pets(user_id)
            else:
                cached = await get_cached_summary(user_id)
            
            if cached and isinstance(cached, dict):
                if "data" in cached:
                    etag = cached.get("etag")
                    return cached["data"], etag
                return cached, generate_etag(cached)
    return None, None

async def set_cached_data(key: str, data: Any, ttl: int):
    """Сохраняет данные в кеш по ключу."""
    parts = key.split(":")
    if len(parts) >= 3:
        key_type = parts[1]
        user_id = parts[2] if len(parts) > 2 else parts[-1]
        
        if key_type == "summary":
            if "all" in key:
                await set_cached_pets(user_id, data, ttl)
            else:
                await set_cached_summary(user_id, data, ttl)

def calculate_time_to_next_stage(current_stage: str, created_at: datetime, updated_at: datetime | None) -> int:
    """
    Рассчитывает время до следующей стадии в секундах.
    """
    try:
        # Находим индекс текущей стадии
        current_index = STAGE_ORDER.index(current_stage)
        
        # Если это последняя стадия, возвращаем 0
        if current_index >= len(STAGE_ORDER) - 1:
            return 0
        
        # От какого времени считать: начало текущей стадии = updated_at (если уже были апдейты) иначе created_at
        stage_started_at = updated_at or created_at
        # Рассчитываем время начала стадии + интервал перехода
        transition_time = stage_started_at + timedelta(seconds=STAGE_TRANSITION_INTERVAL)
        
        # Вычисляем оставшееся время
        now = datetime.utcnow()
        remaining_seconds = max(0, int((transition_time - now).total_seconds()))
        
        return remaining_seconds
    except Exception as e:
        logger.error(f"Ошибка расчета времени до следующей стадии: {e}")
        return 0

async def get_summary_internal(user_id: str, db: AsyncSession):
    """
    Внутренняя функция для получения данных питомца (используется для кеширования и WebSocket).
    Оптимизирована: использует JOIN для получения Wallet вместе с Pet.
    """
    # Оптимизированный запрос: получаем питомцев и кошелек одним JOIN запросом
    # Сначала получаем всех питомцев
    result = await db.execute(
        select(Pet).where(Pet.user_id == user_id).order_by(Pet.created_at.desc())
    )
    pets = result.scalars().all()
    
    # Получаем кошелек пользователя (можем оптимизировать через JOIN в будущем)
    # Для summary достаточно одного запроса Wallet, так как он один на пользователя
    wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id)
    )
    wallet = wallet_result.scalar_one_or_none()
    
    # Если питомцев нет вообще
    if not pets:
        logger.info(f"Питомцы для пользователя {user_id} не найдены")
        
        return {
            "status": "no_pets",
            "message": "У вас пока нет питомцев. Создайте первого!",
            "user_id": user_id,
            "total_pets": 0,
            "alive_pets": 0,
            "dead_pets": 0,
            "wallet": {
                "coins": wallet.coins if wallet else INITIAL_COINS,
                "total_earned": wallet.total_earned if wallet else INITIAL_COINS,
                "total_spent": wallet.total_spent if wallet else 0
            }
        }
    
    # Проверяем, есть ли живые питомцы
    alive_pets = [pet for pet in pets if pet.status == PetLifeStatus.alive]
    dead_pets = [pet for pet in pets if pet.status == PetLifeStatus.dead]
    
    # Если есть только мертвые питомцы
    if not alive_pets:
        logger.info(f"У пользователя {user_id} только мертвые питомцы")
        
        return {
            "status": "all_dead",
            "message": "Все ваши питомцы умерли. Создайте нового!",
            "user_id": user_id,
            "total_pets": len(pets),
            "alive_pets": 0,
            "dead_pets": len(dead_pets),
            "wallet": {
                "coins": wallet.coins if wallet else INITIAL_COINS,
                "total_earned": wallet.total_earned if wallet else INITIAL_COINS,
                "total_spent": wallet.total_spent if wallet else 0
            }
        }
    
    # Берем самого нового живого питомца
    active_pet = alive_pets[0]
    
    # Рассчитываем время до следующей стадии
    time_to_next_stage = calculate_time_to_next_stage(
        active_pet.state.value,
        active_pet.created_at.replace(tzinfo=None),
        active_pet.updated_at.replace(tzinfo=None) if active_pet.updated_at else None,
    )
    
    # Определяем жизненный статус питомца
    life_status = active_pet.status.value
    
    # Определяем следующую стадию
    current_index = STAGE_ORDER.index(active_pet.state.value)
    next_stage = STAGE_ORDER[current_index + 1] if current_index < len(STAGE_ORDER) - 1 else active_pet.state.value
    
    # URL изображения - используем R2 напрямую, если есть, иначе fallback на proxy URL
    state_key = active_pet.state.value
    if state_key == 'egg':
        direct_url = getattr(active_pet, 'image_egg_url', None)
    elif state_key == 'baby':
        direct_url = getattr(active_pet, 'image_baby_url', None)
    else:
        direct_url = getattr(active_pet, 'image_adult_url', None)
    
    if direct_url:
        image_url = direct_url
    else:
        from config.settings import API_BASE_URL
        base_url = API_BASE_URL
        image_path = f"/pet-images/{active_pet.user_id}/{active_pet.name}"
        image_url = f"{base_url}{image_path}"
    
    # Подготовка расширенных данных
    creature = None
    try:
        creature = json.loads(active_pet.creature_json) if active_pet.creature_json else None
    except Exception:
        creature = None

    prompts = {
        "egg_en": active_pet.prompt_egg_en,
        "baby_en": active_pet.prompt_baby_en,
        "adult_en": active_pet.prompt_adult_en,
    }

    return {
        "status": "success",
        "id": active_pet.id,
        "user_id": active_pet.user_id,
        "name": active_pet.name,
        "state": active_pet.state.value,
        "health": active_pet.health,
        "life_status": life_status,
        "next_stage": next_stage,
        "time_to_next_stage_seconds": time_to_next_stage,
        "image_url": image_url,
        "created_at": active_pet.created_at.isoformat() + "Z",
        "updated_at": active_pet.updated_at.isoformat() + "Z" if active_pet.updated_at else active_pet.created_at.isoformat() + "Z",
        "total_pets": len(pets),
        "alive_pets": len(alive_pets),
        "dead_pets": len(dead_pets),
        "selected_pet_type": "alive",
        "creature": creature,
        "prompts": prompts,
        "wallet": {
            "coins": wallet.coins if wallet else INITIAL_COINS,
            "total_earned": wallet.total_earned if wallet else INITIAL_COINS,
            "total_spent": wallet.total_spent if wallet else 0
        }
    }

@router.get("")
async def get_summary(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Получает информацию о питомце пользователя из базы данных.
    Поддерживает кеширование через Redis и ETag для условных запросов.
    """
    try:
        # Проверяем кеш
        cache_key = f"{_redis_config['key_prefix']}:summary:{user_id}"
        cache_ttl = _redis_config['ttl']['summary']
        
        # Проверяем ETag из заголовка запроса
        if_none_match = request.headers.get("If-None-Match")
        
        # Пытаемся получить данные из кеша
        cached_data, cached_etag = await get_cached_data(cache_key)
        if cached_data and if_none_match and cached_etag == if_none_match:
            # Данные не изменились - возвращаем 304 Not Modified
            from fastapi.responses import Response
            return Response(status_code=304, headers={"ETag": cached_etag})
        
        if cached_data and not if_none_match:
            # Возвращаем закешированные данные
            logger.debug(f"Cache hit для summary:{user_id}")
            # Генерируем ETag для ответа
            etag = cached_etag or generate_etag(cached_data)
            from fastapi.responses import JSONResponse
            response = JSONResponse(content=cached_data)
            response.headers["ETag"] = etag
            response.headers["Cache-Control"] = f"public, max-age={cache_ttl}"
            return response
        
        # Данных нет в кеше или они изменились - получаем из БД
        logger.debug(f"Cache miss для summary:{user_id}")
        data = await get_summary_internal(user_id, db)
        
        # Сохраняем в кеш
        await set_cached_data(cache_key, data, cache_ttl)
        
        # Генерируем ETag
        etag = generate_etag(data)
        
        # Возвращаем ответ с ETag
        from fastapi.responses import JSONResponse
        response = JSONResponse(content=data)
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = f"public, max-age={cache_ttl}"
        return response
    except Exception as e:
        logger.error(f"Ошибка получения питомца: {e}")
        # Возвращаем безопасный ответ вместо 500
        return {
            "status": "no_pets",
            "message": "У вас пока нет питомцев. Создайте первого!",
            "user_id": user_id,
            "total_pets": 0,
            "alive_pets": 0,
            "dead_pets": 0,
            "wallet": {
                "coins": INITIAL_COINS,
                "total_earned": INITIAL_COINS,
                "total_spent": 0
            }
        }

async def get_all_pets_summary_internal(user_id: str, db: AsyncSession):
    """
    Внутренняя функция для получения данных всех питомцев (используется для кеширования и WebSocket).
    Оптимизирована: получает кошелек одним запросом, используется для всех питомцев.
    """
    # Отладочная информация
    logger.info(f"🔍 Searching for pets for user_id: {user_id}")
    
    # Оптимизированный запрос: получаем кошелек один раз для всех питомцев
    wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id)
    )
    wallet = wallet_result.scalar_one_or_none()
    
    # Получаем всех питомцев пользователя
    result = await db.execute(
        select(Pet).where(Pet.user_id == user_id).order_by(Pet.created_at.desc())
    )
    pets = result.scalars().all()
    
    logger.info(f"🔍 Found {len(pets)} pets for user {user_id}")
    
    # Если питомцев нет
    if not pets:
        logger.info(f"Питомцы для пользователя {user_id} не найдены")
        return {
            "status": "no_pets",
            "message": "У вас пока нет питомцев. Создайте первого!",
            "user_id": user_id,
            "pets": [],
            "total_pets": 0,
            "alive_pets": 0,
            "dead_pets": 0,
            "wallet": {
                "coins": INITIAL_COINS,
                "total_earned": INITIAL_COINS,
                "total_spent": 0
            }
        }
    
    # Формируем список питомцев
    pets_data = []
    alive_pets = 0
    dead_pets = 0
    
    # Используем nginx proxy URL вместо прямого backend URL
    from config.settings import API_BASE_URL
    base_url = API_BASE_URL
    for pet in pets:
        status = pet.status.value
        if pet.status == PetLifeStatus.alive:
            alive_pets += 1
        else:
            dead_pets += 1
            
        # Расширенные данные для каждого питомца
        try:
            creature = json.loads(pet.creature_json) if pet.creature_json else None
        except Exception:
            creature = None
        prompts = {
            "egg_en": pet.prompt_egg_en,
            "baby_en": pet.prompt_baby_en,
            "adult_en": pet.prompt_adult_en,
        }

        # Рассчитываем таймер перехода стадии для каждого питомца (0 для последней стадии и мёртвых)
        try:
            time_to_next_stage = calculate_time_to_next_stage(
                pet.state.value,
                pet.created_at.replace(tzinfo=None),
                pet.updated_at.replace(tzinfo=None) if pet.updated_at else None,
            ) if pet.status == PetLifeStatus.alive else 0
        except Exception:
            time_to_next_stage = 0

        # Используем R2 URL напрямую, если есть, иначе fallback на proxy URL
        state_key = pet.state.value
        if state_key == 'egg':
            direct_url = getattr(pet, 'image_egg_url', None)
        elif state_key == 'baby':
            direct_url = getattr(pet, 'image_baby_url', None)
        else:
            direct_url = getattr(pet, 'image_adult_url', None)
        
        # Если есть прямой R2 URL - используем его, иначе proxy URL
        if direct_url:
            image_url = direct_url
        else:
            image_path = f"/pet-images/{pet.user_id}/{pet.name}"
            image_url = f"{base_url}{image_path}"
        
        pets_data.append({
            "id": pet.id,
            "name": pet.name,
            "state": pet.state.value,
            "health": pet.health,
            "status": status,
            "time_to_next_stage_seconds": time_to_next_stage,
            "created_at": pet.created_at.isoformat() + "Z",
            "updated_at": pet.updated_at.isoformat() + "Z" if pet.updated_at else pet.created_at.isoformat() + "Z",
            "creature": creature,
            "prompts": prompts,
            "image_url": image_url,
        })
    
    # Проверяем, есть ли живые питомцы
    if alive_pets == 0:
        return {
            "status": "all_dead",
            "message": "Все ваши питомцы умерли. Создайте нового!",
            "user_id": user_id,
            "pets": pets_data,
            "total_pets": len(pets),
            "alive_pets": alive_pets,
            "dead_pets": dead_pets,
            "wallet": {
                "coins": wallet.coins if wallet else INITIAL_COINS,
                "total_earned": wallet.total_earned if wallet else INITIAL_COINS,
                "total_spent": wallet.total_spent if wallet else 0
            }
        }
    
    return {
        "status": "success",
        "user_id": user_id,
        "pets": pets_data,
        "total_pets": len(pets),
        "alive_pets": alive_pets,
        "dead_pets": dead_pets,
        "wallet": {
            "coins": wallet.coins if wallet else INITIAL_COINS,
            "total_earned": wallet.total_earned if wallet else INITIAL_COINS,
            "total_spent": wallet.total_spent if wallet else 0
        }
    }

@router.get("/all")
async def get_all_pets_summary(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Получает сводку всех питомцев пользователя из базы данных.
    Поддерживает кеширование через Redis и ETag для условных запросов.
    """
    try:
        # Проверяем кеш
        cache_key = f"{_redis_config['key_prefix']}:summary:all:{user_id}"
        cache_ttl = _redis_config['ttl']['summary']
        
        # Проверяем ETag из заголовка запроса
        if_none_match = request.headers.get("If-None-Match")
        
        # Пытаемся получить данные из кеша
        cached_data, cached_etag = await get_cached_data(cache_key)
        if cached_data and if_none_match and cached_etag == if_none_match:
            # Данные не изменились - возвращаем 304 Not Modified
            from fastapi.responses import Response
            return Response(status_code=304, headers={"ETag": cached_etag})
        
        if cached_data and not if_none_match:
            # Возвращаем закешированные данные
            logger.debug(f"Cache hit для summary:all:{user_id}")
            # Генерируем ETag для ответа
            etag = cached_etag or generate_etag(cached_data)
            from fastapi.responses import JSONResponse
            response = JSONResponse(content=cached_data)
            response.headers["ETag"] = etag
            response.headers["Cache-Control"] = f"public, max-age={cache_ttl}"
            return response
        
        # Данных нет в кеше или они изменились - получаем из БД
        logger.debug(f"Cache miss для summary:all:{user_id}")
        data = await get_all_pets_summary_internal(user_id, db)
        
        # Сохраняем в кеш
        await set_cached_data(cache_key, data, cache_ttl)
        
        # Генерируем ETag
        etag = generate_etag(data)
        
        # Возвращаем ответ с ETag
        from fastapi.responses import JSONResponse
        response = JSONResponse(content=data)
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = f"public, max-age={cache_ttl}"
        return response
    except Exception as e:
        logger.error(f"Ошибка получения сводки питомцев: {e}")
        # Возвращаем безопасный ответ вместо 500
        return {
            "status": "no_pets",
            "message": "У вас пока нет питомцев. Создайте первого!",
            "user_id": user_id,
            "pets": [],
            "total_pets": 0,
            "alive_pets": 0,
            "dead_pets": 0,
            "wallet": {
                "coins": INITIAL_COINS,
                "total_earned": INITIAL_COINS,
                "total_spent": 0
            }
        }