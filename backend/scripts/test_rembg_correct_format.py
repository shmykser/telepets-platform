#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест правильного формата вызова модели cjwbw/rembg
"""
import os
import sys
import replicate
from pathlib import Path
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(), override=False)

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def test_rembg_formats():
    """Тестирует разные форматы вызова модели"""
    print("=" * 60)
    print("ТЕСТ РАЗНЫХ ФОРМАТОВ ВЫЗОВА cjwbw/rembg")
    print("=" * 60)
    
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("[ERROR] REPLICATE_API_TOKEN не установлен")
        return False
    
    print(f"[OK] Токен найден")
    
    # Создаем тестовое изображение
    test_img = Image.new("RGB", (256, 256), color="red")
    test_img_bytes = BytesIO()
    test_img.save(test_img_bytes, format="PNG")
    test_img_bytes.seek(0)
    
    model_id = "cjwbw/rembg"
    
    # Тест 1: BytesIO напрямую
    print(f"\n1. Тест: BytesIO напрямую")
    try:
        test_img_bytes.seek(0)
        output = replicate.run(
            model_id,
            input={"image": test_img_bytes}
        )
        print(f"   [OK] Успешно! Тип: {type(output)}")
        if isinstance(output, list) and output:
            print(f"   Результат: {type(output[0])}")
        return True
    except Exception as e:
        print(f"   [ERROR] {e}")
    
    # Тест 2: Файл через open()
    print(f"\n2. Тест: Файл через open()")
    try:
        # Сохраняем временный файл
        temp_file = "temp_test_image.png"
        test_img.save(temp_file)
        
        with open(temp_file, "rb") as f:
            output = replicate.run(
                model_id,
                input={"image": f}
            )
        print(f"   [OK] Успешно! Тип: {type(output)}")
        # Удаляем временный файл
        os.remove(temp_file)
        return True
    except Exception as e:
        print(f"   [ERROR] {e}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
    
    # Тест 3: URL изображения (если есть)
    print(f"\n3. Тест: URL изображения (пропускаем - нужен публичный URL)")
    
    # Тест 4: Проверка доступности модели
    print(f"\n4. Тест: Проверка доступности модели")
    try:
        # Попробуем получить информацию о модели
        parts = model_id.split("/")
        if len(parts) == 2:
            owner, model_name = parts
            model = replicate.models.get(owner, model_name)
            print(f"   [OK] Модель найдена: {model.name}")
            print(f"   Описание: {model.description[:100] if model.description else 'N/A'}")
            
            # Попробуем получить последнюю версию
            try:
                versions = list(model.versions.list())
                if versions:
                    latest = versions[0]
                    print(f"   Последняя версия: {latest.id}")
                    print(f"   Тестируем с версией...")
                    test_img_bytes.seek(0)
                    output = replicate.run(
                        latest,
                        input={"image": test_img_bytes}
                    )
                    print(f"   [OK] С версией работает! Тип: {type(output)}")
                    return True
            except Exception as e:
                print(f"   [WARN] Не удалось получить версию: {e}")
    except Exception as e:
        print(f"   [ERROR] {e}")
    
    # Тест 5: Попробуем без указания версии, но с правильным форматом
    print(f"\n5. Тест: Без версии, проверка формата параметров")
    try:
        test_img_bytes.seek(0)
        # Согласно документации, rembg может принимать image как файл или URL
        # Попробуем передать как файл-объект
        output = replicate.run(
            model_id,
            input={"image": test_img_bytes}
        )
        print(f"   [OK] Успешно!")
        return True
    except replicate.exceptions.ReplicateError as e:
        error_str = str(e)
        print(f"   [ERROR] Replicate ошибка: {error_str[:200]}")
        
        # Проверяем детали ошибки
        if hasattr(e, 'response'):
            print(f"   Статус: {getattr(e.response, 'status_code', 'N/A')}")
    
    return False

if __name__ == "__main__":
    success = test_rembg_formats()
    sys.exit(0 if success else 1)







