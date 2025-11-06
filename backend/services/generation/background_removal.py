"""
Сервис для удаления фона с изображений через Replicate
"""
from __future__ import annotations

import logging
from io import BytesIO
from typing import Optional
import os

import replicate
import requests
from PIL import Image

from config.settings import (
    get_background_removal_settings,
    get_background_removal_model,
)

logger = logging.getLogger(__name__)


class BackgroundRemovalService:
    """Сервис для удаления фона с изображений"""
    
    def __init__(self):
        self.settings = get_background_removal_settings()
        self.timeout = int(self.settings.get("timeout", 60))
        
        # Проверяем наличие токена Replicate при инициализации
        replicate_token = os.getenv("REPLICATE_API_TOKEN")
        if not replicate_token:
            logger.warning("REPLICATE_API_TOKEN not set - background removal may fail")
        else:
            logger.debug(f"REPLICATE_API_TOKEN is set (length: {len(replicate_token)})")
    
    def remove_background(
        self,
        image: Image.Image,
        model_name: Optional[str] = None,
    ) -> Optional[Image.Image]:
        """
        Удаляет фон с изображения
        
        Args:
            image: PIL Image объект
            model_name: Имя модели для удаления фона (опционально)
            
        Returns:
            PIL Image с прозрачным фоном или None при ошибке
        """
        if not self.settings.get("enabled", True):
            logger.info("Background removal disabled, skipping")
            return None
        
        try:
            # Получаем модель
            model_info = get_background_removal_model(model_name)
            model_id = model_info["model_id"]
            
            logger.info(f"Removing background using model: {model_id}, image size: {image.size}, mode: {image.mode}")
            
            # Если модель без версии, получаем последнюю версию
            # Это необходимо, так как Replicate API требует версию для некоторых моделей
            model_version = None
            if "/" in model_id and ":" not in model_id:
                try:
                    parts = model_id.split("/")
                    if len(parts) == 2:
                        owner, model_name_only = parts
                        model = replicate.models.get(owner, model_name_only)
                        versions = list(model.versions.list())
                        if versions:
                            model_version = versions[0]  # Используем последнюю версию
                            logger.info(f"Using model version: {model_version.id}")
                except Exception as e:
                    logger.warning(f"Could not get model version, using model_id directly: {e}")
                    model_version = None
            
            # Конвертируем изображение в RGB если нужно (rembg работает лучше с RGB)
            # Но сохраняем оригинальный режим для конвертации обратно
            if image.mode not in ("RGB", "RGBA"):
                logger.info(f"Converting image from {image.mode} to RGB")
                if image.mode == "P":
                    # Для палитровых изображений сначала конвертируем в RGBA, потом в RGB
                    image = image.convert("RGBA")
                image = image.convert("RGB")
            elif image.mode == "RGBA":
                # RGBA тоже конвертируем в RGB для rembg
                logger.info("Converting RGBA to RGB for rembg")
                image = image.convert("RGB")
            
            # Конвертируем PIL Image в BytesIO для отправки в Replicate
            # rembg требует PNG формат
            image_bytes = BytesIO()
            image.save(image_bytes, format="PNG")
            image_bytes.seek(0)
            
            image_size_bytes = len(image_bytes.getvalue())
            logger.info(f"Image prepared for rembg: {image_size_bytes} bytes, format=PNG")
            
            # Вызываем модель удаления фона
            # rembg принимает файл как file-like объект
            # Используем версию модели, если она была получена
            target_model = model_version if model_version else model_id
            logger.info(f"Calling Replicate API with model {target_model}...")
            try:
                # Используем use_file_output=False чтобы получить URL вместо FileOutput
                # Это позволяет нам загружать файл с правильной авторизацией
                output = replicate.run(
                    target_model,
                    input={"image": image_bytes},
                    use_file_output=False  # Получаем URL вместо FileOutput
                )
                logger.info(f"Replicate API call completed. Output type: {type(output)}")
            except Exception as api_error:
                logger.error(f"Replicate API call failed: {type(api_error).__name__}: {api_error}", exc_info=True)
                raise
            
            logger.info(f"Replicate output type: {type(output)}, repr: {repr(output)[:200]}")
            
            # Обрабатываем результат
            # С use_file_output=False мы получаем URL строки, которые нужно загрузить
            url = None
            result_image = None
            
            if isinstance(output, list) and output:
                # Если список, берем первый элемент
                item = output[0]
                logger.info(f"Output is list, first item type: {type(item)}")
                
                # Проверяем, является ли это FileOutput (если use_file_output=False не сработал)
                if hasattr(item, 'read'):
                    # Это FileOutput - используем Image.open() напрямую
                    try:
                        logger.info("Trying Image.open() directly with FileOutput...")
                        result_image = Image.open(item).convert("RGBA")
                        logger.info(f"Background removed successfully from FileOutput (direct), size: {result_image.size}")
                        return result_image
                    except Exception as e:
                        logger.warning(f"Image.open() failed, trying .read(): {e}")
                        try:
                            result_bytes = item.read()
                            result_image = Image.open(BytesIO(result_bytes)).convert("RGBA")
                            logger.info(f"Background removed successfully from FileOutput (.read()), size: {result_image.size}")
                            return result_image
                        except Exception as e2:
                            logger.error(f"Both Image.open() and .read() failed: {e2}")
                            # Пробуем получить URL из FileOutput
                            if hasattr(item, 'urls') and item.urls:
                                url = item.urls.get('get')
                            elif hasattr(item, 'url'):
                                url = item.url
                elif isinstance(item, str) and item.startswith("http"):
                    url = item
                else:
                    url = str(item)
            elif hasattr(output, 'read'):
                # Это FileOutput объект напрямую
                try:
                    logger.info("Output is FileOutput directly, trying Image.open()...")
                    result_image = Image.open(output).convert("RGBA")
                    logger.info(f"Background removed successfully from FileOutput (direct), size: {result_image.size}")
                    return result_image
                except Exception as e:
                    logger.warning(f"Image.open() failed, trying .read(): {e}")
                    try:
                        result_bytes = output.read()
                        result_image = Image.open(BytesIO(result_bytes)).convert("RGBA")
                        logger.info(f"Background removed successfully from FileOutput (.read()), size: {result_image.size}")
                        return result_image
                    except Exception as e2:
                        logger.error(f"Both Image.open() and .read() failed: {e2}")
                        # Пробуем получить URL
                        if hasattr(output, 'urls') and output.urls:
                            url = output.urls.get('get')
                        elif hasattr(output, 'url'):
                            url = output.url
            elif isinstance(output, str):
                url = output
            else:
                try:
                    s = str(output)
                    if s.startswith("http"):
                        url = s
                    else:
                        logger.warning(f"Unexpected output format: {type(output)}, value: {s[:100]}")
                except Exception as e:
                    logger.error(f"Failed to convert output to string: {e}", exc_info=True)
            
            if not url:
                logger.error(f"Background removal returned empty output. Output type: {type(output)}, value: {repr(output)[:200]}")
                return None
            
            # Загружаем результат по URL с авторизацией
            if isinstance(url, str) and url.startswith("http"):
                logger.info(f"Downloading result from URL: {url[:100]}...")
                
                # Получаем токен для авторизации
                replicate_token = os.getenv("REPLICATE_API_TOKEN")
                headers = {}
                if replicate_token:
                    headers["Authorization"] = f"Token {replicate_token}"
                
                resp = requests.get(url, timeout=self.timeout, headers=headers)
                resp.raise_for_status()
                
                # Возвращаем изображение с прозрачностью
                result_image = Image.open(BytesIO(resp.content)).convert("RGBA")
                logger.info(f"Background removed successfully from URL, size: {result_image.size}")
                return result_image
            else:
                logger.error(f"Invalid URL format: {url} (type: {type(url)})")
                return None
            
        except replicate.exceptions.ReplicateError as e:
            error_msg = str(e)
            logger.error(f"Replicate API error during background removal: {e}", exc_info=True)
            if "401" in error_msg or "authorization" in error_msg.lower() or "token" in error_msg.lower():
                logger.error("AUTHENTICATION ERROR: Check REPLICATE_API_TOKEN environment variable.")
            elif "404" in error_msg or "not found" in error_msg.lower():
                logger.error(f"MODEL NOT FOUND: Model '{model_id}' is not available. This may mean:")
                logger.error("  1. The model was removed or renamed on Replicate")
                logger.error("  2. Your API token doesn't have access to this model")
                logger.error("  3. The model ID is incorrect")
                logger.error("  Consider updating BACKGROUND_REMOVAL_MODEL in settings or .env file")
            elif "422" in error_msg or "invalid version" in error_msg.lower():
                logger.error(f"INVALID MODEL VERSION: Model '{model_id}' version is invalid or not permitted")
                logger.error("  Try using the model without a specific version (e.g., 'cjwbw/rembg')")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error during background removal: {e}", exc_info=True)
            return None
        except Exception as e:
            logger.error(f"Background removal failed with unexpected error: {type(e).__name__}: {e}", exc_info=True)
            return None
    
    def is_enabled(self) -> bool:
        """Проверяет, включено ли удаление фона"""
        return self.settings.get("enabled", True)

