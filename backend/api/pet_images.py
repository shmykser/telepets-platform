from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from io import BytesIO
from PIL import Image
import httpx
import logging
import os

from core.db import get_db
from models import Pet
from services.generation.factory import get_image_generator
from services.generation.background_removal import BackgroundRemovalService
from services.prompt_store import load_prompts, generate_and_store_prompts
from services.r2_storage import R2Storage
from config.settings import (
    get_generation_defaults,
    get_quality_settings,
    get_stage_negative_prompt,
    get_realism_prompt,
    build_pet_image_key,
    LEGACY_R2_PREFIX,
    API_PET_IMAGES_PATH,
)

# Используем централизованную конфигурацию пути из settings
router = APIRouter(prefix=API_PET_IMAGES_PATH, tags=["Pet Images"])
logger = logging.getLogger(__name__)


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
    transparent: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Получает изображение питомца.
    
    Args:
        user_id: ID пользователя
        pet_name: Имя питомца
        transparent: Если True, возвращает изображение с прозрачным фоном (если доступно)
        db: Сессия базы данных
    """
    # Получаем питомца
    result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")

    stage_key = pet.state.value if pet.state.value in {"egg", "baby", "adult"} else "adult"

    # Выбираем URL в зависимости от запроса
    if transparent:
        # Сначала ищем прозрачное изображение
        url_map_transparent = {
            "egg": getattr(pet, "image_egg_transparent_url", None),
            "baby": getattr(pet, "image_baby_transparent_url", None),
            "adult": getattr(pet, "image_adult_transparent_url", None),
        }
        existing_url = url_map_transparent.get(stage_key)
        # Если прозрачного варианта нет, используем обычный
        if not existing_url:
            url_map_fallback = {
                "egg": getattr(pet, "image_egg_url", None),
                "baby": getattr(pet, "image_baby_url", None),
                "adult": getattr(pet, "image_adult_url", None),
            }
            existing_url = url_map_fallback.get(stage_key)
    else:
        # Обычное изображение
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
            # Двойной префикс (например /pets/pets/) означает устаревший формат
            double_prefix = f"{LEGACY_R2_PREFIX}{LEGACY_R2_PREFIX}"
            if "?" not in existing_url or double_prefix in existing_url:
                should_regenerate = True
        
        if should_regenerate:
            # Перегенерируем URL с правильным ключом
            # Пробуем оба варианта: с префиксом pets/ и без (для обратной совместимости)
            from config.settings import get_legacy_pet_image_key
            # Пробуем WebP и PNG для обратной совместимости
            key = build_pet_image_key(user_id, pet_name, stage_key, ext="webp")
            key_png = build_pet_image_key(user_id, pet_name, stage_key, ext="png")
            key_with_prefix = get_legacy_pet_image_key(user_id, pet_name, stage_key, ext="png")
            
            r2_storage = R2Storage()
            # Пробуем сначала новый формат WebP, затем PNG, затем старый формат
            found_key = None
            for key_variant in [key, key_png, key_with_prefix]:
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
                    # URL истёк или файл не найден - ищем файл по всем вариантам пути
                    from config.settings import get_legacy_pet_image_key
                    key = build_pet_image_key(user_id, pet_name, stage_key, ext="webp")
                    key_png = build_pet_image_key(user_id, pet_name, stage_key, ext="png")
                    key_with_prefix = get_legacy_pet_image_key(user_id, pet_name, stage_key, ext="png")
                    
                    r2_storage = R2Storage()
                    found_key = None
                    # Проверяем все варианты пути (WebP, PNG, старый формат)
                    for key_variant in [key, key_png, key_with_prefix]:
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
        
        # Fallback: если проксирование не удалось или URL не из R2, делаем редирект с заголовками кэширования
        return RedirectResponse(
            existing_url, 
            status_code=307,
            headers={
                "Cache-Control": "public, max-age=604800, immutable",
            }
        )

    # Генерация через реплику и ПРЯМАЯ загрузка в R2 (без локальных файлов и без base64)
    prompt_en = _ensure_prompt(user_id, pet_name, stage_key)

    gen_defaults = get_generation_defaults()
    quality_settings = get_quality_settings(gen_defaults["quality_preset"])  # type: ignore
    stage_negative = get_stage_negative_prompt(stage_key, include_global=True)
    realism_prompt = get_realism_prompt(gen_defaults["realism_style"])  # type: ignore
    enhanced_prompt = f"{prompt_en}, {realism_prompt}, masterpiece, best quality, highly detailed, ultra detailed, 8k resolution, professional photography, natural lighting, realistic creature, detailed anatomy, natural environment, realistic proportions, detailed features, natural colors, realistic shadows, depth of field, natural pose"

    generator = get_image_generator()
    # Получаем формат из настроек
    output_format = gen_defaults.get("output_format", "webp").lower()
    
    img = generator.generate_image(
        enhanced_prompt,
        negative_prompt=stage_negative,
        output_format=output_format,
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
            
            # Сохраняем URL в БД
            if stage_key == "egg":
                pet.image_egg_url = url
            elif stage_key == "baby":
                pet.image_baby_url = url
            else:
                pet.image_adult_url = url
            await db.commit()
        except Exception as fallback_error:
            # Если и альтернативный генератор не сработал
            raise HTTPException(status_code=503, detail=f"Генерация изображения недоступна: {str(fallback_error)}")
    else:
        # Сохраняем основное изображение в WebP
        buf = BytesIO()
        img.save(buf, format=output_format.upper())
        data = buf.getvalue()
        key = build_pet_image_key(user_id, pet_name, stage_key, ext=output_format)
        content_type = f"image/{output_format}"
        url = R2Storage().upload_bytes(key, data, content_type)
        
        # Сохраняем URL основного изображения в БД
        if stage_key == "egg":
            pet.image_egg_url = url
        elif stage_key == "baby":
            pet.image_baby_url = url
        else:
            pet.image_adult_url = url
        
        # Удаляем фон (если включено)
        img_transparent = None
        bg_removal_service = BackgroundRemovalService()
        if bg_removal_service.is_enabled():
            img_transparent = bg_removal_service.remove_background(img)
            
            if img_transparent:
                # Сохраняем изображение с прозрачным фоном в WebP
                buf_transparent = BytesIO()
                img_transparent.save(buf_transparent, format="WEBP")
                data_transparent = buf_transparent.getvalue()
                
                key_transparent = build_pet_image_key(
                    user_id, pet_name, stage_key, ext="webp", transparent=True
                )
                url_transparent = R2Storage().upload_bytes(
                    key_transparent, data_transparent, "image/webp"
                )
                
                # Сохраняем URL прозрачного изображения в БД
                if stage_key == "egg":
                    pet.image_egg_transparent_url = url_transparent
                elif stage_key == "baby":
                    pet.image_baby_transparent_url = url_transparent
                else:
                    pet.image_adult_transparent_url = url_transparent
        
        await db.commit()
        
        # Если запрошено прозрачное изображение и оно создано, используем его
        if transparent and img_transparent:
            url = url_transparent

    # Всегда проксируем через backend для правильных заголовков кэширования
    if "r2.cloudflarestorage.com" in url:
        return await _proxy_r2_image(url, stage_key)
    
    # Fallback: редирект с заголовками кэширования
    return RedirectResponse(
        url, 
        status_code=307,
        headers={
            "Cache-Control": "public, max-age=604800, immutable",
        }
    )


async def _proxy_r2_image(r2_url: str, stage_key: str) -> Response:
    """
    Проксирует изображение из R2 через backend с правильными CORS заголовками.
    Решает проблему CORS, когда R2 бакет не настроен на CORS.
    Добавляет агрессивное кэширование для уменьшения количества запросов.
    """
    import hashlib
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(r2_url)
            response.raise_for_status()
            
            # Определяем content-type из заголовков или расширения файла
            content_type = response.headers.get("content-type", "image/webp")
            if not content_type or content_type == "application/octet-stream":
                # Пробуем определить по URL
                if ".webp" in r2_url.lower():
                    content_type = "image/webp"
                elif ".png" in r2_url.lower():
                    content_type = "image/png"
                else:
                    content_type = "image/webp"  # По умолчанию WebP
            
            # Генерируем ETag на основе URL изображения для валидации кэша
            etag = hashlib.md5(r2_url.encode()).hexdigest()
            
            # Получаем Last-Modified из исходного ответа R2, если есть
            last_modified = response.headers.get("Last-Modified")
            
            # Возвращаем изображение с правильными CORS заголовками и агрессивным кэшированием
            headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                # Агрессивное кэширование: 7 дней (604800 секунд)
                # Изображения питомцев не меняются часто, поэтому можно кэшировать долго
                "Cache-Control": "public, max-age=604800, immutable",
                "ETag": f'"{etag}"',
                "X-Pet-Stage": stage_key,
                "X-Pet-Source": "r2_proxied",
            }
            
            # Добавляем Last-Modified если есть
            if last_modified:
                headers["Last-Modified"] = last_modified
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers=headers
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


@router.post("/{user_id}/{pet_name}/remove-background")
async def remove_background_from_existing_image(
    user_id: str,
    pet_name: str,
    stage: Optional[str] = None,  # Если не указано, обработает все стадии
    db: AsyncSession = Depends(get_db)
):
    """
    Удаляет фон с уже существующего изображения питомца.
    Загружает изображение из R2, применяет удаление фона и сохраняет результат.
    
    Args:
        user_id: ID пользователя
        pet_name: Имя питомца
        stage: Стадия питомца (egg, baby, adult). Если не указано, обработает все стадии
        db: Сессия базы данных
    
    Returns:
        Информация о созданных прозрачных изображениях
    """
    # Получаем питомца
    result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    # Определяем стадии для обработки
    stages_to_process = [stage] if stage and stage in ["egg", "baby", "adult"] else ["egg", "baby", "adult"]
    
    bg_removal_service = BackgroundRemovalService()
    if not bg_removal_service.is_enabled():
        raise HTTPException(
            status_code=400, 
            detail="Удаление фона отключено. Установите BACKGROUND_REMOVAL_ENABLED=true"
        )
    
    # Проверяем наличие токена Replicate
    replicate_token = os.getenv("REPLICATE_API_TOKEN")
    if not replicate_token:
        raise HTTPException(
            status_code=500,
            detail="REPLICATE_API_TOKEN не установлен. Удаление фона требует токен Replicate API."
        )
    
    r2_storage = R2Storage()
    processed = []
    errors = []
    
    for stage_key in stages_to_process:
        # Получаем URL обычного изображения
        url_map = {
            "egg": getattr(pet, "image_egg_url", None),
            "baby": getattr(pet, "image_baby_url", None),
            "adult": getattr(pet, "image_adult_url", None),
        }
        image_url = url_map.get(stage_key)
        
        # Проверяем, есть ли уже прозрачное изображение
        transparent_url_map = {
            "egg": getattr(pet, "image_egg_transparent_url", None),
            "baby": getattr(pet, "image_baby_transparent_url", None),
            "adult": getattr(pet, "image_adult_transparent_url", None),
        }
        existing_transparent = transparent_url_map.get(stage_key)
        
        if not image_url:
            errors.append(f"Изображение для стадии '{stage_key}' не найдено (URL отсутствует в БД)")
            continue
        
        if existing_transparent:
            processed.append({
                "stage": stage_key,
                "status": "already_exists",
                "message": f"Прозрачное изображение для стадии '{stage_key}' уже существует"
            })
            continue
        
        try:
            # Загружаем изображение из R2
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                
                # Конвертируем в PIL Image
                img = Image.open(BytesIO(response.content))
                
                # Логируем информацию об изображении
                logger.info(f"[REMOVE-BG] Processing image for {user_id}/{pet_name}/{stage_key}: size={img.size}, mode={img.mode}, format={img.format}, URL={image_url[:100]}")
                
                # Применяем удаление фона
                logger.info(f"[REMOVE-BG] Starting background removal for {user_id}/{pet_name}/{stage_key}")
                img_transparent = bg_removal_service.remove_background(img)
                
                if not img_transparent:
                    error_msg = f"Не удалось удалить фон для стадии '{stage_key}' (проверьте логи сервера для деталей)"
                    logger.error(f"[REMOVE-BG] Background removal FAILED for {user_id}/{pet_name}/{stage_key} - service returned None")
                    errors.append(error_msg)
                    continue
                
                logger.info(f"[REMOVE-BG] Background removal SUCCESS for {user_id}/{pet_name}/{stage_key}, result size: {img_transparent.size}")
                
                # Сохраняем прозрачное изображение в WebP
                buf_transparent = BytesIO()
                img_transparent.save(buf_transparent, format="WEBP")
                data_transparent = buf_transparent.getvalue()
                
                key_transparent = build_pet_image_key(
                    user_id, pet_name, stage_key, ext="webp", transparent=True
                )
                url_transparent = r2_storage.upload_bytes(
                    key_transparent, data_transparent, "image/webp"
                )
                
                # Сохраняем URL прозрачного изображения в БД
                if stage_key == "egg":
                    pet.image_egg_transparent_url = url_transparent
                elif stage_key == "baby":
                    pet.image_baby_transparent_url = url_transparent
                else:
                    pet.image_adult_transparent_url = url_transparent
                
                processed.append({
                    "stage": stage_key,
                    "status": "created",
                    "transparent_url": url_transparent
                })
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Ошибка загрузки изображения для стадии '{stage_key}': HTTP {e.response.status_code}"
            logger.error(f"{error_msg} (URL: {image_url})")
            errors.append(error_msg)
            continue
        except Exception as e:
            error_msg = f"Ошибка обработки стадии '{stage_key}': {str(e)}"
            logger.error(f"{error_msg}", exc_info=True)
            errors.append(error_msg)
            continue
    
    # Сохраняем изменения в БД
    if processed:
        await db.commit()
    
    return {
        "status": "success" if processed else "error",
        "processed": processed,
        "errors": errors if errors else None
    }


@router.post("/admin/clear-all")
async def clear_all_images_r2():
    """ОСТОРОЖНО: очищает весь бакет (без условий)."""
    storage = R2Storage()
    deleted = storage.delete_prefix("")
    return {"deleted": deleted}


