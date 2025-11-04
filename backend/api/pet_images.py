from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from io import BytesIO
from PIL import Image
import httpx

from core.db import get_db
from models import Pet
from services.generation.factory import get_image_generator
from services.prompt_store import load_prompts, generate_and_store_prompts
from services.r2_storage import R2Storage
from config.settings import (
    get_generation_defaults,
    get_quality_settings,
    get_stage_negative_prompt,
    get_realism_prompt,
    build_pet_image_key,
)

router = APIRouter(prefix="/pet-images", tags=["Pet Images"])


def _ensure_prompt(user_id: str, pet_name: str, stage_key: str) -> str:
    from services.stages import StageLifecycleService
    prompt_en: Optional[str] = None
    try:
        prompt_en = StageLifecycleService._get_prompt_from_db_sync(user_id, pet_name, stage_key)
    except Exception:
        prompt_en = None
    if not prompt_en:
        stored = load_prompts(user_id, pet_name) or {}
        if not stored:
            stored = generate_and_store_prompts(user_id, pet_name) or {}
        prompt_en = ((stored.get("stage_prompts", {}) or {}).get(stage_key, {}) or {}).get("en")
    if not prompt_en:
        base_by_stage = {
            "egg": "a single egg with subtle textures, photorealistic, studio lighting",
            "baby": "a cute baby animal portrait, photorealistic, studio lighting",
            "adult": "a realistic adult animal portrait, photorealistic, studio lighting",
        }
        prompt_en = base_by_stage.get(stage_key, base_by_stage["baby"])
    return prompt_en


@router.get("/{user_id}/{pet_name}")
async def get_pet_image(
    user_id: str,
    pet_name: str,
    db: AsyncSession = Depends(get_db)
):
    # Получаем питомца
    result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")

    stage_key = pet.state.value if pet.state.value in {"egg", "baby", "adult"} else "adult"

    # Если уже есть URL — редиректим
    url_map = {
        "egg": getattr(pet, "image_egg_url", None),
        "baby": getattr(pet, "image_baby_url", None),
        "adult": getattr(pet, "image_adult_url", None),
    }
    existing_url = url_map.get(stage_key)
    if existing_url:
        # Проверяем и перегенерируем URL если нужно:
        # 1. URL без подписи (не содержит ?)
        # 2. URL содержит старый формат /pets/pets/ (двойной префикс)
        # 3. URL может быть истёкшим (будет перегенерирован при 403)
        should_regenerate = False
        if "r2.cloudflarestorage.com" in existing_url:
            # Проверяем наличие подписи и правильность пути
            if "?" not in existing_url or "/pets/pets/" in existing_url:
                should_regenerate = True
        
        if should_regenerate:
            # Перегенерируем URL с правильным ключом
            # Пробуем оба варианта: с префиксом pets/ и без (для обратной совместимости)
            key = build_pet_image_key(user_id, pet_name, stage_key, ext="png")
            key_with_prefix = f"pets/{key}"
            
            r2_storage = R2Storage()
            # Пробуем сначала новый формат (без префикса), затем старый (с префиксом)
            found_key = None
            for key_variant in [key, key_with_prefix]:
                if r2_storage.key_exists(key_variant):
                    found_key = key_variant
                    break
            
            # Используем найденный ключ или новый формат по умолчанию
            signed = r2_storage.make_url(found_key if found_key else key)
            # Сохраняем URL в БД
            if stage_key == "egg":
                pet.image_egg_url = signed
            elif stage_key == "baby":
                pet.image_baby_url = signed
            else:
                pet.image_adult_url = signed
            await db.commit()
            existing_url = signed
        
        # Проксируем через backend для CORS, если URL из R2
        if "r2.cloudflarestorage.com" in existing_url:
            try:
                return await _proxy_r2_image(existing_url, stage_key)
            except HTTPException as e:
                # Если получили 403/404, возможно URL истёк или файл перемещён
                # Перегенерируем URL и попробуем снова
                if e.status_code in (403, 404, 502):
                    # URL истёк или файл не найден - ищем файл по обоим вариантам пути
                    key = build_pet_image_key(user_id, pet_name, stage_key, ext="png")
                    key_with_prefix = f"pets/{key}"
                    
                    r2_storage = R2Storage()
                    found_key = None
                    # Проверяем оба варианта пути
                    for key_variant in [key, key_with_prefix]:
                        if r2_storage.key_exists(key_variant):
                            found_key = key_variant
                            break
                    
                    if found_key:
                        # Файл найден - генерируем новый URL и сохраняем
                        new_url = r2_storage.make_url(found_key)
                        if stage_key == "egg":
                            pet.image_egg_url = new_url
                        elif stage_key == "baby":
                            pet.image_baby_url = new_url
                        else:
                            pet.image_adult_url = new_url
                        await db.commit()
                        # Пробуем получить изображение
                        return await _proxy_r2_image(new_url, stage_key)
                    # Если файл не найден - продолжаем выполнение для генерации нового изображения
                    # (код ниже обработает это)
        
        return RedirectResponse(existing_url, status_code=307)

    # Генерация через реплику и ПРЯМАЯ загрузка в R2 (без локальных файлов и без base64)
    prompt_en = _ensure_prompt(user_id, pet_name, stage_key)

    gen_defaults = get_generation_defaults()
    quality_settings = get_quality_settings(gen_defaults["quality_preset"])  # type: ignore
    stage_negative = get_stage_negative_prompt(stage_key, include_global=True)
    realism_prompt = get_realism_prompt(gen_defaults["realism_style"])  # type: ignore
    enhanced_prompt = f"{prompt_en}, {realism_prompt}, masterpiece, best quality, highly detailed, ultra detailed, 8k resolution, professional photography, natural lighting, realistic creature, detailed anatomy, natural environment, realistic proportions, detailed features, natural colors, realistic shadows, depth of field, natural pose"

    generator = get_image_generator()
    img = generator.generate_image(
        enhanced_prompt,
        negative_prompt=stage_negative,
        **quality_settings,
    )
    if img is None:
        # Fallback на альтернативный генератор SVG
        try:
            from services.generation.alternative_generator import pet_generator_alternative
            import asyncio
            svg_path, metadata = await pet_generator_alternative.generate_pet_image(user_id, pet_name, stage_key, pet.health)
            # Читаем SVG файл
            with open(svg_path, 'rb') as f:
                svg_data = f.read()
            key = build_pet_image_key(user_id, pet_name, stage_key, ext="svg")
            url = R2Storage().upload_bytes(key, svg_data, "image/svg+xml")
        except Exception as fallback_error:
            # Если и альтернативный генератор не сработал
            raise HTTPException(status_code=503, detail=f"Генерация изображения недоступна: {str(fallback_error)}")
    else:
        # PNG в память -> R2
        buf = BytesIO()
        img.save(buf, format="PNG")
        data = buf.getvalue()
        key = build_pet_image_key(user_id, pet_name, stage_key, ext="png")
        url = R2Storage().upload_bytes(key, data, "image/png")

    # Сохраняем URL в БД
    if stage_key == "egg":
        pet.image_egg_url = url
    elif stage_key == "baby":
        pet.image_baby_url = url
    else:
        pet.image_adult_url = url
    await db.commit()

    # Проксируем через backend для CORS, если URL из R2
    if "r2.cloudflarestorage.com" in url:
        return await _proxy_r2_image(url, stage_key)
    
    return RedirectResponse(url, status_code=307)


async def _proxy_r2_image(r2_url: str, stage_key: str) -> Response:
    """
    Проксирует изображение из R2 через backend с правильными CORS заголовками.
    Решает проблему CORS, когда R2 бакет не настроен на CORS.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(r2_url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "image/png")
            
            # Возвращаем изображение с правильными CORS заголовками
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Cache-Control": "public, max-age=86400",  # Кеш на 1 день
                    "X-Pet-Stage": stage_key,
                    "X-Pet-Source": "r2_proxied",
                }
            )
    except httpx.HTTPStatusError as e:
        # Преобразуем HTTP ошибки в HTTPException с правильным статус кодом
        status_code = e.response.status_code
        if status_code == 403:
            raise HTTPException(status_code=403, detail=f"Доступ запрещен к изображению в R2 (возможно истёк URL или нет прав): {str(e)}")
        elif status_code == 404:
            raise HTTPException(status_code=404, detail=f"Изображение не найдено в R2: {str(e)}")
        else:
            raise HTTPException(status_code=502, detail=f"Ошибка получения изображения из R2 (HTTP {status_code}): {str(e)}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ошибка получения изображения из R2: {str(e)}")


@router.post("/admin/clear-all")
async def clear_all_images_r2():
    """ОСТОРОЖНО: очищает весь бакет (без условий)."""
    storage = R2Storage()
    deleted = storage.delete_prefix("")
    return {"deleted": deleted}


