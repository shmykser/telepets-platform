#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Поиск рабочей модели для удаления фона через Replicate API
"""
import os
import sys
import replicate
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(), override=False)

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def search_models():
    """Ищет модели для удаления фона"""
    print("=" * 60)
    print("ПОИСК МОДЕЛЕЙ ДЛЯ УДАЛЕНИЯ ФОНА")
    print("=" * 60)
    
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("[ERROR] REPLICATE_API_TOKEN не установлен")
        return
    
    print(f"[OK] Токен найден (длина: {len(token)})")
    
    # Попробуем найти модели через поиск
    search_terms = ["rembg", "background removal", "remove background"]
    
    for term in search_terms:
        print(f"\nПоиск по запросу: '{term}'")
        try:
            # Пробуем получить список моделей (может не работать без правильного API)
            # Вместо этого попробуем прямые вызовы известных моделей
            pass
        except Exception as e:
            print(f"  [ERROR] {e}")
    
    # Попробуем модели с версиями
    models_with_versions = [
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c0032",
    ]
    
    print("\n" + "=" * 60)
    print("ТЕСТИРОВАНИЕ МОДЕЛЕЙ С ВЕРСИЯМИ")
    print("=" * 60)
    
    from io import BytesIO
    from PIL import Image
    
    test_img = Image.new("RGB", (100, 100), color="blue")
    test_img_bytes = BytesIO()
    test_img.save(test_img_bytes, format="PNG")
    test_img_bytes.seek(0)
    
    for model_id in models_with_versions:
        print(f"\nТестируем: {model_id}")
        try:
            output = replicate.run(
                model_id,
                input={"image": test_img_bytes}
            )
            print(f"  [OK] Модель работает!")
            print(f"  Тип результата: {type(output)}")
            return model_id
        except Exception as e:
            error_str = str(e)
            if "404" in error_str:
                print(f"  [ERROR] Модель не найдена")
            else:
                print(f"  [ERROR] {error_str[:100]}")
    
    print("\n[ERROR] Не найдено рабочих моделей")
    return None

if __name__ == "__main__":
    result = search_models()
    if result:
        print(f"\n[OK] Рекомендуемая модель: {result}")
    else:
        print("\n[ERROR] Не удалось найти рабочую модель")


