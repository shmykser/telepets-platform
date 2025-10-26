# 🚀 План публикации Telepets Platform

## 📊 Анализ текущей архитектуры

### Компоненты проекта:
1. **Backend (FastAPI)** - API сервер на Python 3.11
2. **Frontend WebApp (React)** - основное приложение с React + TypeScript
3. **Frontend Games (Phaser)** - мини-игры на Phaser.js
4. **PostgreSQL Database** - основная база данных
5. **Telegram Bot** - бот для уведомлений (aiogram)

---

## 🎯 Рекомендуемая архитектура деплоя (бесплатная)

### Вариант 1: Render + GitHub Pages (РЕКОМЕНДУЕТСЯ)

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Bot WebApp                      │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  React WebApp    │         │  Phaser Games    │          │
│  │ (GitHub Pages)   │ ←───────│ (GitHub Pages)   │          │
│  │ /telepets-webapp │  iframe │ /telepets-games  │          │
│  └──────────────────┘         └──────────────────┘          │
│         │ fetch API                    │ fetch API          │
│         ▼                              ▼                    │
└─────────┼──────────────────────────────┼───────────────────┘
          │                              │
          ▼                              ▼
    ┌────────────────────────────────────────────┐
    │         Backend API (Render)               │
    │   https://telepets-api.onrender.com        │
    │                                            │
    │  ┌──────────────────────────────────────┐  │
    │  │    PostgreSQL (Render)               │  │
    │  │  Free tier: 256MB / 90 days          │  │
    │  └──────────────────────────────────────┘  │
    └────────────────────────────────────────────┘
          ▲
          │ webhook
    ┌─────┴─────────────────────────────────────┐
    │    Telegram Bot (тот же Render сервис)    │
    │  или отдельный Web Service на Render      │
    └───────────────────────────────────────────┘
```

**Преимущества:**
- ✅ Полностью бесплатно (в рамках лимитов)
- ✅ Статика на GitHub Pages — быстро и надёжно
- ✅ Backend на Render — автоматический деплой из Git
- ✅ PostgreSQL на Render — управляемая база данных
- ✅ SSL сертификаты из коробки

**Ограничения:**
- ⚠️ Render free tier: спящий режим после 15 минут бездействия
- ⚠️ PostgreSQL free tier удаляется через 90 дней
- ⚠️ 750 часов в месяц (достаточно для 1 сервиса 24/7)

---

### Вариант 2: Полностью на Render (альтернатива)

```
    ┌────────────────────────────────────────────┐
    │        Render Static Site (WebApp)         │
    │   https://telepets.onrender.com            │
    └────────────────────────────────────────────┘
                      │ fetch API
                      ▼
    ┌────────────────────────────────────────────┐
    │     Render Web Service (Backend)           │
    │   https://telepets-api.onrender.com        │
    │         + PostgreSQL Internal              │
    └────────────────────────────────────────────┘
```

**Преимущества:**
- ✅ Всё в одном месте
- ✅ Простое управление

**Недостатки:**
- ⚠️ Нужно 2-3 отдельных сервиса (WebApp, Games, Backend)
- ⚠️ Каждый static site учитывается в лимитах

---

## 📋 Пошаговый план деплоя (Вариант 1 - РЕКОМЕНДУЕТСЯ)

### Этап 1: Подготовка репозитория

1. **Создать отдельные GitHub репозитории:**
   - `telepets-webapp` - для React приложения
   - `telepets-games` - для Phaser игр
   - `telepets-backend` - для FastAPI backend

   **Альтернатива:** Использовать один монорепозиторий с GitHub Actions

2. **Настроить .gitignore:**
   ```gitignore
   # Backend
   __pycache__/
   *.pyc
   *.db
   .env
   cache/
   
   # Frontend
   node_modules/
   dist/
   .DS_Store
   
   # IDE
   .vscode/
   .idea/
   ```

### Этап 2: Настройка GitHub Pages для фронтенда

#### 2.1 WebApp (React)

1. **Обновить `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     base: '/telepets-webapp/', // или '/' если custom domain
     build: {
       outDir: 'dist',
       sourcemap: false, // отключить для production
     }
   })
   ```

2. **Обновить API endpoints в коде:**
   Создать `src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = import.meta.env.VITE_API_URL || 
     'https://telepets-api.onrender.com';
   ```

3. **Создать GitHub Action для деплоя:**
   `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Build
           env:
             VITE_API_URL: https://telepets-api.onrender.com
           run: npm run build
           
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

4. **Включить GitHub Pages:**
   - Settings → Pages → Source: Deploy from branch
   - Branch: `gh-pages` → `/ (root)` → Save

#### 2.2 Games (Phaser)

Аналогично WebApp, но с `base: '/telepets-games/'`

### Этап 3: Настройка Render для Backend

#### 3.1 Создать PostgreSQL базу данных

1. **В Render Dashboard:**
   - New → PostgreSQL
   - Name: `telepets-db`
   - Database: `telepets`
   - User: `telepets`
   - Region: выбрать ближайший
   - Plan: Free

2. **Скопировать Internal Database URL** (формат: `postgresql://user:pass@host/db`)

#### 3.2 Создать Web Service для Backend

1. **В Render Dashboard:**
   - New → Web Service
   - Connect repository: `telepets-backend`
   - Name: `telepets-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Настроить Environment Variables:**
   ```
   ENVIRONMENT=production
   DATABASE_URL=<скопированный Internal Database URL>
   SECRET_KEY=<генерируем случайный ключ>
   TELEGRAM_BOT_TOKEN=<токен бота>
   API_BASE_URL=https://telepets-api.onrender.com
   RUN_MIGRATIONS_ON_STARTUP=true
   SKIP_DB_ON_STARTUP=false
   HF_API_TOKEN=<токен Hugging Face>
   OPENAI_API_KEY=<если используется>
   
   # CORS для GitHub Pages
   CORS_ORIGINS=https://ваш-username.github.io
   ```

3. **Настроить Health Check Path:**
   - Health Check Path: `/monitoring/health`

#### 3.3 (Опционально) Отдельный сервис для Telegram Bot

1. **Вариант A: В том же сервисе (проще):**
   - Запускать бота в фоновом режиме вместе с FastAPI
   - Использовать supervisor или asyncio tasks

2. **Вариант B: Отдельный сервис (лучше):**
   - New → Web Service
   - Name: `telepets-bot`
   - Start Command: `python bot.py`
   - Environment Variables: `TELEGRAM_BOT_TOKEN`, `API_PUBLIC_URL`

### Этап 4: Настройка Telegram WebApp

1. **Открыть @BotFather в Telegram:**

2. **Установить WebApp URL:**
   ```
   /setmenubutton
   @ваш_бот_username
   Играть 🎮
   https://ваш-username.github.io/telepets-webapp/
   ```

3. **Настроить команды:**
   ```
   /setcommands
   start - Запустить игру
   help - Помощь
   profile - Профиль
   pets - Мои питомцы
   ```

4. **Настроить inline mode (опционально):**
   ```
   /setinline
   ```

### Этап 5: Обновление кода для production

#### 5.1 Backend: CORS настройки

```python:telepets-platform/backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "https://ваш-username.github.io",
        "https://telepets.onrender.com",  # если используете
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 5.2 Frontend: API клиент

```typescript:telepets-platform/frontends/webapp/src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'https://telepets-api.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // увеличить для холодного старта Render
});
```

#### 5.3 Frontend: Telegram WebApp SDK

```typescript:telepets-platform/frontends/webapp/src/lib/telegram.ts
// Инициализация Telegram WebApp SDK
const tg = window.Telegram?.WebApp;

export function initTelegramWebApp() {
  if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Получаем initData для авторизации
    const initData = tg.initData;
    const user = tg.initDataUnsafe?.user;
    
    return { initData, user };
  }
  return null;
}
```

### Этап 6: Тестирование

#### 6.1 Локальное тестирование перед деплоем

1. **Билд фронтендов:**
   ```bash
   cd telepets-platform/frontends/webapp
   npm run build
   
   cd ../games
   npm run build
   ```

2. **Проверка билдов:**
   ```bash
   npx serve dist
   ```

3. **Тестирование backend:**
   ```bash
   cd telepets-platform/backend
   export DATABASE_URL="sqlite:///./test.db"
   uvicorn main:app --reload
   ```

#### 6.2 Production тестирование

1. **Проверить Backend:**
   - Открыть https://telepets-api.onrender.com/docs
   - Протестировать /monitoring/health
   - Проверить подключение к БД

2. **Проверить Frontend:**
   - Открыть https://ваш-username.github.io/telepets-webapp/
   - Проверить загрузку ассетов
   - Проверить API запросы в DevTools

3. **Проверить Telegram WebApp:**
   - Открыть бота в Telegram
   - Нажать кнопку Menu
   - Проверить работу приложения

### Этап 7: Мониторинг и поддержка

1. **Настроить UptimeRobot:**
   - Мониторинг: https://telepets-api.onrender.com/health
   - Интервал: 5 минут
   - Уведомления: Telegram/Email

2. **Настроить логирование:**
   - Render Dashboard → Logs
   - Настроить алерты

3. **Backup базы данных:**
   - Render автоматически делает снэпшоты
   - Дополнительно: еженедельный экспорт через скрипт

---

## 🔧 Альтернативные платформы

### Cloudflare Pages (вместо GitHub Pages)

**Преимущества:**
- ✅ Глобальный CDN
- ✅ Неограниченный bandwidth
- ✅ Быстрее GitHub Pages
- ✅ Бесплатные custom domains

**Настройка:**
1. Подключить Git репозиторий
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables: `VITE_API_URL`

### Railway (вместо Render)

**Преимущества:**
- ✅ $5 бесплатных кредитов в месяц
- ✅ Без cold start
- ✅ Проще настройка

**Недостатки:**
- ⚠️ Меньше free tier чем Render

### Vercel (для фронтенда)

**Преимущества:**
- ✅ Мгновенный деплой
- ✅ Preview deployments
- ✅ Edge functions

---

## 📊 Сравнение вариантов

| Платформа | Backend | Frontend | БД | SSL | Cold Start | Лимиты |
|-----------|---------|----------|-----|-----|-----------|--------|
| **Render + GitHub Pages** | ✅ | ✅ | ✅ | ✅ | 30-60s | 750h/мес |
| **Render All-in-One** | ✅ | ✅ | ✅ | ✅ | 30-60s | 750h/мес |
| **Railway + Cloudflare** | ✅ | ✅ | ✅ | ✅ | нет | $5/мес |
| **Vercel + Render** | ❌ | ✅ | 📦 | ✅ | 5-10s | 100GB/мес |

---

## 🎯 Финальная рекомендация

**Для вашего случая рекомендую:**

1. **Frontend (WebApp + Games)** → **GitHub Pages**
   - Бесплатно
   - Вы уже использовали
   - Надёжно для статики

2. **Backend** → **Render Web Service**
   - Бесплатно 750 часов
   - Автодеплой из Git
   - PostgreSQL включён

3. **Database** → **Render PostgreSQL**
   - Бесплатно 90 дней (потом можно пересоздать)
   - Managed service

4. **Telegram Bot** → **В том же Render сервисе что и Backend**
   - Экономия ресурсов
   - Проще управление

**Общая стоимость: $0/месяц** 🎉

---

## 📝 Следующие шаги

1. ✅ Прочитать этот план
2. ⬜ Создать репозитории на GitHub
3. ⬜ Настроить Render аккаунт
4. ⬜ Следовать пошаговой инструкции
5. ⬜ Протестировать в Telegram

**Готовы начать деплой?** 🚀

