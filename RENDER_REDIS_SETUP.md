# Инструкция по настройке Redis на Render

## 🚀 Быстрая настройка

### Шаг 1: Настройка Redis сервиса в Render Dashboard

1. Перейдите в [Render Dashboard](https://dashboard.render.com)
2. Выберите сервис **redis** (redis-sju8)
3. Откройте вкладку **Settings**
4. В разделе **Build & Deploy** установите:

```
Root Directory: (оставьте пустым)
Dockerfile Path: telepets-platform/Dockerfile.redis
Docker Context: .
```

**ИЛИ** если root directory пустой не работает:

```
Root Directory: telepets-platform
Dockerfile Path: Dockerfile.redis
Docker Context: .
```

5. **Сохраните изменения**

### Шаг 2: Запуск деплоя

1. Перейдите во вкладку **Manual Deploy**
2. Нажмите **Deploy latest commit**
3. Дождитесь завершения деплоя

### Шаг 3: Проверка переменных окружения

Убедитесь, что в Redis сервисе установлены (уже добавлены автоматически):

- `REDIS_PASSWORD` = (пусто)
- `REDIS_PORT` = 6379
- `REDIS_MAXMEMORY` = 256mb
- `REDIS_MAXMEMORY_POLICY` = allkeys-lru

### Шаг 4: Проверка переменных в Backend сервисе

Убедитесь, что в **telepets-api-docker** сервисе установлены (уже добавлены автоматически):

- `REDIS_URL` = `redis://redis-sju8.onrender.com:6379`
- `REDIS_ENABLED` = `true`
- `CACHE_TTL_PETS` = `30`
- `CACHE_TTL_WALLET` = `60`
- `CACHE_TTL_SUMMARY` = `30`

## 🔍 Проверка работы

### 1. Проверка логов Redis сервиса

В Render Dashboard → redis → Logs должно быть:
```
* Ready to accept connections
```

### 2. Проверка логов Backend сервиса

В Render Dashboard → telepets-api-docker → Logs должно быть:
```
Redis подключен: redis://redis-sju8.onrender.com:6379
```

### 3. Если подключение не работает

Возможные причины и решения:

#### Проблема 1: Redis не доступен по порту 6379
**Решение:** На Render веб-сервисы могут не поддерживать прямые TCP соединения на не-HTTP портах.

**Варианты:**
1. Использовать внутренний DNS (если поддерживается Render):
   ```
   REDIS_URL=redis://redis-sju8:6379
   ```

2. Использовать встроенный Redis addon от Render:
   - В Render Dashboard → Add New → Redis
   - Скопировать Internal Redis URL
   - Обновить `REDIS_URL` в backend сервисе

#### Проблема 2: Dockerfile не найден
**Решение:** Проверьте путь к Dockerfile в настройках Redis сервиса.

#### Проблема 3: Сборка завершилась с ошибкой
**Решение:** 
- Проверьте логи сборки
- Убедитесь, что Dockerfile.redis находится в правильном месте
- Проверьте, что Dockerfile корректен

## 📝 Альтернативное решение: Использование Redis Addon

Если веб-сервис Redis не работает, рекомендуется использовать встроенный Redis addon:

1. В Render Dashboard → Add New → Redis
2. Выберите план (Free доступен)
3. Создайте Redis instance
4. После создания скопируйте **Internal Redis URL** (формат: `redis://red-xxxxx:6379`)
5. В backend сервисе обновите:
   ```
   REDIS_URL=<скопированный Internal Redis URL>
   ```

Это более надежное решение для продакшн.

## ✅ Статус текущей настройки

- ✅ Dockerfile.redis создан
- ✅ Переменные окружения добавлены в оба сервиса
- ⚠️ Требуется настройка Dockerfile Path в Render Dashboard
- ⏳ Ожидается успешный деплой Redis

## 📞 Поддержка

После настройки Dockerfile Path и успешного деплоя Redis должен автоматически подключиться к backend сервису.

Если проблемы сохраняются, используйте Redis addon от Render как альтернативу.

