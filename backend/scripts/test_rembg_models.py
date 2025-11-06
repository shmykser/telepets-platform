#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для поиска рабочей модели rembg на Replicate
"""
import os
import sys
import replicate
from pathlib import Path
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv, find_dotenv

# Загружаем переменные окружения из .env
load_dotenv(find_dotenv(), override=False)

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Список возможных моделей для проверки
MODELS_TO_TEST = [
    "cjwbw/rembg",
    "levindabhi/rembg-api",
    "levindabhi/clipdrop-remove-background",
]

def test_model(model_id):
    """Тестирует модель с реальным изображением"""
    print(f"\nТестируем модель: {model_id}")
    
    # Создаем тестовое изображение
    test_img = Image.new("RGB", (256, 256), color="red")
    test_img_bytes = BytesIO()
    test_img.save(test_img_bytes, format="PNG")
    test_img_bytes.seek(0)
    
    try:
        print(f"  Вызываем API...")
        output = replicate.run(
            model_id,
            input={"image": test_img_bytes}
        )
        
        print(f"  [OK] API вызов успешен")
        print(f"  Тип результата: {type(output)}")
        
        # Обрабатываем результат
        result_image = None
        
        if isinstance(output, list) and output:
            item = output[0]
            if hasattr(item, 'read'):
                try:
                    result_image = Image.open(item)
                    print(f"  [OK] Image.open() сработал, размер: {result_image.size}")
                    return True, model_id
                except Exception as e:
                    print(f"  [WARN] Image.open() не сработал: {e}")
                    try:
                        result_bytes = item.read()
                        result_image = Image.open(BytesIO(result_bytes))
                        print(f"  [OK] .read() сработал, размер: {result_image.size}")
                        return True, model_id
                    except Exception as e2:
                        print(f"  [ERROR] Оба метода не сработали: {e2}")
                        return False, None
            elif isinstance(item, str) and item.startswith("http"):
                print(f"  [OK] Получен URL: {item[:50]}...")
                import requests
                resp = requests.get(item, timeout=30)
                result_image = Image.open(BytesIO(resp.content))
                print(f"  [OK] Загружено с URL, размер: {result_image.size}")
                return True, model_id
        elif hasattr(output, 'read'):
            try:
                result_image = Image.open(output)
                print(f"  [OK] Image.open() напрямую, размер: {result_image.size}")
                return True, model_id
            except Exception as e:
                print(f"  [ERROR] Image.open() не сработал: {e}")
                return False, None
        
        print(f"  [ERROR] Неожиданный формат результата")
        return False, None
        
    except replicate.exceptions.ReplicateError as e:
        error_str = str(e)
        if "404" in error_str:
            print(f"  [ERROR] Модель не найдена (404)")
        elif "401" in error_str:
            print(f"  [ERROR] Ошибка авторизации (401)")
        else:
            print(f"  [ERROR] Replicate ошибка: {error_str[:100]}")
        return False, None
    except Exception as e:
        print(f"  [ERROR] Неожиданная ошибка: {type(e).__name__}: {e}")
        return False, None

def main():
    print("=" * 60)
    print("ПОИСК РАБОЧЕЙ МОДЕЛИ REMBG")
    print("=" * 60)
    
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("[ERROR] REPLICATE_API_TOKEN не установлен")
        print("Установите переменную окружения REPLICATE_API_TOKEN")
        return 1
    
    print(f"[OK] Токен установлен (длина: {len(token)})")
    
    working_models = []
    for model_id in MODELS_TO_TEST:
        success, model = test_model(model_id)
        if success:
            working_models.append(model)
    
    print("\n" + "=" * 60)
    print("РЕЗУЛЬТАТЫ:")
    print("=" * 60)
    if working_models:
        print("[OK] Рабочие модели:")
        for model in working_models:
            print(f"  - {model}")
        print(f"\nРекомендуется использовать: {working_models[0]}")
    else:
        print("[ERROR] Не найдено рабочих моделей")
        print("Проверьте:")
        print("  1. Правильность REPLICATE_API_TOKEN")
        print("  2. Доступность моделей на Replicate")
        print("  3. Интернет соединение")
    
    return 0 if working_models else 1

if __name__ == "__main__":
    sys.exit(main())

