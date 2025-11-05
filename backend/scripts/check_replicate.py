#!/usr/bin/env python3
"""
Скрипт для проверки доступа к Replicate API и просмотра последних генераций
"""
import os
import sys
from pathlib import Path

# Добавляем путь к backend для импорта модулей
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import replicate
from config.settings import get_replicate_settings, get_generation_defaults, get_quality_settings

def check_replicate_access():
    """Проверяет доступ к Replicate API"""
    print("=" * 60)
    print("ПРОВЕРКА ДОСТУПА К REPLICATE")
    print("=" * 60)
    
    # Проверка токена
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        print("❌ REPLICATE_API_TOKEN не установлен в переменных окружения")
        return False
    
    print(f"✅ REPLICATE_API_TOKEN установлен (длина: {len(token)} символов)")
    
    # Проверка настроек
    settings = get_replicate_settings()
    print(f"✅ Модель: {settings.get('model')}")
    print(f"✅ Timeout: {settings.get('timeout')} сек")
    
    # Проверка качества
    defaults = get_generation_defaults()
    quality_preset = defaults.get("quality_preset", "high")
    quality = get_quality_settings(quality_preset)
    print(f"✅ Quality preset: {quality_preset}")
    print(f"   - width: {quality.get('width')}")
    print(f"   - height: {quality.get('height')}")
    print(f"   - steps: {quality.get('steps')}")
    print(f"   - guidance_scale: {quality.get('guidance_scale')}")
    
    return True

def list_recent_predictions(limit=10):
    """Получает список последних предсказаний"""
    print("\n" + "=" * 60)
    print(f"ПОСЛЕДНИЕ {limit} ГЕНЕРАЦИЙ")
    print("=" * 60)
    
    try:
        # Получаем список предсказаний
        page = replicate.predictions.list()
        predictions = list(page)[:limit]
        
        if not predictions:
            print("❌ Нет предсказаний")
            return
        
        for i, pred in enumerate(predictions, 1):
            print(f"\n--- Предсказание #{i} ---")
            print(f"ID: {pred.id}")
            print(f"Статус: {pred.status}")
            print(f"Модель: {pred.model}")
            print(f"Версия: {pred.version}")
            print(f"Создано: {pred.created_at}")
            
            # Показываем входные параметры
            if hasattr(pred, 'input') and pred.input:
                print(f"Входные параметры:")
                for key, value in pred.input.items():
                    if key == 'prompt':
                        # Обрезаем длинный промпт
                        prompt_str = str(value)
                        if len(prompt_str) > 100:
                            prompt_str = prompt_str[:100] + "..."
                        print(f"  - {key}: {prompt_str}")
                    else:
                        print(f"  - {key}: {value}")
            
            # Показываем логи если есть
            if hasattr(pred, 'logs') and pred.logs:
                logs = pred.logs
                if len(logs) > 500:
                    logs = logs[:500] + "..."
                print(f"Логи (первые 500 символов):\n{logs}")
            
            # Показываем вывод
            if hasattr(pred, 'output') and pred.output:
                print(f"Вывод: {pred.output}")
            
            # Показываем ошибки если есть
            if hasattr(pred, 'error') and pred.error:
                print(f"❌ Ошибка: {pred.error}")
    
    except Exception as e:
        print(f"❌ Ошибка при получении списка предсказаний: {e}")
        import traceback
        traceback.print_exc()

def check_model_schema():
    """Проверяет схему модели flux-1.1-pro"""
    print("\n" + "=" * 60)
    print("СХЕМА МОДЕЛИ flux-1.1-pro")
    print("=" * 60)
    
    try:
        model = replicate.models.get("black-forest-labs/flux-1.1-pro")
        latest_version = model.versions.list()[0]
        
        print(f"Модель: {model.owner}/{model.name}")
        print(f"Последняя версия: {latest_version.id}")
        
        # Получаем схему входных параметров
        if hasattr(latest_version, 'openapi_schema'):
            schema = latest_version.openapi_schema
            if schema and 'components' in schema:
                schemas = schema.get('components', {}).get('schemas', {})
                if 'Input' in schemas:
                    input_schema = schemas['Input']
                    properties = input_schema.get('properties', {})
                    print("\nДоступные входные параметры:")
                    for prop_name, prop_info in properties.items():
                        prop_type = prop_info.get('type', 'unknown')
                        default = prop_info.get('default', 'нет')
                        description = prop_info.get('description', '')
                        print(f"  - {prop_name}:")
                        print(f"      Тип: {prop_type}")
                        print(f"      По умолчанию: {default}")
                        if description:
                            print(f"      Описание: {description}")
        
        # Альтернативный способ - через описание версии
        if hasattr(latest_version, 'description'):
            print(f"\nОписание версии: {latest_version.description}")
    
    except Exception as e:
        print(f"❌ Ошибка при получении схемы модели: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Главная функция"""
    if not check_replicate_access():
        print("\n❌ Не удалось проверить доступ. Убедитесь, что REPLICATE_API_TOKEN установлен.")
        sys.exit(1)
    
    check_model_schema()
    list_recent_predictions(limit=5)
    
    print("\n" + "=" * 60)
    print("ПРОВЕРКА ЗАВЕРШЕНА")
    print("=" * 60)

if __name__ == "__main__":
    main()


