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
    stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Получает изображение питомца.
    
    Args:
        user_id: ID пользователя
        pet_name: Имя питомца
        transparent: Если True, возвращает изображение с прозрачным фоном (если доступно)
        stage: Стадия питомца (egg, baby, adult). Если не указана, используется текущая стадия питомца
        db: Сессия базы данных
    """
    # Получаем питомца
    result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")

    # Определяем стадию: из параметра запроса или из текущей стадии питомца
    if stage and stage in {"egg", "baby", "adult"}:
        stage_key = stage
    else:
        stage_key = pet.state.value if pet.state.value in {"egg", "baby", "adult"} else "adult"

    # Presigned URLs на лету: генерируем URL из ключа объекта, не читаем из БД
    # Это решает проблему истечения URL и соответствует best practices
    # Но для обратной совместимости сначала проверяем старые URL из БД
    r2_storage = R2Storage()
    from config.settings import get_legacy_pet_image_key
    
    # Сначала проверяем старые URL из БД (для обратной совместимости)
    # Если они есть и валидны, используем их
    if transparent:
        url_map_transparent = {
            "egg": getattr(pet, "image_egg_transparent_url", None),
            "baby": getattr(pet, "image_baby_transparent_url", None),
            "adult": getattr(pet, "image_adult_transparent_url", None),
        }
        existing_url = url_map_transparent.get(stage_key)
        if not existing_url:
            url_map_fallback = {
                "egg": getattr(pet, "image_egg_url", None),
                "baby": getattr(pet, "image_baby_url", None),
                "adult": getattr(pet, "image_adult_url", None),
            }
            existing_url = url_map_fallback.get(stage_key)
    else:
        url_map = {
            "egg": getattr(pet, "image_egg_url", None),
            "baby": getattr(pet, "image_baby_url", None),
            "adult": getattr(pet, "image_adult_url", None),
        }
        existing_url = url_map.get(stage_key)
    
    # Если есть старый URL из БД, пробуем использовать его
    if existing_url and "r2.cloudflarestorage.com" in existing_url:
        try:
            logger.info(f"Пробуем использовать старый URL из БД: {existing_url[:100]}...")
            return await _proxy_r2_image(existing_url, stage_key)
        except HTTPException as e:
            if e.status_code in (403, 404, 502):
                logger.warning(f"Старый URL истек или недоступен (HTTP {e.status_code}), ищем по ключам...")
                # URL истек, продолжаем поиск по ключам
            else:
                raise
        except Exception as e:
            logger.error(f"Ошибка при использовании старого URL: {str(e)}", exc_info=True)
            # Продолжаем поиск по ключам
    
    # Определяем ключ объекта в зависимости от запроса (прозрачное или обычное)
    if transparent:
        # Сначала пробуем прозрачное изображение
        key = build_pet_image_key(user_id, pet_name, stage_key, ext="webp", transparent=True)
        key_png = build_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=True)
        key_with_prefix = get_legacy_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=True)
        
        # Пробуем найти прозрачное изображение
        found_key = None
        for key_variant in [key, key_png, key_with_prefix]:
            logger.debug(f"Проверка существования ключа (transparent): {key_variant}")
            if r2_storage.key_exists(key_variant):
                found_key = key_variant
                logger.info(f"Найдено прозрачное изображение: {found_key}")
                break
        
        # Если прозрачного нет, пробуем обычное
        if not found_key:
            key = build_pet_image_key(user_id, pet_name, stage_key, ext="webp", transparent=False)
            key_png = build_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=False)
            key_with_prefix = get_legacy_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=False)
            
            for key_variant in [key, key_png, key_with_prefix]:
                logger.debug(f"Проверка существования ключа (fallback): {key_variant}")
                if r2_storage.key_exists(key_variant):
                    found_key = key_variant
                    logger.info(f"Найдено обычное изображение: {found_key}")
                    break
    else:
        # Обычное изображение
        key = build_pet_image_key(user_id, pet_name, stage_key, ext="webp", transparent=False)
        key_png = build_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=False)
        key_with_prefix = get_legacy_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=False)
        
        # Пробуем найти изображение (WebP, PNG, старый формат)
        found_key = None
        for key_variant in [key, key_png, key_with_prefix]:
            logger.debug(f"Проверка существования ключа: {key_variant}")
            if r2_storage.key_exists(key_variant):
                found_key = key_variant
                logger.info(f"Найдено изображение: {found_key}")
                break
    
    # Если изображение найдено, генерируем presigned URL на лету и проксируем
    if found_key:
        try:
            logger.info(f"Генерация presigned URL для ключа: {found_key}")
            # Генерируем presigned URL на лету (не сохраняем в БД)
            presigned_url = r2_storage.make_url(found_key)
            logger.debug(f"Presigned URL сгенерирован: {presigned_url[:100]}...")
            return await _proxy_r2_image(presigned_url, stage_key)
        except Exception as e:
            logger.error(f"Ошибка при генерации presigned URL для {found_key}: {str(e)}", exc_info=True)
            # Если не удалось сгенерировать URL, продолжаем к генерации изображения
            pass
    else:
        logger.warning(f"Изображение не найдено в R2 для {user_id}/{pet_name}/{stage_key} (transparent={transparent}). Пробовали ключи: {[key, key_png, key_with_prefix]}")

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
            # Загружаем в R2, но не сохраняем URL в БД (используем presigned URLs на лету)
            url = R2Storage().upload_bytes(key, svg_data, "image/svg+xml")
            # URL не сохраняем в БД - генерируем presigned URL на лету при запросе
            await db.commit()
            
            # Возвращаем изображение через проксирование presigned URL
            return await _proxy_r2_image(url, stage_key)
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
        # Загружаем в R2, но не сохраняем URL в БД (используем presigned URLs на лету)
        url = R2Storage().upload_bytes(key, data, content_type)
        
        # Удаляем фон (если включено)
        img_transparent = None
        url_transparent = None
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
                # Загружаем в R2, но не сохраняем URL в БД (используем presigned URLs на лету)
                url_transparent = R2Storage().upload_bytes(
                    key_transparent, data_transparent, "image/webp"
                )
        
        await db.commit()
        
        # Если запрошено прозрачное изображение и оно создано, используем его
        if transparent and url_transparent:
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
        # Проверяем, есть ли уже прозрачное изображение (по ключу объекта)
        key_transparent = build_pet_image_key(
            user_id, pet_name, stage_key, ext="webp", transparent=True
        )
        existing_transparent = r2_storage.key_exists(key_transparent)
        
        if existing_transparent:
            processed.append({
                "stage": stage_key,
                "status": "already_exists",
                "message": f"Прозрачное изображение для стадии '{stage_key}' уже существует"
            })
            continue
        
        # Генерируем ключ объекта для обычного изображения
        key = build_pet_image_key(user_id, pet_name, stage_key, ext="webp", transparent=False)
        key_png = build_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=False)
        from config.settings import get_legacy_pet_image_key
        key_with_prefix = get_legacy_pet_image_key(user_id, pet_name, stage_key, ext="png", transparent=False)
        
        # Пробуем найти изображение (WebP, PNG, старый формат)
        found_key = None
        for key_variant in [key, key_png, key_with_prefix]:
            if r2_storage.key_exists(key_variant):
                found_key = key_variant
                break
        
        if not found_key:
            errors.append(f"Изображение для стадии '{stage_key}' не найдено в R2")
            continue
        
        try:
            # Генерируем presigned URL на лету для загрузки изображения
            image_url = r2_storage.make_url(found_key)
            
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
                # Загружаем прозрачное изображение в R2, но не сохраняем URL в БД
                url_transparent = r2_storage.upload_bytes(
                    key_transparent, data_transparent, "image/webp"
                )
                # URL не сохраняем в БД - генерируем presigned URL на лету при запросе
                
                processed.append({
                    "stage": stage_key,
                    "status": "created",
                    "message": f"Прозрачное изображение для стадии '{stage_key}' успешно создано"
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


