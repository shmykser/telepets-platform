from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from .base import Base, AuctionStatus, WalletHoldStatus


class Auction(Base):
    __tablename__ = 'auctions'
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey('pets.id'), nullable=False)
    seller_user_id = Column(String, ForeignKey('users.user_id'), nullable=False)
    start_price = Column(Integer, nullable=False)
    current_price = Column(Integer, nullable=False)
    buy_now_price = Column(Integer, nullable=True)
    min_increment_abs = Column(Integer, nullable=True)
    min_increment_pct = Column(Integer, nullable=True)
    soft_close_seconds = Column(Integer, nullable=False, default=60)
    status = Column(Enum(AuctionStatus, name='auction_status'), nullable=False, default=AuctionStatus.active)
    current_winner_user_id = Column(String, ForeignKey('users.user_id'), nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AuctionBid(Base):
    __tablename__ = 'auction_bids'
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey('auctions.id'), nullable=False, index=True)
    bidder_user_id = Column(String, ForeignKey('users.user_id'), nullable=False)
    amount = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WalletHold(Base):
    __tablename__ = 'wallet_holds'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.user_id'), nullable=False, index=True)
    auction_id = Column(Integer, ForeignKey('auctions.id'), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    status = Column(Enum(WalletHoldStatus, name='wallet_hold_status'), nullable=False, default=WalletHoldStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    released_at = Column(DateTime(timezone=True), nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)


class PetOwnershipHistory(Base):
    __tablename__ = 'pet_ownership_history'
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey('pets.id'), nullable=False)
    from_user_id = Column(String, ForeignKey('users.user_id'), nullable=True)
    to_user_id = Column(String, ForeignKey('users.user_id'), nullable=True)
    price = Column(Integer, nullable=True)
    auction_id = Column(Integer, ForeignKey('auctions.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



