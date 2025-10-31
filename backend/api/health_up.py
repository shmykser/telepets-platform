from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db import get_db
from models import Pet, PetState, PetLifeStatus
from config.settings import HEALTH_MAX, HEALTH_UP_AMOUNTS, STAGE_MESSAGES, HEALTH_MIN
import logging

logger = logging.getLogger(__name__)

from api.schemas.common import HealthUpResponse, ErrorResponse

router = APIRouter(prefix="/health_up", tags=["pet"])

async def health_up_logic(user_id: str, db: AsyncSession, pet_name: str | None = None) -> dict:
    """
    Логика увеличения здоровья питомца.
    Используется как в обычном API, так и в экономике.
    """
    # Находим питомца пользователя: либо конкретного по имени, либо единственного живого
    if pet_name:
        result = await db.execute(
            select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name, Pet.status == PetLifeStatus.alive)
        )
        pet = result.scalar_one_or_none()
    else:
        result = await db.execute(
            select(Pet).where(Pet.user_id == user_id, Pet.status == PetLifeStatus.alive)
        )
        pets = result.scalars().all()
        if len(pets) > 1:
            raise HTTPException(status_code=400, detail="Уточните питомца (несколько живых питомцев)")
        pet = pets[0] if pets else None
    
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден или умер")
    
    # Проверяем, не умер ли питомец
    if pet.health <= HEALTH_MIN or pet.status == PetLifeStatus.dead:
        raise HTTPException(status_code=400, detail="Питомец умер и не может быть вылечен")
    
    # Получаем количество увеличения здоровья для текущей стадии
    health_up_amount = HEALTH_UP_AMOUNTS.get(pet.state.value, 15)
    
    # Увеличиваем здоровье
    old_health = pet.health
    pet.health = min(HEALTH_MAX, pet.health + health_up_amount)
    # Не трогаем updated_at, чтобы таймер стадий не сбрасывался от лечений
    
    # Получаем сообщение для текущей стадии
    stage_message = STAGE_MESSAGES.get(pet.state.value, {}).get('health_up', 'Здоровье увеличено')
    
    await db.commit()
    await db.refresh(pet)
    
    # Инвалидируем кеш после изменения
    try:
        from cache.redis_client import invalidate_pets_cache, invalidate_summary_cache
        await invalidate_pets_cache(user_id)
        await invalidate_summary_cache(user_id)
    except Exception as e:
        logger.warning(f"Ошибка инвалидации кеша после health_up: {e}")
    
    # Отправляем обновление через WebSocket
    try:
        from api.websocket import broadcast_pet_update
        await broadcast_pet_update(user_id, "health_changed", {
            "pet_id": pet.id,
            "pet_name": pet.name,
            "health": pet.health,
            "health_increased": pet.health - old_health,
            "stage": pet.state.value,
        })
    except Exception as e:
        logger.warning(f"Ошибка отправки WebSocket обновления: {e}")
    
    return {
        "message": stage_message,
        "health": pet.health,
        "health_increased": pet.health - old_health,
        "stage": pet.state.value,
        "pet_id": pet.id
    }

@router.post("", response_model=HealthUpResponse, responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}})
async def health_up(user_id: str, pet_name: str | None = None, db: AsyncSession = Depends(get_db)):
    """
    Увеличивает здоровье питомца в зависимости от его стадии.
    Для каждой стадии используется разная логика и сообщения.
    """
    return await health_up_logic(user_id, db, pet_name)