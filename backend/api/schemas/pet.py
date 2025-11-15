from pydantic import BaseModel
from typing import Optional, Dict, Any


class PetSchema(BaseModel):
    id: int
    user_id: str
    name: str
    state: str
    health: int

    class Config:
        from_attributes = True


class CreatePetResponse(BaseModel):
    id: int
    user_id: str
    name: str
    state: str
    health: int
    image_url: Optional[str] = None
    paid: bool
    paid_cost: int
    creation_cost_tier: Optional[str] = None
    wallet: dict


class CharacteristicSnapshot(BaseModel):
    value: int
    status: str


class HealthTickSchema(BaseModel):
    interval_seconds: int
    penalty: int
    regen_amount: int
    last_tick_at: Optional[str] = None


class PetCharacteristicsResponse(BaseModel):
    pet_id: int
    characteristics: Dict[str, CharacteristicSnapshot]
    health_tick: Optional[HealthTickSchema]


class CharacteristicActionRequest(BaseModel):
    action_key: str
    value: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class CharacteristicActionResponse(PetCharacteristicsResponse):
    characteristic: str
    value: int
    status: str
