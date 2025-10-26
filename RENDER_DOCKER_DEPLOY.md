# 🐳 Deploy Backend на Render через Docker

## 📋 Преимущества Docker

✅ **Гарантированная работа** - окружение идентично локальному  
✅ **Нет проблем с зависимостями** - все пакеты собираются в образе  
✅ **Python 3.12** - стабильная версия без конфликтов  
✅ **Быстрая сборка** - кэширование слоев Docker  

---

## 🚀 Пошаговая Инструкция

### Шаг 1: Добавить карту (обязательно)

Даже для Free tier Render требует карту для верификации:

1. Откройте: https://dashboard.render.com/billing
2. **Add Payment Method** → введите данные карты
3. **Free tier остается бесплатным** - карта только для верификации

---

### Шаг 2: Создать Web Service

1. **Откройте Dashboard:** https://dashboard.render.com/
2. **Выберите workspace:** `telepets-platform`
3. **Нажмите:** New + → Web Service
4. **Connect repository:**
   - Build and deploy from a Git repository → Next
   - Connect: `shmykser/telepets-platform`

---

### Шаг 3: Настроить сервис

| Параметр | Значение | Важность |
|----------|----------|----------|
| **Name** | `telepets-api-docker` | ✅ |
| **Region** | Frankfurt | ✅ (ближе к Supabase) |
| **Branch** | master | ✅ |
| **Root Directory** | `backend` | ⚠️ КРИТИЧНО! |
| **Environment** | Docker | ⚠️ КРИТИЧНО! |
| **Dockerfile Path** | `./Dockerfile` | ✅ (относительно Root Dir) |
| **Docker Build Context** | `.` | ✅ |
| **Docker Command** | *(оставить пустым)* | ✅ (CMD из Dockerfile) |

⚠️ **Важно:**
- **Root Directory** = `backend` - Render будет работать из этой папки
- **Dockerfile Path** = `./Dockerfile` - относительно `backend/`
- **Environment** = `Docker` (НЕ Python!)

---

### Шаг 4: Выбрать план

| План | Характеристики | Стоимость |
|------|---------------|-----------|
| **Free** | 512MB RAM, spin down после 15 мин бездействия | $0/месяц ✅ |
| Starter | 512MB RAM, always on | $7/месяц |

**Выберите:** Free ✅

⚠️ **Free tier особенности:**
- Сервис "засыпает" после 15 минут бездействия
- Первый запрос после "сна" будет медленным (~30 сек)
- Для Telegram бота это нормально - пользователи не заметят

---

### Шаг 5: Environment Variables

Нажмите **"Advanced"** → **Add Environment Variable**

Добавьте переменные:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.xlhzcriexndjamdqeqvc:QC%25PAj4qvBH/HA3@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Environment
ENVIRONMENT=production

# Security
SECRET_KEY=telepets-prod-secret-2024-render-supabase-xyz

# API
API_HOST=0.0.0.0

# Database migrations
RUN_MIGRATIONS_ON_STARTUP=false
SKIP_DB_ON_STARTUP=false

# Telegram Bot (ЗАМЕНИТЕ НА ВАШ ТОКЕН!)
TELEGRAM_BOT_TOKEN=your_token_here

# Hugging Face (опционально)
HF_API_TOKEN=
```

⚠️ **Замените `TELEGRAM_BOT_TOKEN`** на ваш реальный токен от @BotFather!

---

### Шаг 6: Advanced Settings (опционально)

**Auto-Deploy:**
- ✅ Yes - автоматический деплой при push в `master`

**Health Check Path:**
- `/monitoring/health` - Render будет проверять статус

**Pull Request Previews:**
- ❌ No - не нужно для Free tier

---

### Шаг 7: Deploy!

1. **Нажмите:** Create Web Service
2. **Ждите:** ~5-10 минут (первая сборка Docker образа)
3. **Следите за логами** в реальном времени

---

## ✅ После успешного деплоя

### 1. Получите URL сервиса

Ваш backend будет доступен по адресу:
```
https://telepets-api-docker.onrender.com
```

### 2. Проверьте работу

Откройте в браузере:
- **API Docs:** https://telepets-api-docker.onrender.com/docs
- **Health Check:** https://telepets-api-docker.onrender.com/monitoring/health

Должны увидеть:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-26T17:45:00Z"
}
```

### 3. Обновите Frontend

Обновите API URL на фронтенде:

**Файл:** `frontends/webapp/src/config/endpoints.ts`

```typescript
const PROD_CONFIG = {
  api: {
    url: 'https://telepets-api-docker.onrender.com/api', // ← обновить
    directBackendUrl: '',
  },
  petImages: {
    url: 'https://telepets-api-docker.onrender.com/pet-images', // ← обновить
  },
}
```

**Закоммитить и запушить:**
```bash
git add frontends/webapp/src/config/endpoints.ts
git commit -m "fix: update API URL to Docker service"
git push origin master
```

GitHub Actions автоматически пересоберет и задеплоит frontend.

---

## 🔧 Troubleshooting

### Проблема 1: Build Failed

**Симптомы:** Ошибка при сборке Docker образа

**Решение:**
1. Проверьте **Root Directory** = `backend`
2. Проверьте **Dockerfile Path** = `./Dockerfile`
3. Проверьте логи сборки в Dashboard

### Проблема 2: Service не запускается

**Симптомы:** Сервис в статусе "Deploy failed"

**Решение:**
1. Проверьте **Environment Variables** - все ли добавлены?
2. Проверьте **DATABASE_URL** - правильный ли URL-encoding?
3. Проверьте логи: Dashboard → Logs

### Проблема 3: 502 Bad Gateway

**Симптомы:** API возвращает 502 ошибку

**Возможные причины:**
- Приложение не слушает порт `$PORT`
- Приложение крашится при старте
- Database не доступна

**Решение:**
1. Проверьте логи: Dashboard → Logs
2. Убедитесь что DATABASE_URL правильный
3. Проверьте что Supabase доступна

### Проблема 4: Медленный первый запрос

**Симптомы:** Первый запрос после долгого простоя занимает 30+ секунд

**Это нормально для Free tier!**
- Сервис "засыпает" после 15 минут бездействия
- При первом запросе Render "будит" сервис
- Последующие запросы будут быстрыми

**Решение для production:**
- Upgrade до Starter plan ($7/мес) - always on
- Или настроить cron job для пинга каждые 10 минут

---

## 📊 Мониторинг

### Render Dashboard

- **Deploys:** https://dashboard.render.com/web/[service-id]/deploys
- **Logs:** https://dashboard.render.com/web/[service-id]/logs
- **Metrics:** https://dashboard.render.com/web/[service-id]/metrics
- **Environment:** https://dashboard.render.com/web/[service-id]/env

### Endpoints для проверки

| Endpoint | Что проверяет |
|----------|---------------|
| `/docs` | Swagger UI |
| `/monitoring/health` | Статус приложения |
| `/monitoring/metrics` | Метрики |
| `/monitoring/stats` | Статистика БД |

---

## 🎯 Следующие шаги

После успешного деплоя backend:

1. ✅ **Обновить Frontend** - новый API URL
2. ⏳ **Настроить Telegram WebApp** - через @BotFather
3. ⏳ **Протестировать** - на смартфоне

Инструкции в файле `DEPLOY_CHECKLIST.md`

---

## 💡 Полезные команды

### Локальная сборка Docker (для тестирования)

```bash
# Перейти в backend
cd telepets-platform/backend

# Собрать образ
docker build -t telepets-api .

# Запустить контейнер
docker run -p 10000:10000 \
  -e DATABASE_URL="..." \
  -e ENVIRONMENT=production \
  telepets-api

# Проверить
curl http://localhost:10000/monitoring/health
```

---

## 📚 Дополнительные ресурсы

- **Render Docker Docs:** https://render.com/docs/docker
- **Render Environment Variables:** https://render.com/docs/environment-variables
- **Render Health Checks:** https://render.com/docs/health-checks
- **Render Free Tier:** https://render.com/docs/free

---

**Docker образ готов к деплою! 🐳**

Следуйте инструкции выше и через 10 минут backend будет работать! 🚀

