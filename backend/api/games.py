from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update
from sqlalchemy.orm import selectinload
from db import get_db
from models import User, GameProgress
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class GameProgressData(BaseModel):
    user_id: str
    pet_name: str
    coins_stolen: int
    game_type: str = "pet_thief"

class UserNameResponse(BaseModel):
    user_id: str
    username: Optional[str]
    display_name: str

@router.post("/save-progress")
async def save_game_progress(
    progress_data: GameProgressData,
    db: AsyncSession = Depends(get_db)
):
    """
    Сохраняет прогресс игры в базу данных
    """
    try:
        # Проверяем, существует ли уже запись для этого пользователя и питомца
        result = await db.execute(
            select(GameProgress).where(
                GameProgress.user_id == progress_data.user_id,
                GameProgress.pet_name == progress_data.pet_name,
                GameProgress.game_type == progress_data.game_type
            )
        )
        existing_progress = result.scalar_one_or_none()
        
        if existing_progress:
            # Обновляем существующую запись
            await db.execute(
                update(GameProgress)
                .where(GameProgress.id == existing_progress.id)
                .values(coins_stolen=progress_data.coins_stolen)
            )
            logger.info(f"Обновлен прогресс игры для пользователя {progress_data.user_id}, питомец {progress_data.pet_name}: {progress_data.coins_stolen} монет")
        else:
            # Создаем новую запись
            await db.execute(
                insert(GameProgress).values(
                    user_id=progress_data.user_id,
                    pet_name=progress_data.pet_name,
                    game_type=progress_data.game_type,
                    coins_stolen=progress_data.coins_stolen
                )
            )
            logger.info(f"Создан новый прогресс игры для пользователя {progress_data.user_id}, питомец {progress_data.pet_name}: {progress_data.coins_stolen} монет")
        
        await db.commit()
        return {"success": True, "message": "Прогресс игры сохранен"}
        
    except Exception as e:
        logger.error(f"Ошибка при сохранении прогресса игры: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка при сохранении прогресса игры")

@router.get("/user-names")
async def get_user_names(
    user_ids: str,  # Строка с ID пользователей через запятую
    db: AsyncSession = Depends(get_db)
):
    """
    Получает имена пользователей для отображения в игре
    """
    try:
        # Парсим список ID пользователей
        user_id_list = [uid.strip() for uid in user_ids.split(',') if uid.strip()]
        
        if not user_id_list:
            return {"users": []}
        
        # Получаем пользователей из базы данных
        result = await db.execute(
            select(User).where(User.user_id.in_(user_id_list))
        )
        users = result.scalars().all()
        
        # Формируем ответ
        user_names = []
        for user in users:
            display_name = user.username if user.username else user.user_id
            user_names.append({
                "user_id": user.user_id,
                "username": user.username,
                "display_name": display_name
            })
        
        logger.info(f"Получены имена для {len(user_names)} пользователей")
        return {"users": user_names}
        
    except Exception as e:
        logger.error(f"Ошибка при получении имен пользователей: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при получении имен пользователей")

@router.get("/progress/{user_id}")
async def get_game_progress(
    user_id: str,
    pet_name: Optional[str] = None,
    game_type: str = "pet_thief",
    db: AsyncSession = Depends(get_db)
):
    """
    Получает прогресс игры для пользователя
    """
    try:
        query = select(GameProgress).where(
            GameProgress.user_id == user_id,
            GameProgress.game_type == game_type
        )
        
        if pet_name:
            query = query.where(GameProgress.pet_name == pet_name)
        
        result = await db.execute(query)
        progress_records = result.scalars().all()
        
        return {
            "progress": [
                {
                    "pet_name": record.pet_name,
                    "coins_stolen": record.coins_stolen,
                    "created_at": record.created_at.isoformat() if record.created_at else None,
                    "updated_at": record.updated_at.isoformat() if record.updated_at else None
                }
                for record in progress_records
            ]
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении прогресса игры: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при получении прогресса игры")
