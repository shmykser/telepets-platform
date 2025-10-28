"""
Скрипт миграции тестовых данных из SQLite в PostgreSQL (Supabase)
"""
import sqlite3
import asyncpg
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Connection strings
SQLITE_DB = "telepets_dev.db"
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres.xlhzcriexndjamdqeqvc:OgzEL5yWT2R2@aws-1-eu-west-1.pooler.supabase.com:5432/postgres")

async def migrate_data():
    """Миграция данных из SQLite в PostgreSQL"""
    
    # Подключение к SQLite
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # Подключение к PostgreSQL (убираем ssl для asyncpg)
    pg_conn = await asyncpg.connect(POSTGRES_URL.replace("?ssl=require", ""))
    
    try:
        print("🔄 Начало миграции данных...")
        
        # ========== USERS ==========
        print("\n1️⃣ Миграция пользователей...")
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        
        for user in users:
            await pg_conn.execute("""
                INSERT INTO users (telegram_id, username, balance, created_at, last_active)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (telegram_id) DO UPDATE
                SET username = EXCLUDED.username,
                    balance = EXCLUDED.balance,
                    last_active = EXCLUDED.last_active
            """, user['telegram_id'], user['username'], user['balance'], 
                user['created_at'], user['last_active'])
        
        print(f"   ✅ Перенесено пользователей: {len(users)}")
        
        # ========== PETS ==========
        print("\n2️⃣ Миграция питомцев...")
        sqlite_cursor.execute("SELECT * FROM pets")
        pets = sqlite_cursor.fetchall()
        
        for pet in pets:
            await pg_conn.execute("""
                INSERT INTO pets (user_id, name, stage, health, created_at, updated_at, image_prompt)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, name) DO UPDATE
                SET stage = EXCLUDED.stage,
                    health = EXCLUDED.health,
                    updated_at = EXCLUDED.updated_at,
                    image_prompt = EXCLUDED.image_prompt
            """, pet['user_id'], pet['name'], pet['stage'], pet['health'],
                pet['created_at'], pet['updated_at'], pet.get('image_prompt'))
        
        print(f"   ✅ Перенесено питомцев: {len(pets)}")
        
        # ========== TRANSACTIONS ==========
        print("\n3️⃣ Миграция транзакций...")
        sqlite_cursor.execute("SELECT * FROM transactions")
        transactions = sqlite_cursor.fetchall()
        
        for tx in transactions:
            await pg_conn.execute("""
                INSERT INTO transactions (user_id, amount, type, description, created_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING
            """, tx['user_id'], tx['amount'], tx['type'], tx['description'], tx['created_at'])
        
        print(f"   ✅ Перенесено транзакций: {len(transactions)}")
        
        # ========== MARKET LISTINGS ==========
        print("\n4️⃣ Миграция объявлений маркета...")
        sqlite_cursor.execute("SELECT * FROM market_listings")
        listings = sqlite_cursor.fetchall()
        
        for listing in listings:
            await pg_conn.execute("""
                INSERT INTO market_listings 
                (seller_id, pet_id, price, status, created_at, updated_at, buyer_id, sold_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING
            """, listing['seller_id'], listing['pet_id'], listing['price'], 
                listing['status'], listing['created_at'], listing['updated_at'],
                listing.get('buyer_id'), listing.get('sold_at'))
        
        print(f"   ✅ Перенесено объявлений: {len(listings)}")
        
        # ========== GAME SCORES ==========
        print("\n5️⃣ Миграция игровых очков...")
        sqlite_cursor.execute("SELECT * FROM game_scores")
        scores = sqlite_cursor.fetchall()
        
        for score in scores:
            await pg_conn.execute("""
                INSERT INTO game_scores (user_id, game_type, score, coins_earned, created_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING
            """, score['user_id'], score['game_type'], score['score'], 
                score['coins_earned'], score['created_at'])
        
        print(f"   ✅ Перенесено игровых записей: {len(scores)}")
        
        print("\n" + "="*50)
        print("✅ МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Ошибка миграции: {e}")
        raise
    finally:
        sqlite_conn.close()
        await pg_conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_data())



