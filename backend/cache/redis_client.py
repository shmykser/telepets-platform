"""
Модуль для работы с Redis кешированием.

Предоставляет асинхронные функции для кеширования данных питомцев,
кошельков и других сущностей с поддержкой TTL и инвалидации кеша.
"""
import json
import hashlib
import logging
from typing import Optional, Any, Dict
from datetime import datetime

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
    RedisType = redis.Redis  # Для типизации
except ImportError:
    REDIS_AVAILABLE = False
    RedisType = None
    logging.warning("Redis библиотека не установлена. Кеширование отключено.")

from config.settings import (
    REDIS_URL,
    REDIS_ENABLED,
    CACHE_KEY_PREFIX,
    CACHE_TTL_PETS,
    CACHE_TTL_WALLET,
    CACHE_TTL_SUMMARY,
)

logger = logging.getLogger(__name__)

# Глобальный экземпляр Redis клиента
_redis_client: Optional[Any] = None


async def get_redis() -> Optional[Any]:
    """
    Получает или создает экземпляр Redis клиента.
    
    Returns:
        Redis клиент или None, если Redis недоступен или отключен.
    """
    global _redis_client
    
    # Если Redis отключен в настройках
    if not REDIS_ENABLED:
        return None
    
    # Если библиотека не установлена
    if not REDIS_AVAILABLE:
        return None
    
    # Если клиент уже создан - возвращаем его
    if _redis_client is not None:
        try:
            # Проверяем соединение
            await _redis_client.ping()
            return _redis_client
        except Exception as e:
            logger.warning(f"Redis соединение разорвано, переподключение: {e}")
            _redis_client = None
    
    # Создаем новый клиент
    try:
        _redis_client = await redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
        )
        # Проверяем соединение
        await _redis_client.ping()
        logger.info(f"Redis подключен: {REDIS_URL}")
        return _redis_client
    except Exception as e:
        logger.error(f"Ошибка подключения к Redis: {e}. Кеширование отключено.")
        _redis_client = None
        return None


async def close_redis():
    """Закрывает соединение с Redis."""
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
            logger.info("Redis соединение закрыто")
        except Exception as e:
            logger.warning(f"Ошибка закрытия Redis соединения: {e}")
        finally:
            _redis_client = None


def _build_key(key_type: str, user_id: str, *args: str) -> str:
    """
    Строит ключ для кеша с префиксом.
    
    Args:
        key_type: Тип ключа (pets, wallet, summary)
        user_id: ID пользователя
        *args: Дополнительные части ключа
    
    Returns:
        Полный ключ кеша
    """
    parts = [CACHE_KEY_PREFIX, key_type, user_id] + list(args)
    return ":".join(filter(None, parts))


def _serialize_value(value: Any) -> str:
    """
    Сериализует значение для хранения в Redis.
    
    Args:
        value: Значение для сериализации
    
    Returns:
        JSON строка
    """
    # Используем default=str для обработки datetime и других типов
    return json.dumps(value, default=str, ensure_ascii=False)


def _deserialize_value(value: str) -> Any:
    """
    Десериализует значение из Redis.
    
    Args:
        value: JSON строка из Redis
    
    Returns:
        Десериализованное значение
    """
    return json.loads(value)


def _calculate_etag(data: Any) -> str:
    """
    Вычисляет ETag для данных на основе их содержимого.
    
    Args:
        data: Данные для вычисления ETag
    
    Returns:
        ETag (MD5 хеш)
    """
    # Сортируем ключи для стабильного хеша
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.md5(serialized.encode()).hexdigest()


# ========== Функции для работы с кешем питомцев ==========

async def get_cached_pets(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Получает данные всех питомцев из кеша.
    
    Args:
        user_id: ID пользователя
    
    Returns:
        Словарь с данными питомцев и ETag, или None если нет в кеше
    """
    r = await get_redis()
    if r is None:
        return None
    
    try:
        key = _build_key("pets", "all", user_id)
        cached_data = await r.get(key)
        
        if cached_data:
            return _deserialize_value(cached_data)
        return None
    except Exception as e:
        logger.error(f"Ошибка чтения кеша питомцев для {user_id}: {e}")
        return None


async def set_cached_pets(user_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
    """
    Сохраняет данные всех питомцев в кеш.
    
    Args:
        user_id: ID пользователя
        data: Данные питомцев
        ttl: Время жизни в секундах (по умолчанию CACHE_TTL_PETS)
    
    Returns:
        True если успешно, False если ошибка
    """
    r = await get_redis()
    if r is None:
        return False
    
    try:
        # Вычисляем ETag для данных
        etag = _calculate_etag(data)
        
        # Сохраняем данные с ETag
        cache_data = {
            "data": data,
            "etag": etag,
            "cached_at": datetime.utcnow().isoformat(),
        }
        
        key = _build_key("pets", "all", user_id)
        ttl = ttl or CACHE_TTL_PETS
        
        await r.setex(
            key,
            ttl,
            _serialize_value(cache_data)
        )
        
        logger.debug(f"Кеш питомцев сохранен для {user_id}, TTL: {ttl}с")
        return True
    except Exception as e:
        logger.error(f"Ошибка сохранения кеша питомцев для {user_id}: {e}")
        return False


async def invalidate_pets_cache(user_id: str) -> bool:
    """
    Инвалидирует кеш питомцев для пользователя.
    
    Args:
        user_id: ID пользователя
    
    Returns:
        True если успешно
    """
    r = await get_redis()
    if r is None:
        return False
    
    try:
        # Удаляем все ключи, связанные с питомцами пользователя
        key_pattern = _build_key("pets", "*", user_id) + "*"
        keys = []
        
        async for key in r.scan_iter(match=key_pattern):
            keys.append(key)
        
        if keys:
            await r.delete(*keys)
            logger.debug(f"Кеш питомцев инвалидирован для {user_id}, удалено ключей: {len(keys)}")
        
        # Также инвалидируем summary
        await invalidate_summary_cache(user_id)
        
        return True
    except Exception as e:
        logger.error(f"Ошибка инвалидации кеша питомцев для {user_id}: {e}")
        return False


# ========== Функции для работы с кешем summary ==========

async def get_cached_summary(user_id: str) -> Optional[Dict[str, Any]]:
    """Получает summary данные из кеша."""
    r = await get_redis()
    if r is None:
        return None
    
    try:
        key = _build_key("summary", user_id)
        cached_data = await r.get(key)
        
        if cached_data:
            return _deserialize_value(cached_data)
        return None
    except Exception as e:
        logger.error(f"Ошибка чтения кеша summary для {user_id}: {e}")
        return None


async def set_cached_summary(user_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
    """Сохраняет summary данные в кеш."""
    r = await get_redis()
    if r is None:
        return False
    
    try:
        etag = _calculate_etag(data)
        cache_data = {
            "data": data,
            "etag": etag,
            "cached_at": datetime.utcnow().isoformat(),
        }
        
        key = _build_key("summary", user_id)
        ttl = ttl or CACHE_TTL_SUMMARY
        
        await r.setex(key, ttl, _serialize_value(cache_data))
        return True
    except Exception as e:
        logger.error(f"Ошибка сохранения кеша summary для {user_id}: {e}")
        return False


async def invalidate_summary_cache(user_id: str) -> bool:
    """Инвалидирует кеш summary для пользователя."""
    r = await get_redis()
    if r is None:
        return False
    
    try:
        key = _build_key("summary", user_id)
        await r.delete(key)
        return True
    except Exception as e:
        logger.error(f"Ошибка инвалидации кеша summary для {user_id}: {e}")
        return False


# ========== Функции для работы с кешем кошелька ==========

async def get_cached_wallet(user_id: str) -> Optional[Dict[str, Any]]:
    """Получает данные кошелька из кеша."""
    r = await get_redis()
    if r is None:
        return None
    
    try:
        key = _build_key("wallet", user_id)
        cached_data = await r.get(key)
        
        if cached_data:
            return _deserialize_value(cached_data)
        return None
    except Exception as e:
        logger.error(f"Ошибка чтения кеша кошелька для {user_id}: {e}")
        return None


async def set_cached_wallet(user_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
    """Сохраняет данные кошелька в кеш."""
    r = await get_redis()
    if r is None:
        return False
    
    try:
        etag = _calculate_etag(data)
        cache_data = {
            "data": data,
            "etag": etag,
            "cached_at": datetime.utcnow().isoformat(),
        }
        
        key = _build_key("wallet", user_id)
        ttl = ttl or CACHE_TTL_WALLET
        
        await r.setex(key, ttl, _serialize_value(cache_data))
        return True
    except Exception as e:
        logger.error(f"Ошибка сохранения кеша кошелька для {user_id}: {e}")
        return False


async def invalidate_wallet_cache(user_id: str) -> bool:
    """Инвалидирует кеш кошелька для пользователя."""
    r = await get_redis()
    if r is None:
        return False
    
    try:
        key = _build_key("wallet", user_id)
        await r.delete(key)
        return True
    except Exception as e:
        logger.error(f"Ошибка инвалидации кеша кошелька для {user_id}: {e}")
        return False


# ========== Утилиты ==========

async def clear_all_cache(user_id: Optional[str] = None) -> bool:
    """
    Очищает весь кеш или кеш конкретного пользователя.
    
    Args:
        user_id: ID пользователя (если None - очищает весь кеш)
    
    Returns:
        True если успешно
    """
    r = await get_redis()
    if r is None:
        return False
    
    try:
        if user_id:
            # Очищаем кеш конкретного пользователя
            pattern = _build_key("*", "*", user_id) + "*"
            keys = []
            async for key in r.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await r.delete(*keys)
                logger.info(f"Кеш очищен для пользователя {user_id}, удалено ключей: {len(keys)}")
        else:
            # Очищаем весь кеш приложения
            pattern = f"{CACHE_KEY_PREFIX}:*"
            keys = []
            async for key in r.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await r.delete(*keys)
                logger.info(f"Весь кеш очищен, удалено ключей: {len(keys)}")
        
        return True
    except Exception as e:
        logger.error(f"Ошибка очистки кеша: {e}")
        return False


async def get_cache_stats(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Получает статистику кеша.
    
    Args:
        user_id: ID пользователя (опционально)
    
    Returns:
        Словарь со статистикой
    """
    r = await get_redis()
    if r is None:
        return {"enabled": False, "error": "Redis недоступен"}
    
    try:
        pattern = f"{CACHE_KEY_PREFIX}:*"
        if user_id:
            pattern = _build_key("*", "*", user_id) + "*"
        
        keys = []
        async for key in r.scan_iter(match=pattern):
            keys.append(key)
        
        # Получаем TTL для ключей
        ttls = []
        for key in keys[:10]:  # Ограничиваем для производительности
            ttl = await r.ttl(key)
            if ttl > 0:
                ttls.append(ttl)
        
        return {
            "enabled": True,
            "keys_count": len(keys),
            "avg_ttl": sum(ttls) / len(ttls) if ttls else 0,
            "min_ttl": min(ttls) if ttls else 0,
            "max_ttl": max(ttls) if ttls else 0,
        }
    except Exception as e:
        logger.error(f"Ошибка получения статистики кеша: {e}")
        return {"enabled": True, "error": str(e)}

