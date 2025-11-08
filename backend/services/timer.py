from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, time, timezone
from enum import Enum
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import (
    STAGE_TRANSITION_INTERVALS,
    STAGE_ORDER,
    ACTION_REWARDS,
)
from models import Pet, PetLifeStatus, Transaction, PetState

logger = logging.getLogger(__name__)


class TimerStatus(str, Enum):
    running = "running"
    cooldown = "cooldown"
    ready = "ready"
    completed = "completed"
    idle = "idle"


@dataclass(slots=True)
class TimerPayload:
    id: str
    type: str
    label: str
    status: TimerStatus
    remaining_seconds: int
    duration_seconds: Optional[int] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    available_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    def as_dict(self) -> Dict[str, Any]:
        payload = {
            "id": self.id,
            "type": self.type,
            "label": self.label,
            "status": self.status.value,
            "remaining_seconds": max(0, self.remaining_seconds),
        }
        if self.duration_seconds is not None:
            payload["duration_seconds"] = self.duration_seconds
        if self.starts_at is not None:
            payload["starts_at"] = self.starts_at
        if self.ends_at is not None:
            payload["ends_at"] = self.ends_at
        if self.available_at is not None:
            payload["available_at"] = self.available_at
        if self.metadata:
            payload["meta"] = self.metadata
        return payload


class TimerService:
    MAX_DAILY_STREAK = 10
    DAILY_LOGIN_TIMER_ID = "daily_login"
    DAILY_LOGIN_DESCRIPTION = "Ежедневная награда за вход"

    @classmethod
    async def get_user_timers(cls, db: AsyncSession, user_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        timers: List[TimerPayload] = []

        try:
            pet_stage_timers = await cls._collect_pet_stage_timers(db, user_id, now)
            timers.extend(pet_stage_timers)
        except Exception as exc:  # noqa: BLE001
            logger.error("Не удалось собрать таймеры стадий питомцев: %s", exc, exc_info=True)

        try:
            daily_login_timer = await cls._build_daily_login_timer(db, user_id, now)
        except Exception as exc:  # noqa: BLE001
            logger.error("Не удалось построить таймер ежедневной награды: %s", exc, exc_info=True)
            daily_login_timer = cls._fallback_daily_timer(now)
        timers.append(daily_login_timer)

        return {
            "server_time": cls._format_datetime(now),
            "timers": [timer.as_dict() for timer in timers],
        }

    @classmethod
    async def ensure_daily_login_available(cls, db: AsyncSession, user_id: str) -> TimerPayload:
        timer = await cls._build_daily_login_timer(db, user_id, datetime.now(timezone.utc))
        if timer.status != TimerStatus.ready:
            raise PermissionError("Ежедневная награда недоступна")
        return timer

    @classmethod
    async def _collect_pet_stage_timers(
        cls,
        db: AsyncSession,
        user_id: str,
        now: datetime,
    ) -> List[TimerPayload]:
        result = await db.execute(
            select(Pet).where(Pet.user_id == user_id, Pet.status == PetLifeStatus.alive)
        )
        pets: List[Pet] = result.scalars().all()
        timers: List[TimerPayload] = []

        for pet in pets:
            timer = cls._build_stage_timer(now, pet)
            if timer:
                timers.append(timer)

        return timers

    @classmethod
    def _build_stage_timer(cls, now: datetime, pet: Pet) -> Optional[TimerPayload]:
        try:
            current_stage = pet.state.value
            stage_index = STAGE_ORDER.index(current_stage)
        except (ValueError, AttributeError):
            return None

        interval_seconds = STAGE_TRANSITION_INTERVALS.get(current_stage)
        if not interval_seconds:
            return None

        stage_started_at = cls._normalize_datetime(pet.updated_at) or cls._normalize_datetime(pet.created_at)
        if stage_started_at is None:
            return None

        ends_at_dt = stage_started_at + timedelta(seconds=interval_seconds)
        remaining = max(0, int((ends_at_dt - now).total_seconds()))
        status = TimerStatus.running if remaining > 0 else TimerStatus.completed

        next_stage = (
            STAGE_ORDER[stage_index + 1]
            if stage_index < len(STAGE_ORDER) - 1
            else current_stage
        )

        return TimerPayload(
            id=f"pet_stage:{pet.id}",
            type="pet_stage",
            label="Переход на следующую стадию",
            status=status,
            remaining_seconds=remaining,
            duration_seconds=interval_seconds,
            starts_at=cls._format_datetime(stage_started_at),
            ends_at=cls._format_datetime(ends_at_dt),
            metadata={
                "pet_id": pet.id,
                "pet_name": pet.name,
                "stage": current_stage,
                "next_stage": next_stage,
                "pet_state": pet.state.value if isinstance(pet.state, PetState) else pet.state,
                "stage_transition_seconds": interval_seconds,
            },
        )

    @classmethod
    async def _build_daily_login_timer(
        cls,
        db: AsyncSession,
        user_id: str,
        now: datetime,
    ) -> TimerPayload:
        now = cls._normalize_datetime(now) or datetime.now(timezone.utc)
        state = await cls._get_daily_login_state(db, user_id, now)
        last_claim = state.last_claim_at

        if last_claim is None:
            return TimerPayload(
                id=cls.DAILY_LOGIN_TIMER_ID,
                type="daily_login",
                label="Ежедневная награда",
                status=TimerStatus.ready,
                remaining_seconds=0,
                available_at=cls._format_datetime(now),
                metadata=state.as_metadata(available_now=True),
            )

        next_available = cls._next_daily_login_at(last_claim)
        remaining = max(0, int((next_available - now).total_seconds()))
        status = TimerStatus.ready if remaining <= 0 else TimerStatus.cooldown
        available_at_iso = cls._format_datetime(now if remaining <= 0 else next_available)

        return TimerPayload(
            id=cls.DAILY_LOGIN_TIMER_ID,
            type="daily_login",
            label="Ежедневная награда",
            status=status,
            remaining_seconds=remaining,
            available_at=available_at_iso,
            metadata=state.as_metadata(available_now=remaining <= 0),
        )

    @classmethod
    async def _get_daily_login_state(
        cls,
        db: AsyncSession,
        user_id: str,
        now: datetime,
    ) -> "DailyLoginState":
        base_amount = ACTION_REWARDS.get("daily_login", 5)

        try:
            result = await db.execute(
                select(Transaction)
                .where(
                    Transaction.user_id == user_id,
                    Transaction.description == cls.DAILY_LOGIN_DESCRIPTION,
                )
                .order_by(desc(Transaction.created_at))
                .limit(cls.MAX_DAILY_STREAK * 2)
            )
            transactions = result.scalars().all()
        except Exception as exc:  # noqa: BLE001
            logger.error("Не удалось загрузить историю ежедневных наград: %s", exc, exc_info=True)
            return DailyLoginState(
                base_amount=base_amount,
                current_streak=0,
                last_claim_at=None,
                next_multiplier=1,
            )

        if not transactions:
            return DailyLoginState(
                base_amount=base_amount,
                current_streak=0,
                last_claim_at=None,
                next_multiplier=1,
            )

        last_claim = cls._normalize_datetime(transactions[0].created_at)
        last_claim_date = last_claim.date()
        days_since_last = (now.date() - last_claim_date).days

        try:
            streak = cls._calculate_streak(transactions, last_claim_date)
            if days_since_last > 1:
                streak = 0

            if days_since_last in (0, 1):
                next_multiplier = min(streak + 1, cls.MAX_DAILY_STREAK)
            else:
                next_multiplier = 1
        except Exception as exc:  # noqa: BLE001
            logger.error("Ошибка вычисления серии ежедневной награды: %s", exc, exc_info=True)
            streak = 0
            next_multiplier = 1

        return DailyLoginState(
            base_amount=base_amount,
            current_streak=streak,
            last_claim_at=last_claim,
            next_multiplier=next_multiplier,
        )

    @staticmethod
    def _calculate_streak(transactions: List[Transaction], last_claim_date: datetime.date) -> int:
        streak = 1
        previous_date = last_claim_date

        for tx in transactions[1:]:
            if tx.created_at is None:
                break
            tx_dt = TimerService._normalize_datetime(tx.created_at)
            if tx_dt is None:
                break
            tx_date = tx_dt.date()
            delta = (previous_date - tx_date).days

            if delta == 0:
                continue
            if delta != 1:
                break

            streak += 1
            previous_date = tx_date
            if streak >= TimerService.MAX_DAILY_STREAK:
                break

        return streak

    @staticmethod
    def _next_daily_login_at(last_claim: datetime) -> datetime:
        last_claim_date = last_claim.date()
        next_day = last_claim_date + timedelta(days=1)
        return datetime.combine(next_day, time.min).replace(tzinfo=timezone.utc)

    @staticmethod
    def _normalize_datetime(dt: Optional[datetime]) -> Optional[datetime]:
        if dt is None:
            return None
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc)
        return dt.replace(tzinfo=timezone.utc)

    @staticmethod
    def _format_datetime(dt: datetime) -> str:
        return TimerService._normalize_datetime(dt).isoformat().replace("+00:00", "Z")

    @classmethod
    def _fallback_daily_timer(cls, now: datetime) -> TimerPayload:
        base_amount = ACTION_REWARDS.get("daily_login", 5)
        metadata = DailyLoginState(
            base_amount=base_amount,
            current_streak=0,
            last_claim_at=None,
            next_multiplier=1,
        ).as_metadata(available_now=True)
        return TimerPayload(
            id=cls.DAILY_LOGIN_TIMER_ID,
            type="daily_login",
            label="Ежедневная награда",
            status=TimerStatus.ready,
            remaining_seconds=0,
            available_at=cls._format_datetime(now),
            metadata=metadata,
        )


@dataclass(slots=True)
class DailyLoginState:
    base_amount: int
    current_streak: int
    last_claim_at: Optional[datetime]
    next_multiplier: int

    def as_metadata(self, available_now: bool) -> Dict[str, Any]:
        base = max(int(self.base_amount), 0)
        current_streak = max(int(self.current_streak), 0)
        next_multiplier = max(int(self.next_multiplier), 1)
        next_reward = base * next_multiplier
        return {
            "base_amount": base,
            "current_streak": current_streak,
            "last_claim_at": TimerService._format_datetime(self.last_claim_at) if self.last_claim_at else None,
            "next_multiplier": next_multiplier,
            "next_reward_amount": next_reward,
            "max_streak": TimerService.MAX_DAILY_STREAK,
            "available_now": available_now,
        }


__all__ = ["TimerService", "TimerStatus", "TimerPayload"]

