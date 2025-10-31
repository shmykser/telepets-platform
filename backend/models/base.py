from sqlalchemy.ext.declarative import declarative_base
import enum


Base = declarative_base()


class PetState(enum.Enum):
    egg = 'egg'
    baby = 'baby'
    adult = 'adult'


class PetLifeStatus(enum.Enum):
    alive = 'alive'
    dead = 'dead'


class TransactionType(enum.Enum):
    purchase = 'purchase'
    earning = 'earning'
    spending = 'spending'
    bonus = 'bonus'
    refund = 'refund'
    market_purchase = 'market_purchase'
    market_sale = 'market_sale'
    market_fee = 'market_fee'


class TransactionStatus(enum.Enum):
    pending = 'pending'
    completed = 'completed'
    failed = 'failed'
    cancelled = 'cancelled'


class AuctionStatus(enum.Enum):
    active = 'active'
    completed = 'completed'
    cancelled = 'cancelled'
    expired = 'expired'


class WalletHoldStatus(enum.Enum):
    active = 'active'
    released = 'released'
    captured = 'captured'



