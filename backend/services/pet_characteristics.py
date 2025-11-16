from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Mapping, Optional, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import PET_CHARACTERISTICS, HEALTH_DEGRADATION_RULES, CHARACTERISTIC_ACTIONS
from models import Pet, PetCharacteristic, PetCharacteristicEvent


@dataclass(frozen=True)
class CharacteristicDefinition:
    key: str
    display_name: str
    unit: str
    range_min: int
    range_max: int
    normal_min: int
    normal_max: int
    decay_per_interval: int
    penalty_value: int

    @classmethod
    def from_config(cls, key: str, payload: Mapping[str, Any]) -> "CharacteristicDefinition":
        rng = payload.get("range", {})
        normal = payload.get("normal", {})
        penalty = payload.get("penalty", {})
        return cls(
            key=key,
            display_name=payload.get("display_name", key),
            unit=payload.get("unit", "%"),
            range_min=int(rng.get("min", 0)),
            range_max=int(rng.get("max", 100)),
            normal_min=int(normal.get("min", 0)),
            normal_max=int(normal.get("max", 100)),
            decay_per_interval=int(payload.get("decay_per_interval", 0)),
            penalty_value=int(penalty.get("value", 0)),
        )


@dataclass(frozen=True)
class HealthRule:
    interval_seconds: int
    base_drop: int
    regen_amount: int
    penalties: Mapping[str, int]

    @classmethod
    def from_config(cls, payload: Mapping[str, Any]) -> "HealthRule":
        return cls(
            interval_seconds=int(payload.get("interval_seconds", 600)),
            base_drop=int(payload.get("base_drop", 0)),
            regen_amount=int(payload.get("regen_amount", 0)),
            penalties={k: int(v) for k, v in payload.get("penalties", {}).items()},
        )


class PetCharacteristicService:
    """
    Управление характеристиками питомца и расчёт штрафов здоровья.
    """

    # ----- Метаданные и правила -----
    @staticmethod
    def stage_definitions(stage: str) -> Dict[str, CharacteristicDefinition]:
        definitions: Dict[str, CharacteristicDefinition] = {}
        for key, payload in PET_CHARACTERISTICS.get(stage, {}).items():
            definitions[key] = CharacteristicDefinition.from_config(key, payload)
        return definitions

    @staticmethod
    def get_health_rule(stage: str) -> Optional[HealthRule]:
        payload = HEALTH_DEGRADATION_RULES.get(stage)
        if not payload:
            return None
        return HealthRule.from_config(payload)

    # ----- Работа с БД -----
    @classmethod
    async def ensure_for_pet(cls, db: AsyncSession, pet: Pet, *, commit: bool = False) -> Dict[str, PetCharacteristic]:
        """
        Гарантирует, что у питомца есть полный набор характеристик для текущей стадии.
        Возвращает словарь {key: PetCharacteristic}.
        """
        definitions = cls.stage_definitions(pet.state.value)
        existing = await cls._load_characteristics(db, pet.id)

        missing_keys = set(definitions.keys()) - set(existing.keys())
        if missing_keys:
            for key in missing_keys:
                definition = definitions[key]
                initial_value = definition.normal_max
                status = cls._resolve_status(definition, initial_value)
                record = PetCharacteristic(
                    pet_id=pet.id,
                    characteristic=key,
                    value=initial_value,
                    status=status,
                )
                db.add(record)
                existing[key] = record
            await db.flush()
            if commit:
                await db.commit()
        return existing

    @classmethod
    async def snapshot(cls, db: AsyncSession, pet: Pet) -> Dict[str, Dict[str, Any]]:
        """
        Возвращает актуальные значения и статусы характеристик питомца.
        """
        records = await cls.ensure_for_pet(db, pet, commit=False)
        definitions = cls.stage_definitions(pet.state.value)
        snapshot: Dict[str, Dict[str, Any]] = {}
        for key, record in records.items():
            if key not in definitions:
                continue
            snapshot[key] = {"value": record.value, "status": record.status}
        return snapshot

    @classmethod
    async def update_characteristic(
        cls,
        db: AsyncSession,
        pet: Pet,
        characteristic: str,
        *,
        delta: Optional[int] = None,
        absolute_value: Optional[int] = None,
        reason: Optional[str] = None,
        source: Optional[str] = None,
        payload: Optional[dict] = None,
        commit: bool = True,
    ) -> Dict[str, Any]:
        """
        Обновляет характеристику питомца и записывает событие.
        Возвращает словарь с новым значением и статусом.
        """
        definitions = cls.stage_definitions(pet.state.value)
        if characteristic not in definitions:
            raise ValueError(f"Characteristic '{characteristic}' is not defined for stage '{pet.state.value}'")

        records = await cls.ensure_for_pet(db, pet, commit=False)
        record = records[characteristic]

        definition = definitions[characteristic]
        previous_value = record.value
        target_value = previous_value

        if absolute_value is not None:
            target_value = int(absolute_value)
        elif delta is not None:
            target_value = previous_value + int(delta)

        target_value = max(definition.range_min, min(definition.range_max, target_value))
        if target_value == previous_value:
            return {"value": previous_value, "status": record.status, "changed": False}

        record.value = target_value
        record.status = cls._resolve_status(definition, target_value)
        await db.flush()

        event = PetCharacteristicEvent(
            pet_id=pet.id,
            characteristic=characteristic,
            value_before=previous_value,
            value_after=target_value,
            delta=target_value - previous_value,
            reason=reason,
            source=source,
            payload=payload,
        )
        db.add(event)

        if commit:
            await db.commit()
        else:
            await db.flush()

        return {"value": target_value, "status": record.status, "changed": True}

    @classmethod
    async def summarize_for_pet(cls, db: AsyncSession, pet: Pet) -> Dict[str, Any]:
        """
        Возвращает агрегированный отчёт по характеристикам и штрафам здоровья.
        """
        snapshot = await cls.snapshot(db, pet)
        values = {key: item["value"] for key, item in snapshot.items()}
        health_summary = cls.summarize(pet.state.value, values)
        health_summary["characteristics"] = snapshot
        return health_summary

    @classmethod
    async def apply_action(
        cls,
        db: AsyncSession,
        pet: Pet,
        action_key: str,
        *,
        delta: Optional[int] = None,
        target_value: Optional[int] = None,
        value: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        action = CHARACTERISTIC_ACTIONS.get(action_key)
        if not action:
            raise ValueError(f"Неизвестное действие '{action_key}'")

        expected_stage = action.get("stage")
        if expected_stage and expected_stage != pet.state.value:
            raise ValueError(f"Действие '{action_key}' недоступно для стадии {pet.state.value}")

        characteristic = action.get("characteristic")
        if not characteristic:
            raise ValueError(f"Действие '{action_key}' не привязано к характеристике")

        resolved_target = target_value if target_value is not None else value
        resolved_delta = delta

        if resolved_target is None and resolved_delta is None:
            resolved_delta = cls._resolve_action_delta(pet.state.value, characteristic, action_key)

        payload = metadata.copy() if metadata else {}
        if resolved_delta is not None:
            payload["requested_delta"] = resolved_delta
        if resolved_target is not None:
            payload["requested_target_value"] = resolved_target

        return await cls.update_characteristic(
            db,
            pet,
            characteristic,
            delta=None if resolved_target is not None else resolved_delta,
            absolute_value=resolved_target,
            reason=f"action:{action_key}",
            source=action_key,
            payload=payload or None,
        )

    # ----- Расчёт штрафов -----
    @classmethod
    def calculate_penalty(cls, stage: str, values: Mapping[str, int]) -> int:
        """
        Возвращает итоговый штраф здоровья (Y) исходя из характеристик.
        Значения характеристик ожидаются в диапазоне 0-100.
        """
        rule = cls.get_health_rule(stage)
        if not rule:
            return 0

        total_penalty = rule.base_drop
        definitions = cls.stage_definitions(stage)

        for key, definition in definitions.items():
            current_value = int(values.get(key, definition.normal_max))
            penalty_weight = rule.penalties.get(key, definition.penalty_value)
            if current_value < definition.normal_min or current_value > definition.normal_max:
                total_penalty += penalty_weight

        return max(0, total_penalty)

    @classmethod
    def summarize(cls, stage: str, values: Mapping[str, int]) -> Dict[str, int]:
        """
        Возвращает агрегированную информацию по штрафу и регенерации.
        """
        rule = cls.get_health_rule(stage)
        penalty = cls.calculate_penalty(stage, values)

        if not rule:
            return {
                "interval_seconds": 600,
                "penalty": penalty,
                "regen_amount": 0,
            }

        return {
            "interval_seconds": rule.interval_seconds,
            "penalty": penalty,
            "regen_amount": rule.regen_amount if penalty == 0 else 0,
        }

    # ----- Вспомогательные методы -----
    @classmethod
    async def _load_characteristics(cls, db: AsyncSession, pet_id: int) -> Dict[str, PetCharacteristic]:
        result = await db.execute(
            select(PetCharacteristic).where(PetCharacteristic.pet_id == pet_id)
        )
        items = result.scalars().all()
        return {item.characteristic: item for item in items}

    @staticmethod
    def _resolve_status(definition: CharacteristicDefinition, value: int) -> str:
        if definition.normal_min <= value <= definition.normal_max:
            return "normal"
        if definition.range_min <= value <= definition.range_max:
            return "warning"
        return "critical"

    @staticmethod
    def _resolve_action_delta(stage: str, characteristic: str, action_key: str) -> int:
        characteristic_config = PET_CHARACTERISTICS.get(stage, {}).get(characteristic, {})
        recovery_config = characteristic_config.get("recovery", {})
        if action_key in recovery_config:
            return int(recovery_config[action_key])
        if "default" in recovery_config:
            return int(recovery_config["default"])
        return 0


