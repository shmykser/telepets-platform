from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import (
    API_BASE_URL,
    INITIAL_COINS,
    STAGE_ORDER,
    STAGE_TRANSITION_INTERVAL,
    get_pet_image_api_url,
)
from models import Pet, PetLifeStatus
from models import Wallet as WalletModel

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class WalletSnapshot:
    coins: int
    total_earned: int
    total_spent: int


class PetSummaryService:
    """Сервис агрегации данных питомцев для API и фоновых задач."""

    @staticmethod
    def _normalise_datetime(value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        return value if value.tzinfo is None else value.replace(tzinfo=None)

    @staticmethod
    def _format_datetime(value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        naive = PetSummaryService._normalise_datetime(value)
        return f"{naive.isoformat()}Z" if naive else None

    @classmethod
    def _wallet_snapshot(cls, wallet: Optional[WalletModel]) -> WalletSnapshot:
        if wallet is None:
            return WalletSnapshot(
                coins=INITIAL_COINS,
                total_earned=INITIAL_COINS,
                total_spent=0,
            )
        return WalletSnapshot(
            coins=wallet.coins,
            total_earned=wallet.total_earned,
            total_spent=wallet.total_spent,
        )

    @classmethod
    def _split_pets(cls, pets: List[Pet]) -> Tuple[List[Pet], List[Pet]]:
        alive: List[Pet] = []
        dead: List[Pet] = []
        for pet in pets:
            if pet.status == PetLifeStatus.alive:
                alive.append(pet)
            else:
                dead.append(pet)
        return alive, dead

    @classmethod
    def calculate_time_to_next_stage(cls, pet: Pet) -> int:
        try:
            current_stage = pet.state.value
            current_index = STAGE_ORDER.index(current_stage)
        except ValueError:
            logger.warning("Неизвестная стадия питомца %s: %s", pet.id, pet.state)
            return 0

        if current_index >= len(STAGE_ORDER) - 1:
            return 0

        stage_started_at = cls._normalise_datetime(pet.updated_at) or cls._normalise_datetime(pet.created_at)
        if not stage_started_at:
            return 0

        transition_time = stage_started_at + timedelta(seconds=STAGE_TRANSITION_INTERVAL)
        remaining = (transition_time - datetime.utcnow()).total_seconds()
        return max(0, int(remaining))

    @classmethod
    def determine_next_stage(cls, pet: Pet) -> str:
        try:
            current_index = STAGE_ORDER.index(pet.state.value)
        except ValueError:
            return pet.state.value
        if current_index >= len(STAGE_ORDER) - 1:
            return pet.state.value
        return STAGE_ORDER[current_index + 1]

    @classmethod
    def serialize_pet(cls, pet: Pet, base_url: Optional[str] = None) -> Dict[str, Any]:
        time_to_next_stage = cls.calculate_time_to_next_stage(pet) if pet.status == PetLifeStatus.alive else 0

        try:
            creature = json.loads(pet.creature_json) if pet.creature_json else None
        except Exception:
            creature = None

        prompts = {
            "egg_en": pet.prompt_egg_en,
            "baby_en": pet.prompt_baby_en,
            "adult_en": pet.prompt_adult_en,
        }

        return {
            "id": pet.id,
            "name": pet.name,
            "state": pet.state.value,
            "health": pet.health,
            "status": pet.status.value,
            "time_to_next_stage_seconds": time_to_next_stage,
            "created_at": cls._format_datetime(pet.created_at),
            "updated_at": cls._format_datetime(pet.updated_at) or cls._format_datetime(pet.created_at),
            "creature": creature,
            "prompts": prompts,
            "image_url": cls.build_image_url(pet, base_url),
        }

    @staticmethod
    def _normalise_base_url(base_url: Optional[str]) -> str:
        if base_url:
            return base_url.rstrip("/")
        return API_BASE_URL.rstrip("/")

    @classmethod
    def _image_version(cls, pet: Pet) -> int:
        reference = cls._normalise_datetime(pet.updated_at) or cls._normalise_datetime(pet.created_at)
        if reference is None:
            return 0
        try:
            return int(reference.timestamp())
        except Exception:
            return 0

    @classmethod
    def build_image_url(cls, pet: Pet, base_url: Optional[str] = None) -> str:
        base = cls._normalise_base_url(base_url)
        endpoint = get_pet_image_api_url(pet.user_id, pet.name, base)
        version = cls._image_version(pet)
        stage = pet.state.value
        return f"{endpoint}?stage={stage}&v={version}"

    @classmethod
    def empty_summary(cls, user_id: str, wallet: Optional[WalletModel] = None) -> Dict[str, Any]:
        snapshot = cls._wallet_snapshot(wallet)
        return {
            "status": "no_pets",
            "message": "У вас пока нет питомцев. Создайте первого!",
            "user_id": user_id,
            "total_pets": 0,
            "alive_pets": 0,
            "dead_pets": 0,
            "wallet": {
                "coins": snapshot.coins,
                "total_earned": snapshot.total_earned,
                "total_spent": snapshot.total_spent,
            },
        }

    @classmethod
    async def build_summary(cls, db: AsyncSession, user_id: str, base_url: Optional[str] = None) -> Dict[str, Any]:
        pets = await cls._fetch_pets(db, user_id)
        wallet = await cls._fetch_wallet(db, user_id)
        return cls._compose_single_summary(user_id, pets, wallet, base_url)

    @classmethod
    async def build_all_pets_summary(cls, db: AsyncSession, user_id: str, base_url: Optional[str] = None) -> Dict[str, Any]:
        pets = await cls._fetch_pets(db, user_id)
        wallet = await cls._fetch_wallet(db, user_id)
        return cls._compose_all_pets_summary(user_id, pets, wallet, base_url)

    @classmethod
    async def _fetch_pets(cls, db: AsyncSession, user_id: str) -> List[Pet]:
        result = await db.execute(
            select(Pet).where(Pet.user_id == user_id).order_by(Pet.created_at.desc())
        )
        pets = result.scalars().all()
        logger.debug("Получено %s питомцев для пользователя %s", len(pets), user_id)
        return pets

    @classmethod
    async def _fetch_wallet(cls, db: AsyncSession, user_id: str) -> Optional[WalletModel]:
        result = await db.execute(select(WalletModel).where(WalletModel.user_id == user_id))
        wallet = result.scalar_one_or_none()
        if wallet is None:
            logger.debug("Кошелек пользователя %s не найден — будет использован snapshot по умолчанию", user_id)
        return wallet

    @classmethod
    def _compose_single_summary(
        cls,
        user_id: str,
        pets: List[Pet],
        wallet: Optional[WalletModel],
        base_url: Optional[str],
    ) -> Dict[str, Any]:
        if not pets:
            return cls.empty_summary(user_id, wallet)

        alive, dead = cls._split_pets(pets)
        snapshot = cls._wallet_snapshot(wallet)

        if not alive:
            return {
                "status": "all_dead",
                "message": "Все ваши питомцы умерли. Создайте нового!",
                "user_id": user_id,
                "total_pets": len(pets),
                "alive_pets": 0,
                "dead_pets": len(dead),
                "wallet": {
                    "coins": snapshot.coins,
                    "total_earned": snapshot.total_earned,
                    "total_spent": snapshot.total_spent,
                },
            }

        active_pet = alive[0]
        base = cls._normalise_base_url(base_url)
        next_stage = cls.determine_next_stage(active_pet)
        time_to_next_stage = cls.calculate_time_to_next_stage(active_pet)

        serialized = cls.serialize_pet(active_pet, base)

        return {
            "status": "success",
            "id": active_pet.id,
            "user_id": active_pet.user_id,
            "name": active_pet.name,
            "state": active_pet.state.value,
            "health": active_pet.health,
            "life_status": active_pet.status.value,
            "next_stage": next_stage,
            "time_to_next_stage_seconds": time_to_next_stage,
            "image_url": serialized["image_url"],
            "created_at": serialized["created_at"],
            "updated_at": serialized["updated_at"],
            "total_pets": len(pets),
            "alive_pets": len(alive),
            "dead_pets": len(dead),
            "selected_pet_type": "alive",
            "creature": serialized.get("creature"),
            "prompts": serialized.get("prompts"),
            "wallet": {
                "coins": snapshot.coins,
                "total_earned": snapshot.total_earned,
                "total_spent": snapshot.total_spent,
            },
        }

    @classmethod
    def _compose_all_pets_summary(
        cls,
        user_id: str,
        pets: List[Pet],
        wallet: Optional[WalletModel],
        base_url: Optional[str],
    ) -> Dict[str, Any]:
        if not pets:
            return cls.empty_summary(user_id, wallet) | {"pets": []}

        alive, dead = cls._split_pets(pets)
        snapshot = cls._wallet_snapshot(wallet)
        base = cls._normalise_base_url(base_url)

        pets_payload = [cls.serialize_pet(pet, base) for pet in pets]

        status = "success" if alive else "all_dead"
        message = None
        if status == "all_dead":
            message = "Все ваши питомцы умерли. Создайте нового!"

        summary: Dict[str, Any] = {
            "status": status,
            "user_id": user_id,
            "pets": pets_payload,
            "total_pets": len(pets),
            "alive_pets": len(alive),
            "dead_pets": len(dead),
            "wallet": {
                "coins": snapshot.coins,
                "total_earned": snapshot.total_earned,
                "total_spent": snapshot.total_spent,
            },
        }

        if message:
            summary["message"] = message

        return summary

