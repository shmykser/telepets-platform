from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from typing import Any, Optional

from cache.redis_client import (
    get_cached_pets,
    get_cached_summary,
    get_cached_wallet,
    invalidate_pets_cache,
    invalidate_summary_cache,
    invalidate_wallet_cache,
    set_cached_pets,
    set_cached_summary,
    set_cached_wallet,
)
from config.settings import get_redis_config

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CacheEntry:
    data: Any
    etag: str
    cached_at: Optional[str] = None


class CacheService:
    """Высокоуровневый адаптер для работы с кешем Redis."""

    _config = get_redis_config()

    @classmethod
    def _ttl(cls, bucket: str) -> int:
        return cls._config.get("ttl", {}).get(bucket, 0)

    @classmethod
    def pets_ttl(cls) -> int:
        return cls._ttl("pets")

    @classmethod
    def summary_ttl(cls) -> int:
        return cls._ttl("summary")

    @classmethod
    def wallet_ttl(cls) -> int:
        return cls._ttl("wallet")

    @staticmethod
    def compute_etag(data: Any) -> str:
        serialized = json.dumps(data, sort_keys=True, ensure_ascii=False, default=str)
        return hashlib.md5(serialized.encode("utf-8")).hexdigest()

    @classmethod
    def _parse_payload(cls, payload: Any) -> Optional[CacheEntry]:
        if not payload:
            return None

        if isinstance(payload, dict) and "data" in payload:
            data = payload.get("data")
            etag = payload.get("etag") or cls.compute_etag(data)
            cached_at = payload.get("cached_at")
            return CacheEntry(data=data, etag=etag, cached_at=cached_at)

        return CacheEntry(data=payload, etag=cls.compute_etag(payload))

    # ----- Summary -----
    @classmethod
    async def get_summary(cls, user_id: str) -> Optional[CacheEntry]:
        payload = await get_cached_summary(user_id)
        return cls._parse_payload(payload)

    @classmethod
    async def set_summary(cls, user_id: str, data: Any, ttl: Optional[int] = None) -> bool:
        ttl_to_use = ttl if ttl is not None and ttl > 0 else cls.summary_ttl()
        return await set_cached_summary(user_id, data, ttl_to_use)

    @classmethod
    async def invalidate_summary(cls, user_id: str) -> bool:
        return await invalidate_summary_cache(user_id)

    # ----- Pets -----
    @classmethod
    async def get_pets(cls, user_id: str) -> Optional[CacheEntry]:
        payload = await get_cached_pets(user_id)
        return cls._parse_payload(payload)

    @classmethod
    async def set_pets(cls, user_id: str, data: Any, ttl: Optional[int] = None) -> bool:
        ttl_to_use = ttl if ttl is not None and ttl > 0 else cls.pets_ttl()
        return await set_cached_pets(user_id, data, ttl_to_use)

    @classmethod
    async def invalidate_pets(cls, user_id: str) -> bool:
        return await invalidate_pets_cache(user_id)

    # ----- Wallet -----
    @classmethod
    async def get_wallet(cls, user_id: str) -> Optional[CacheEntry]:
        payload = await get_cached_wallet(user_id)
        return cls._parse_payload(payload)

    @classmethod
    async def set_wallet(cls, user_id: str, data: Any, ttl: Optional[int] = None) -> bool:
        ttl_to_use = ttl if ttl is not None and ttl > 0 else cls.wallet_ttl()
        return await set_cached_wallet(user_id, data, ttl_to_use)

    @classmethod
    async def invalidate_wallet(cls, user_id: str) -> bool:
        return await invalidate_wallet_cache(user_id)

    # ----- Bulk helpers -----
    @classmethod
    async def invalidate_user(cls, user_id: str, *, pets: bool = True, summary: bool = True, wallet: bool = False) -> bool:
        results = []
        if pets:
            results.append(await cls.invalidate_pets(user_id))
        if summary:
            results.append(await cls.invalidate_summary(user_id))
        if wallet:
            results.append(await cls.invalidate_wallet(user_id))

        # Если список пуст (все флаги False), возвращаем True
        if not results:
            return True

        return all(results)

