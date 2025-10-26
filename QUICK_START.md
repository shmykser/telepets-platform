# ⚡ Быстрый старт Telepets Platform

> 🚀 Запустите проект за 5 минут локально или за 30 минут в production

---

## 🎯 Выберите ваш сценарий:

### 🏠 [Локальная разработка](#локальная-разработка)
Запуск на своем компьютере для разработки и тестирования

### ☁️ [Production деплой](#production-деплой)
Публикация в интернет (Render + GitHub Pages)

---

## 🏠 Локальная разработка

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/your-username/telepets-platform.git
cd telepets-platform
```

### Шаг 2: Настройка Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv

# Активировать (Windows)
venv\Scripts\activate

# Активировать (Linux/Mac)
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Создать .env файл
cp ../.env.production.example .env

# Отредактировать .env - минимальные настройки:
# TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
# SECRET_KEY=любая_случайная_строка
# DATABASE_URL=sqlite:///./telepets_dev.db
```

### Шаг 3: Применить миграции

```bash
# Применить миграции базы данных
alembic upgrade head
```

### Шаг 4: Запустить Backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 3000
```

Откройте: http://127.0.0.1:3000/docs

### Шаг 5: Запустить Frontend WebApp

```bash
# В новом терминале
cd frontends/webapp

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

Откройте: http://127.0.0.1:3001

### Шаг 6: Запустить Games

```bash
# В новом терминале
cd frontends/games

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

Откройте: http://127.0.0.1:3002

### Шаг 7: Тестирование

1. Откройте http://127.0.0.1:3001 в браузере
2. Создайте тестового питомца через UI
3. Попробуйте игры: http://127.0.0.1:3001 → кнопка "Игры"

✅ **Готово!** Проект запущен локально.

---

## ☁️ Production деплой

### Быстрый путь (30 минут):

1. **Прочитайте план:** [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)
2. **Следуйте инструкции:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Краткая схема:

```
1. Создать Render аккаунт → создать PostgreSQL БД
   ↓
2. Создать Web Service на Render → подключить Git репозиторий backend
   ↓
3. Создать GitHub репозитории для frontends → настроить GitHub Actions
   ↓
4. Задеплоить фронтенды на GitHub Pages
   ↓
5. Настроить Telegram WebApp через @BotFather
   ↓
6. Протестировать в Telegram на смартфоне
```

### Что вам понадобится:

- ✅ GitHub аккаунт
- ✅ Render аккаунт (бесплатно)
- ✅ Telegram бот (создать через @BotFather)
- ✅ 30 минут времени

### Финальный результат:

- 🌐 Backend: `https://telepets-api.onrender.com`
- 🎮 Frontend: `https://your-username.github.io/telepets-webapp`
- 📱 Telegram WebApp: работает на смартфоне
- 💰 Стоимость: **$0/месяц** (бесплатные тарифы)

---

## 📚 Полная документация

| Документ | Описание |
|----------|----------|
| [README.md](README.md) | Обзор проекта и архитектура |
| [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) | Подробный план деплоя с вариантами |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Пошаговая инструкция деплоя |
| [QUICK_START.md](QUICK_START.md) | Этот файл - быстрый старт |

---

## 🐛 Проблемы?

**Backend не запускается:**
- Проверьте `.env` файл
- Проверьте что PostgreSQL/SQLite доступна
- Проверьте логи: `uvicorn main:app --reload --log-level debug`

**Frontend не подключается к Backend:**
- Проверьте CORS в `backend/main.py`
- Проверьте `VITE_API_URL` в frontend

**Telegram WebApp не работает:**
- Проверьте URL в @BotFather
- Проверьте что фронтенд задеплоен на HTTPS
- Проверьте консоль браузера (F12)

**Нужна помощь?**
- 📖 Читайте [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - там Troubleshooting раздел
- 🐛 Создайте Issue на GitHub
- 💬 Напишите в поддержку

---

## 🎉 Следующие шаги

После успешного запуска:

1. **Изучите код:**
   - Backend: `backend/` - FastAPI endpoints
   - Frontend: `frontends/webapp/` - React компоненты
   - Games: `frontends/games/` - Phaser сцены

2. **Добавьте функционал:**
   - Новые типы питомцев
   - Новые мини-игры
   - Систему достижений

3. **Деплойте изменения:**
   - Коммит → Push → автоматический деплой
   - GitHub Actions для фронтенда
   - Render auto-deploy для backend

**Удачи с проектом! 🚀🐾**

