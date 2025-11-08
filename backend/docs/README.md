# Telepets Backend — README

Этот документ описывает архитектуру, структуру каталогов, окружение, запуск, деплой и основные API бэкенда Telepets.

## Обзор
- Стек: FastAPI, SQLAlchemy 2 (async), Alembic, Uvicorn
- БД: SQLite (dev) / PostgreSQL (prod)
- Аутентификация: JWT (HS256), `sub = user_id` (MVP)
- Домены: питомцы/стадии, экономика/кошельки, рынок/аукционы, профиль/анонимность, генерация изображений
- Документация: Swagger UI по адресу `/docs`, ReDoc — `/redoc`

## Структура каталогов
```
backend/
  api/                    # Роутеры FastAPI и схемы запросов/ответов
    schemas/              # Pydantic-схемы (унификация Swagger)
  services/               # Бизнес-логика (economy, auction, stages, user_profile, prompt_store, telegram_client)
  models/                 # ORM-модели (разнесены по доменам)
  config/                 # Глобальные настройки (чтение .env)
  alembic/ | migrations/  # Миграции БД
  generator/              # Генерация изображений (HF)
  cache/                  # Кэш изображений
  data/                   # Артефакты данных (SQLite-файлы, большие фикстуры)
  docs/                   # Документация (этот файл + API заметки)
  Dockerfile              # Оптимизированный multi-stage образ
  Dockerfile.production   # Продовый образ (если используется отдельно)
  main.py                 # Точка входа FastAPI
  core/                   # Ядро приложения
    db.py                 # Движок БД и session factory
    auth.py               # Аутентификация и авторизация
    tasks.py              # Фоновые задачи
    monitoring.py         # Метрики и health
```

### Модели (ORM)
- `models/base.py`: `Base` и enum-ы (`PetState`, `PetLifeStatus`, `TransactionType`, `TransactionStatus`, `AuctionStatus`, `WalletHoldStatus`)
- `models/pets.py`: `Pet`
- `models/users.py`: `User`, `Wallet`, `Transaction`, `Achievement`
- `models/market.py`: `Auction`, `AuctionBid`, `WalletHold`, `PetOwnershipHistory`
- `models/notifications.py`: `Notification`
- `models/games.py`: `GameProgress`

### Роутеры (API)
- Pet: `api/create.py`, `api/health_up.py`, `api/pet_images.py`
- Economy: `api/economy.py`
- Market: `api/market.py`
- User Profile: `api/user_profile.py`
- Auth: `api/auth_api.py`
- Games: `api/games.py`
- Monitoring/Debug: `api/monitoring.py`, `api/debug.py`

### Сервисы
- `services/economy.py`: кошелёк, транзакции, награды, лимиты
- `services/auction.py`: аукционы, ставки, холды, финализация, уведомления
- `services/stages.py`: стадии питомцев, подготовка промптов/изображений, base64 в БД
- `services/user_profile.py`: профиль, анонимность, публичные имена
- `services/prompt_store.py`: хранение/загрузка промптов
- `services/telegram_client.py`: уведомления Telegram
- `services/generation/`: генерация изображений
  - `factory.py`: фабрика генераторов
  - `replicate_client.py`: клиент Replicate
  - `alternative_generator.py`: SVG fallback генератор

## Переменные окружения
Загружаются в `config/settings.py` через `python-dotenv` из `.env`.

Обязательные/важные:
- `ENVIRONMENT` — `development` (dev) / иное (prod)
- `API_HOST` — хост (по умолчанию `127.0.0.1`)
- `API_PORT` — порт (строка или алиас `$PORT`), см. парсер `_parse_port`
- `PORT` — платформенный порт (Render и др.)
- `SECRET_KEY` — ключ JWT (обновите в проде!)
- `DATABASE_URL` — prod-подключение (например, PostgreSQL)
- `GENERATION_PROVIDER` — `replicate` (по умолчанию) или `hf`
- `REPLICATE_API_TOKEN` — токен Replicate (для провайдера replicate)
- `REPLICATE_MODEL` — id модели Replicate (по умолчанию `black-forest-labs/flux-1.1-pro`)
- `REPLICATE_TIMEOUT` — таймаут генерации (сек), по умолчанию 180
- `REPLICATE_POLL_INTERVAL` — период опроса статуса, по умолчанию 2
- `HF_API_TOKEN` — токен Hugging Face (если выбран провайдер `hf`)
- `TELEGRAM_BOT_TOKEN` — токен бота Telegram
- Флаги:
  - `SKIP_DB_ON_STARTUP` — пропустить init БД и фоновые задачи при старте
  - `RUN_MIGRATIONS_ON_STARTUP` — применить Alembic миграции на старте
  - `API_BASE_URL` — базовый URL для формирования абсолютных ссылок на изображения

Пример `.env` (адаптируйте под окружение):
```
ENVIRONMENT=development
API_HOST=0.0.0.0
API_PORT=3000
SECRET_KEY=change-me
# DATABASE_URL=postgresql://user:pass@host:5432/db
GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=your-replicate-token
REPLICATE_MODEL=black-forest-labs/flux-1.1-pro
# HF_API_TOKEN=your-hf-token
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
SKIP_DB_ON_STARTUP=false
RUN_MIGRATIONS_ON_STARTUP=false
API_BASE_URL=http://localhost:8080/api
```

## Локальный запуск
1) Установить зависимости
```
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
2) Настроить `.env` (см. раздел выше)
3) Запуск
```
uvicorn main:app --host 0.0.0.0 --port 8080
```
4) Документация
- Swagger: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

## Docker
Сборка образа:
```
docker build -t telepets-backend:latest .
```
Запуск контейнера:
```
docker run --rm -p 3000:10000 \
  -e PORT=10000 \
  --env-file .env \
  telepets-backend:latest
```
Примечания:
- Образ multi‑stage, колёса Python собираются на стадии builder
- Healthcheck: `GET /monitoring/health`

## База данных и миграции
- Dev: SQLite файл в `data/`
- Prod: PostgreSQL (`DATABASE_URL`), SSL на внешних хостах обрабатывается в `db.py`
- Alembic:
  - Автозапуск миграций на старте при `RUN_MIGRATIONS_ON_STARTUP=true`
  - Ручной запуск:
    ```
    alembic upgrade head
    ```

## Аутентификация
- `POST /api/auth/token` — выдаёт JWT для `user_id` (MVP)
- Все защищённые маршруты используют Bearer токен, зависимость `get_current_user`

## Основные API (вкратце)
- Pet:
  - `POST /api/create` — создание питомца (учёт платного создания, когда есть живые не‑взрослые питомцы)
  - `POST /api/health_up` — повышение здоровья (бесплатная механика)
  - `POST /api/economy/actions/{user_id}/health_up` — платное повышение здоровья (списание монет)
- Economy:
  - `GET /api/economy/wallet/{user_id}` — кошелёк
  - `GET /api/economy/transactions/{user_id}` — транзакции
  - `POST /api/economy/games/{user_id}/claim` — награда за мини‑игру
- Market:
  - `GET /api/market/auctions` — список аукционов
  - `POST /api/market/auctions` — создать аукцион (нужен токен)
  - `POST /api/market/auctions/{id}/bids` — ставка
  - `POST /api/market/auctions/{id}/buy_now` — мгновенная покупка
  - `POST /api/market/auctions/{id}/cancel` — отмена продавцом
- User Profile:
  - `GET /api/users/profile` — профиль текущего пользователя
  - `PUT /api/users/profile` — обновить анонимность/имя
  - `GET /api/users/{user_id}/public` — публичная информация
- Games:
  - `POST /api/games/save-progress` — сохранить прогресс мини‑игры
  - `GET /api/games/progress/{user_id}` — получить прогресс
- Monitoring:
  - `GET /monitoring/health`, `GET /monitoring/metrics`

## Фоновые задачи
- Уменьшение здоровья питомцев, переходы стадий, очистка изображений при смерти — `tasks.py`
- Финализация аукционов — `tasks.py`
- Запуск в `main.py` (можно отключить флагами в `.env`)

## Правила и конвенции
- Все глобальные настройки — в `config/settings.py` (DRY)
- SOLID/DRY: бизнес‑логика в `services/`, роутеры максимально тонкие
- Схемы Pydantic в `api/schemas/` формируют контракт API и Swagger
- Большие артефакты — в `data/` и исключены из Git (см. `.gitignore`)

### Правило: реактивные обновления фронтенда
- Любое действие (REST/WS/фоновые задачи), меняющее состояние, которое отображается во фронте, **обязано** проходить через единый слой событий.
- Для этого используем хелперы в `services/events.py` (добавляем/расширяем, если требуется):
  - `emit_pet_died()`, `emit_pet_stage_changed()`, `emit_wallet_updated()` и т.п. внутри **сами** выполняют `CacheService.invalidate_user(...)`, готовят `PetSummaryService.build_all_pets_summary(...)` и рассылают `broadcast_*`.
  - Если нового события нет — сначала добавляем его в `services/events.py`, затем вызываем.
- Фоновые задачи (`core/tasks.py`), сервисы (`services/*`) и API (`api/*`) **не** должны напрямую ходить в `CacheService` или `broadcast_*`; только через `emit_*`.
- Любой новый функционал, влияющий на UI, сразу подключаем к этому правилу — так фронт будет получать свежие данные без повторяющейся ручной логики и без перезагрузки.

## Генерация изображений (Replicate по умолчанию)
- Провайдер выбирается через `GENERATION_PROVIDER` (`replicate`|`hf`)
- По умолчанию используется Replicate с моделью `black-forest-labs/flux-1.1-pro`
- Промпт усиливается реалистичными модификаторами, используются негативные промпты и пресеты качества
- Результат сохраняется во временный файл и конвертируется в base64 в БД (`pets.image_*_b64`)
- При ошибках/таймаутах выполняется безопасный fallback (SVG/альтернативный генератор)

## Непокрытые места/Роадмап
- Унифицировать ответы ошибок через `ErrorResponse` во всех роутерах (частично сделано)
- Добавить тесты (unit/integration), smoke‑тесты эндпоинтов
- Дополнить схемы API для всех ответов в `market`, `games`, `monitoring` при необходимости

---
Если вы заметили неточность в документации или хотите расширения — добавьте issue/задачу и привяжите к соответствующему модулю.

