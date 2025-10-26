# ✅ Чеклист деплоя Telepets Platform

> Используйте этот чеклист для отслеживания прогресса деплоя

---

## 📋 Подготовка (5 минут)

- [ ] Прочитать [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)
- [ ] Прочитать [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [ ] Зарегистрироваться на [Render](https://render.com)
- [ ] Иметь GitHub аккаунт
- [ ] Иметь Telegram бот (создать через @BotFather)

---

## 🔧 Локальное тестирование (опционально, 10 минут)

- [ ] Клонировать репозиторий
- [ ] Установить зависимости backend (`pip install -r requirements.txt`)
- [ ] Установить зависимости frontends (`npm install`)
- [ ] Создать `.env` с локальными настройками
- [ ] Применить миграции (`alembic upgrade head`)
- [ ] Запустить backend локально
- [ ] Запустить frontends локально
- [ ] Протестировать работу локально

---

## 🗄️ База данных (5 минут)

- [ ] Открыть [Render Dashboard](https://dashboard.render.com/)
- [ ] Создать PostgreSQL базу:
  - [ ] New → PostgreSQL
  - [ ] Name: `telepets-db`
  - [ ] Region: выбрать ближайший
  - [ ] Plan: Free
- [ ] Дождаться создания (~2 минуты)
- [ ] Скопировать **Internal Database URL**
- [ ] Сохранить URL в безопасное место

---

## 🔙 Backend на Render (10 минут)

- [ ] Подготовить backend репозиторий:
  - [ ] Создать GitHub репозиторий `telepets-backend`
  - [ ] Скопировать файлы из `telepets-platform/backend/`
  - [ ] Закоммитить и запушить
- [ ] Создать Web Service на Render:
  - [ ] New → Web Service
  - [ ] Подключить `telepets-backend` репозиторий
  - [ ] Name: `telepets-api`
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Настроить Environment Variables:
  - [ ] `ENVIRONMENT=production`
  - [ ] `DATABASE_URL=<Internal Database URL>`
  - [ ] `SECRET_KEY=<сгенерировать>`
  - [ ] `TELEGRAM_BOT_TOKEN=<ваш токен>`
  - [ ] `API_BASE_URL=https://telepets-api.onrender.com`
  - [ ] `RUN_MIGRATIONS_ON_STARTUP=true`
  - [ ] `SKIP_DB_ON_STARTUP=false`
  - [ ] `API_HOST=0.0.0.0`
  - [ ] `API_PORT=$PORT`
- [ ] Настроить Health Check Path: `/monitoring/health`
- [ ] Создать сервис
- [ ] Дождаться деплоя (~5-10 минут)
- [ ] Проверить: открыть `https://telepets-api.onrender.com/docs`
- [ ] Протестировать `/monitoring/health` endpoint

---

## 🎨 Frontend WebApp на GitHub Pages (10 минут)

- [ ] Подготовить webapp репозиторий:
  - [ ] Создать GitHub репозиторий `telepets-webapp`
  - [ ] Скопировать файлы из `telepets-platform/frontends/webapp/`
  - [ ] Скопировать `.github/workflows/deploy-github-pages.yml`
  - [ ] Обновить `vite.config.ts` (установить правильный `base`)
- [ ] Настроить GitHub Actions:
  - [ ] Открыть Settings → Secrets and variables → Actions
  - [ ] Добавить `VITE_API_URL=https://telepets-api.onrender.com`
- [ ] Настроить GitHub Pages:
  - [ ] Settings → Pages
  - [ ] Source: Deploy from a branch
  - [ ] Branch: `gh-pages` (создастся после первого деплоя)
- [ ] Закоммитить и запушить
- [ ] Дождаться GitHub Action (~3-5 минут)
- [ ] Проверить: открыть `https://ваш-username.github.io/telepets-webapp/`
- [ ] Проверить консоль браузера на ошибки

---

## 🎮 Frontend Games на GitHub Pages (10 минут)

- [ ] Повторить те же шаги что для WebApp:
  - [ ] Создать репозиторий `telepets-games`
  - [ ] Скопировать файлы из `frontends/games/`
  - [ ] Настроить GitHub Actions
  - [ ] Настроить GitHub Pages
  - [ ] Задеплоить
- [ ] Проверить: открыть `https://ваш-username.github.io/telepets-games/`

---

## 🔄 Обновление CORS (5 минут)

- [ ] В `telepets-backend` репозитории:
  - [ ] Открыть `main.py`
  - [ ] Добавить GitHub Pages URL в `allow_origins`:
    ```python
    allow_origins=[
        "http://localhost:3001",
        "https://ваш-username.github.io",  # ← добавить
        "https://telepets-api.onrender.com",
    ]
    ```
  - [ ] Закоммитить и запушить
- [ ] Дождаться автодеплоя на Render (~3-5 минут)

---

## 📱 Telegram WebApp (10 минут)

- [ ] Открыть [@BotFather](https://t.me/BotFather) в Telegram
- [ ] Настроить Menu Button:
  - [ ] `/mybots` → выбрать бота
  - [ ] Bot Settings → Menu Button
  - [ ] URL: `https://ваш-username.github.io/telepets-webapp/`
  - [ ] Текст кнопки: `🎮 Играть`
- [ ] Настроить команды:
  - [ ] `/setcommands`
  - [ ] Добавить команды:
    ```
    start - Запустить игру
    help - Помощь
    profile - Профиль
    pets - Мои питомцы
    market - Маркетплейс
    ```
- [ ] Настроить описание:
  - [ ] `/setdescription`
  - [ ] Добавить описание проекта
- [ ] Настроить короткое описание:
  - [ ] `/setabouttext`
  - [ ] Краткое описание

---

## 🤖 Telegram Bot (опционально, 5 минут)

### Вариант A: В том же сервисе что Backend
- [ ] Уже работает, если бот встроен в `main.py`
- [ ] Проверить логи Render на наличие "Telegram бот запущен"

### Вариант B: Отдельный Background Worker
- [ ] New → Background Worker на Render
- [ ] Name: `telepets-bot`
- [ ] Start Command: `python bot.py`
- [ ] Environment Variables: те же что у backend + `API_PUBLIC_URL`
- [ ] Создать и дождаться деплоя

---

## 🧪 Тестирование (10 минут)

### Backend
- [ ] Открыть `https://telepets-api.onrender.com/docs`
- [ ] Swagger UI загружается
- [ ] `/monitoring/health` возвращает 200 OK
- [ ] `/monitoring/metrics` возвращает метрики
- [ ] Создать тестового питомца через Swagger

### Frontend
- [ ] Открыть `https://ваш-username.github.io/telepets-webapp/`
- [ ] Страница загружается
- [ ] Нет ошибок в консоли (F12)
- [ ] API запросы проходят (проверить Network tab)

### Telegram WebApp - Desktop
- [ ] Открыть бота в Telegram (Desktop)
- [ ] `/start` - бот отвечает
- [ ] Кнопка Menu "🎮 Играть" видна
- [ ] При клике открывается WebApp
- [ ] WebApp работает корректно

### Telegram WebApp - Mobile
- [ ] Открыть бота в Telegram (iOS/Android)
- [ ] `/start` - бот отвечает
- [ ] Кнопка Menu "🎮 Играть" видна
- [ ] При клике открывается WebApp на весь экран
- [ ] Интерфейс адаптивный
- [ ] Создание питомца работает
- [ ] Кормление работает
- [ ] Игры запускаются
- [ ] Маркетплейс доступен

---

## 📊 Мониторинг (5 минут)

- [ ] Зарегистрироваться на [UptimeRobot](https://uptimerobot.com)
- [ ] Создать монитор:
  - [ ] Monitor Type: HTTP(s)
  - [ ] URL: `https://telepets-api.onrender.com/health`
  - [ ] Interval: 5 minutes
  - [ ] Alert: Email/Telegram
- [ ] Настроить алерты
- [ ] Проверить что мониторинг работает

---

## 🔒 Безопасность (5 минут)

- [ ] Проверить что `.env` не закоммичен в Git
- [ ] Проверить что `SECRET_KEY` надежный
- [ ] Проверить что `TELEGRAM_BOT_TOKEN` не утек
- [ ] Проверить CORS настройки
- [ ] Проверить что PostgreSQL password надежный
- [ ] Включить 2FA на GitHub
- [ ] Включить 2FA на Render

---

## 📚 Документация (5 минут)

- [ ] Создать `README.md` в каждом репозитории
- [ ] Добавить ссылки на production URLs
- [ ] Задокументировать environment variables
- [ ] Добавить troubleshooting секцию
- [ ] Обновить контакты для поддержки

---

## 🎉 Финальная проверка

- [ ] ✅ Backend работает: `https://telepets-api.onrender.com`
- [ ] ✅ WebApp работает: `https://ваш-username.github.io/telepets-webapp/`
- [ ] ✅ Games работают: `https://ваш-username.github.io/telepets-games/`
- [ ] ✅ Telegram бот отвечает
- [ ] ✅ Telegram WebApp открывается и работает
- [ ] ✅ Можно создать питомца
- [ ] ✅ Можно кормить питомца
- [ ] ✅ Игры запускаются
- [ ] ✅ Маркетплейс доступен
- [ ] ✅ Мониторинг настроен
- [ ] ✅ Документация обновлена

---

## 🎊 Поздравляем!

Ваш проект **Telepets Platform** успешно опубликован в интернет!

### Что дальше?

1. **Поделиться:** Пригласите друзей протестировать
2. **Мониторинг:** Следите за метриками и логами
3. **Улучшения:** Добавляйте новые фичи
4. **Backup:** Настройте регулярный backup БД
5. **Масштабирование:** При росте пользователей - переходите на платные тарифы

### Полезные ссылки:

- 📖 [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) - детальный план
- 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - полная инструкция
- ⚡ [QUICK_START.md](QUICK_START.md) - быстрый старт
- 📊 [Render Dashboard](https://dashboard.render.com)
- 🐱 [GitHub Actions](https://github.com/your-username/telepets-webapp/actions)

---

**Удачи с проектом! 🚀🐾**

