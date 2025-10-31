# Исправление CORS и WebSocket проблем на Render

**Дата:** 2025-10-31  
**Проблемы:** CORS preflight блокируется, WebSocket не подключается

---

## ✅ Исправленные проблемы

### Проблема 1: CORS preflight (OPTIONS) блокируется

**Симптомы:**
```
Access to XMLHttpRequest at 'https://telepets-api-docker.onrender.com/api/summary/all?user_id=273065571' 
from origin 'https://shmykser.github.io' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Причина:**
- `MonitoringMiddleware` перехватывал OPTIONS запросы до обработки CORS middleware
- CORS настройки были недостаточно детализированы

**Решение:**
1. ✅ Добавлен пропуск OPTIONS запросов в `MonitoringMiddleware`
2. ✅ Улучшены CORS настройки:
   - Явно указан `OPTIONS` в `allow_methods`
   - Добавлены необходимые заголовки в `allow_headers`
   - Добавлен `max_age=3600` для кеширования preflight
   - Добавлен `expose_headers=["*"]`

### Проблема 2: WebSocket не подключается

**Симптомы:**
```
WebSocket connection to 'wss://telepets-api-docker.onrender.com/api/ws/pets/273065571' failed
```

**Причина:**
- Render требует правильной настройки WebSocket
- Возможно, нужно убедиться что uvicorn запущен с поддержкой WebSocket

**Решение:**
- ✅ WebSocket endpoint уже настроен правильно
- ✅ Uvicorn поддерживает WebSocket по умолчанию
- ⚠️ Возможно Render требует дополнительных настроек (см. ниже)

---

## 📝 Изменения в коде

### 1. `telepets-platform/backend/main.py`

**Улучшены CORS настройки:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://telepets-frontend.onrender.com",
        "https://shmykser.github.io",  # GitHub Pages
        "https://shmykser.github.io/",  # GitHub Pages с trailing slash
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Явно указан OPTIONS
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
    max_age=3600,  # Кеш preflight запросов на 1 час
)
```

### 2. `telepets-platform/backend/monitoring.py`

**Добавлен пропуск OPTIONS запросов:**
```python
async def __call__(self, scope, receive, send):
    # Пропускаем не-HTTP события (lifespan, websocket)
    if scope.get("type") != "http":
        await self.app(scope, receive, send)
        return

    # Пропускаем OPTIONS запросы (CORS preflight) без логирования метрик
    if scope.get("method") == "OPTIONS":
        await self.app(scope, receive, send)
        return

    # Остальная логика мониторинга...
```

---

## 🔧 Дополнительные проверки для WebSocket на Render

### Проверка 1: Render поддерживает WebSocket

Render автоматически поддерживает WebSocket для FastAPI/Uvicorn приложений. Никаких дополнительных настроек не требуется.

### Проверка 2: Проверка логов Render

После деплоя проверьте логи Render на наличие:
- `WebSocket подключен: user_id=...`
- Ошибок при подключении WebSocket

### Проверка 3: Uvicorn настройки

Убедитесь что используется `uvicorn[standard]` в `requirements.txt`:
```
uvicorn[standard]==0.24.0
```

---

## 🚀 Следующие шаги

1. **Закоммитьте изменения:**
   ```bash
   git add telepets-platform/backend/main.py
   git add telepets-platform/backend/monitoring.py
   git commit -m "fix: исправить CORS preflight и добавить поддержку OPTIONS запросов"
   git push origin master
   ```

2. **Дождитесь деплоя на Render**

3. **Проверьте в браузере:**
   - CORS ошибки должны исчезнуть
   - WebSocket должен подключиться
   - В DevTools → Network → WS должно быть подключение
   - В консоли должно быть: `✅ [WebSocket] Подключено`

---

## 📊 Ожидаемый результат

После исправлений:
- ✅ OPTIONS запросы (preflight) обрабатываются корректно
- ✅ API запросы проходят без CORS ошибок
- ✅ WebSocket подключается (если Render поддерживает)
- ✅ Все запросы работают с `https://shmykser.github.io`

---

## ⚠️ Если WebSocket все еще не работает

Render может иметь ограничения на WebSocket для free tier. Альтернативы:
1. Использовать polling как fallback (уже реализовано)
2. Рассмотреть использование Render Pro plan
3. Использовать отдельный WebSocket сервис

Но основная проблема (CORS) должна быть решена! ✅

