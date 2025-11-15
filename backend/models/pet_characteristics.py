from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base


class PetCharacteristic(Base):
    __tablename__ = "pet_characteristics"
    __table_args__ = (
        UniqueConstraint(
            "pet_id",
            "characteristic",
            name="uq_pet_characteristics_pet_id_characteristic",
        ),
        Index("ix_pet_characteristics_pet_id", "pet_id"),
    )

    id = Column(Integer, primary_key=True)
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
    )
    characteristic = Column(String, nullable=False)
    value = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="normal")
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    pet = relationship("Pet", back_populates="characteristics")


class PetCharacteristicEvent(Base):
    __tablename__ = "pet_characteristic_events"
    __table_args__ = (
        Index("ix_pet_characteristic_events_pet_id", "pet_id"),
    )

    id = Column(Integer, primary_key=True)
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
    )
    characteristic = Column(String, nullable=False)
    value_before = Column(Integer, nullable=True)
    value_after = Column(Integer, nullable=True)
    delta = Column(Integer, nullable=True)
    reason = Column(String, nullable=True)
    source = Column(String, nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    pet = relationship("Pet", back_populates="characteristic_events")

