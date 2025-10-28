"""
Скрипт для импорта данных в Supabase через MCP
"""
import json

# Читаем данные
with open('test_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Importing data to Supabase via MCP...")
print(f"Users: {len(data['users'])}")
print(f"Pets: {len(data['pets'])}")
print(f"Transactions: {len(data['transactions'])}")

# TODO: Импорт через MCP будет выполнен отдельными командами



