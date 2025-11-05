#!/usr/bin/env python3
"""
Скрипт для поиска рабочей модели rembg на Replicate
"""
import os
import sys
import replicate
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Список возможных моделей для проверки
MODELS_TO_TEST = [
    "cjwbw/rembg",
    "levindabhi/rembg-api",
    "levindabhi/clipdrop-remove-background",
    "fofr/remove-background",
    "logerzhu/face-detection",
]

def test_model(model_id):
    """Тестирует модель"""
    print(f"\nТестируем модель: {model_id}")
    try:
        # Пробуем получить информацию о модели
        model = replicate.models.get(model_id.split("/")[0], model_id.split("/")[1])
        print(f"  ✅ Модель найдена: {model.name}")
        print(f"  Описание: {model.description[:100] if model.description else 'N/A'}")
        return True
    except Exception as e:
        print(f"  ❌ Ошибка: {e}")
        return False

def main():
    print("=" * 60)
    print("ПОИСК РАБОЧЕЙ МОДЕЛИ REMBG")
    print("=" * 60)
    
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("❌ REPLICATE_API_TOKEN не установлен")
        return 1
    
    print(f"✅ Токен установлен")
    
    working_models = []
    for model_id in MODELS_TO_TEST:
        if test_model(model_id):
            working_models.append(model_id)
    
    print("\n" + "=" * 60)
    print("РЕЗУЛЬТАТЫ:")
    print("=" * 60)
    if working_models:
        print("✅ Рабочие модели:")
        for model in working_models:
            print(f"  - {model}")
    else:
        print("❌ Не найдено рабочих моделей")
    
    return 0 if working_models else 1

if __name__ == "__main__":
    sys.exit(main())

