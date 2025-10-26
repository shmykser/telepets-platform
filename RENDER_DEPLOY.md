# 🚀 Deploy Backend на Render - Пошаговая Инструкция

## ⚠️ Требование Render

Render требует добавить банковскую карту даже для Free tier. Это защита от злоупотреблений.
**Free tier остается бесплатным**, карта нужна только для верификации.

**Добавить карту:** https://dashboard.render.com/billing

---

## 📋 Подготовка

### ✅ Что уже готово:

1. ✅ Frontend на GitHub Pages: https://shmykser.github.io/telepets-platform/
2. ✅ База данных Supabase (11 таблиц создано)
3. ✅ CORS обновлен для GitHub Pages
4. ✅ Workspace `telepets-platform` выбран в Render

### 🔑 Connection String для Supabase:

```
postgresql://postgres.xlhzcriexndjamdqeqvc:QC%25PAj4qvBH/HA3@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **Важно:** Символ `%` в пароле URL-encoded как `%25`

---

## 🚀 Деплой через Render Dashboard

### Шаг 1: Создать Web Service

1. Откройте: https://dashboard.render.com/
2. Выберите workspace **"telepets-platform"**
3. Нажмите **"New +"** → **"Web Service"**
4. Выберите **"Build and deploy from a Git repository"** → Next

### Шаг 2: Подключить репозиторий

1. **Connect a repository:**
   - Если репозиторий не подключен, нажмите **"Configure account"**
   - Выберите GitHub → `telepets-platform`
   
2. Или введите URL:
   ```
   https://github.com/shmykser/telepets-platform
   ```

### Шаг 3: Настроить сервис

| Параметр | Значение |
|----------|----------|
| **Name** | `telepets-api` |
| **Region** | Frankfurt (ближе к Supabase EU) |
| **Branch** | `master` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

⚠️ **Важно:** Указать **Root Directory** = `backend` чтобы Render работал из папки backend/

### Шаг 4: Environment Variables

Нажмите **"Advanced"** → **"Add Environment Variable"** и добавьте:

```env
# Database
DATABASE_URL=postgresql://postgres.xlhzcriexndjamdqeqvc:QC%25PAj4qvBH/HA3@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Environment
ENVIRONMENT=production

# Security
SECRET_KEY=telepets-prod-secret-2024-render-supabase-xyz

# Telegram Bot (ваш токен от @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# API
API_HOST=0.0.0.0

# Database migrations (уже применены через Supabase)
RUN_MIGRATIONS_ON_STARTUP=false
SKIP_DB_ON_STARTUP=false

# Hugging Face (опционально, для генерации изображений)
HF_API_TOKEN=
```

⚠️ **Замените:**
- `TELEGRAM_BOT_TOKEN` - ваш реальный токен от @BotFather

### Шаг 5: Advanced Settings (опционально)

**Health Check Path:**
```
/monitoring/health
```

**Auto-Deploy:**
- ✅ Yes (деплой при каждом push в master)

### Шаг 6: Deploy

1. Нажмите **"Create Web Service"**
2. Дождитесь завершения деплоя (~5-10 минут)
3. Статус будет **"Live"** когда готово

### Шаг 7: Проверить API

После деплоя откройте:

- **API Docs:** `https://telepets-api.onrender.com/docs`
- **Health Check:** `https://telepets-api.onrender.com/monitoring/health`
- **API Base:** `https://telepets-api.onrender.com/api`

---

## 🔧 Обновить Frontend для нового API

После успешного деплоя нужно обновить API URL на фронтенде.

### Проверить текущие настройки

<function_calls>
<invoke name="grep">
<parameter name="pattern">VITE_API_URL|API_URL|api\.onrender
