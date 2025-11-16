from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.db import get_db
from models import Pet, PetLifeStatus
from services.pet_characteristics import PetCharacteristicService
from services.cache_service import CacheService
from api.schemas.pet import (
    PetCharacteristicsResponse,
    CharacteristicActionRequest,
    CharacteristicActionResponse,
)

router = APIRouter(prefix="/pets", tags=["pet-characteristics"])


async def _get_pet_by_id(db: AsyncSession, user_id: str, pet_id: int) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.user_id == user_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    return pet


@router.get("/{pet_id}/characteristics", response_model=PetCharacteristicsResponse)
async def get_pet_characteristics(
    pet_id: int,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    pet = await _get_pet_by_id(db, user_id, pet_id)
    snapshot = await PetCharacteristicService.snapshot(db, pet)
    summary = PetCharacteristicService.summarize(pet.state.value, {k: v["value"] for k, v in snapshot.items()})
    summary["last_tick_at"] = pet.health_updated_at.isoformat() if pet.health_updated_at else None
    return PetCharacteristicsResponse(
        pet_id=pet.id,
        characteristics=snapshot,
        health_tick=summary,
    )


@router.post("/{pet_id}/characteristics/apply", response_model=CharacteristicActionResponse)
async def apply_characteristic_action(
    pet_id: int,
    request: CharacteristicActionRequest,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    pet = await _get_pet_by_id(db, user_id, pet_id)
    if pet.status != PetLifeStatus.alive:
        raise HTTPException(status_code=400, detail="Нельзя взаимодействовать с мёртвым питомцем")

    try:
        result = await PetCharacteristicService.apply_action(
            db,
            pet,
            action_key=request.action_key,
            delta=request.delta,
            target_value=request.target_value or request.value,
            metadata=request.metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    snapshot = await PetCharacteristicService.snapshot(db, pet)
    summary = PetCharacteristicService.summarize(pet.state.value, {k: v["value"] for k, v in snapshot.items()})
    summary["last_tick_at"] = pet.health_updated_at.isoformat() if pet.health_updated_at else None

    await CacheService.invalidate_user(user_id, pets=True, summary=True)

    try:
        from api.websocket import broadcast_pet_update

        await broadcast_pet_update(
            user_id,
            "characteristics_changed",
            {
                "pet_id": pet.id,
                "pet_name": pet.name,
                "characteristics": snapshot,
            },
        )
    except Exception:
        pass

    return CharacteristicActionResponse(
        pet_id=pet.id,
        characteristic=request.action_key,
        value=result["value"],
        status=result["status"],
        characteristics=snapshot,
        health_tick=summary,
    )

