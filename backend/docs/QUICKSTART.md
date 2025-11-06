# Быстрый старт — локальный запуск бэкенда

## Предварительные требования

- Python 3.12 или выше
- pip (менеджер пакетов Python)
- Git (для клонирования репозитория)

## Шаг 1: Установка зависимостей

### Вариант A: Использование виртуального окружения (рекомендуется)

```bash
# Перейдите в директорию бэкенда
cd telepets-platform/backend

# Создайте виртуальное окружение
python -m venv .venv

# Активируйте виртуальное окружение
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Установите зависимости
pip install -r requirements.txt
```

### Вариант B: Глобальная установка (не рекомендуется)

```bash
cd telepets-platform/backend
pip install -r requirements.txt
```

## Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта `telepets-platform/backend/` со следующим содержимым:

```env
# Режим работы
ENVIRONMENT=development

# Настройки API
API_HOST=0.0.0.0
API_PORT=3000
API_BASE_URL=http://localhost:3000/api

# Безопасность
SECRET_KEY=your-secret-key-here-change-in-production

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# Генерация изображений (выберите один провайдер)
GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=your-replicate-api-token-here
REPLICATE_MODEL=black-forest-labs/flux-1.1-pro
REPLICATE_TIMEOUT=180
REPLICATE_POLL_INTERVAL=2

# Или используйте Hugging Face (альтернатива)
# GENERATION_PROVIDER=hf
# HF_API_TOKEN=your-huggingface-token-here

# Опционально: PostgreSQL (для продакшена)
# DATABASE_URL=postgresql://user:password@localhost:5432/telepets

# Флаги запуска
SKIP_DB_ON_STARTUP=false
RUN_MIGRATIONS_ON_STARTUP=false
```

### Получение токенов

**Telegram Bot Token:**
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен

**Replicate API Token:**
1. Зарегистрируйтесь на [Replicate](https://replicate.com)
2. Перейдите в [Settings → API tokens](https://replicate.com/account/api-tokens)
3. Создайте новый токен
4. Скопируйте токен

**Hugging Face Token (опционально):**
1. Зарегистрируйтесь на [Hugging Face](https://huggingface.co)
2. Перейдите в [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Создайте новый токен с правами чтения
4. Скопируйте токен

## Шаг 3: Инициализация базы данных

При первом запуске база данных создастся автоматически. В режиме разработки используется SQLite.

Если нужно применить миграции Alembic вручную:

```bash
# Из директории backend
alembic upgrade head
```

## Шаг 4: Запуск сервера

### Способ 1: Использование uvicorn напрямую

**Linux/Mac/Git Bash:**
```bash
cd telepets-platform/backend
# Для локальной разработки используйте ENVIRONMENT=development (SQLite)
ENVIRONMENT=development uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Windows CMD:**
```cmd
cd telepets-platform\backend
set ENVIRONMENT=development
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Windows PowerShell:**
```powershell
cd telepets-platform\backend
$env:ENVIRONMENT="development"
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Важно:** Если не установить `ENVIRONMENT=development`, система будет пытаться подключиться к PostgreSQL. Для локальной разработки используйте SQLite.

**Альтернатива:** Создайте файл `.env` в директории `backend/` с содержимым:
```env
ENVIRONMENT=development
```

Флаг `--reload` включает автоперезагрузку при изменении кода.

### Способ 2: Использование Python

```bash
cd telepets-platform/backend
python main.py
```

### Способ 3: Использование Docker

```bash
# Сборка образа
cd telepets-platform/backend
docker build -t telepets-backend:latest .

# Запуск контейнера
docker run --rm -p 3000:10000 \
  -e PORT=10000 \
  -e ENVIRONMENT=development \
  --env-file .env \
  telepets-backend:latest
```

## Шаг 5: Проверка работы

После запуска сервера вы должны увидеть сообщения в консоли:

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:3000
```

Проверьте работоспособность:

1. **Корневой endpoint:**
   ```
   http://localhost:3000/
   ```

2. **Swagger UI (интерактивная документация):**
   ```
   http://localhost:3000/docs
   ```

3. **ReDoc (альтернативная документация):**
   ```
   http://localhost:3000/redoc
   ```

4. **Health check:**
   ```
   http://localhost:3000/monitoring/health
   ```

## Шаг 6: Тестовые запросы

### Создание тестового токена авторизации

```bash
curl -X POST "http://localhost:3000/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}'
```

Ответ будет содержать JWT токен, используйте его для аутентификации.

### Создание питомца

```bash
curl -X POST "http://localhost:3000/api/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "MyPet",
    "description": "A cute test pet"
  }'
```

### Получение информации о кошельке

```bash
curl -X GET "http://localhost:3000/api/economy/wallet/test_user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Решение проблем

### Ошибка импорта модулей

```bash
# Убедитесь, что вы находитесь в директории backend
cd telepets-platform/backend

# Убедитесь, что виртуальное окружение активировано
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate
```

### Порт уже занят

Измените порт в `.env` файле:

```env
API_PORT=3001
```

Или укажите другой порт при запуске:

```bash
uvicorn main:app --host 0.0.0.0 --port 3001
```

### Ошибка подключения к базе данных

Убедитесь, что файл базы данных существует:

```bash
ls -la data/telepets_dev.db
```

Если файла нет, он создастся автоматически при первом запросе к API.

### Ошибка генерации изображений

Если вы не настроили токены для генерации изображений, API все равно будет работать, но генерация изображений будет недоступна. 

Для тестирования без токенов можно использовать SVG-заглушки (модуль автоматически переключится на них при ошибках).

### Логи и отладка

Логи выводятся в консоль. Для более детального логирования установите уровень DEBUG:

```python
# В main.py временно измените:
logging.basicConfig(level=logging.DEBUG)
```

## Дополнительные настройки

### Использование PostgreSQL вместо SQLite

Измените в `.env`:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@localhost:5432/telepets
```

### Автоматическое применение миграций при старте

```env
RUN_MIGRATIONS_ON_STARTUP=true
```

### Пропуск инициализации БД (для быстрого старта без фоновых задач)

```env
SKIP_DB_ON_STARTUP=true
```

## Дальнейшие шаги

1. Изучите [README.md](docs/README.md) для детальной информации об архитектуре
2. Ознакомьтесь с [API документацией](http://localhost:3000/docs) в Swagger UI
3. Проверьте [примеры использования](../frontends/ENDPOINTS_GUIDE.md)

## Полезные команды

```bash
# Просмотр логов приложения
tail -f logs/pipeline.log

# Очистка кэша изображений
rm -rf cache/pet_images/*

# Сброс базы данных (ОСТОРОЖНО: удалит все данные!)
rm data/telepets_dev.db

# Создание новой миграции
alembic revision --autogenerate -m "description"

# Применение конкретной миграции
alembic upgrade +1

# Откат миграции
alembic downgrade -1
```

## Получение помощи

Если у вас возникли проблемы:

1. Проверьте логи в консоли
2. Убедитесь, что все зависимости установлены: `pip list`
3. Проверьте версию Python: `python --version` (должна быть 3.12+)
4. Убедитесь, что файл `.env` существует и правильно настроен
5. Проверьте, что используете актуальную версию кода: `git pull origin main`

