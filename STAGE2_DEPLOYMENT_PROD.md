# Этап 2: Деплой на продакшн

**Дата:** 2025-10-31  
**Этап:** WebSocket и Redis кеширование

---

## ✅ Чек-лист перед деплоем

### 1. Проверка Redis (Этап 1 уже выполнен)

Убедитесь, что Redis настроен и работает:

- ✅ **Key Value instance создан** (этап 1)
- ✅ **Переменные окружения добавлены** в backend сервис:
  ```
  REDIS_URL=redis://red-d4290uer433s73f6tch0:6379
  REDIS_ENABLED=true
  CACHE_TTL_PETS=30
  CACHE_TTL_WALLET=60
  CACHE_TTL_SUMMARY=30
  ```

**Проверка:**
1. Перейдите в Render Dashboard → Backend сервис → Environment
2. Убедитесь, что все Redis переменные присутствуют
3. Проверьте логи backend на наличие:
   ```
   Redis подключен: redis://...
   ```

---

### 2. Проверка зависимостей

**Файл:** `telepets-platform/backend/requirements.txt`

Убедитесь, что следующие зависимости присутствуют:
```
redis==5.0.1
aioredis==2.0.1
```

**Проверка:**
- Эти зависимости уже добавлены в requirements.txt
- При деплое Render автоматически установит их

---

### 3. Коммит и push изменений

Убедитесь, что все изменения этапа 2 закоммичены и запушены:

```bash
# Проверьте статус
git status

# Добавьте файлы (если нужно)
git add telepets-platform/backend/api/websocket.py
git add telepets-platform/backend/api/summary.py
git add telepets-platform/backend/api/health_up.py
git add telepets-platform/backend/api/create.py
git add telepets-platform/backend/tasks.py
git add telepets-platform/backend/main.py

# Закоммитьте
git commit -m "feat: Add WebSocket and Redis caching (Stage 2)"

# Запушьте
git push origin master
```

---

### 4. Деплой на Render

#### Автоматический деплой (рекомендуется)

Если на Render включен **Auto-Deploy**, то после push в master branch деплой запустится автоматически.

**Проверка:**
1. Перейдите в Render Dashboard → Backend сервис
2. Дождитесь завершения деплоя
3. Проверьте статус: должен быть **Live**

#### Ручной деплой (если нужно)

1. Перейдите в Render Dashboard → Backend сервис
2. Нажмите **Manual Deploy** → **Deploy latest commit**
3. Дождитесь завершения

---

### 5. Проверка после деплоя

#### 5.1. Проверка логов

В Render Dashboard → Backend сервис → Logs проверьте:

**✅ Успешный старт:**
```
Запуск Telepets API ...
База данных инициализирована
Redis подключен: redis://red-d4290uer433s73f6tch0:6379
Фоновая задача здоровья запущена
Система мониторинга запущена
```

**❌ Если видите ошибки:**
- `Ошибка подключения к Redis` - проверьте `REDIS_URL`
- `ModuleNotFoundError: No module named 'redis'` - проверьте requirements.txt
- `ImportError` - проверьте что все файлы задеплоены

#### 5.2. Проверка WebSocket endpoint

**Метод 1: Через браузерную консоль**

Откройте консоль разработчика (F12) и выполните:

```javascript
const ws = new WebSocket('wss://telepets-api-docker.onrender.com/api/ws/pets/YOUR_USER_ID');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onmessage = (event) => console.log('📨 Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('❌ Error:', error);
ws.onclose = () => console.log('🔌 WebSocket closed');
```

**Ожидаемый результат:**
- `WebSocket connected` в консоли
- Получение сообщения с типом `pets_update`

**Метод 2: Через curl (для проверки HTTP endpoints)**

```bash
# Проверка обычного endpoint
curl https://telepets-api-docker.onrender.com/api/ws/stats

# Должен вернуть JSON со статистикой подключений:
# {"total_connections": 0, "users_with_connections": 0, ...}
```

#### 5.3. Проверка кеширования

**Метод 1: Через логи**

При первом запросе должно быть:
```
Cache miss для summary:all:USER_ID
```

При повторном запросе (в течение TTL):
```
Cache hit для summary:all:USER_ID
```

**Метод 2: Через HTTP заголовки**

```bash
# Первый запрос
curl -I https://telepets-api-docker.onrender.com/api/summary/all?user_id=YOUR_USER_ID

# Должен вернуть:
# ETag: "abc123..."
# Cache-Control: public, max-age=30

# Повторный запрос с ETag
curl -I -H "If-None-Match: abc123..." https://telepets-api-docker.onrender.com/api/summary/all?user_id=YOUR_USER_ID

# Должен вернуть:
# HTTP/1.1 304 Not Modified
```

#### 5.4. Проверка инвалидации кеша

1. Выполните действие (например, `health_up`)
2. Проверьте логи - должно появиться:
   ```
   Кеш питомцев инвалидирован для USER_ID
   Broadcast отправлен: user_id=USER_ID, type=health_changed
   ```

---

### 6. Проверка CORS для WebSocket

**Файл:** `telepets-platform/backend/main.py`

CORS уже настроен правильно:
```python
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
```

**Важно:** Если frontend на другом домене, убедитесь, что он добавлен в `allow_origins`:
```python
allow_origins=[
    "https://your-frontend-domain.com",
    ...
]
```

---

### 7. Мониторинг WebSocket подключений

**Endpoint:** `/api/ws/stats`

```bash
curl https://telepets-api-docker.onrender.com/api/ws/stats
```

**Ответ:**
```json
{
  "total_connections": 5,
  "users_with_connections": 3,
  "connections_by_user": {
    "user_id_1": 2,
    "user_id_2": 1,
    "user_id_3": 2
  }
}
```

---

## 🔧 Решение проблем

### Проблема 1: Redis не подключается

**Симптомы:**
```
Ошибка подключения к Redis: ...
Кеширование отключено.
```

**Решения:**
1. Проверьте `REDIS_URL` в Environment Variables
2. Убедитесь, что Key Value instance в статусе `available`
3. Попробуйте использовать внутренний URL:
   ```
   REDIS_URL=redis://telepets-redis:6379
   ```
   или
   ```
   REDIS_URL=redis://red-d4290uer433s73f6tch0:6379
   ```

### Проблема 2: WebSocket не подключается

**Симптомы:**
- WebSocket connection failed
- 404 Not Found на `/api/ws/pets/...`

**Решения:**
1. Убедитесь, что роутер подключен в `main.py`:
   ```python
   app.include_router(websocket.router, prefix="/api")
   ```
2. Проверьте логи на наличие ошибок импорта
3. Убедитесь, что используется правильный URL (wss:// для HTTPS)

### Проблема 3: Кеш не работает

**Симптомы:**
- Всегда `Cache miss` в логах
- Нет заголовков `ETag` в ответах

**Решения:**
1. Проверьте `REDIS_ENABLED=true`
2. Убедитесь, что Redis подключен (см. логи)
3. Проверьте права доступа к Redis

### Проблема 4: Broadcast не отправляется

**Симптомы:**
- Изменения не приходят через WebSocket
- Нет ошибок в логах

**Решения:**
1. Проверьте логи на наличие:
   ```
   Broadcast отправлен: user_id=..., type=...
   ```
2. Убедитесь, что WebSocket подключен на клиенте
3. Проверьте что инвалидация кеша вызывается (см. логи)

---

## 📊 Проверка производительности

### Метрики для отслеживания:

1. **Количество WebSocket подключений**
   - Endpoint: `/api/ws/stats`
   - Ожидаемо: растет при использовании

2. **Cache hit rate**
   - Смотрите логи: `Cache hit` vs `Cache miss`
   - Ожидаемо: больше `Cache hit` после прогрева

3. **Время ответа API**
   - Endpoint: `/monitoring/metrics`
   - Ожидаемо: снижение времени ответа при использовании кеша

4. **Нагрузка на БД**
   - Ожидаемо: снижение количества запросов к БД

---

## ✅ Финальный чек-лист

После деплоя убедитесь:

- [ ] Redis подключен (логи показывают "Redis подключен")
- [ ] WebSocket endpoint доступен (`/api/ws/pets/{user_id}`)
- [ ] Кеширование работает (видны `Cache hit` в логах)
- [ ] ETag работает (304 Not Modified при повторных запросах)
- [ ] Broadcast работает (WebSocket получает обновления)
- [ ] Инвалидация кеша работает (кеш очищается при изменениях)
- [ ] Нет ошибок в логах
- [ ] Метрики улучшились (меньше запросов к БД, быстрее ответы)

---

## 🚀 Следующие шаги

После успешного деплоя этапа 2:

1. **Этап 3: Frontend интеграция**
   - Создание WebSocket hook на frontend
   - Интеграция с React Query
   - Отключение polling при активном WebSocket

2. **Мониторинг**
   - Отслеживание метрик производительности
   - Настройка алертов (если нужно)

---

## 📝 Полезные команды

### Проверка Redis

```bash
# В Render Dashboard можно использовать SSH:
ssh srv-xxxxx@ssh.frankfurt.render.com

# Подключиться к Redis:
redis-cli -h red-d4290uer433s73f6tch0 -p 6379
PING  # Должен ответить PONG
KEYS telepets:*  # Показать все ключи кеша
TTL telepets:summary:all:USER_ID  # Проверить TTL ключа
```

### Просмотр логов в реальном времени

В Render Dashboard → Backend → Logs можно фильтровать:
- `Redis` - для просмотра сообщений о Redis
- `WebSocket` - для просмотра WebSocket событий
- `Cache` - для просмотра операций кеширования

---

## ✅ Итог

После выполнения всех шагов:

1. ✅ **Redis настроен и работает**
2. ✅ **WebSocket endpoint доступен**
3. ✅ **Кеширование активно**
4. ✅ **Broadcast работает**
5. ✅ **Инвалидация кеша работает**

**Статус:** Готово к использованию и интеграции frontend!

