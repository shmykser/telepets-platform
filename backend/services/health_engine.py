from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import HEALTH_MAX, HEALTH_MIN
from models import Pet
from .pet_characteristics import (
    PetCharacteristicService,
    PetCharacteristic,
    PetCharacteristicEvent,
    CharacteristicDefinition,
)


@dataclass
class HealthTickResult:
    ticks: int
    health_delta: int
    characteristics_snapshot: Dict[str, Dict[str, Any]] | None

    @property
    def processed(self) -> bool:
        return self.ticks > 0 or self.health_delta != 0 or bool(self.characteristics_snapshot)


class HealthEngine:
    """
    Управляет естественным изменением характеристик и здоровья питомца.
    """

    @classmethod
    async def process_pet(cls, db: AsyncSession, pet: Pet) -> HealthTickResult:
        rule = PetCharacteristicService.get_health_rule(pet.state.value)
        if not rule:
            return HealthTickResult(0, 0, None)

        last_tick = pet.health_updated_at or pet.created_at
        if last_tick is None:
            last_tick = datetime.now(timezone.utc)
        if last_tick.tzinfo is None:
            last_tick = last_tick.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        elapsed = (now - last_tick).total_seconds()
        if elapsed < rule.interval_seconds:
            return HealthTickResult(0, 0, None)

        ticks = int(elapsed // rule.interval_seconds)
        records = await PetCharacteristicService.ensure_for_pet(db, pet, commit=False)
        definitions = PetCharacteristicService.stage_definitions(pet.state.value)

        current_values: Dict[str, int] = {key: record.value for key, record in records.items()}
        total_health_delta = 0

        current_health = pet.health

        for _ in range(ticks):
            cls._decay_characteristics(current_values, definitions)
            penalty = PetCharacteristicService.calculate_penalty(pet.state.value, current_values)
            if penalty > 0:
                total_health_delta -= penalty
            else:
                regen = rule.regen_amount
                if regen > 0 and (pet.health + total_health_delta) < HEALTH_MAX:
                    regen_effective = min(regen, HEALTH_MAX - (pet.health + total_health_delta))
                    total_health_delta += regen_effective

        characteristics_changed = cls._persist_characteristics(db, pet.id, records, current_values, definitions)

        new_health = current_health + total_health_delta
        if new_health > HEALTH_MAX:
            new_health = HEALTH_MAX
        if new_health < HEALTH_MIN:
            new_health = HEALTH_MIN

        pet.health = new_health
        pet.health_updated_at = last_tick + timedelta(seconds=ticks * rule.interval_seconds)

        snapshot = None
        if characteristics_changed:
            snapshot = {
                key: {
                    "value": current_values[key],
                    "status": PetCharacteristicService._resolve_status(definitions[key], current_values[key]),
                }
                for key in current_values
            }

        return HealthTickResult(
            ticks=ticks,
            health_delta=new_health - current_health,
            characteristics_snapshot=snapshot,
        )

    @staticmethod
    def _decay_characteristics(values: Dict[str, int], definitions: Dict[str, CharacteristicDefinition]):
        for key, definition in definitions.items():
            before = values.get(key, definition.normal_max)
            after = max(definition.range_min, before - definition.decay_per_interval)
            values[key] = after

    @classmethod
    def _persist_characteristics(
        cls,
        db: AsyncSession,
        pet_id: int,
        records: Dict[str, PetCharacteristic],
        new_values: Dict[str, int],
        definitions: Dict[str, CharacteristicDefinition],
    ) -> bool:
        changed = False
        for key, record in records.items():
            prev = record.value
            new_value = new_values.get(key, prev)
            if new_value == prev:
                continue
            changed = True
            record.value = new_value
            record.status = PetCharacteristicService._resolve_status(definitions[key], new_value)
            event = PetCharacteristicEvent(
                pet_id=pet_id,
                characteristic=key,
                value_before=prev,
                value_after=new_value,
                delta=new_value - prev,
                reason="auto_decay",
                source="health_engine",
            )
            db.add(event)
        return changed

