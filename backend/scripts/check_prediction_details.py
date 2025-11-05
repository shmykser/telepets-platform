#!/usr/bin/env python3
"""
Проверка деталей конкретного предсказания
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import replicate
import json

def check_prediction_details(prediction_id):
    """Проверяет детали конкретного предсказания"""
    try:
        prediction = replicate.predictions.get(prediction_id)
        
        print(f"ID: {prediction.id}")
        print(f"Статус: {prediction.status}")
        print(f"Модель: {prediction.model}")
        print(f"\nВходные параметры (input):")
        print(json.dumps(prediction.input, indent=2, ensure_ascii=False))
        
        print(f"\nПолная информация о предсказании:")
        pred_dict = dict(prediction)
        print(json.dumps(pred_dict, indent=2, ensure_ascii=False, default=str))
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Используем последнее предсказание из списка
    prediction_id = "pkhews2d2hrm80ctabv9xkwk1r"  # Из вывода предыдущего скрипта
    if len(sys.argv) > 1:
        prediction_id = sys.argv[1]
    
    check_prediction_details(prediction_id)


