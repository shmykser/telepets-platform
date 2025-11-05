#!/usr/bin/env python3
"""
Тест генерации с прозрачным фоном через flux-1.1-pro
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import replicate
from PIL import Image
from io import BytesIO

def test_transparent_background():
    """Тестирует различные способы получения прозрачного фона"""
    
    print("=" * 60)
    print("ТЕСТ ГЕНЕРАЦИИ С ПРОЗРАЧНЫМ ФОНОМ")
    print("=" * 60)
    
    prompt = "a cute baby animal, isolated on transparent background, white background"
    
    # Тест 1: PNG с промптом про прозрачность
    print("\n1. Тест: PNG с промптом про прозрачность")
    try:
        output = replicate.run(
            "black-forest-labs/flux-1.1-pro",
            input={
                "prompt": prompt,
                "output_format": "png",
                "image_size": "512x512",
                "num_inference_steps": 20,
                "guidance": 7.0,
            }
        )
        
        if output:
            url = output[0] if isinstance(output, list) else output
            if isinstance(url, str) and url.startswith("http"):
                import requests
                resp = requests.get(url)
                img = Image.open(BytesIO(resp.content))
                print(f"   Формат: {img.format}")
                print(f"   Режим: {img.mode}")
                print(f"   Размер: {img.size}")
                if img.mode in ("RGBA", "LA"):
                    print("   ✅ Есть альфа-канал (прозрачность)")
                else:
                    print("   ❌ Нет альфа-канала")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 2: WebP (поддерживает альфа-канал)
    print("\n2. Тест: WebP формат")
    try:
        output = replicate.run(
            "black-forest-labs/flux-1.1-pro",
            input={
                "prompt": prompt,
                "output_format": "webp",
                "image_size": "512x512",
                "num_inference_steps": 20,
                "guidance": 7.0,
            }
        )
        
        if output:
            url = output[0] if isinstance(output, list) else output
            if isinstance(url, str) and url.startswith("http"):
                import requests
                resp = requests.get(url)
                img = Image.open(BytesIO(resp.content))
                print(f"   Формат: {img.format}")
                print(f"   Режим: {img.mode}")
                print(f"   Размер: {img.size}")
                if img.mode in ("RGBA", "LA"):
                    print("   ✅ Есть альфа-канал (прозрачность)")
                else:
                    print("   ❌ Нет альфа-канала")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Проверка доступных параметров модели
    print("\n3. Проверка доступных параметров модели")
    try:
        # Попробуем получить информацию о модели
        # Это может не работать, но попробуем
        print("   Примечание: flux-1.1-pro не предоставляет список версий через API")
        print("   Нужно проверить документацию на replicate.com")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    print("\n" + "=" * 60)
    print("ВЫВОД:")
    print("=" * 60)
    print("Модели генерации изображений обычно НЕ генерируют прозрачный фон напрямую.")
    print("Для получения прозрачного фона нужно:")
    print("1. Использовать post-processing (удаление фона через API)")
    print("2. Или использовать специализированные модели для удаления фона")
    print("3. Или использовать промпты с 'white background' и затем удалять белый фон")

if __name__ == "__main__":
    test_transparent_background()


