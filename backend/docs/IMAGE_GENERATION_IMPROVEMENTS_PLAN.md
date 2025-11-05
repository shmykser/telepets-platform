# План реализации улучшений генерации изображений

## Обзор

Документ описывает план реализации следующих улучшений системы генерации изображений питомцев:

1. **Переход на WebP формат и настройки качества "fast"** (512x512)
2. **Добавление постпроцессинга для удаления фона** с настраиваемыми параметрами
3. **Расширение схемы БД** для хранения изображений с прозрачным фоном

---

## 1. Переход на WebP и настройки "fast" (512x512)

### 1.1. Изменения в конфигурации

**Файл:** `config/settings.py`

#### 1.1.1. Обновление GENERATION_DEFAULTS
```python
GENERATION_DEFAULTS = {
    "provider": GENERATION_PROVIDER,
    "preferred_model": "flux-1.1-pro" if GENERATION_PROVIDER == "replicate" else "flux1-dev",
    "realism_style": "photorealistic",
    "quality_preset": "fast",  # Уже изменено
    "output_format": "webp",   # НОВОЕ: формат по умолчанию
}
```

#### 1.1.2. Добавление настроек постпроцессинга
```python
# Настройки постпроцессинга для удаления фона
BACKGROUND_REMOVAL_SETTINGS = {
    "enabled": os.getenv("BACKGROUND_REMOVAL_ENABLED", "true").strip().lower() in {"1", "true", "yes", "y"},
    "model": os.getenv("BACKGROUND_REMOVAL_MODEL", "cjwbw/rembg"),  # Модель по умолчанию
    "timeout": int(os.getenv("BACKGROUND_REMOVAL_TIMEOUT", "60")),
}

# Доступные модели для удаления фона
BACKGROUND_REMOVAL_MODELS = {
    "rembg": {
        "model_id": "cjwbw/rembg",
        "description": "Universal background removal (default)"
    },
    "clipdrop": {
        "model_id": "levindabhi/clipdrop-remove-background",
        "description": "Clipdrop background removal"
    },
    "rembg-api": {
        "model_id": "levindabhi/rembg-api",
        "description": "Alternative rembg implementation"
    }
}
```

#### 1.1.3. Обновление функций для работы с форматами
```python
def build_pet_image_key(user_id: str, pet_name: str, stage_key: str, ext: str = "webp") -> str:
    """Обновить значение по умолчанию ext="webp" """

def get_background_removal_settings():
    return BACKGROUND_REMOVAL_SETTINGS.copy()

def get_background_removal_model(model_name: str = None):
    if model_name:
        return BACKGROUND_REMOVAL_MODELS.get(model_name, BACKGROUND_REMOVAL_MODELS["rembg"])
    settings = get_background_removal_settings()
    model_id = settings.get("model", "cjwbw/rembg")
    # Находим ключ по model_id
    for key, model_info in BACKGROUND_REMOVAL_MODELS.items():
        if model_info["model_id"] == model_id:
            return model_info
    return BACKGROUND_REMOVAL_MODELS["rembg"]
```

### 1.2. Изменения в Replicate клиенте

**Файл:** `services/generation/replicate_client.py`

#### 1.2.1. Обновление метода generate_image
```python
def generate_image(
    self,
    prompt: str,
    negative_prompt: Optional[str] = None,
    output_format: Optional[str] = None,  # НОВЫЙ параметр
    **kwargs,
) -> Optional[Image.Image]:
    defaults = get_generation_defaults()
    
    # Получаем формат из параметров или настроек
    format_value = output_format or defaults.get("output_format", "webp")
    
    quality = get_quality_settings(defaults.get("quality_preset", "fast"))
    width = int(kwargs.get("width", quality.get("width", 512)))
    height = int(kwargs.get("height", quality.get("height", 512)))
    steps = int(kwargs.get("steps", quality.get("steps", 20)))
    guidance = float(kwargs.get("guidance_scale", quality.get("guidance_scale", 7.0)))

    def _call(image_size: str):
        inputs = {
            "prompt": prompt,
            "image_size": image_size,
            "num_inference_steps": steps,
            "guidance": guidance,
            "output_format": format_value,  # Используем выбранный формат
        }
        # ... остальной код
```

### 1.3. Обновление сохранения изображений

**Файлы:** `api/pet_images.py`, `services/stages.py`

#### 1.3.1. Обновление формата сохранения
```python
# Вместо format="PNG" использовать динамический формат
from config.settings import get_generation_defaults

defaults = get_generation_defaults()
output_format = defaults.get("output_format", "webp").upper()

# Сохранение
img.save(buf, format=output_format)
content_type = f"image/{output_format.lower()}"

# Ключ для R2
ext = output_format.lower()
key = build_pet_image_key(user_id, pet_name, stage_key, ext=ext)
```

---

## 2. Постпроцессинг для удаления фона

### 2.1. Создание нового сервиса для удаления фона

**Новый файл:** `services/generation/background_removal.py`

```python
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
            
            logger.info(f"Removing background using model: {model_id}")
            
            # Конвертируем PIL Image в BytesIO для отправки в Replicate
            image_bytes = BytesIO()
            image.save(image_bytes, format="PNG")
            image_bytes.seek(0)
            
            # Вызываем модель удаления фона
            output = replicate.run(
                model_id,
                input={"image": image_bytes}
            )
            
            # Обрабатываем результат
            url = None
            if isinstance(output, list) and output:
                url = output[0]
            elif isinstance(output, str):
                url = output
            else:
                try:
                    s = str(output)
                    if s.startswith("http"):
                        url = s
                except Exception:
                    pass
            
            if not url:
                logger.warning("Background removal returned empty output")
                return None
            
            # Загружаем результат
            resp = requests.get(url, timeout=self.timeout)
            resp.raise_for_status()
            
            # Возвращаем изображение с прозрачностью
            result_image = Image.open(BytesIO(resp.content)).convert("RGBA")
            logger.info(f"Background removed successfully, size: {result_image.size}")
            
            return result_image
            
        except Exception as e:
            logger.error(f"Background removal failed: {e}")
            return None
    
    def is_enabled(self) -> bool:
        """Проверяет, включено ли удаление фона"""
        return self.settings.get("enabled", True)
```

### 2.2. Интеграция в процесс генерации

**Файл:** `api/pet_images.py`

#### 2.2.1. Обновление функции генерации изображения
```python
from services.generation.background_removal import BackgroundRemovalService

# В функции генерации изображения:
generator = get_image_generator()

# Генерируем основное изображение
img = generator.generate_image(
    enhanced_prompt,
    negative_prompt=stage_negative,
    **quality_settings,
)

if img is None:
    # Fallback на альтернативный генератор SVG
    # ...

# Сохраняем основное изображение
# ... код сохранения основного изображения ...

# Удаляем фон (если включено)
img_transparent = None
bg_removal_service = BackgroundRemovalService()
if bg_removal_service.is_enabled():
    img_transparent = bg_removal_service.remove_background(img)
    
    if img_transparent:
        # Сохраняем изображение с прозрачным фоном
        buf_transparent = BytesIO()
        img_transparent.save(buf_transparent, format="WEBP")
        data_transparent = buf_transparent.getvalue()
        
        key_transparent = build_pet_image_key(
            user_id, pet_name, stage_key, ext="webp"
        )
        url_transparent = R2Storage().upload_bytes(
            key_transparent, data_transparent, "image/webp"
        )
        
        # Сохраняем URL в БД (см. раздел 3)
```

### 2.3. Обновление services/stages.py

Аналогичные изменения в `_generate_png_for_stage` и `prepare_on_create`:

```python
# После генерации изображения
img_transparent = None
if BackgroundRemovalService().is_enabled():
    img_transparent = BackgroundRemovalService().remove_background(img)
    # Сохранение и загрузка в R2
```

---

## 3. Расширение схемы БД

### 3.1. Миграция Alembic

**Новый файл:** `alembic/versions/YYYY_MM_DD_HHMMSS_add_transparent_images.py`

```python
"""add_transparent_images

Revision ID: 2025_11_05_add_transparent_images
Revises: 2025_10_31_000007
Create Date: 2025-11-05
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '2025_11_05_add_transparent_images'
down_revision = '2025_10_31_000007'  # Последняя миграция: add_performance_indexes
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Добавляем новые поля для изображений с прозрачным фоном
    op.add_column('pets', sa.Column('image_egg_transparent_url', sa.String(), nullable=True))
    op.add_column('pets', sa.Column('image_baby_transparent_url', sa.String(), nullable=True))
    op.add_column('pets', sa.Column('image_adult_transparent_url', sa.String(), nullable=True))

def downgrade() -> None:
    # Удаляем поля при откате миграции
    op.drop_column('pets', 'image_adult_transparent_url')
    op.drop_column('pets', 'image_baby_transparent_url')
    op.drop_column('pets', 'image_egg_transparent_url')
```

### 3.2. Обновление модели Pet

**Файл:** `models/pets.py`

```python
class Pet(Base):
    # ... существующие поля ...
    
    # Новые поля для изображений с прозрачным фоном (опциональные)
    image_egg_transparent_url: Optional[str] = None
    image_baby_transparent_url: Optional[str] = None
    image_adult_transparent_url: Optional[str] = None
```

### 3.3. Обновление логики сохранения URL

**Файлы:** `api/pet_images.py`, `services/stages.py`

```python
# После генерации и сохранения изображения с прозрачным фоном:
if img_transparent and url_transparent:
    if stage_key == "egg":
        pet.image_egg_transparent_url = url_transparent
    elif stage_key == "baby":
        pet.image_baby_transparent_url = url_transparent
    else:  # adult
        pet.image_adult_transparent_url = url_transparent
    await db.commit()
```

### 3.4. Безопасная обработка пустых полей

**Файл:** `api/pet_images.py`

```python
# При получении изображения - проверяем наличие прозрачного варианта
# Если нужен прозрачный фон, используем transparent_url, иначе обычный url

@router.get("/{user_id}/{pet_name}")
async def get_pet_image(
    user_id: str,
    pet_name: str,
    transparent: bool = False,  # Новый параметр запроса
    db: AsyncSession = Depends(get_db)
):
    # ...
    
    # Выбираем URL в зависимости от запроса
    if transparent:
        url_map = {
            "egg": getattr(pet, "image_egg_transparent_url", None),
            "baby": getattr(pet, "image_baby_transparent_url", None),
            "adult": getattr(pet, "image_adult_transparent_url", None),
        }
        # Если прозрачного варианта нет, используем обычный
        existing_url = url_map.get(stage_key) or url_map.get(stage_key)
    else:
        url_map = {
            "egg": getattr(pet, "image_egg_url", None),
            "baby": getattr(pet, "image_baby_url", None),
            "adult": getattr(pet, "image_adult_url", None),
        }
        existing_url = url_map.get(stage_key)
    
    # Если прозрачного варианта нет, fallback на обычный
    if transparent and not existing_url:
        url_map_fallback = {
            "egg": getattr(pet, "image_egg_url", None),
            "baby": getattr(pet, "image_baby_url", None),
            "adult": getattr(pet, "image_adult_url", None),
        }
        existing_url = url_map_fallback.get(stage_key)
```

---

## 4. Переменные окружения

Добавить в `.env.example`:

```env
# Генерация изображений
GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=your-token
REPLICATE_MODEL=black-forest-labs/flux-1.1-pro

# Постпроцессинг удаления фона
BACKGROUND_REMOVAL_ENABLED=true
BACKGROUND_REMOVAL_MODEL=cjwbw/rembg
BACKGROUND_REMOVAL_TIMEOUT=60
```

---

## 5. Обновление API документации

**Файл:** `docs/pet_images_api.md`

### 5.1. Обновление endpoint GET /pet-images/{user_id}/{pet_name}

Добавить параметр запроса:
- `transparent` (boolean, optional): Если `true`, возвращает изображение с прозрачным фоном (если доступно). По умолчанию `false`.

**Пример запроса:**
```
GET /api/pet-images/{user_id}/{pet_name}?transparent=true
```

**Ответ:**
- `200 OK` - Бинарные данные WebP (image/webp) с прозрачностью
- Если прозрачного варианта нет, возвращается обычное изображение

---

## 6. Порядок реализации

### Этап 1: Подготовка (1-2 часа)
1. ✅ Изменить `quality_preset` на "fast" в `GENERATION_DEFAULTS`
2. Добавить настройки для формата и постпроцессинга в `config/settings.py`
3. Обновить функции `build_pet_image_key` для поддержки WebP

### Этап 2: Переход на WebP (2-3 часа)
1. Обновить `replicate_client.py` для поддержки `output_format`
2. Обновить сохранение изображений в `api/pet_images.py`
3. Обновить сохранение изображений в `services/stages.py`
4. Тестирование генерации WebP

### Этап 3: Постпроцессинг (3-4 часа)
1. Создать `services/generation/background_removal.py`
2. Интегрировать в `api/pet_images.py`
3. Интегрировать в `services/stages.py`
4. Тестирование удаления фона

### Этап 4: Расширение БД (2-3 часа)
1. Создать миграцию Alembic
2. Обновить модель `Pet`
3. Обновить логику сохранения URL
4. Обновить логику получения изображений с поддержкой прозрачности
5. Применить миграцию

### Этап 5: Тестирование и документация (2-3 часа)
1. Протестировать все сценарии:
   - Генерация с включенным удалением фона
   - Генерация с выключенным удалением фона
   - Получение прозрачного изображения (если есть)
   - Получение прозрачного изображения (если нет - fallback)
2. Обновить документацию API
3. Обновить `QUICKSTART.md` с новыми переменными окружения

---

## 7. Обратная совместимость

### 7.1. Старые изображения
- Старые изображения остаются в формате PNG
- При запросе возвращаются как есть
- Новые генерации используют WebP

### 7.2. Прозрачные изображения
- Если поле `*_transparent_url` пустое, используется обычное изображение
- Это не ломает существующую функциональность

### 7.3. Fallback механизмы
- Если удаление фона выключено, сохраняется только обычное изображение
- Если прозрачное изображение запрашивается, но его нет, возвращается обычное

---

## 8. Тестирование

### Тест-кейсы:

1. **Генерация с WebP:**
   - ✅ Генерируется изображение в формате WebP
   - ✅ Сохраняется в R2 с правильным content-type
   - ✅ URL сохраняется в БД

2. **Генерация с удалением фона (включено):**
   - ✅ Генерируется основное изображение
   - ✅ Генерируется изображение с прозрачным фоном
   - ✅ Оба изображения сохраняются в R2
   - ✅ Оба URL сохраняются в БД

3. **Генерация с удалением фона (выключено):**
   - ✅ Генерируется только основное изображение
   - ✅ Поле `*_transparent_url` остается пустым
   - ✅ Ничего не ломается

4. **Получение изображения:**
   - ✅ `GET /pet-images/{user_id}/{pet_name}` - возвращает обычное
   - ✅ `GET /pet-images/{user_id}/{pet_name}?transparent=true` - возвращает прозрачное (если есть)
   - ✅ `GET /pet-images/{user_id}/{pet_name}?transparent=true` - fallback на обычное (если нет)

5. **Переключение моделей удаления фона:**
   - ✅ Можно изменить модель через переменную окружения
   - ✅ Все модели работают корректно

---

## 9. Риски и митигация

### Риск 1: Увеличение времени генерации
**Митигация:** Удаление фона выполняется асинхронно или можно отключить через настройки

### Риск 2: Увеличение затрат на Replicate
**Митигация:** Можно отключить удаление фона через `BACKGROUND_REMOVAL_ENABLED=false`

### Риск 3: Ошибки при удалении фона
**Митигация:** Если удаление фона не удалось, используется обычное изображение, генерация не прерывается

### Риск 4: Проблемы с совместимостью WebP
**Митигация:** Современные браузеры поддерживают WebP (95%+), но можно вернуться к PNG через настройки

---

## 10. Файлы для изменения

### Новые файлы:
- `services/generation/background_removal.py`
- `alembic/versions/YYYY_MM_DD_HHMMSS_add_transparent_images.py`
- `docs/IMAGE_GENERATION_IMPROVEMENTS_PLAN.md` (этот файл)

### Изменяемые файлы:
- `config/settings.py`
- `services/generation/replicate_client.py`
- `api/pet_images.py`
- `services/stages.py`
- `models/pets.py`
- `docs/pet_images_api.md`
- `docs/QUICKSTART.md`
- `.env.example`

---

## 11. Оценка времени

- **Общая оценка:** 10-15 часов
- **Разбивка:**
  - Подготовка: 1-2 часа
  - WebP: 2-3 часа
  - Постпроцессинг: 3-4 часа
  - БД: 2-3 часа
  - Тестирование: 2-3 часа

---

## 12. Чек-лист перед деплоем

- [ ] Все изменения протестированы локально
- [ ] Миграция БД протестирована
- [ ] Обратная совместимость проверена
- [ ] Документация обновлена
- [ ] Переменные окружения добавлены в `.env.example`
- [ ] Переменные окружения настроены в продакшене
- [ ] Логи проверены на наличие ошибок
- [ ] Производительность проверена (время генерации)

