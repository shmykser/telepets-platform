# Redis Кеширование

Модуль для работы с Redis кешированием данных питомцев, кошельков и других сущностей.

## Установка

### Локальная разработка

#### Вариант 1: Docker (рекомендуется)

Redis уже настроен в `docker-compose.yml`. Просто запустите:

```bash
cd telepets-platform/infra
docker-compose up -d redis
```

Redis будет доступен по адресу `redis://localhost:6379`

#### Вариант 2: Установка Redis локально

**Windows:**
- Скачайте Redis for Windows: https://github.com/microsoftarchive/redis/releases
- Или используйте WSL: `sudo apt-get install redis-server`

**Linux/macOS:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis
```

### Продакшн (Render)

На Render Redis доступен через внешний сервис или можно использовать встроенный Redis addon:

1. В Render Dashboard создайте новый Redis instance
2. Скопируйте внутренний Redis URL (формат: `redis://red-xxxxx:6379`)
3. Добавьте в Environment Variables backend сервиса:
   ```
   REDIS_URL=redis://red-xxxxx:6379
   REDIS_ENABLED=true
   ```

## Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию | Локально | Продакшн |
|------------|----------|--------------|----------|----------|
| `REDIS_URL` | URL подключения к Redis | `redis://localhost:6379` | `redis://localhost:6379` | `redis://redis:6379` (Docker) или внешний URL |
| `REDIS_ENABLED` | Включить/выключить Redis | `true` | `true` | `true` |
| `CACHE_TTL_PETS` | TTL для кеша питомцев (сек) | `30` | `30` | `30` |
| `CACHE_TTL_WALLET` | TTL для кеша кошелька (сек) | `60` | `60` | `60` |
| `CACHE_TTL_SUMMARY` | TTL для кеша summary (сек) | `30` | `30` | `30` |
| `CACHE_KEY_PREFIX` | Префикс ключей кеша | `telepets` | `telepets` | `telepets` |

### Локальная разработка (.env)

```env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
CACHE_TTL_PETS=30
CACHE_TTL_WALLET=60
CACHE_TTL_SUMMARY=30
```

### Docker (docker-compose.yml)

При использовании Docker, Redis доступен по имени сервиса:

```env
REDIS_URL=redis://redis:6379
REDIS_ENABLED=true
```

### Продакшн (Render)

В Render Dashboard → Environment Variables добавьте:

```env
REDIS_URL=redis://red-xxxxx:6379  # URL из Render Redis addon
REDIS_ENABLED=true
CACHE_TTL_PETS=30
CACHE_TTL_WALLET=60
CACHE_TTL_SUMMARY=30
```

## Использование

### Пример: Кеширование данных питомцев

```python
from cache.redis_client import (
    get_cached_pets,
    set_cached_pets,
    invalidate_pets_cache,
)

# Получение из кеша
cached = await get_cached_pets(user_id)
if cached:
    pets_data = cached["data"]
    etag = cached["etag"]
else:
    # Запрос к БД
    pets_data = await get_pets_from_db(user_id)
    # Сохранение в кеш
    await set_cached_pets(user_id, pets_data)

# Инвалидация кеша при изменениях
await invalidate_pets_cache(user_id)
```

### Проверка доступности Redis

```python
from cache.redis_client import get_redis

redis_client = await get_redis()
if redis_client is None:
    # Redis недоступен, используем прямой доступ к БД
    pass
```

## Структура ключей кеша

- Питомцы: `telepets:pets:all:{user_id}`
- Summary: `telepets:summary:{user_id}`
- Кошелек: `telepets:wallet:{user_id}`

## Инвалидация кеша

Кеш автоматически инвалидируется при:
- Создании питомца
- Обновлении здоровья питомца
- Изменении кошелька
- Переходе стадии питомца

Или вручную:

```python
from cache.redis_client import (
    invalidate_pets_cache,
    invalidate_wallet_cache,
    clear_all_cache,
)

# Инвалидация кеша конкретного пользователя
await invalidate_pets_cache(user_id)

# Очистка всего кеша
await clear_all_cache()
```

## Отладка

### Проверка подключения

```python
from cache.redis_client import get_redis, get_cache_stats

# Проверка соединения
redis_client = await get_redis()
if redis_client:
    await redis_client.ping()
    print("Redis подключен!")

# Статистика кеша
stats = await get_cache_stats(user_id)
print(stats)
```

### Логирование

Модуль использует стандартный Python logging. Уровень логов:

```python
import logging
logging.getLogger("cache.redis_client").setLevel(logging.DEBUG)
```

## Graceful Degradation

Если Redis недоступен, модуль автоматически отключает кеширование и возвращает `None` из функций чтения кеша. Приложение продолжает работать без кеширования.

## Производительность

- **Без кеша**: ~200-500ms на запрос к БД
- **С кешем (hit)**: ~1-5ms (чтение из Redis)
- **С кешем (miss)**: ~200-500ms + 1-5ms (запрос к БД + запись в Redis)

Снижение нагрузки на БД: **~80-90%**

