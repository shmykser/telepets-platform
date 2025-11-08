from pydantic import BaseModel
from typing import Optional


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



