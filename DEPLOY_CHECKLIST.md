# ✅ Checklist Деплоя Telepets Platform

## 📊 Статус

| Компонент | Статус | URL/Детали |
|-----------|--------|------------|
| Frontend (React) | ✅ ГОТОВО | https://shmykser.github.io/telepets-platform/ |
| Frontend (Games) | ✅ ГОТОВО | https://shmykser.github.io/telepets-platform/games/ |
| Database (Supabase) | ✅ ГОТОВО | 11 таблиц создано |
| Backend (Render) | ⏳ ТРЕБУЕТСЯ | https://telepets-api.onrender.com |
| CORS | ✅ ГОТОВО | GitHub Pages добавлен |
| API Endpoints | ✅ ГОТОВО | Обновлено для Render |
| Telegram WebApp | ⏳ ТРЕБУЕТСЯ | Настроить через BotFather |

---

## 🎯 Что Сделано

### ✅ 1. Frontend на GitHub Pages

**Результат:**
- WebApp: https://shmykser.github.io/telepets-platform/
- Games: https://shmykser.github.io/telepets-platform/games/

**GitHub Actions:**
- Автодеплой при push в `master`
- Сборка React (Vite)
- Сборка Phaser (Vite)

**Файлы:**
- `.github/workflows/deploy-frontends.yml` ✅
- `frontends/webapp/vite.config.ts` ✅
- `frontends/games/vite.config.js` ✅

### ✅ 2. База Данных на Supabase

**Результат:**
- Project ID: `xlhzcriexndjamdqeqvc`
- URL: https://xlhzcriexndjamdqeqvc.supabase.co
- Connection String: `postgresql://postgres.xlhzcriexndjamdqeqvc:QC%25PAj4qvBH/HA3@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

**Таблицы (11 шт):**
- users, pets, wallets, transactions
- notifications, achievements
- auctions, auction_bids, wallet_holds
- pet_ownership_history, game_progress

**Файлы:**
- `SUPABASE_SETUP.md` ✅

### ✅ 3. Backend - CORS обновлен

**Изменения:**
```python
# backend/main.py
allow_origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://telepets-frontend.onrender.com",
    "https://shmykser.github.io",  # ✅ GitHub Pages
]
```

### ✅ 4. Frontend - API Endpoints обновлены

**Изменения:**
```typescript
// frontends/webapp/src/config/endpoints.ts
const PROD_CONFIG = {
  api: {
    url: 'https://telepets-api.onrender.com/api', // ✅ Render
  },
  petImages: {
    url: 'https://telepets-api.onrender.com/pet-images',
  },
}
```

---

## ⏳ Что Осталось Сделать

### 1️⃣ Deploy Backend на Render (ТРЕБУЕТ ДЕЙСТВИЙ)

**Проблема:** Render требует добавить банковскую карту даже для Free tier.

**Решение:**
1. Добавьте карту: https://dashboard.render.com/billing
2. Следуйте инструкции: `RENDER_DEPLOY.md`

**Настройки сервиса:**

```yaml
Name: telepets-api
Region: Frankfurt
Branch: master
Root Directory: backend
Runtime: Python 3
Build: pip install -r requirements.txt
Start: uvicorn main:app --host 0.0.0.0 --port $PORT
Plan: Free
```

**Environment Variables:**

```env
DATABASE_URL=postgresql://postgres.xlhzcriexndjamdqeqvc:QC%25PAj4qvBH/HA3@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
ENVIRONMENT=production
SECRET_KEY=telepets-prod-secret-2024-render-supabase-xyz
TELEGRAM_BOT_TOKEN=<ВАШ_ТОКЕН>
API_HOST=0.0.0.0
RUN_MIGRATIONS_ON_STARTUP=false
SKIP_DB_ON_STARTUP=false
HF_API_TOKEN=<ОПЦИОНАЛЬНО>
```

**После деплоя проверить:**
- https://telepets-api.onrender.com/docs
- https://telepets-api.onrender.com/monitoring/health

---

### 2️⃣ Настроить Telegram WebApp (ТРЕБУЕТ ДЕЙСТВИЙ)

**Шаги:**

1. **Открыть BotFather** в Telegram: https://t.me/BotFather

2. **Установить Menu Button:**
```
/mybots
→ Выбрать вашего бота
→ Bot Settings
→ Menu Button
→ Configure menu button
→ URL: https://shmykser.github.io/telepets-platform/
→ Text: Играть 🎮
```

3. **Включить WebApp:**
```
/mybots
→ Выбрать вашего бота
→ Bot Settings
→ Inline Mode
→ Turn on
```

4. **Установить описание и картинку:**
```
/mybots
→ Выбрать вашего бота
→ Edit Bot
→ Description: Виртуальный питомец Тамагочи в Telegram!
→ About: Выращивай питомца, играй в игры, торгуй на рынке!
→ Bot Pic: <загрузить картинку>
```

---

### 3️⃣ Финальное Тестирование (ПОСЛЕ RENDER ДЕПЛОЯ)

**Чек-лист:**

#### Backend API
- [ ] https://telepets-api.onrender.com/docs открывается
- [ ] https://telepets-api.onrender.com/monitoring/health возвращает `{"status": "ok"}`
- [ ] CORS работает (проверить в DevTools браузера)

#### Frontend WebApp
- [ ] https://shmykser.github.io/telepets-platform/ загружается
- [ ] API запросы успешны (проверить в Network DevTools)
- [ ] Можно создать питомца
- [ ] Можно покормить питомца
- [ ] Баланс монет работает

#### Frontend Games
- [ ] https://shmykser.github.io/telepets-platform/games/ загружается
- [ ] Игра Pet Thief работает
- [ ] Награды начисляются

#### Telegram WebApp
- [ ] Открыть бота в Telegram
- [ ] Нажать "Играть 🎮" или /start
- [ ] WebApp открывается в Telegram
- [ ] Telegram initData передается корректно
- [ ] Можно играть на смартфоне

#### Database
- [ ] Данные сохраняются в Supabase
- [ ] Транзакции записываются
- [ ] Нет ошибок в логах Render

---

## 📋 Быстрый Старт для Деплоя

### Вариант A: Через Render Dashboard (рекомендуется)

1. Добавить карту: https://dashboard.render.com/billing
2. Следовать: `RENDER_DEPLOY.md` (пошаговая инструкция)
3. После деплоя: настроить Telegram через BotFather

### Вариант B: Через Render CLI (для опытных)

```bash
# Установить Render CLI
npm install -g render-cli

# Авторизоваться
render login

# Создать сервис из blueprint
render blueprint deploy render.yaml
```

---

## 🔧 Troubleshooting

### Backend не стартует на Render

**Проверить:**
1. Root Directory = `backend`
2. Start Command = `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. DATABASE_URL правильно URL-encoded (% → %25)
4. Логи: https://dashboard.render.com/logs

### Frontend не подключается к Backend

**Проверить:**
1. Backend URL в `frontends/webapp/src/config/endpoints.ts`
2. CORS в `backend/main.py` включает GitHub Pages
3. Backend Live на Render
4. Network DevTools для ошибок

### Telegram WebApp не открывается

**Проверить:**
1. URL в BotFather правильный
2. HTTPS (не HTTP)
3. WebApp открывается в обычном браузере
4. Telegram WebApp SDK подключен

---

## 📚 Документация

| Файл | Описание |
|------|----------|
| `README.md` | Общее описание проекта |
| `SUPABASE_SETUP.md` | Настройка базы данных Supabase ✅ |
| `RENDER_DEPLOY.md` | Деплой backend на Render ⏳ |
| `DEPLOY_CHECKLIST.md` | Этот файл - чек-лист деплоя |
| `QUICK_START.md` | Локальная разработка |
| `DEPLOYMENT_GUIDE.md` | Детальное руководство |

---

## 🎉 Следующий Шаг

**Чтобы завершить деплой:**

1. **Добавьте карту на Render:** https://dashboard.render.com/billing
2. **Следуйте инструкции:** `RENDER_DEPLOY.md`
3. **После деплоя настройте Telegram:** Шаг 2️⃣ выше

**Ожидаемое время:** 15-20 минут

---

**Статус:** Backend готов к деплою, требуется добавить карту на Render! 🚀

