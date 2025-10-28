"""
Скрипт для адаптации и импорта данных из test_data.json в Supabase
"""
import json

# Читаем данные
with open('test_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 60)
print("Adaptirovka dannyh pod novuyu shemu Supabase")
print("=" * 60)

# 1. Адаптируем USERS
print("\n1. Users:")
sql_users = []
for user in data['users']:
    # Старая схема: user_id, username, telegram_username, first_name, last_name, display_name, created_at, updated_at
    # Новая схема: user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name
    telegram_id = user.get('user_id') or user.get('telegram_id')
    username = user.get('username')
    telegram_username = user.get('telegram_username')
    display_name = user.get('display_name')
    first_name = user.get('first_name')
    last_name = user.get('last_name')
    is_anonymous = bool(user.get('is_anonymous', False))
    created_at = user.get('created_at')
    updated_at = user.get('updated_at')
    
    sql = f"""
    INSERT INTO users (user_id, username, telegram_username, display_name, is_anonymous, first_name, last_name, created_at, updated_at)
    VALUES ('{telegram_id}', {f"'{username}'" if username else 'NULL'}, {f"'{telegram_username}'" if telegram_username else 'NULL'}, 
            {f"'{display_name}'" if display_name else 'NULL'}, {is_anonymous}, 
            {f"'{first_name}'" if first_name else 'NULL'}, {f"'{last_name}'" if last_name else 'NULL'},
            '{created_at}', {f"'{updated_at}'" if updated_at else 'NULL'})
    ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        telegram_username = EXCLUDED.telegram_username,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = EXCLUDED.updated_at;
    """
    sql_users.append(sql)
    print(f"   OK {telegram_id} ({telegram_username or username or 'Unknown'})")

# 2. Адаптируем WALLETS (в старой схеме balance был в users)
print("\n2. Wallets:")
sql_wallets = []
for user in data['users']:
    # В старой схеме balance был в users, в новой - в wallets
    telegram_id = user.get('user_id') or user.get('telegram_id')
    # В старой схеме balance не было, но есть в транзакциях - вычислим
    balance = user.get('balance', 0)
    
    sql = f"""
    INSERT INTO wallets (user_id, coins, coins_locked, total_earned, total_spent, created_at, updated_at)
    VALUES ('{telegram_id}', {balance}, 0, 0, 0, '{user.get('created_at')}', NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET coins = EXCLUDED.coins,
        updated_at = NOW();
    """
    sql_wallets.append(sql)
    print(f"   OK {telegram_id} (coins: {balance})")

# 3. Адаптируем PETS
print("\n3. Pets:")
sql_pets = []
for pet in data['pets']:
    # Старая схема: user_id, name, stage, health, created_at, updated_at, image_prompt
    # Новая схема: user_id, name, state ('egg'|'baby'|'adult'), status ('alive'|'dead'), health, creature_json, created_at, updated_at
    user_id = pet.get('user_id')
    name = pet.get('name')
    # Маппинг stage -> state (stage может быть 'egg', 'baby', 'adult')
    old_stage = pet.get('stage', 'egg').lower()
    state_map = {
        'egg': 'egg',
        'baby': 'baby', 
        'adult': 'adult',
        'child': 'baby'  # для совместимости
    }
    state = state_map.get(old_stage, 'egg')
    health = pet.get('health', 100)
    status = 'alive'  # по умолчанию жив
    image_prompt = pet.get('image_prompt')
    created_at = pet.get('created_at')
    updated_at = pet.get('updated_at')
    
    # Если есть image_prompt, можно добавить в creature_json
    creature_json = f'{{"prompt": "{image_prompt}"}}' if image_prompt else None
    
    sql = f"""
    INSERT INTO pets (user_id, name, state, status, health, creature_json, created_at, updated_at)
    VALUES ('{user_id}', '{name}', '{state}', '{status}', {health}, 
            {f"'{creature_json}'" if creature_json else 'NULL'},
            '{created_at}', {f"'{updated_at}'" if updated_at else 'NULL'})
    ON CONFLICT DO NOTHING;
    """
    sql_pets.append(sql)
    print(f"   OK {name} ({state}, health: {health})")

# 4. Адаптируем TRANSACTIONS
print("\n4. Transactions:")
sql_transactions = []
for tx in data['transactions']:
    # Старая схема: user_id, amount, type, description, created_at
    # Новая схема: user_id, transaction_type, amount, balance_before, balance_after, description, status
    user_id = tx.get('user_id')
    amount = tx.get('amount', 0)
    tx_type = tx.get('type', 'earning')
    description = tx.get('description', '')
    created_at = tx.get('created_at')
    
    # Маппинг типов
    type_map = {
        'income': 'earning',
        'expense': 'spending',
        'purchase': 'purchase',
        'market_purchase': 'market_purchase',
        'market_sale': 'market_sale'
    }
    transaction_type = type_map.get(tx_type, 'earning')
    
    # Вычисляем балансы (упрощенно)
    balance_after = amount
    balance_before = 0
    
    sql = f"""
    INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, description, status, created_at)
    VALUES ('{user_id}', '{transaction_type}', {amount}, {balance_before}, {balance_after}, 
            '{description.replace("'", "''")}', 'completed', '{created_at}')
    ON CONFLICT DO NOTHING;
    """
    sql_transactions.append(sql)
    print(f"   OK {user_id}: {description} ({amount} coins)")

# Сохраняем SQL
print("\n" + "=" * 60)
print("Generating SQL commands...")

with open('import_data.sql', 'w', encoding='utf-8') as f:
    f.write("-- Import data to Supabase\n")
    f.write("-- Generated automatically\n\n")
    
    f.write("-- USERS\n")
    for sql in sql_users:
        f.write(sql + "\n")
    
    f.write("\n-- WALLETS\n")
    for sql in sql_wallets:
        f.write(sql + "\n")
    
    f.write("\n-- PETS\n")
    for sql in sql_pets:
        f.write(sql + "\n")
    
    f.write("\n-- TRANSACTIONS\n")
    for sql in sql_transactions:
        f.write(sql + "\n")

print("OK SQL file created: import_data.sql")
print(f"\nStatistics:")
print(f"   - Users: {len(sql_users)}")
print(f"   - Wallets: {len(sql_wallets)}")
print(f"   - Pets: {len(sql_pets)}")
print(f"   - Transactions: {len(sql_transactions)}")

