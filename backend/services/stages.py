#!/usr/bin/env python3
from __future__ import annotations

import os
import json
import asyncio
import logging
from typing import Optional, Tuple, Dict, Any

from config.settings import (
    get_file_settings,
    get_generation_defaults,
    get_quality_settings,
    get_stage_negative_prompt,
    get_realism_prompt,
    HEALTH_MAX,
)
from services.prompt_store import generate_and_store_prompts, load_prompts
from services.generation.factory import get_image_generator
from services.generation.background_removal import BackgroundRemovalService
from services.r2_storage import R2Storage
from config.settings import build_pet_image_key
from generator.promt_gen import CreatureGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Pet, PetState
from services.generation.alternative_generator import pet_generator_alternative

logger = logging.getLogger(__name__)


class StageLifecycleService:
    @staticmethod
    def ensure_prompts(user_id: str, pet_name: str) -> Dict[str, Any]:
        stored = load_prompts(user_id, pet_name)
        if not stored:
            stored = generate_and_store_prompts(user_id, pet_name)
        return stored or {}

    @staticmethod
    def _generate_png_for_stage(user_id: str, pet_name: str, stage_key: str) -> Tuple[Optional[str], Dict[str, Any]]:
        """Пытается сгенерировать PNG через HF по сохранённому промпту. Возвращает (path, metadata)."""
        # Диагностический лог пайплайна
        try:
            os.makedirs('./logs', exist_ok=True)
            with open('./logs/pipeline.log','a',encoding='utf-8') as _f:
                _f.write(f"start _generate_png_for_stage user={user_id} pet={pet_name} stage={stage_key}\n")
        except Exception:
            pass
        stored = StageLifecycleService.ensure_prompts(user_id, pet_name)
        stage_prompts = (stored.get("stage_prompts", {}) or {})
        prompt_en = (stage_prompts.get(stage_key, {}) or {}).get("en")

        # 1) Пытаемся взять промпт из БД (источник истины)
        if not prompt_en:
            try:
                prompt_en = StageLifecycleService._get_prompt_from_db_sync(user_id, pet_name, stage_key)
            except Exception:
                prompt_en = None

        if not prompt_en:
            # Минимальный безопасный промпт, чтобы не падать в SVG
            base_by_stage = {
                "egg": "a single egg with subtle textures, photorealistic, studio lighting",
                "baby": "a cute baby animal portrait, photorealistic, studio lighting",
                "adult": "a realistic adult animal portrait, photorealistic, studio lighting",
            }
            prompt_en = base_by_stage.get(stage_key, base_by_stage["baby"])  # fallback

        gen_defaults = get_generation_defaults()
        preferred_model = gen_defaults["preferred_model"]
        quality_settings = get_quality_settings(gen_defaults["quality_preset"])  # type: ignore
        stage_negative = get_stage_negative_prompt(stage_key, include_global=True)
        realism_prompt = get_realism_prompt(gen_defaults["realism_style"])  # type: ignore
        enhanced_prompt = f"{prompt_en}, {realism_prompt}, masterpiece, best quality, highly detailed, ultra detailed, 8k resolution, professional photography, natural lighting, realistic creature, detailed anatomy, natural environment, realistic proportions, detailed features, natural colors, realistic shadows, depth of field, natural pose"
        
        # Получаем формат из настроек
        output_format = gen_defaults.get("output_format", "webp").lower()

        gen = get_image_generator()
        try:
            from config.settings import get_generation_provider
            prov = get_generation_provider()
            os.makedirs('./logs', exist_ok=True)
            with open('./logs/pipeline.log','a',encoding='utf-8') as _f:
                _f.write(f"generator={type(gen).__name__} provider={prov} prompt_len={len(enhanced_prompt)}\n")
        except Exception:
            pass
        img = gen.generate_image(
            enhanced_prompt,
            negative_prompt=stage_negative,
            output_format=output_format,
            **quality_settings,
        )

        if img is None:
            # Вторая попытка: короткий безопасный промпт без negative
            safe_by_stage = {
                "egg": "a single egg, photorealistic, studio lighting",
                "baby": "a cute baby animal portrait, photorealistic, studio lighting",
                "adult": "a realistic adult animal portrait, photorealistic, studio lighting",
            }
            safe_prompt = safe_by_stage.get(stage_key, safe_by_stage["baby"])
            try:
                with open('./logs/pipeline.log','a',encoding='utf-8') as _f:
                    _f.write("first gen None, retry with safe prompt\n")
            except Exception:
                pass
            img = gen.generate_image(safe_prompt, **quality_settings)
            if img is None:
                try:
                    with open('./logs/pipeline.log','a',encoding='utf-8') as _f:
                        _f.write("retry also None -> fallback SVG\n")
                except Exception:
                    pass
                return None, {}

        import time as _time
        ts = int(_time.time())
        safe_name = f"{user_id}_{pet_name}_{stage_key}_{preferred_model.replace('-', '_')}_{ts}"
        out_dir = get_file_settings()["output_dir"]
        os.makedirs(out_dir, exist_ok=True)
        # Сохраняем в формате из настроек (по умолчанию webp)
        image_path = os.path.join(out_dir, f"{safe_name}.{output_format}")
        img.save(image_path, format=output_format.upper())
        try:
            with open('./logs/pipeline.log','a',encoding='utf-8') as _f:
                _f.write(f"saved_png={image_path}\n")
        except Exception:
            pass

        metadata = {
            "user_id": user_id,
            "pet_name": pet_name,
            "stage": stage_key,
            "model": preferred_model,
            "prompt": enhanced_prompt,
            "base_prompt": prompt_en,
            "negative_prompt": stage_negative,
            "image_path": image_path,
            "timestamp": ts,
        }
        json_path = os.path.join(out_dir, f"{safe_name}_data.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        return image_path, metadata

    @staticmethod
    def get_or_generate_image(user_id: str, pet_name: str, stage_key: str, health: Optional[int] = None) -> Tuple[str, Dict[str, Any]]:
        image_path, metadata = StageLifecycleService._generate_png_for_stage(user_id, pet_name, stage_key)
        if image_path:
            return image_path, metadata
        # Fallback SVG
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(pet_generator_alternative.generate_pet_image(user_id, pet_name, stage_key, health or 100))

    @staticmethod
    async def warm_stage_image_async(user_id: str, pet_name: str, stage_key: str, health: int) -> None:
        def _run() -> None:
            try:
                StageLifecycleService.get_or_generate_image(user_id, pet_name, stage_key, health)
            except Exception:
                pass

        await asyncio.get_event_loop().run_in_executor(None, _run)

    @staticmethod
    async def prepare_on_create(db: AsyncSession, user_id: str, pet_name: str) -> None:
        """Генерирует creature-json и промпты для всех стадий, сохраняет в БД;
        затем генерирует изображение для стадии egg и сохраняет base64 в БД."""
        stored = StageLifecycleService.ensure_prompts(user_id, pet_name)
        stage_prompts = (stored.get("stage_prompts", {}) or {})

        # Сохраняем creature_json и промпты в БД (источник истины — БД)
        result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
        pet = result.scalar_one_or_none()
        if pet:
            pet.creature_json = json.dumps(stored.get("creature", {}), ensure_ascii=False)
            egg_en = (stage_prompts.get("egg", {}) or {}).get("en")
            baby_en = (stage_prompts.get("baby", {}) or {}).get("en")
            adult_en = (stage_prompts.get("adult", {}) or {}).get("en")
            if egg_en:
                pet.prompt_egg_en = egg_en
            if baby_en:
                pet.prompt_baby_en = baby_en
            if adult_en:
                pet.prompt_adult_en = adult_en
            await db.commit()

        # Сразу генерируем изображение для первой стадии (egg) и загружаем в R2 (в БД только URL)
        try:
            gen_defaults = get_generation_defaults()
            quality_settings = get_quality_settings(gen_defaults["quality_preset"])  # type: ignore
            stage_negative = get_stage_negative_prompt("egg", include_global=True)
            realism_prompt = get_realism_prompt(gen_defaults["realism_style"])  # type: ignore
            egg_prompt = (stage_prompts.get("egg", {}) or {}).get("en") or "a single egg with subtle textures, photorealistic, studio lighting"
            enhanced_prompt = f"{egg_prompt}, {realism_prompt}, masterpiece, best quality, highly detailed, ultra detailed, 8k resolution, professional photography, natural lighting, realistic creature, detailed anatomy, natural environment, realistic proportions, detailed features, natural colors, realistic shadows, depth of field, natural pose"
            
            # Получаем формат из настроек
            output_format = gen_defaults.get("output_format", "webp").lower()

            gen = get_image_generator()
            img = gen.generate_image(
                enhanced_prompt,
                negative_prompt=stage_negative,
                output_format=output_format,
                **quality_settings,
            )
            if img is not None:
                from io import BytesIO
                from services.r2_storage import R2Storage
                from config.settings import build_pet_image_key
                from services.generation.background_removal import BackgroundRemovalService
                
                # Сохраняем основное изображение в WebP
                buf = BytesIO()
                img.save(buf, format=output_format.upper())
                raw = buf.getvalue()
                key = build_pet_image_key(user_id, pet_name, "egg", ext=output_format)
                content_type = f"image/{output_format}"
                url = R2Storage().upload_bytes(key, raw, content_type)
                
                # Сохранить URL основного изображения в БД
                result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
                pet = result.scalar_one_or_none()
                if pet:
                    pet.image_egg_url = url
                    
                    # Удаляем фон (если включено)
                    bg_removal_service = BackgroundRemovalService()
                    if bg_removal_service.is_enabled():
                        img_transparent = bg_removal_service.remove_background(img)
                        
                        if img_transparent:
                            # Сохраняем изображение с прозрачным фоном в WebP
                            buf_transparent = BytesIO()
                            img_transparent.save(buf_transparent, format="WEBP")
                            data_transparent = buf_transparent.getvalue()
                            
                            key_transparent = build_pet_image_key(
                                user_id, pet_name, "egg", ext="webp", transparent=True
                            )
                            url_transparent = R2Storage().upload_bytes(
                                key_transparent, data_transparent, "image/webp"
                            )
                            
                            # Сохраняем URL прозрачного изображения в БД
                            pet.image_egg_transparent_url = url_transparent
                    
                    await db.commit()
            else:
                # Fallback на альтернативный генератор SVG
                from io import BytesIO
                from services.r2_storage import R2Storage
                from config.settings import build_pet_image_key
                from services.generation.alternative_generator import pet_generator_alternative
                svg_path, metadata = await pet_generator_alternative.generate_pet_image(user_id, pet_name, "egg", HEALTH_MAX)
                # Читаем SVG файл и загружаем в R2
                with open(svg_path, 'rb') as f:
                    svg_data = f.read()
                key = build_pet_image_key(user_id, pet_name, "egg", ext="svg")
                url = R2Storage().upload_bytes(key, svg_data, "image/svg+xml")
                # сохранить URL в БД
                result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
                pet = result.scalar_one_or_none()
                if pet:
                    pet.image_egg_url = url
                    await db.commit()
        except Exception as e:
            logger.error(f"Ошибка генерации изображения для {pet_name}: {e}")
            pass

    @staticmethod
    async def persist_stage_artifacts(db: AsyncSession, user_id: str, pet_name: str, stage_key: str, prompt_en: Optional[str], image_path: Optional[str]) -> None:
        """Сохраняет promt_en и URL текущей стадии (загрузка в R2) в таблицу pets."""
        result = await db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
        pet = result.scalar_one_or_none()
        if not pet:
            return
        # Промпты
        if stage_key == 'egg' and prompt_en:
            pet.prompt_egg_en = prompt_en
        elif stage_key == 'baby' and prompt_en:
            pet.prompt_baby_en = prompt_en
        elif stage_key == 'adult' and prompt_en:
            pet.prompt_adult_en = prompt_en
        # Загрузка в R2 и сохранение URL
        if image_path and os.path.exists(image_path):
            try:
                with open(image_path, 'rb') as f:
                    raw = f.read()
                # Определяем content-type и расширение
                head = raw[:10]
                if head.startswith(b"<?xml") or b"<svg" in head:
                    ext = 'svg'; content_type = 'image/svg+xml'
                elif head.startswith(b"RIFF") and b"WEBP" in raw[:12]:
                    ext = 'webp'; content_type = 'image/webp'
                elif head.startswith(b"\x89PNG\r\n\x1a\n"):
                    ext = 'png'; content_type = 'image/png'
                else:
                    # По умолчанию используем webp
                    ext = 'webp'; content_type = 'image/webp'
                key = build_pet_image_key(user_id, pet_name, stage_key, ext=ext)
                url = R2Storage().upload_bytes(key, raw, content_type)
                
                # Сохраняем URL основного изображения
                if stage_key == 'egg':
                    pet.image_egg_url = url
                elif stage_key == 'baby':
                    pet.image_baby_url = url
                elif stage_key == 'adult':
                    pet.image_adult_url = url
                
                # Если это не SVG, пытаемся удалить фон
                if ext != 'svg':
                    try:
                        from PIL import Image
                        from io import BytesIO
                        from services.generation.background_removal import BackgroundRemovalService
                        
                        # Загружаем изображение для удаления фона
                        img = Image.open(BytesIO(raw))
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
                                if stage_key == 'egg':
                                    pet.image_egg_transparent_url = url_transparent
                                elif stage_key == 'baby':
                                    pet.image_baby_transparent_url = url_transparent
                                elif stage_key == 'adult':
                                    pet.image_adult_transparent_url = url_transparent
                    except Exception as bg_error:
                        # Если удаление фона не удалось, продолжаем без него
                        logger.warning(f"Background removal failed in persist_stage_artifacts: {bg_error}")
            except Exception:
                pass
        await db.commit()

    @staticmethod
    async def wipe_images_on_death(db: AsyncSession, pet: Pet) -> None:
        # Очищаем URL изображений при смерти питомца (изображения остаются в R2, но ссылки удаляются)
        pet.image_egg_url = None
        pet.image_baby_url = None
        pet.image_adult_url = None
        # Очищаем также URL прозрачных изображений
        pet.image_egg_transparent_url = None
        pet.image_baby_transparent_url = None
        pet.image_adult_transparent_url = None
        await db.commit()

    # ===== Helpers =====
    @staticmethod
    def _get_prompt_from_db_sync(user_id: str, pet_name: str, stage_key: str) -> Optional[str]:
        """Синхронный helper для получения промпта из БД (используется в sync-пайплайне генерации изображений)."""
        from core.db import AsyncSessionLocal
        from models import Pet
        import asyncio as _asyncio

        async def _fetch() -> Optional[str]:
            async with AsyncSessionLocal() as _db:
                res = await _db.execute(select(Pet).where(Pet.user_id == user_id, Pet.name == pet_name))
                pet = res.scalar_one_or_none()
                if not pet:
                    return None
                if stage_key == 'egg':
                    return pet.prompt_egg_en
                if stage_key == 'baby':
                    return pet.prompt_baby_en
                if stage_key == 'adult':
                    return pet.prompt_adult_en
                return None

        loop = _asyncio.get_event_loop()
        return loop.run_until_complete(_fetch())


