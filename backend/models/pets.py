from sqlalchemy import Column, Integer, String, DateTime, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.settings import HEALTH_MAX
from .base import Base, PetState, PetLifeStatus


class Pet(Base):
    __tablename__ = 'pets'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    state = Column(Enum(PetState, name='pet_state'), default=PetState.egg, nullable=False)
    status = Column(Enum(PetLifeStatus, name='pet_life_status'), default=PetLifeStatus.alive, nullable=False)
    health = Column(Integer, default=HEALTH_MAX, nullable=False)
    creature_json = Column(Text, nullable=True)
    prompt_egg_en = Column(Text, nullable=True)
    prompt_baby_en = Column(Text, nullable=True)
    prompt_adult_en = Column(Text, nullable=True)
    # base64-хранилище удалено; изображения теперь только в R2 (URL)
    # R2 URL'ы (новая система хранения)
    image_egg_url = Column(String, nullable=True)
    image_baby_url = Column(String, nullable=True)
    image_adult_url = Column(String, nullable=True)
    # URL'ы для изображений с прозрачным фоном (опциональные)
    image_egg_transparent_url = Column(String, nullable=True)
    image_baby_transparent_url = Column(String, nullable=True)
    image_adult_transparent_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)



