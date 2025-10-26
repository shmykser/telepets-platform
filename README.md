# 🐾 Telepets Platform

> Современный виртуальный питомец для Telegram WebApp с мини-играми

**Telepets Platform** — это полнофункциональная экосистема тамагочи-игры в Telegram, построенная на принципе **Mono-Backend + Multi-Frontend**:

- 🎮 **Виртуальный питомец** — выращивай с яйца до взрослой особи
- 🕹️ **Мини-игры** — зарабатывай монеты и развлекай питомца
- 💰 **Экономическая система** — покупай, продавай, торгуй на маркетплейсе
- 🤖 **AI-генерация** — уникальные изображения питомцев через Hugging Face
- 📱 **Telegram Integration** — полная интеграция с Telegram WebApp

## 🏗️ Технологический стек

- **Backend:** FastAPI + Python 3.11 + SQLAlchemy + PostgreSQL
- **Frontend WebApp:** React 18 + TypeScript + Vite + TailwindCSS
- **Frontend Games:** Phaser 3 + JavaScript
- **Deployment:** Render (Backend) + GitHub Pages (Frontend)
- **Bot:** Aiogram 3 для уведомлений

## 🏗️ Архитектура

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Telegram WebApp                             │
│                                                                          │
│  ┌───────────────┐     iframe      ┌────────────────────┐                 │
│  │ React WebApp  │ ─────────────→  │  Phaser MiniGame   │                 │
│  │ (Telepets UI) │ ← postMessage ─ │  (Egg Defense etc) │                 │
│  └───────────────┘                 └────────────────────┘                 │
│          │                                    │                           │
│          ▼                                    ▼                           │
│        fetch                                 fetch                        │
│          │                                    │                           │
└──────────┼────────────────────────────────────┼───────────────────────────┘
           ▼                                    ▼
       ┌──────────────────────────────────────────────────────┐
       │                    FastAPI Backend                   │
       │    /api/pets  /api/economy  /api/games/result         │
       │                                                      │
       │  ┌──────────┐  ┌──────────┐  ┌────────────┐          │
       │  │ Users    │  │ Pets     │  │ GameResult │          │
       │  └──────────┘  └──────────┘  └────────────┘          │
       │                PostgreSQL Database                   │
       └──────────────────────────────────────────────────────┘
```

## 📁 Структура проекта

```
telepets-platform/
├── backend/                        # Единый бэкенд (FastAPI)
│   ├── api/                        # Эндпоинты
│   ├── core/                       # Базовые модули системы
│   ├── models/                     # SQLAlchemy модели
│   ├── schemas/                    # Pydantic схемы
│   ├── services/                   # Бизнес-логика
│   ├── tasks/                      # Фоновые процессы
│   └── main.py                     # Точка входа
│
├── frontends/
│   ├── webapp/                     # React-приложение (Telepets UI)
│   │   ├── src/
│   │   │   ├── pages/              # Страницы приложения
│   │   │   ├── components/         # React компоненты
│   │   │   ├── hooks/              # Custom hooks
│   │   │   └── lib/                # Утилиты и API клиент
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── games/                      # Phaser-проект
│       ├── src/
│       │   ├── scenes/             # Игровые сцены
│       │   ├── systems/            # Игровые системы
│       │   ├── objects/            # Игровые объекты
│       │   └── main.js             # Точка входа
│       ├── vite.config.js
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml          # Единый запуск всех сервисов
│   ├── nginx.conf                  # Reverse Proxy
│   ├── env/                        # Переменные окружения
│   └── deploy/                     # Скрипты деплоя
│
└── README.md
```

## ⚡ Быстрый старт

### 🏠 Локальная разработка (5 минут)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/telepets-platform.git
cd telepets-platform

# 2. Настроить backend
cd backend
pip install -r requirements.txt
cp ../.env.production.example .env
# Отредактируйте .env с вашим TELEGRAM_BOT_TOKEN

# 3. Применить миграции
alembic upgrade head

# 4. Запустить backend
uvicorn main:app --reload --port 3000

# 5. В новом терминале - запустить webapp
cd frontends/webapp
npm install && npm run dev

# 6. В новом терминале - запустить games
cd frontends/games
npm install && npm run dev
```

**Готово!** Откройте:
- 🌐 WebApp: http://localhost:3001
- 🎮 Games: http://localhost:3002
- 📚 API Docs: http://localhost:3000/docs

📖 **Подробнее:** [QUICK_START.md](QUICK_START.md)

### ☁️ Production деплой (30 минут)

Бесплатный деплой на **Render** (backend) + **GitHub Pages** (frontend):

1. 📖 Прочитайте план: [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)
2. 🚀 Следуйте инструкции: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Результат:** Полностью рабочее приложение в Telegram на смартфоне ($0/месяц)

## 📁 Структура проекта

```
telepets-platform/
├── backend/                    # FastAPI Backend
│   ├── api/                   # REST API endpoints
│   ├── models.py              # SQLAlchemy модели (User, Pet, Transaction...)
│   ├── services/              # Бизнес-логика (auction, stages, profiles)
│   ├── generator/             # AI генерация изображений (Hugging Face)
│   ├── alembic/               # Миграции базы данных
│   ├── main.py                # Точка входа FastAPI
│   └── requirements.txt
│
├── frontends/
│   ├── webapp/                # React WebApp (основное приложение)
│   │   ├── src/
│   │   │   ├── pages/         # Страницы (Dashboard, Market, Profile...)
│   │   │   ├── components/    # UI компоненты
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── lib/           # API клиент, утилиты
│   │   └── package.json
│   │
│   └── games/                 # Phaser Games (мини-игры)
│       ├── src/
│       │   ├── scenes/        # Игровые сцены (EggDefense, PetThief...)
│       │   ├── systems/       # Игровые системы (AI, Combat, Economy...)
│       │   └── objects/       # Игровые объекты (Pet, Enemy, Chest...)
│       └── package.json
│
├── infra/                     # Infrastructure
│   ├── docker-compose.yml     # Docker конфигурация (для локальной разработки)
│   └── nginx.conf             # Nginx reverse proxy
│
├── DEPLOYMENT_PLAN.md         # 📖 Подробный план деплоя
├── DEPLOYMENT_GUIDE.md        # 🚀 Пошаговая инструкция
├── QUICK_START.md             # ⚡ Быстрый старт
└── README.md                  # 📄 Этот файл
```

## 🔗 API Endpoints

### Аутентификация
- `POST /api/auth/validate` - Валидация Telegram токена
- `POST /api/auth/refresh` - Обновление JWT токена

### Питомцы
- `GET /api/pets` - Список питомцев пользователя
- `POST /api/pets` - Создание нового питомца
- `GET /api/pets/{pet_id}` - Детали питомца

### Игры
- `POST /api/games/result` - Отправка результата игры
- `GET /api/games/history` - История игр пользователя

### Экономика
- `GET /api/economy/balance` - Баланс пользователя
- `POST /api/economy/transaction` - Транзакция

## 🔒 Безопасность

- Авторизация только через Telegram `initData`
- JWT-токен с TTL ≤ 15 минут
- HTTPS между всеми сервисами
- CORS разрешён только для доверенных доменов

## 🧰 Технологический стек

| Компонент | Технология | Описание |
|-----------|-------------|----------|
| Backend | FastAPI + Python 3.11 | API сервер |
| Database | PostgreSQL 15 | Основная БД |
| Cache | Redis 7 | Кэширование |
| WebApp | React 18 + TypeScript | UI приложения |
| MiniGames | Phaser 3 + JavaScript | Игровой движок |
| Proxy | Nginx | Reverse proxy |
| Container | Docker + Docker Compose | Контейнеризация |

## 📊 Мониторинг

- Health check: `GET /health`
- API документация: `GET /docs` (Swagger)
- Логи доступны через Docker: `docker-compose logs -f`

## 🌐 Деплой в Production

### Рекомендуемая архитектура (бесплатно):

```
Backend (FastAPI) → Render Web Service + PostgreSQL
Frontend (React) → GitHub Pages
Games (Phaser)    → GitHub Pages
Telegram Bot      → Render Background Worker
```

**Стоимость:** $0/месяц (в рамках free tier)

### Пошаговые инструкции:

1. **📋 План деплоя:** [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)
   - Сравнение платформ
   - Архитектурные решения
   - Альтернативные варианты

2. **🚀 Инструкция по деплою:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
   - Настройка Render
   - Настройка GitHub Pages
   - Настройка Telegram WebApp
   - Troubleshooting

3. **⚡ Быстрый старт:** [QUICK_START.md](QUICK_START.md)
   - Локальный запуск
   - Краткая схема деплоя

### Автоматический деплой:

- ✅ **Backend:** Render автоматически деплоит при push в main
- ✅ **Frontend:** GitHub Actions деплоит на Pages при push
- ✅ **База данных:** Автоматические миграции при старте backend

## 🎮 Основные функции

### Уход за питомцем
- 🥚 **Яйцо** → 👶 **Детёныш** → 🐾 **Взрослый питомец**
- ❤️ Система здоровья и настроения
- 🍖 Кормление и уход
- 📊 Отслеживание статистики

### Мини-игры
- 🛡️ **Egg Defense** - Tower Defense защита яйца
- 🏃 **Pet Thief** - Stealth игра с процедурной генерацией
- 🎯 Другие игры (в разработке)

### Экономика
- 💰 Внутриигровая валюта (монеты)
- 🏪 Маркетплейс и аукционы
- 💎 Покупка специальных предметов
- ⭐ Поддержка Telegram Stars

### AI-Генерация
- 🎨 Уникальные изображения питомцев через Hugging Face
- 🖼️ Разные стили: фотореализм, научный, дикая природа
- 📸 Кэширование изображений

### Социальные функции
- 👥 Система профилей
- 🎭 Анонимный режим
- 🏆 Лидерборды
- 📊 Статистика игроков

## 🔒 Безопасность

- ✅ Авторизация через Telegram `initData`
- ✅ JWT токены с коротким TTL
- ✅ Валидация всех входных данных
- ✅ Rate limiting на API
- ✅ CORS защита
- ✅ HTTPS обязателен в production

## 📊 Мониторинг

- **Health Check:** `/monitoring/health`
- **Metrics:** `/monitoring/metrics`
- **API Docs:** `/docs` (Swagger UI)
- **Logs:** Доступны через Render Dashboard

## 🛠️ Разработка

### Создание новой фичи

1. Создайте branch: `git checkout -b feature/new-feature`
2. Внесите изменения
3. Запустите тесты (если есть)
4. Commit: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/new-feature`
6. Создайте Pull Request

### Стиль кода

- **Python:** PEP 8, type hints обязательны
- **TypeScript:** ESLint конфигурация в проекте
- **Commits:** Conventional Commits (feat, fix, docs, chore...)

## 🐛 Известные проблемы

- ⚠️ Render free tier: cold start 30-60s после 15 мин бездействия
- ⚠️ PostgreSQL free tier: удаляется через 90 дней (требует пересоздания)
- ⚠️ GitHub Pages: лимит 100GB bandwidth в месяц

**Решения в:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Troubleshooting

## 📚 Документация

| Документ | Назначение |
|----------|------------|
| [README.md](README.md) | Обзор проекта (этот файл) |
| [QUICK_START.md](QUICK_START.md) | Быстрый старт для разработки |
| [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) | Детальный план деплоя |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Пошаговая инструкция деплоя |
| [ENDPOINTS_GUIDE.md](frontends/ENDPOINTS_GUIDE.md) | Описание API endpoints |

## 🤝 Contributing

Мы приветствуем вклад в проект! Пожалуйста:

1. Fork репозитория
2. Создайте feature branch
3. Следуйте стилю кода проекта
4. Добавьте тесты (если применимо)
5. Создайте Pull Request с подробным описанием

## 📞 Поддержка

**Нужна помощь?**
- 📖 Читайте документацию выше
- 🐛 [GitHub Issues](https://github.com/your-username/telepets-platform/issues)
- 💬 Telegram: @your_support_channel

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) для деталей.

---

<div align="center">

**Telepets Platform** — современный виртуальный питомец в Telegram! 🐾

Made with ❤️ by Telepets Team

[🌐 Website](https://your-site.com) • [📱 Telegram Bot](https://t.me/your_bot) • [📖 Docs](https://docs.your-site.com)

</div>
