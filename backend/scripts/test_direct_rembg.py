#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест прямого использования rembg библиотеки (без Replicate)
"""
import sys
from pathlib import Path
from io import BytesIO
from PIL import Image

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def test_rembg_library():
    """Тестирует использование rembg библиотеки напрямую"""
    print("=" * 60)
    print("ТЕСТ: Прямое использование rembg библиотеки")
    print("=" * 60)
    
    try:
        from rembg import remove
        print("[OK] Библиотека rembg установлена")
    except ImportError:
        print("[ERROR] Библиотека rembg не установлена")
        print("Установите: pip install rembg")
        return False
    
    # Создаем тестовое изображение
    test_img = Image.new("RGB", (256, 256), color="red")
    test_img_bytes = BytesIO()
    test_img.save(test_img_bytes, format="PNG")
    test_img_bytes.seek(0)
    
    try:
        print("Вызываем remove()...")
        output_bytes = remove(test_img_bytes.read())
        
        # Сохраняем результат
        result_img = Image.open(BytesIO(output_bytes))
        print(f"[OK] Успешно! Размер: {result_img.size}, mode: {result_img.mode}")
        
        # Проверяем альфа-канал
        if result_img.mode in ("RGBA", "LA"):
            print("[OK] Изображение имеет альфа-канал")
        else:
            print(f"[WARN] Изображение без альфа-канала, mode: {result_img.mode}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_rembg_library()
    sys.exit(0 if success else 1)


