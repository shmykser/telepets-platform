"""
Модуль кеширования данных.

Предоставляет функции для работы с Redis кешированием.
"""

from .redis_client import (
    get_redis,
    close_redis,
    get_cached_pets,
    set_cached_pets,
    invalidate_pets_cache,
    get_cached_summary,
    set_cached_summary,
    invalidate_summary_cache,
    get_cached_wallet,
    set_cached_wallet,
    invalidate_wallet_cache,
    clear_all_cache,
    get_cache_stats,
)

__all__ = [
    "get_redis",
    "close_redis",
    "get_cached_pets",
    "set_cached_pets",
    "invalidate_pets_cache",
    "get_cached_summary",
    "set_cached_summary",
    "invalidate_summary_cache",
    "get_cached_wallet",
    "set_cached_wallet",
    "invalidate_wallet_cache",
    "clear_all_cache",
    "get_cache_stats",
]

