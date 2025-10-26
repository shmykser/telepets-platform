# 🗄️ Supabase Database Setup - ГОТОВО! ✅

## ✅ Что уже сделано:

База данных **успешно создана** в Supabase!

- **Project ID:** `xlhzcriexndjamdqeqvc`
- **Project URL:** https://xlhzcriexndjamdqeqvc.supabase.co
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Созданные таблицы (11 штук):

✅ users - пользователи  
✅ pets - питомцы  
✅ wallets - кошельки  
✅ transactions - транзакции  
✅ notifications - уведомления  
✅ achievements - достижения  
✅ auctions - аукционы  
✅ auction_bids - ставки на аукционе  
✅ wallet_holds - холды монет  
✅ pet_ownership_history - история владения питомцами  
✅ game_progress - прогресс в играх  

---

## 🔑 Получение Connection String

### Шаг 1: Открыть настройки БД

1. Откройте: https://supabase.com/dashboard/project/xlhzcriexndjamdqeqvc/settings/database
2. Прокрутите до секции **"Connection string"**

### Шаг 2: Выбрать формат

Выберите **"URI"** формат (для SQLAlchemy):

```
postgresql://postgres.xlhzcriexndjamdqeqvc:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Шаг 3: Получить пароль

Пароль БД был установлен при создании проекта. Если забыли:
1. Settings → Database → Database Password
2. Нажмите **"Reset Database Password"**
3. Скопируйте новый пароль

---

## 🚀 Настройка Backend на Render

### Вариант 1: Через Render Dashboard (рекомендуется)

1. Откройте: https://dashboard.render.com/
2. **New** → **Web Service**
3. Подключите репозиторий: `telepets-platform/backend`

**Настройки сервиса:**

| Параметр | Значение |
|----------|----------|
| Name | `telepets-api` |
| Region | Frankfurt (ближе к Supabase EU) |
| Branch | `master` |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Plan | Free |

**Environment Variables:**

```env
# Supabase Database
DATABASE_URL=postgresql://postgres.xlhzcriexndjamdqeqvc:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Environment
ENVIRONMENT=production

# Security
SECRET_KEY=<сгенерировать случайный ключ>

# Telegram
TELEGRAM_BOT_TOKEN=<ваш токен от BotFather>

# API
API_HOST=0.0.0.0
API_PORT=$PORT
API_BASE_URL=https://telepets-api.onrender.com

# Migrations
RUN_MIGRATIONS_ON_STARTUP=false
SKIP_DB_ON_STARTUP=false

# CORS (обновить после деплоя)
CORS_ORIGINS=https://shmykser.github.io

# Hugging Face (опционально)
HF_API_TOKEN=<ваш токен>
```

**⚠️ Важно:**
- Замените `[PASSWORD]` на реальный пароль от Supabase
- `RUN_MIGRATIONS_ON_STARTUP=false` - миграции уже применены через Supabase MCP
- `SECRET_KEY` - сгенерируйте: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### Шаг 4: Health Check

В Render настройках установите:
- **Health Check Path:** `/monitoring/health`

### Шаг 5: Deploy

1. Нажмите **"Create Web Service"**
2. Дождитесь деплоя (~5-10 минут)
3. Проверьте: `https://telepets-api.onrender.com/docs`

---

## 🔧 Обновление Backend для Supabase

### Изменения в коде (если нужны)

**backend/db.py** - уже готов для PostgreSQL:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.settings import DATABASE_URL

# Для Supabase используется обычный PostgreSQL connection
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
```

**backend/config/settings.py** - уже поддерживает PostgreSQL:

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./telepets.db")
```

✅ **Никаких изменений в коде не требуется!**

---

## 🔐 Безопасность

### Row Level Security (RLS)

Supabase поддерживает RLS для защиты данных. Можно настроить позже:

```sql
-- Включить RLS для таблицы users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Создать политику (пример)
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid()::text = user_id);
```

**⚠️ Пока RLS отключен** - backend полностью контролирует доступ.

---

## 📊 Мониторинг

### Supabase Dashboard

- **Database:** https://supabase.com/dashboard/project/xlhzcriexndjamdqeqvc/database/tables
- **SQL Editor:** https://supabase.com/dashboard/project/xlhzcriexndjamdqeqvc/sql/new
- **Logs:** https://supabase.com/dashboard/project/xlhzcriexndjamdqeqvc/logs/explorer

### Полезные SQL запросы

**Проверить количество записей:**
```sql
SELECT 
  'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets;
```

**Посмотреть последних пользователей:**
```sql
SELECT user_id, username, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎯 Следующие шаги

1. ✅ База данных создана в Supabase
2. ⏳ Получить Connection String
3. ⏳ Создать Web Service на Render
4. ⏳ Настроить Environment Variables
5. ⏳ Задеплоить backend
6. ⏳ Обновить CORS для GitHub Pages
7. ⏳ Настроить Telegram WebApp

---

## 💡 Преимущества Supabase

✅ **PostgreSQL не удаляется** (в отличие от Render free tier 90 дней)  
✅ **500MB БД бесплатно**  
✅ **Realtime** - подписки на изменения данных  
✅ **Storage** - хранение файлов (изображения питомцев)  
✅ **Auth** - встроенная авторизация  
✅ **Backups** - автоматические бэкапы  
✅ **pgAdmin UI** - удобный интерфейс управления  

---

**База данных готова к использованию! 🎉**

Следующий шаг: настройте backend на Render с полученным CONNECTION_STRING.

