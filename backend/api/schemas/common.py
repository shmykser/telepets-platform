from pydantic import BaseModel
from typing import Optional, Any, Dict


class ErrorResponse(BaseModel):
    detail: str
    error_type: Optional[str] = None


class HealthUpResponse(BaseModel):
    message: str
    health: int
    health_increased: int
    stage: str
    pet_id: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str

