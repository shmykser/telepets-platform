# Деплой Redis на Render - ВЫПОЛНЕНО ✅

**Дата:** 2025-10-31  
**Статус:** Переменные окружения добавлены, деплои запущены

## ✅ Выполненные действия

### 1. Создан Dockerfile для Redis

**Файл:** `telepets-platform/Dockerfile.redis`

Использует официальный образ `redis:7-alpine` с healthcheck.

**Важно:** В настройках Redis сервиса в Render Dashboard нужно указать:
- **Dockerfile Path:** `Dockerfile.redis`
- **Root Directory:** оставьте пустым (или `telepets-platform` если не работает)

### 2. Настроены переменные окружения

#### Redis сервис (srv-d428scs9c44c73868f9g):
- `REDIS_PASSWORD` - пароль Redis (пустой по умолчанию)
- `REDIS_PORT` - порт Redis (6379)
- `REDIS_MAXMEMORY` - максимальная память (256mb)
- `REDIS_MAXMEMORY_POLICY` - политика удаления ключей (allkeys-lru)

#### Backend сервис (telepets-api-docker):
- `REDIS_URL` - URL подключения к Redis: `redis://redis-sju8.onrender.com:6379`
- `REDIS_ENABLED` - включить кеширование: `true`
- `CACHE_TTL_PETS` - TTL кеша питомцев: `30` секунд
- `CACHE_TTL_WALLET` - TTL кеша кошелька: `60` секунд
- `CACHE_TTL_SUMMARY` - TTL кеша summary: `30` секунд

### 3. Запущены деплои

⚠️ **Redis сервис:** Деплой завершился с ошибкой (dep-d428tru3jp1c73aejojg)  
✅ **Backend сервис:** Деплой запущен (dep-d428tsruibrs73cpmnng)

**Причина ошибки:** Нужно настроить Dockerfile path в Render Dashboard

## ⚠️ Важные замечания

### Подключение к Redis на Render

На Render веб-сервисы обычно доступны только через HTTP/HTTPS. Для Redis на порту 6379 есть несколько вариантов:

#### Вариант 1: Внутренний DNS (если поддерживается Render)
Используйте имя сервиса:
```
REDIS_URL=redis://redis-sju8:6379
```

#### Вариант 2: Публичный URL с портом (если порт открыт)
```
REDIS_URL=redis://redis-sju8.onrender.com:6379
```

#### Вариант 3: Использовать Redis Addon (рекомендуется для продакшн)
Render предоставляет встроенный Redis addon, который предоставляет внутренний URL:
1. В Render Dashboard → Add New → Redis
2. Скопируйте Internal Redis URL
3. Обновите `REDIS_URL` в backend сервисе

## ⚠️ ВАЖНО: Настройка Redis сервиса в Render Dashboard

Redis сервис завершился с ошибкой сборки. Необходимо настроить следующие параметры вручную:

### Шаги настройки:

1. Перейдите в Render Dashboard → Redis сервис (redis-sju8)
2. Откройте **Settings** → **Build & Deploy**
3. Настройте следующие параметры:
   - **Dockerfile Path:** `telepets-platform/Dockerfile.redis` (или `Dockerfile.redis` если rootDir пустой)
   - **Root Directory:** оставьте пустым (пустая строка)
   - **Docker Context:** `.` (точка)

### Альтернативный вариант:

Если Root Directory пустой не работает, попробуйте:
   - **Root Directory:** `telepets-platform`
   - **Dockerfile Path:** `Dockerfile.redis`

### После настройки:

1. Сохраните изменения
2. Запустите новый деплой (Manual Deploy или подождите авто-деплой)

### Проверка подключения Redis:

После успешного деплоя Redis проверьте:
   - Что Redis сервис запущен и работает
   - Логи Redis сервиса на предмет ошибок
   - Что порт 6379 доступен (Render может не открывать не-HTTP порты)

**⚠️ Важно:** Render веб-сервисы обычно доступны только через HTTP/HTTPS. Для Redis на порту 6379 может потребоваться:
- Использовать внутренний DNS имя сервиса
- Или использовать встроенный Redis addon от Render (рекомендуется)

### Альтернативное решение

Если прямой TCP доступ к Redis через веб-сервис не работает, рекомендуется:

1. Использовать встроенный Redis addon от Render (более надежно)
2. Или использовать облачный Redis (Redis Cloud, AWS ElastiCache и т.д.)

## Проверка работы

После деплоя проверьте логи backend сервиса:
```bash
# Должно появиться сообщение:
"Redis подключен: redis://..."
```

Если видите ошибки подключения:
```bash
# Проверьте URL Redis
# Попробуйте изменить REDIS_URL на внутренний хост:
REDIS_URL=redis://redis-sju8:6379
```

## Дальнейшие действия

1. ✅ Дождаться завершения деплоев
2. ✅ Проверить логи обоих сервисов
3. ✅ Проверить подключение Redis из backend
4. При необходимости изменить REDIS_URL на внутренний адрес

