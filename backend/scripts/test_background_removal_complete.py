#!/usr/bin/env python3
"""
Полный тест удаления фона от начала до конца
"""
import os
import sys
from pathlib import Path
from io import BytesIO

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import logging
import requests
import replicate
from PIL import Image
import json

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_replicate_directly():
    """Тест прямого вызова Replicate API"""
    print("\n" + "=" * 60)
    print("ТЕСТ 1: Прямой вызов Replicate API")
    print("=" * 60)
    
    # Проверяем токен
    replicate_token = os.getenv("REPLICATE_API_TOKEN")
    if not replicate_token:
        print("[ERROR] REPLICATE_API_TOKEN не установлен")
        return False
    
    print(f"[OK] REPLICATE_API_TOKEN установлен (длина: {len(replicate_token)})")
    
    # Создаем тестовое изображение
    test_img = Image.new("RGB", (512, 512), color="red")
    test_img_bytes = BytesIO()
    test_img.save(test_img_bytes, format="PNG")
    test_img_bytes.seek(0)
    
    print(f"[OK] Создано тестовое изображение: {test_img.size}, mode={test_img.mode}")
    
    model_id = "cjwbw/rembg"
    print(f"[OK] Используем модель: {model_id}")
    
    try:
        print("Вызываем Replicate API...")
        output = replicate.run(
            model_id,
            input={"image": test_img_bytes}
        )
        
        print(f"[OK] API вызов завершен. Тип результата: {type(output)}")
        print(f"   repr: {repr(output)[:200]}")
        
        # Обрабатываем результат
        result_image = None
        
        if isinstance(output, list) and output:
            item = output[0]
            print(f"   Первый элемент списка: {type(item)}")
            
            # Проверяем, является ли это FileOutput
            if hasattr(item, 'read'):
                print("   [OK] Это FileOutput объект - используем Image.open() напрямую")
                try:
                    result_image = Image.open(item)
                    print(f"   [OK] Успешно открыто через Image.open(), размер: {result_image.size}, mode: {result_image.mode}")
                except Exception as e:
                    print(f"   [WARN] Image.open() не сработал: {e}, пробуем через .read()")
                    result_bytes = item.read()
                    result_image = Image.open(BytesIO(result_bytes))
                    print(f"   [OK] Успешно через .read(), размер: {result_image.size}")
            elif isinstance(item, str) and item.startswith("http"):
                print(f"   [OK] Это URL: {item}")
                resp = requests.get(item, timeout=60)
                resp.raise_for_status()
                result_image = Image.open(BytesIO(resp.content))
                print(f"   [OK] Загружено с URL, размер: {result_image.size}")
        elif hasattr(output, 'read'):
            print("   [OK] Результат - FileOutput объект напрямую")
            result_image = Image.open(output)
            print(f"   [OK] Успешно, размер: {result_image.size}")
        elif isinstance(output, str):
            if output.startswith("http"):
                print(f"   [OK] Результат - URL: {output}")
                resp = requests.get(output, timeout=60)
                resp.raise_for_status()
                result_image = Image.open(BytesIO(resp.content))
                print(f"   [OK] Загружено, размер: {result_image.size}")
        
        if result_image:
            # Проверяем, что изображение имеет альфа-канал
            if result_image.mode in ("RGBA", "LA"):
                print(f"   [OK] Изображение имеет альфа-канал (прозрачность)")
            else:
                print(f"   [WARN] Изображение без альфа-канала, режим: {result_image.mode}")
                result_image = result_image.convert("RGBA")
                print(f"   [OK] Конвертировано в RGBA")
            
            # Сохраняем для проверки
            output_path = "test_output_transparent.png"
            result_image.save(output_path)
            print(f"   [OK] Сохранено в {output_path}")
            return True
        else:
            print("   [ERROR] Не удалось получить изображение из результата")
            return False
            
    except replicate.exceptions.ReplicateError as e:
        print(f"[ERROR] Replicate API ошибка: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_background_removal_service():
    """Тест сервиса удаления фона"""
    print("\n" + "=" * 60)
    print("ТЕСТ 2: Тест BackgroundRemovalService")
    print("=" * 60)
    
    try:
        from services.generation.background_removal import BackgroundRemovalService
        
        # Создаем тестовое изображение
        test_img = Image.new("RGB", (512, 512), color="blue")
        print(f"✅ Создано тестовое изображение: {test_img.size}, mode={test_img.mode}")
        
        service = BackgroundRemovalService()
        print(f"✅ Сервис инициализирован")
        
        if not service.is_enabled():
            print("⚠️  Удаление фона отключено в настройках")
            return False
        
        print("Вызываем remove_background()...")
        result = service.remove_background(test_img)
        
        if result:
            print(f"✅ Успешно! Результат: {result.size}, mode={result.mode}")
            
            # Сохраняем для проверки
            output_path = "test_service_output.png"
            result.save(output_path)
            print(f"✅ Сохранено в {output_path}")
            return True
        else:
            print("❌ Сервис вернул None")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_endpoint():
    """Тест endpoint API"""
    print("\n" + "=" * 60)
    print("ТЕСТ 3: Тест API Endpoint")
    print("=" * 60)
    
    user_id = "273065571"
    pet_name = "Trans"
    base_url = "http://localhost:8080"
    endpoint = f"{base_url}/api/pet-images/{user_id}/{pet_name}/remove-background?stage=baby"
    
    print(f"URL: {endpoint}")
    
    try:
        print("Отправка POST запроса...")
        response = requests.post(endpoint, timeout=120)
        
        print(f"Статус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Ответ:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            if data.get("status") == "success":
                print("✅ Успешно!")
                return True
            elif data.get("status") == "error":
                print("❌ Ошибка в ответе")
                errors = data.get("errors", [])
                for error in errors:
                    print(f"   - {error}")
                return False
        else:
            print(f"❌ HTTP ошибка {response.status_code}")
            print(f"Ответ: {response.text[:500]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к серверу")
        print("   Убедитесь, что сервер запущен на http://localhost:8080")
        return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Запуск всех тестов"""
    print("=" * 60)
    print("ПОЛНЫЙ ТЕСТ УДАЛЕНИЯ ФОНА")
    print("=" * 60)
    
    results = []
    
    # Тест 1: Прямой вызов Replicate
    results.append(("Прямой вызов Replicate", test_replicate_directly()))
    
    # Тест 2: Сервис
    results.append(("BackgroundRemovalService", test_background_removal_service()))
    
    # Тест 3: Endpoint
    results.append(("API Endpoint", test_endpoint()))
    
    # Итоги
    print("\n" + "=" * 60)
    print("ИТОГИ")
    print("=" * 60)
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(r for _, r in results)
    print(f"\nОбщий результат: {'✅ ВСЕ ТЕСТЫ ПРОШЛИ' if all_passed else '❌ ЕСТЬ ОШИБКИ'}")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

