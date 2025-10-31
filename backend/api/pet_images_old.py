from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db import get_db
from models import Pet
from pet_generator_alternative import pet_generator_alternative
from typing import Optional
import json
from . import *  # noqa: F401
from services.generation.factory import get_image_generator
from generator.promt_gen import CreatureGenerator
from services.prompt_store import load_prompts, generate_and_store_prompts
from config.settings import GENERATION_DEFAULTS, get_file_settings
from services.stages import StageLifecycleService
import logging
import os
import base64

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pet-images", tags=["Pet Images"])

@router.get("/{user_id}/{pet_name}")
async def get_pet_image(
    user_id: str,
    pet_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Получает изображение питомца исключительно из БД (base64).
    При его отсутствии генерирует и сохраняет в БД, затем отдает.
    """
    try:
        # Получаем информацию о питомце из БД
        result = await db.execute(
            select(Pet).where(
                Pet.user_id == user_id, 
                Pet.name == pet_name
            )
        )
        pet = result.scalar_one_or_none()
        
        if not pet:
            raise HTTPException(status_code=404, detail="Питомец не найден")
        stage_key = pet.state.value if pet.state.value in {"egg", "baby", "adult"} else "adult"

        # 1) Если есть URL в БД — делаем redirect на внешний URL (R2)
        url_map = {
            'egg': getattr(pet, 'image_egg_url', None),
            'baby': getattr(pet, 'image_baby_url', None),
            'adult': getattr(pet, 'image_adult_url', None),
        }
        existing_url = url_map.get(stage_key)
        if existing_url:
            return RedirectResponse(existing_url, status_code=307)

        # 2) Пытаемся отдать сохранённое изображение из БД (legacy base64)
        b64_map = {
            'egg': pet.image_egg_b64,
            'baby': pet.image_baby_b64,
            'adult': pet.image_adult_b64,
        }
        existing_b64 = b64_map.get(stage_key)
        if existing_b64:
            try:
                raw = base64.b64decode(existing_b64)
                # Определяем тип содержимого по сигнатуре
                media = "image/png"
                sig = raw[:10]
                if sig.startswith(b"<?xml") or b"<svg" in sig:
                    media = "image/svg+xml"
                elif sig.startswith(b"\x89PNG\r\n\x1a\n"):
                    media = "image/png"
                return Response(content=raw, media_type=media, headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "X-Pet-Stage": stage_key,
                    "X-Pet-Source": "db_base64",
                    "X-Media-Type": media,
                })
            except Exception:
                pass

        # 3) Нет изображения — генерируем и загружаем в R2
        image_path: Optional[str] = None
        try:
            from config.settings import (
                get_generation_defaults,
                get_quality_settings,
                get_stage_negative_prompt,
                get_realism_prompt,
            )
            generator = get_image_generator()

            # Промпт: обеспечиваем наличие (генерируем при отсутствии)
            prompt_en = None
            try:
                prompt_en = StageLifecycleService._get_prompt_from_db_sync(user_id, pet_name, stage_key)
            except Exception:
                prompt_en = None
            if not prompt_en:
                stored = StageLifecycleService.ensure_prompts(user_id, pet_name)
                prompt_en = ((stored.get("stage_prompts", {}) or {}).get(stage_key, {}) or {}).get("en")
            if not prompt_en:
                base_by_stage = {
                    "egg": "a single egg with subtle textures, photorealistic, studio lighting",
                    "baby": "a cute baby animal portrait, photorealistic, studio lighting",
                    "adult": "a realistic adult animal portrait, photorealistic, studio lighting",
                }
                prompt_en = base_by_stage.get(stage_key, base_by_stage["baby"])  # safe fallback

            if prompt_en:
                gen_defaults = get_generation_defaults()
                preferred_model = gen_defaults["preferred_model"]
                quality_settings = get_quality_settings(gen_defaults["quality_preset"])  # type: ignore
                stage_negative = get_stage_negative_prompt(stage_key, include_global=True)
                realism_prompt = get_realism_prompt(gen_defaults["realism_style"])  # type: ignore
                enhanced_prompt = f"{prompt_en}, {realism_prompt}, masterpiece, best quality, highly detailed, ultra detailed, 8k resolution, professional photography, natural lighting, realistic creature, detailed anatomy, natural environment, realistic proportions, detailed features, natural colors, realistic shadows, depth of field, natural pose"

                img = generator.generate_image(
                    enhanced_prompt,
                    negative_prompt=stage_negative,
                    **quality_settings,
                )
                try:
                    import os
                    os.makedirs('./logs', exist_ok=True)
                    with open('./logs/pet_images.log','a',encoding='utf-8') as _f:
                        _f.write(f"gen_called stage={stage_key} got={'OK' if img is not None else 'None'}\n")
                except Exception:
                    pass
                if img is not None:
                    # Сохраняем в файловую систему временно, затем кладем в БД через persist
                    out_dir = get_file_settings()["output_dir"]
                    os.makedirs(out_dir, exist_ok=True)
                    temp_path = os.path.join(out_dir, f"{user_id}_{pet_name}_{stage_key}_temp.png")
                    img.save(temp_path)
                    image_path = temp_path
            # Если не удалось — SVG fallback
            if image_path is None:
                image_path, _ = await pet_generator_alternative.generate_pet_image(
                    user_id=user_id,
                    pet_name=pet_name,
                    stage=stage_key,
                    health=pet.health
                )

            # Persist в БД (сохраняем URL) и повторная отдача
            await StageLifecycleService.persist_stage_artifacts(db, user_id, pet_name, stage_key, prompt_en, image_path)

            # Обновим pet и отдадим redirect
            await db.refresh(pet)
            refreshed_url = {
                'egg': getattr(pet, 'image_egg_url', None),
                'baby': getattr(pet, 'image_baby_url', None),
                'adult': getattr(pet, 'image_adult_url', None),
            }.get(stage_key)
            if refreshed_url:
                return RedirectResponse(refreshed_url, status_code=307)

            # Если по какой-то причине не удалось — безопасный SVG placeholder
            placeholder_svg = f"""
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#f0f9ff' />
      <stop offset='100%' stop-color='#e0f2fe' />
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='200' height='200' rx='16' fill='url(#bg)' />
  <text x='100' y='100' text-anchor='middle' dominant-baseline='middle' font-size='18' fill='#0b1220'>Telepets</text>
  <text x='100' y='130' text-anchor='middle' dominant-baseline='middle' font-size='12' fill='#334155'>{pet_name} · {user_id}</text>
  <text x='100' y='155' text-anchor='middle' dominant-baseline='middle' font-size='10' fill='#64748b'>stage: {stage_key}</text>
  <title>generated inline svg placeholder</title>
  </svg>""".strip()
            return Response(content=placeholder_svg, media_type="image/svg+xml")
        except Exception:
            # Если генерация/сохранение упала, продолжим на общий обработчик ниже
            pass
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения изображения питомца: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения изображения")

@router.get("/{user_id}/{pet_name}/metadata")
async def get_pet_image_metadata(
    user_id: str, 
    pet_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Получает метаданные изображения питомца.
    """
    try:
        # Получаем информацию о питомце из БД
        result = await db.execute(
            select(Pet).where(
                Pet.user_id == user_id, 
                Pet.name == pet_name
            )
        )
        pet = result.scalar_one_or_none()
        
        if not pet:
            raise HTTPException(status_code=404, detail="Питомец не найден")
        
        # Генерируем изображение и получаем метаданные
        _, metadata = await pet_generator_alternative.generate_pet_image(
            user_id=user_id,
            pet_name=pet_name,
            stage=pet.state.value,
            health=pet.health
        )
        
        return {
            "user_id": user_id,
            "pet_name": pet_name,
            "stage": pet.state.value,
            "health": pet.health,
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения метаданных изображения: {e}")
        raise HTTPException(status_code=500, detail="Ошибка получения метаданных")

@router.post("/{user_id}/regenerate")
async def regenerate_pet_images(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Перегенерирует все изображения питомцев пользователя.
    """
    try:
        # Получаем всех питомцев пользователя
        result = await db.execute(
            select(Pet).where(Pet.user_id == user_id)
        )
        pets = result.scalars().all()
        
        if not pets:
            raise HTTPException(status_code=404, detail="Питомцы не найдены")
        
        # Очищаем кэш для пользователя
        await pet_generator_alternative.clear_cache(user_id)
        
        # Перегенерируем изображения для всех питомцев
        regenerated_images = []
        for pet in pets:
            try:
                image_path, metadata = await pet_generator_alternative.generate_pet_image(
                    user_id=user_id,
                    pet_name=pet.name,
                    stage=pet.state.value,
                    health=pet.health
                )
                regenerated_images.append({
                    "pet_name": pet.name,
                    "stage": pet.state.value,
                    "health": pet.health,
                    "image_path": image_path
                })
            except Exception as e:
                logger.error(f"Ошибка перегенерации изображения для {pet.name}: {e}")
        
        return {
            "message": f"Перегенерировано {len(regenerated_images)} изображений",
            "regenerated_images": regenerated_images
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка перегенерации изображений: {e}")
        raise HTTPException(status_code=500, detail="Ошибка перегенерации изображений")

@router.delete("/cache")
async def clear_image_cache():
    """
    Очищает весь кэш изображений питомцев.
    """
    try:
        await pet_generator_alternative.clear_cache()
        return {"message": "Кэш изображений очищен"}
    except Exception as e:
        logger.error(f"Ошибка очистки кэша: {e}")
        raise HTTPException(status_code=500, detail="Ошибка очистки кэша") 