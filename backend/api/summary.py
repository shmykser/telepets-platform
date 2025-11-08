from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from services.cache_service import CacheService
from services.pet_summary import PetSummaryService

router = APIRouter(prefix="/summary", tags=["Pet"])
logger = logging.getLogger(__name__)


def _resolve_base_url(request: Request) -> Optional[str]:
    try:
        base_url = str(request.base_url)
    except Exception:  # noqa: BLE001
        return None
    if not base_url:
        return None
    return base_url.rstrip("/") + "/api"


@router.get("")
async def get_summary(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Возвращает summary по активному питомцу пользователя с поддержкой кеша и ETag."""
    try:
        cache_entry = await CacheService.get_summary(user_id)
        requested_etag = request.headers.get("If-None-Match")
        ttl = CacheService.summary_ttl()

        if cache_entry and requested_etag and cache_entry.etag == requested_etag:
            return Response(status_code=304, headers={"ETag": cache_entry.etag})

        if cache_entry and not requested_etag:
            response = JSONResponse(content=cache_entry.data)
            response.headers["ETag"] = cache_entry.etag
            if ttl:
                response.headers["Cache-Control"] = f"public, max-age={ttl}"
            return response

        base_url = _resolve_base_url(request)
        summary = await PetSummaryService.build_summary(db, user_id, base_url)
        etag = CacheService.compute_etag(summary)

        try:
            await CacheService.set_summary(user_id, summary, ttl=ttl)
        except Exception as cache_error:  # noqa: BLE001
            logger.debug("Не удалось сохранить summary в кеш для %s: %s", user_id, cache_error)

        response = JSONResponse(content=summary)
        response.headers["ETag"] = etag
        if ttl:
            response.headers["Cache-Control"] = f"public, max-age={ttl}"
        return response
    except Exception as exc:  # noqa: BLE001
        logger.exception("Ошибка получения summary для пользователя %s: %s", user_id, exc)
        fallback = PetSummaryService.empty_summary(user_id)
        return JSONResponse(content=fallback)


async def get_summary_internal(user_id: str, db: AsyncSession, base_url: Optional[str] = None):
    """Совместимость со старым API: получение summary напрямую."""
    return await PetSummaryService.build_summary(db, user_id, base_url)


async def get_all_pets_summary_internal(user_id: str, db: AsyncSession, base_url: Optional[str] = None):
    """Совместимость со старым API: получение списка всех питомцев."""
    return await PetSummaryService.build_all_pets_summary(db, user_id, base_url)

