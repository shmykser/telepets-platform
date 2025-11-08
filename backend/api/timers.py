from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from services.timer import TimerService

router = APIRouter(prefix="/timers", tags=["timers"])


@router.get("/{user_id}")
async def get_user_timers(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Возвращает синхронизированные таймеры для пользователя и его питомцев.
    """
    try:
        payload = await TimerService.get_user_timers(db, user_id)
        return payload
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Не удалось получить таймеры: {exc}") from exc

