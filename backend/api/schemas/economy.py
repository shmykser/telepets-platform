from pydantic import BaseModel
from typing import List, Optional


class WalletSchema(BaseModel):
    user_id: str
    coins: int
    total_earned: int
    total_spent: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TransactionItem(BaseModel):
    id: int
    type: str
    amount: int
    balance_before: int
    balance_after: int
    description: str
    status: str
    created_at: str
    transaction_data: Optional[str] = None


class TransactionsResponse(BaseModel):
    user_id: str
    transactions: List[TransactionItem]
    total: int


class HealthUpWithCostResponse(BaseModel):
    success: bool
    coins_spent: int
    new_balance: int
    pet_info: dict



