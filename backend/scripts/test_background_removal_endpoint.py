#!/usr/bin/env python3
"""
Тест endpoint удаления фона с детальным логированием
"""
import os
import sys
import requests
import json
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def test_remove_background_endpoint():
    """Тестирует endpoint удаления фона"""
    
    user_id = "273065571"
    pet_name = "Trans"
    base_url = "http://localhost:8080"
    endpoint = f"{base_url}/api/pet-images/{user_id}/{pet_name}/remove-background"
    
    print("=" * 60)
    print("ТЕСТ ENDPOINT УДАЛЕНИЯ ФОНА")
    print("=" * 60)
    print(f"URL: {endpoint}")
    print()
    
    # Проверяем токен
    replicate_token = os.getenv("REPLICATE_API_TOKEN")
    if not replicate_token:
        print("⚠️  ВНИМАНИЕ: REPLICATE_API_TOKEN не установлен")
        print("   Удаление фона может не работать")
    else:
        print(f"✅ REPLICATE_API_TOKEN установлен (длина: {len(replicate_token)})")
    
    print()
    print("Отправка запроса...")
    
    try:
        response = requests.post(endpoint, timeout=120)
        print(f"Статус: {response.status_code}")
        print(f"Заголовки: {dict(response.headers)}")
        print()
        
        try:
            data = response.json()
            print("Ответ:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except:
            print(f"Текст ответа: {response.text[:500]}")
        
        if response.status_code == 200:
            if data.get("status") == "success":
                print("\n✅ Успешно!")
            elif data.get("status") == "error":
                print("\n❌ Ошибка:")
                errors = data.get("errors", [])
                for error in errors:
                    print(f"   - {error}")
                print("\n⚠️  Проверьте логи сервера для деталей")
        else:
            print(f"\n❌ Ошибка HTTP {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Ошибка: Не удалось подключиться к серверу")
        print("   Убедитесь, что сервер запущен на http://localhost:8080")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_remove_background_endpoint()

