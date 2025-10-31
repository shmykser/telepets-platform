# Переменные окружения для Production

## Обязательные переменные для Render (Backend)

### Cloudflare R2 (хранение изображений)
```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE_URL=https://your-public-domain.com  # Опционально, если используется публичный доступ
R2_USE_SIGNED_URLS=true  # или false, если используется публичный доступ
R2_SIGNED_URL_TTL=3600  # TTL в секундах для подписанных URL
```

### Replicate (генерация изображений)
```
GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=your-replicate-api-token
REPLICATE_MODEL=black-forest-labs/flux-1.1-pro
REPLICATE_TIMEOUT=180
REPLICATE_POLL_INTERVAL=2
```

### База данных и миграции
```
DATABASE_URL=postgresql://user:password@host:5432/dbname  # Supabase connection string
ENVIRONMENT=production
RUN_MIGRATIONS_ON_STARTUP=true  # Автоматическое применение миграций при старте
SKIP_DB_ON_STARTUP=false
```

### Существующие переменные (не изменять)
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
SECRET_KEY=your-jwt-secret-key
API_BASE_URL=https://your-api-domain.com/api  # Базовый URL API для формирования абсолютных ссылок
PORT=10000  # Порт для Render (устанавливается автоматически)
```

## Полный список переменных

### Обязательные:
1. `R2_ACCOUNT_ID` - Cloudflare Account ID
2. `R2_ACCESS_KEY_ID` - R2 Access Key ID
3. `R2_SECRET_ACCESS_KEY` - R2 Secret Access Key
4. `R2_ENDPOINT` - R2 Endpoint URL
5. `R2_BUCKET` - R2 Bucket name
6. `GENERATION_PROVIDER` - replicate или hf
7. `REPLICATE_API_TOKEN` - Replicate API token
8. `DATABASE_URL` - PostgreSQL connection string
9. `TELEGRAM_BOT_TOKEN` - Telegram bot token
10. `SECRET_KEY` - JWT secret key
11. `ENVIRONMENT` - production

### Опциональные (с дефолтами):
- `R2_PUBLIC_BASE_URL` - Публичный URL для CDN (если используется)
- `R2_USE_SIGNED_URLS` - true/false (по умолчанию false)
- `R2_SIGNED_URL_TTL` - TTL в секундах (по умолчанию 3600)
- `REPLICATE_MODEL` - Модель Replicate (по умолчанию black-forest-labs/flux-1.1-pro)
- `REPLICATE_TIMEOUT` - Таймаут (по умолчанию 180)
- `REPLICATE_POLL_INTERVAL` - Интервал опроса (по умолчанию 2)
- `API_BASE_URL` - Базовый URL API (для формирования ссылок)
- `RUN_MIGRATIONS_ON_STARTUP` - true/false (по умолчанию false)
- `SKIP_DB_ON_STARTUP` - true/false (по умолчанию false)

## Инструкция по настройке

### 1. Cloudflare R2
1. Зайдите в Cloudflare Dashboard → R2
2. Создайте bucket (если еще не создан)
3. Перейдите в Manage R2 API Tokens
4. Создайте API Token с правами на чтение/запись
5. Скопируйте Account ID, Access Key ID и Secret Access Key
6. Endpoint формируется как: `https://<account-id>.r2.cloudflarestorage.com`

### 2. Replicate
1. Зайдите на https://replicate.com
2. Зарегистрируйтесь или войдите
3. Перейдите в Settings → API tokens
4. Создайте новый API token
5. Скопируйте токен

### 3. Настройка в Render
1. Зайдите в Render Dashboard
2. Выберите ваш backend сервис
3. Перейдите в Environment
4. Добавьте все переменные из списка выше
5. Сохраните изменения
6. Перезапустите сервис

## Проверка после настройки

После добавления переменных проверьте логи:
```bash
# В Render Dashboard → Logs проверьте:
# 1. Что приложение запустилось без ошибок
# 2. Что миграции применились успешно (если RUN_MIGRATIONS_ON_STARTUP=true)
# 3. Что нет ошибок подключения к R2
# 4. Что нет ошибок подключения к Replicate
```

## Миграции БД

Миграции будут применены автоматически при старте, если `RUN_MIGRATIONS_ON_STARTUP=true`.

Применяемые миграции:
1. `2025_10_30_000005_add_pet_image_urls.py` - добавляет поля image_egg_url, image_baby_url, image_adult_url
2. `2025_10_30_000006_drop_pet_image_b64.py` - удаляет поля image_egg_b64, image_baby_b64, image_adult_b64

**Важно:** Убедитесь, что миграции применяются в правильном порядке!

