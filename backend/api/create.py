from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.db import get_db
from models import Pet, PetState, PetLifeStatus
from config.settings import HEALTH_MAX, ACTION_COSTS
from services.economy import EconomyService
import logging
from services.prompt_store import generate_and_store_prompts
from services.stages import StageLifecycleService
from .validators import CreatePetRequest

logger = logging.getLogger(__name__)

from api.schemas.pet import CreatePetResponse

router = APIRouter(prefix="/create", tags=["pet"])

@router.post("", response_model=CreatePetResponse)
async def create_pet(user_id: str, name: str, override: bool = False, request: Request = None, db: AsyncSession = Depends(get_db)):
    """
    Создает нового питомца для пользователя.
    Автоматически создает кошелек, если его нет.
    """
    try:
        # Валидация имени и user_id (строгая проверка английских букв)
        try:
            CreatePetRequest(user_id=user_id, name=name)
        except Exception as e:
            raise HTTPException(status_code=422, detail=str(e))

        # Ищем всех живых питомцев
        result = await db.execute(
            select(Pet).where(Pet.user_id == user_id, Pet.status == PetLifeStatus.alive)
        )
        alive_pets = result.scalars().all()

        # Логика оплаты: если есть живые и среди них есть не-adult → создание платное
        non_adult_alive = [p for p in alive_pets if p.state != PetState.adult]
        is_paid_creation_required = len(alive_pets) > 0 and len(non_adult_alive) > 0

        # Уникальность имени в рамках пользователя
        same_name = await db.execute(
            select(Pet).where(Pet.user_id == user_id, Pet.name == name)
        )
        if same_name.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Питомец с таким именем у вас уже существует")
        
        # Создаем кошелек для пользователя (если его нет)
        wallet = await EconomyService.create_user_wallet(db, user_id)

        # Определяем стоимость создания питомца (если требуется)
        paid_cost = ACTION_COSTS.get('paid_pet', 500) if is_paid_creation_required else 0

        # Если требуется платное создание — списываем монеты
        if is_paid_creation_required:
            # Проверяем достаточность средств
            if wallet.coins < paid_cost:
                raise HTTPException(status_code=400, detail=f"Недостаточно монет для создания питомца. Требуется: {paid_cost}, доступно: {wallet.coins}")
            spent = await EconomyService.spend_coins(
                db=db,
                user_id=user_id,
                amount=paid_cost,
                description=f"Платное создание нового питомца ({name})",
                transaction_data={"action": "create_pet", "pet_name": name}
            )
            if not spent:
                raise HTTPException(status_code=500, detail="Не удалось списать монеты за создание питомца")
            
            # Обновляем объект wallet после транзакции
            await db.refresh(wallet)
        
        # Создание нового питомца
        new_pet = Pet(user_id=user_id, name=name, state=PetState.egg, health=HEALTH_MAX, status=PetLifeStatus.alive)
        db.add(new_pet)
        await db.commit()
        await db.refresh(new_pet)

        # Подготовка стадий (сохранение creature_json и всех промтов в БД)
        try:
            await StageLifecycleService.prepare_on_create(db, user_id, name)
        except Exception as e:
            logger.warning(f"Подготовка стадий/изображения не удалась: {e}")
        
        # Проверяем достижение "Первый питомец"
        await EconomyService.check_achievement(
            db=db,
            user_id=user_id,
            achievement_type="first_pet",
            title="Первый питомец",
            description="Создал своего первого питомца!",
            coins_reward=50
        )
        
        # Инвалидируем кеш после создания нового питомца
        try:
            from cache.redis_client import invalidate_pets_cache, invalidate_summary_cache, invalidate_wallet_cache
            await invalidate_pets_cache(user_id)
            await invalidate_summary_cache(user_id)
            await invalidate_wallet_cache(user_id)
        except Exception as e:
            logger.warning(f"Ошибка инвалидации кеша после create_pet: {e}")
        
        # Отправляем обновление через WebSocket
        try:
            from api.websocket import broadcast_pet_update, broadcast_wallet_update
            # Получаем обновленные данные для broadcast
            from api.summary import get_all_pets_summary_internal
            pets_data = await get_all_pets_summary_internal(user_id, db)
            await broadcast_pet_update(user_id, "pet_created", {
                "pet_id": new_pet.id,
                "pet_name": new_pet.name,
                "state": new_pet.state.value,
            })
            await broadcast_pet_update(user_id, "pets_update", pets_data)
            await broadcast_wallet_update(user_id, {
                "coins": wallet.coins,
                "total_earned": wallet.total_earned,
                "total_spent": wallet.total_spent
            })
        except Exception as e:
            logger.warning(f"Ошибка отправки WebSocket обновления: {e}")
        
        # URL эндпоинта получения изображения (абсолютный URL для корректной загрузки с фронтенда)
        from config.settings import get_pet_image_api_url, API_BASE_URL
        base_url = API_BASE_URL if request is not None else None
        image_url = get_pet_image_api_url(user_id, name, base_url)
        
        return {
            "id": new_pet.id,
            "user_id": new_pet.user_id,
            "name": new_pet.name,
            "state": new_pet.state.value,
            "health": new_pet.health,
            "image_url": image_url,
            "wallet": {
                "coins": wallet.coins,
                "total_earned": wallet.total_earned,
                "total_spent": wallet.total_spent
            },
            "paid": is_paid_creation_required,
            "paid_cost": paid_cost
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания питомца: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания питомца: {str(e)}") 