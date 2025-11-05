#!/usr/bin/env python3
"""
Тест удаления фона с существующего изображения
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import replicate
import requests
from PIL import Image
from io import BytesIO
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_rembg_model():
    """Тестирует модель rembg напрямую"""
    
    print("=" * 60)
    print("ТЕСТ УДАЛЕНИЯ ФОНА ЧЕРЕЗ REMBG")
    print("=" * 60)
    
    # Создаем тестовое изображение
    test_img = Image.new("RGB", (512, 512), color="red")
    test_img_bytes = BytesIO()
    test_img.save(test_img_bytes, format="PNG")
    test_img_bytes.seek(0)
    
    print(f"\n1. Создано тестовое изображение: {test_img.size}, mode={test_img.mode}")
    
    model_id = "cjwbw/rembg"
    print(f"\n2. Тестируем модель: {model_id}")
    
    try:
        # Вызываем модель
        print("3. Вызываем replicate.run()...")
        output = replicate.run(
            model_id,
            input={"image": test_img_bytes}
        )
        
        print(f"4. Тип результата: {type(output)}")
        print(f"5. Значение результата: {output}")
        
        # Обрабатываем результат
        if isinstance(output, list) and output:
            print(f"   Результат - список, длина: {len(output)}")
            item = output[0]
            print(f"   Первый элемент: {type(item)}, значение: {item}")
            
            # Проверяем, является ли это FileOutput
            if hasattr(item, 'read'):
                print("   ✅ Это FileOutput объект")
                result_bytes = item.read()
                result_img = Image.open(BytesIO(result_bytes))
                print(f"   ✅ Успешно! Результат: {result_img.size}, mode={result_img.mode}")
                return True
            elif isinstance(item, str) and item.startswith("http"):
                print(f"   ✅ Это URL: {item}")
                resp = requests.get(item)
                result_img = Image.open(BytesIO(resp.content))
                print(f"   ✅ Успешно! Результат: {result_img.size}, mode={result_img.mode}")
                return True
        elif hasattr(output, 'read'):
            print("   ✅ Результат - FileOutput объект напрямую")
            result_bytes = output.read()
            result_img = Image.open(BytesIO(result_bytes))
            print(f"   ✅ Успешно! Результат: {result_img.size}, mode={result_img.mode}")
            return True
        elif isinstance(output, str):
            print(f"   ✅ Результат - строка (URL): {output}")
            resp = requests.get(output)
            result_img = Image.open(BytesIO(resp.content))
            print(f"   ✅ Успешно! Результат: {result_img.size}, mode={result_img.mode}")
            return True
        else:
            print(f"   ❌ Неожиданный формат результата")
            return False
            
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_rembg_model()
    sys.exit(0 if success else 1)

