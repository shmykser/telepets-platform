# 🚀 Пошаговая инструкция по деплою Telepets Platform

> **Время выполнения:** ~30-60 минут  
> **Стоимость:** $0 (бесплатные тарифы)  
> **Сложность:** Средняя

---

## 📋 Предварительные требования

- [x] GitHub аккаунт
- [x] Render аккаунт (зарегистрироваться на [render.com](https://render.com))
- [x] Telegram бот (создан через @BotFather)
- [x] Git установлен локально
- [x] Node.js 18+ установлен
- [x] Python 3.11+ установлен

---

## 🎯 Шаг 1: Подготовка кода

### 1.1 Создать `.env` файл для локальной разработки

```bash
cd telepets-platform/backend
cp ../infra/env/env.prod .env
```

Отредактировать `.env`:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
HF_API_TOKEN=ваш_huggingface_токен  # опционально
SECRET_KEY=сгенерируйте_случайный_ключ_32_символа
```

**Генерация SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 1.2 Обновить конфигурацию фронтенда

Создать файл `telepets-platform/frontends/webapp/src/config/api.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV 
    ? 'http://127.0.0.1:3000' 
    : 'https://telepets-api.onrender.com');

export const GAMES_BASE_URL = import.meta.env.VITE_GAMES_URL || 
  (import.meta.env.DEV 
    ? 'http://127.0.0.1:3002' 
    : 'https://ваш-username.github.io/telepets-games');
```

### 1.3 Тестовая сборка локально

```bash
# WebApp
cd telepets-platform/frontends/webapp
npm install
npm run build

# Games
cd ../games
npm install
npm run build

# Проверить что dist/ папки созданы
ls -la dist/
```

---

## 🎯 Шаг 2: Настройка GitHub репозиториев

### Вариант A: Три отдельных репозитория (РЕКОМЕНДУЕТСЯ)

#### 2.1 Создать репозитории на GitHub:

1. `telepets-webapp` - для React приложения
2. `telepets-games` - для Phaser игр  
3. `telepets-backend` - для FastAPI backend

#### 2.2 Настроить репозиторий WebApp

```bash
cd telepets-platform/frontends/webapp

# Инициализация Git (если еще не сделано)
git init
git add .
git commit -m "Initial commit: WebApp"

# Добавить remote
git remote add origin https://github.com/ваш-username/telepets-webapp.git
git branch -M main
git push -u origin main
```

#### 2.3 Настроить GitHub Pages для WebApp

1. Открыть: `https://github.com/ваш-username/telepets-webapp/settings/pages`
2. Source: `Deploy from a branch`
3. Branch: выбрать `gh-pages` (создастся после первого деплоя)

#### 2.4 Создать GitHub Action для автодеплоя

Создать файл `.github/workflows/deploy-pages.yml` в `telepets-webapp`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          VITE_API_URL: https://telepets-api.onrender.com
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 2.5 Обновить vite.config.ts для GitHub Pages

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/', // используйте '/telepets-webapp/' если не custom domain
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
```

#### 2.6 Повторить для Games репозитория

Аналогично создать `telepets-games` репозиторий и настроить деплой.

**Важно:** В `vite.config.js` для Games:
```javascript
export default defineConfig({
  base: '/', // или '/telepets-games/'
  // ... остальное
})
```

### Вариант B: Монорепозиторий (альтернатива)

<details>
<summary>Развернуть инструкции для монорепозитория</summary>

Создать один репозиторий `telepets-platform` и использовать GitHub Actions с фильтрацией путей:

```yaml
name: Deploy All

on:
  push:
    branches: [ main ]

jobs:
  deploy-webapp:
    if: contains(github.event.head_commit.modified, 'frontends/webapp')
    # ... деплой webapp
  
  deploy-games:
    if: contains(github.event.head_commit.modified, 'frontends/games')
    # ... деплой games
```

</details>

---

## 🎯 Шаг 3: Настройка Backend на Render

### 3.1 Создать PostgreSQL базу данных

1. Открыть [Render Dashboard](https://dashboard.render.com/)
2. Нажать **"New +"** → **"PostgreSQL"**
3. Заполнить форму:
   - **Name:** `telepets-db`
   - **Database:** `telepets`
   - **User:** `telepets`
   - **Region:** выбрать ближайший (Frankfurt для Европы)
   - **Plan:** `Free`
4. Нажать **"Create Database"**
5. ⏳ Подождать ~2 минуты пока БД создастся
6. 📋 Скопировать **"Internal Database URL"** (понадобится дальше)

**Формат URL:**
```
postgresql://telepets:пароль@dpg-xxxxx-a/telepets
```

### 3.2 Подготовить Backend репозиторий

```bash
cd telepets-platform/backend

# Инициализация Git
git init
git add .
git commit -m "Initial commit: Backend"

# Добавить remote
git remote add origin https://github.com/ваш-username/telepets-backend.git
git branch -M main
git push -u origin main
```

### 3.3 Создать Web Service на Render

1. **New +** → **"Web Service"**
2. **Connect repository:** выбрать `telepets-backend`
3. Заполнить форму:

| Поле | Значение |
|------|----------|
| **Name** | `telepets-api` |
| **Region** | тот же что у БД (Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | оставить пустым |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

4. **Advanced Settings** → **Environment Variables:**

Добавить переменные (кликнуть "Add Environment Variable"):

```
ENVIRONMENT=production
DATABASE_URL=<скопированный Internal Database URL из шага 3.1>
SECRET_KEY=<сгенерированный ключ из шага 1.1>
TELEGRAM_BOT_TOKEN=<ваш токен от BotFather>
API_BASE_URL=https://telepets-api.onrender.com
RUN_MIGRATIONS_ON_STARTUP=true
SKIP_DB_ON_STARTUP=false
HF_API_TOKEN=<ваш Hugging Face токен (опционально)>
API_HOST=0.0.0.0
API_PORT=$PORT
```

5. **Advanced Settings** → **Health Check Path:**
   ```
   /monitoring/health
   ```

6. Нажать **"Create Web Service"**

7. ⏳ Подождать ~5-10 минут первого деплоя

### 3.4 Проверить деплой Backend

1. Дождаться статуса "Live" в Render Dashboard
2. Открыть URL: `https://telepets-api.onrender.com/docs`
3. Проверить Swagger UI загрузился
4. Протестировать endpoint: `GET /monitoring/health`

**Ожидаемый ответ:**
```json
{
  "status": "healthy",
  "version": "1.1.0",
  "timestamp": "2024-..."
}
```

### 3.5 (Опционально) Настроить кастомный домен

1. В Render сервисе → **Settings** → **Custom Domains**
2. Добавить домен: `api.yourdomain.com`
3. Настроить CNAME запись в DNS:
   ```
   api.yourdomain.com → telepets-api.onrender.com
   ```

---

## 🎯 Шаг 4: Обновление CORS и финальная настройка

### 4.1 Обновить CORS в Backend

После деплоя фронтенда на GitHub Pages, узнать URL и обновить `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://ваш-username.github.io",  # ← добавить ваш GitHub Pages URL
        "https://telepets-api.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Закоммитить и запушить изменения:
```bash
git add backend/main.py
git commit -m "Update CORS for GitHub Pages"
git push
```

Render автоматически задеплоит изменения.

### 4.2 Обновить API URL в фронтенде

В `telepets-webapp` репозитории, обновить `.github/workflows/deploy-pages.yml`:

```yaml
- name: Build
  env:
    VITE_API_URL: https://telepets-api.onrender.com  # ← ваш реальный URL
  run: npm run build
```

### 4.3 Деплой обновлений

```bash
cd telepets-platform/frontends/webapp
git add .
git commit -m "Configure production API URL"
git push
```

GitHub Action автоматически задеплоит на Pages.

---

## 🎯 Шаг 5: Настройка Telegram WebApp

### 5.1 Получить URL фронтенда

После деплоя на GitHub Pages, URL будет:
```
https://ваш-username.github.io/telepets-webapp/
```

Или если custom domain:
```
https://yourapp.com/
```

### 5.2 Настроить WebApp в BotFather

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. Отправить команду:
   ```
   /mybots
   ```
3. Выбрать вашего бота
4. Нажать **"Bot Settings"** → **"Menu Button"**
5. Отправить **URL WebApp:**
   ```
   https://ваш-username.github.io/telepets-webapp/
   ```
6. Отправить **название кнопки:**
   ```
   🎮 Играть
   ```

### 5.3 Настроить команды бота

```
/setcommands

Выберите бота → отправьте список команд:

start - Запустить игру
help - Помощь по игре
profile - Мой профиль
pets - Мои питомцы
market - Маркетплейс
```

### 5.4 Настроить описание бота

```
/setdescription
[выбрать бота]

Telepets - современный цифровой питомец в Telegram! 
🥚 Выращивай питомца с яйца
🎮 Играй в мини-игры
💰 Торгуй на маркетплейсе
```

```
/setabouttext
[выбрать бота]

Твой виртуальный питомец в Telegram! Ухаживай, играй, развивайся!
```

### 5.5 Настроить изображение бота (опционально)

```
/setuserpic
[выбрать бота]
[загрузить квадратное изображение 512x512]
```

---

## 🎯 Шаг 6: Настройка Telegram Bot сервиса

### Вариант A: Bot внутри Backend (проще)

Обновить `backend/main.py` для запуска бота:

```python
import asyncio
from telegram_client import bot, dp

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Запуск Telepets API {APP_VERSION}")
    
    # ... существующий код ...
    
    # Запуск Telegram бота
    asyncio.create_task(dp.start_polling(bot))
    logger.info("Telegram бот запущен")
    
    yield
    
    # Shutdown
    await bot.session.close()
    logger.info("Выключение Telepets API")
```

### Вариант B: Отдельный сервис на Render (рекомендуется)

1. **New +** → **"Background Worker"**
2. Настройки:
   - **Name:** `telepets-bot`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python bot.py`
3. Environment Variables - те же что у backend
4. Добавить переменную:
   ```
   API_PUBLIC_URL=https://telepets-api.onrender.com
   ```

---

## 🎯 Шаг 7: Тестирование

### 7.1 Проверить Backend

1. ✅ Открыть https://telepets-api.onrender.com/docs
2. ✅ Протестировать `/monitoring/health`
3. ✅ Протестировать `/monitoring/metrics`
4. ✅ Создать тестового питомца через Swagger UI:
   - `POST /create`
   - Параметры: `user_id=123456`, `name=TestPet`

### 7.2 Проверить Frontend

1. ✅ Открыть https://ваш-username.github.io/telepets-webapp/
2. ✅ Проверить консоль браузера (F12) на ошибки
3. ✅ Проверить Network tab - запросы к API должны идти на `telepets-api.onrender.com`

### 7.3 Проверить Telegram WebApp

1. ✅ Открыть бота в Telegram
2. ✅ Нажать команду `/start`
3. ✅ Нажать кнопку Menu **"🎮 Играть"**
4. ✅ Проверить что WebApp открывается внутри Telegram
5. ✅ Проверить работу функционала:
   - Создание питомца
   - Кормление
   - Игры
   - Маркетплейс

### 7.4 Проверить Mobile версию

1. ✅ Открыть Telegram на смартфоне (iOS/Android)
2. ✅ Повторить тесты из 7.3
3. ✅ Проверить адаптивность интерфейса
4. ✅ Проверить жесты и тач-события

---

## 🎯 Шаг 8: Мониторинг и поддержка

### 8.1 Настроить UptimeRobot (бесплатный мониторинг)

1. Зарегистрироваться на [uptimerobot.com](https://uptimerobot.com)
2. **Add New Monitor:**
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Telepets API
   - **URL:** `https://telepets-api.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
3. Настроить алерты:
   - Email
   - Telegram (через интеграцию)

**Зачем?** Предотвратить cold start на Render - каждые 5 минут будет пинг.

### 8.2 Настроить логи в Render

1. Открыть ваш сервис в Render Dashboard
2. Перейти в **"Logs"**
3. Включить **"Persistent Logs"** (платно) или смотреть в реальном времени

### 8.3 Backup базы данных

**Автоматический:**
Render делает ежедневные снэпшоты (хранятся 7 дней на free tier)

**Ручной экспорт:**
```bash
# Установить pg_dump
# Экспортировать БД
pg_dump <External Database URL> > backup.sql

# Или через Render Dashboard:
# Database → Actions → Download Snapshot
```

### 8.4 Настроить GitHub Secrets для CI/CD

В репозитории `telepets-webapp` → **Settings** → **Secrets and variables** → **Actions**:

Добавить секреты:
```
VITE_API_URL=https://telepets-api.onrender.com
```

---

## 📊 Проверка статуса деплоя

### ✅ Чеклист финальной проверки

- [ ] Backend на Render: https://telepets-api.onrender.com/docs работает
- [ ] PostgreSQL подключена и миграции применены
- [ ] Frontend WebApp на GitHub Pages открывается
- [ ] Frontend Games на GitHub Pages открывается
- [ ] Telegram бот отвечает на /start
- [ ] Telegram WebApp открывается через Menu Button
- [ ] API запросы проходят (проверить в DevTools)
- [ ] CORS настроен правильно
- [ ] Telegram авторизация работает
- [ ] Создание питомца работает
- [ ] Мини-игры запускаются
- [ ] Маркетплейс доступен
- [ ] UptimeRobot мониторит сервис

---

## 🐛 Troubleshooting

### Проблема: Backend не запускается на Render

**Симптомы:** Deploy failed, ошибка в логах

**Решения:**
1. Проверить `requirements.txt` - все зависимости указаны?
2. Проверить `DATABASE_URL` в Environment Variables
3. Проверить логи: Dashboard → ваш сервис → Logs
4. Попробовать локально:
   ```bash
   export DATABASE_URL="sqlite:///./test.db"
   uvicorn main:app
   ```

### Проблема: Frontend не видит Backend (CORS ошибка)

**Симптомы:** Ошибка в консоли `CORS policy: No 'Access-Control-Allow-Origin'`

**Решения:**
1. Проверить CORS в `backend/main.py`
2. Убедиться что GitHub Pages URL добавлен в `allow_origins`
3. Проверить что Backend задеплоен с новыми изменениями
4. Hard refresh (Ctrl+Shift+R) на фронтенде

### Проблема: Telegram WebApp не открывается

**Симптомы:** При нажатии Menu Button ничего не происходит

**Решения:**
1. Проверить URL в BotFather (/setmenubutton)
2. Проверить что GitHub Pages деплой завершен
3. Открыть URL напрямую в браузере - работает?
4. Проверить HTTPS - GitHub Pages должен использовать HTTPS

### Проблема: Cold start на Render (долгая загрузка)

**Симптомы:** Первый запрос занимает 30-60 секунд

**Решения:**
1. Настроить UptimeRobot (пинг каждые 5 минут)
2. Увеличить timeout на фронтенде:
   ```typescript
   axios.create({ timeout: 60000 })
   ```
3. Показать loading spinner пользователю
4. Рассмотреть платный план Render ($7/мес - без cold start)

### Проблема: GitHub Pages показывает 404

**Симптомы:** https://username.github.io/telepets-webapp/ → 404

**Решения:**
1. Проверить Settings → Pages включен
2. Проверить Branch: должен быть `gh-pages`
3. Проверить что GitHub Action выполнилась успешно
4. Подождать 5-10 минут (иногда DNS кеширование)
5. Проверить наличие файлов в branch `gh-pages`

---

## 🎉 Поздравляем!

Ваше приложение Telepets Platform успешно опубликовано в интернет!

**Что дальше?**
- 📱 Поделиться ботом с друзьями
- 📊 Мониторить метрики через `/monitoring/metrics`
- 🐛 Исправлять баги через GitHub Issues
- ✨ Добавлять новые фичи
- 📈 Масштабироваться при росте пользователей

**Полезные ссылки:**
- Backend: https://telepets-api.onrender.com
- Swagger API: https://telepets-api.onrender.com/docs
- Frontend: https://ваш-username.github.io/telepets-webapp/
- Render Dashboard: https://dashboard.render.com
- GitHub Actions: https://github.com/ваш-username/telepets-webapp/actions

**Нужна помощь?**
- Telegram: @your_support_channel
- GitHub Issues: https://github.com/ваш-username/telepets-platform/issues
- Документация: README.md

---

**Удачи с вашим проектом! 🚀🐾**

