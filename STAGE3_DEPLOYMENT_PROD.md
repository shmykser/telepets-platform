# Этап 3: Деплой на Production - Frontend WebSocket интеграция

**Дата:** 2025-10-31  
**Статус:** Инструкции для деплоя на продакшн

---

## ✅ Что уже готово на проде

### Backend (Render)
- ✅ WebSocket endpoint `/api/ws/pets/{user_id}` уже настроен (этап 2)
- ✅ Redis кеширование работает (этап 1-2)
- ✅ WebSocket broadcast при изменениях реализован

### Frontend
- ✅ WebSocket hook создан (`usePetWebSocket.ts`)
- ✅ Интегрирован в `usePet` и `useAllPets`
- ✅ Автоматическое переподключение настроено
- ✅ URL для WebSocket формируется из `endpoints.ts`

---

## 🔧 Что нужно сделать на проде

### 1. **Деплой Frontend** (GitHub Pages или другой хостинг)

#### Вариант 1: GitHub Pages (если используется)

```bash
# В директории frontends/webapp
npm run build
git add dist/
git commit -m "feat: добавить WebSocket интеграцию (этап 3)"
git push origin master

# GitHub Pages автоматически задеплоит из папки dist/
```

#### Проверка после деплоя:

1. Откройте приложение на проде
2. Откройте DevTools → Network → WS (WebSocket)
3. Должно появиться подключение к:
   ```
   wss://telepets-api-docker.onrender.com/api/ws/pets/{user_id}
   ```
4. В консоли должно быть:
   ```
   🔌 [WebSocket] Подключение к: wss://...
   ✅ [WebSocket] Подключено
   ```

---

### 2. **Проверка WebSocket на Render (Backend)**

WebSocket должен работать автоматически, но стоит проверить:

#### ✅ Проверка 1: Render поддерживает WebSocket

Render автоматически поддерживает WebSocket для всех веб-сервисов. Никаких дополнительных настроек не требуется.

#### ✅ Проверка 2: Правильный URL

Убедитесь, что в `telepets-platform/frontends/webapp/src/config/endpoints.ts` правильно настроен URL:

```typescript
// PROD_CONFIG.api.url должно быть:
url: 'https://telepets-api-docker.onrender.com'
```

WebSocket URL автоматически формируется из этого:
- `https://` → `wss://`
- Добавляется `/api/ws/pets/{user_id}`

#### ✅ Проверка 3: CORS (если есть проблемы)

Если WebSocket не подключается, проверьте CORS настройки в `backend/main.py`:

```python
# Должно быть разрешено подключение с вашего frontend домена
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://shmykser.github.io",  # GitHub Pages
        "https://your-domain.com",     # Ваш домен
        # ... другие домены
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Примечание:** CORS обычно не влияет на WebSocket (это другой протокол), но стоит проверить.

---

### 3. **Проверка переменных окружения (Render)**

Убедитесь, что на Render настроены все необходимые переменные:

#### Backend (Render Service)

```
REDIS_URL=redis://... (уже настроено на этапе 1-2)
REDIS_ENABLED=true
WEBSOCKET_ENABLED=true  # Опционально, по умолчанию true
```

**Проверка:**
1. Зайдите в Render Dashboard → Ваш Backend Service
2. Environment → Проверьте переменные
3. Если `WEBSOCKET_ENABLED` нет - добавьте (опционально, по умолчанию true)

---

### 4. **Тестирование после деплоя**

#### Тест 1: Подключение WebSocket

1. Откройте приложение на проде
2. DevTools → Console
3. Должны увидеть:
   ```
   🔌 [WebSocket] Подключение к: wss://telepets-api-docker.onrender.com/api/ws/pets/273065571
   ✅ [WebSocket] Подключено
   ```

#### Тест 2: Polling отключен

1. DevTools → Network → XHR/Fetch
2. При активном WebSocket НЕ должно быть частых запросов к:
   - `/api/summary?user_id=...`
   - `/api/summary/all?user_id=...`
3. Эти запросы должны быть только при:
   - Первой загрузке
   - Переподключении WebSocket
   - Ручном refresh

#### Тест 3: Real-time обновления

1. Откройте приложение в двух вкладках (с одним user_id)
2. В первой вкладке: увеличьте здоровье питомца
3. Во второй вкладке: должно обновиться **без перезагрузки страницы**

#### Тест 4: Переподключение

1. Откройте DevTools → Network → WS
2. Временно отключите интернет (или закройте вкладку)
3. Включите интернет (или откройте вкладку)
4. В консоли должно быть:
   ```
   🔌 [WebSocket] Соединение закрыто
   🔄 [WebSocket] Переподключение через 3000мс (попытка 1/5)
   ✅ [WebSocket] Подключено
   ```

#### Тест 5: Phaser игры без лагов

1. Откройте любую Phaser игру
2. Играйте в течение 1-2 минут
3. **НЕ должно быть лагов/торможений** при обновлениях данных

---

## 🐛 Возможные проблемы и решения

### Проблема 1: WebSocket не подключается

**Симптомы:**
- В консоли: `❌ [WebSocket] Ошибка соединения`
- В DevTools → Network → WS: нет подключения

**Решение:**
1. Проверьте URL в `endpoints.ts` - должен быть правильный домен Render
2. Проверьте, что Render сервис работает (откройте API в браузере)
3. Проверьте логи Render на наличие ошибок
4. Убедитесь, что WebSocket endpoint существует: `/api/ws/pets/{user_id}`

### Проблема 2: Polling все еще работает

**Симптомы:**
- В DevTools → Network видны частые запросы к `/api/summary`
- WebSocket подключен, но polling продолжается

**Решение:**
1. Проверьте консоль - должно быть `✅ [WebSocket] Подключено`
2. Если WebSocket не подключен, polling будет работать (это fallback)
3. Проверьте логику в `usePet.ts` и `useAllPets()` - должно быть:
   ```typescript
   refetchInterval: isWebSocketConnected ? false : 10000
   ```

### Проблема 3: Обновления не приходят

**Симптомы:**
- WebSocket подключен
- Но изменения не видны без перезагрузки

**Решение:**
1. Проверьте логи Render - должны быть сообщения о broadcast
2. Проверьте консоль браузера - должны быть сообщения:
   ```
   📨 [WebSocket] Получено сообщение: pets_update
   ```
3. Убедитесь, что бэкенд отправляет обновления (проверьте код в `tasks.py`, `health_up.py`, `create.py`)

### Проблема 4: WebSocket постоянно переподключается

**Симптомы:**
- В консоли: частые сообщения о переподключении

**Решение:**
1. Проверьте сетевую стабильность
2. Проверьте логи Render - возможно сервер закрывает соединение
3. Увеличьте `HEARTBEAT_INTERVAL` в `usePetWebSocket.ts` (если нужно)
4. Проверьте таймауты на Render (если есть настройки)

---

## ✅ Чеклист деплоя

- [ ] **Frontend собран** (`npm run build`)
- [ ] **Frontend задеплоен** (GitHub Pages / другой хостинг)
- [ ] **Backend работает** (проверить Render Dashboard)
- [ ] **Redis работает** (этап 1-2, уже настроено)
- [ ] **WebSocket endpoint доступен** (проверить в браузере/DevTools)
- [ ] **Переменные окружения настроены** (Render Dashboard)
- [ ] **Тест подключения** (DevTools → Network → WS)
- [ ] **Тест polling** (убедиться что отключен при WS)
- [ ] **Тест real-time** (две вкладки, обновления синхронно)
- [ ] **Тест переподключения** (отключить/включить интернет)
- [ ] **Тест Phaser игр** (нет лагов)

---

## 📊 Мониторинг после деплоя

### Логи для отслеживания:

1. **Backend (Render):**
   - WebSocket подключения: `WebSocket подключен для пользователя {user_id}`
   - WebSocket отключения: `WebSocket отключен для пользователя {user_id}`
   - Broadcast сообщения: `broadcast_pet_update`, `broadcast_wallet_update`

2. **Frontend (Browser Console):**
   - Подключение: `✅ [WebSocket] Подключено`
   - Получение сообщений: `📨 [WebSocket] Получено сообщение: {type}`
   - Переподключение: `🔄 [WebSocket] Переподключение через {delay}мс`

### Метрики для проверки:

1. **Снижение количества запросов:**
   - До: ~24 запроса/мин на пользователя
   - После: ~2-4 запроса/мин (только при изменениях)

2. **Время обновлений:**
   - До: 5-10 секунд (polling интервал)
   - После: Мгновенно (WebSocket)

3. **Нагрузка на сервер:**
   - Снижение на ~85-90% за счет Redis кеша + WebSocket

---

## 🎯 Итог

### Что нужно сделать:
1. ✅ **Деплой frontend** - просто собрать и задеплоить (GitHub Pages или другой хостинг)
2. ✅ **Проверка backend** - убедиться что WebSocket endpoint работает (уже работает с этапа 2)
3. ✅ **Тестирование** - проверить все тесты выше

### Что НЕ нужно делать:
- ❌ Настраивать WebSocket на Render (уже работает)
- ❌ Менять настройки CORS (если уже работает)
- ❌ Добавлять новые переменные окружения (кроме опциональных)

**Все готово к деплою!** 🚀

