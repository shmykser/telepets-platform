# Анализ оптимизации проекта Telepets Integration

**Дата анализа:** 2025-10-31  
**Цель:** Оптимизация частых запросов к `/api/summary/all` и `/api/summary`, влияющих на производительность Phaser игр

---

## 🔍 Текущее состояние

### Проблемные точки

#### 1. **Frontend: Агрессивный polling**

**Файл:** `telepets-platform/frontends/webapp/src/hooks/usePet.ts`

- **`usePet()`**: `refetchInterval: 10000` (каждые 10 секунд) → `/api/summary`
- **`useAllPets()`**: `refetchInterval: 5000` (каждые 5 секунд) → `/api/summary/all`
  - `refetchIntervalInBackground: true` (даже когда вкладка не активна)

**Файл:** `telepets-platform/frontends/webapp/src/hooks/useEconomy.ts`

- **`useWallet()`**: `refetchInterval: 10000` (каждые 10 секунд) → `/api/economy/wallet/{userId}`
- **`useTransactions()`**: `refetchInterval: 60000` (каждую минуту)
- **`useUserStats()`**: `refetchInterval: 60000` (каждую минуту)
- **`useAuctions()`**: `refetchInterval: 30000` (каждые 30 секунд)

#### 2. **Backend: Тяжелые запросы к БД**

**Файл:** `telepets-platform/backend/api/summary.py`

- **`/api/summary/all`** (строка 200-336):
  - SELECT всех питомцев пользователя
  - SELECT кошелька
  - Цикл обработки каждого питомца (расчет времени до стадии, парсинг JSON, формирование URL изображений)
  - Нет кеширования результатов

- **`/api/summary`** (строка 41-198):
  - Аналогичные запросы + логика выбора активного питомца
  - Повторная обработка данных

#### 3. **Отсутствие реального времени**

- ❌ Нет WebSocket endpoints
- ❌ Нет Server-Sent Events (SSE)
- ❌ Нет механизма push-уведомлений об изменениях

#### 4. **Проблемы с производительностью**

- Все запросы выполняются в основном потоке браузера
- Phaser игры работают в том же потоке, что и React
- Частые HTTP запросы блокируют event loop → торможение игр
- Отсутствие батчинга запросов
- Нет использования HTTP/2 Server Push
- Отсутствие ETags для условных запросов

---

## 📊 Анализ нагрузки

### Текущая частота запросов (на одного пользователя)

| Endpoint | Интервал | Запросов/мин | Запросов/час |
|----------|----------|--------------|--------------|
| `/api/summary/all` | 5 сек | **12** | **720** |
| `/api/summary` | 10 сек | **6** | **360** |
| `/api/economy/wallet/{userId}` | 10 сек | **6** | **360** |
| **ИТОГО** | | **24/мин** | **1440/час** |

### Влияние на производительность

1. **Блокировка основного потока:**
   - Каждый HTTP запрос блокирует event loop на время обработки
   - Phaser игры требуют 60 FPS → каждая задержка заметна

2. **Сетевая нагрузка:**
   - Большие JSON ответы (включая промпты, creature JSON, URL изображений)
   - Повторная передача неизменных данных

3. **Нагрузка на сервер:**
   - Повторные запросы к БД
   - Отсутствие кеширования на бэкенде
   - Вычислительные операции (расчет времени до стадии) выполняются каждый раз

---

## 💡 Предложения по оптимизации

### 🎯 Приоритет 1: Критичные улучшения

#### 1. **Внедрение WebSocket для реального времени**

**Технология:** FastAPI WebSocket + React hooks

**Преимущества:**
- ✅ Устранение polling
- ✅ Мгновенные обновления при изменениях
- ✅ Меньше нагрузки на сервер
- ✅ Меньше сетевого трафика

**Реализация:**

**Backend** (`telepets-platform/backend/api/websocket.py`):
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id].copy():
                try:
                    await connection.send_json(message)
                except:
                    self.active_connections[user_id].discard(connection)

manager = ConnectionManager()

@router.websocket("/ws/pets/{user_id}")
async def websocket_pets(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        # Отправляем начальное состояние
        async with get_db() as db:
            pets_data = await get_all_pets_summary_internal(user_id, db)
            await websocket.send_json({
                "type": "pets_update",
                "data": pets_data
            })
        
        # Ждем сообщений от клиента (heartbeat, подписки)
        while True:
            data = await websocket.receive_text()
            # Обработка команд от клиента
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Триггер отправки обновлений при изменениях
async def broadcast_pet_update(user_id: str, update_type: str, data: dict):
    await manager.send_personal_message({
        "type": update_type,  # "pet_updated", "stage_changed", "health_changed"
        "data": data
    }, user_id)
```

**Frontend** (`telepets-platform/frontends/webapp/src/hooks/usePetWebSocket.ts`):
```typescript
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { getStoredUserId } from '@/utils'

export function usePetWebSocket() {
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number>()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://telepets-api-docker.onrender.com'
    const wsUrl = API_BASE_URL.replace(/^https?/, 'wss').replace(/^http/, 'ws') + `/api/ws/pets/${userId}`
    
    function connect() {
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setIsConnected(true)
          console.log('WebSocket connected')
          // Отправляем heartbeat каждые 30 секунд
          const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping')
            }
          }, 30000)
          ws.addEventListener('close', () => clearInterval(heartbeat))
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            
            if (message.type === 'pets_update') {
              // Обновляем кеш React Query
              queryClient.setQueryData(['allPets', userId], message.data)
            } else if (message.type === 'pet_updated') {
              // Частичное обновление одного питомца
              queryClient.setQueryData(['allPets', userId], (old: any) => {
                if (!old?.pets) return old
                return {
                  ...old,
                  pets: old.pets.map((p: any) => 
                    p.id === message.data.id ? { ...p, ...message.data } : p
                  )
                }
              })
            } else if (message.type === 'stage_changed') {
              // Уведомление о переходе стадии
              queryClient.invalidateQueries(['allPets', userId])
            }
          } catch (e) {
            console.error('WebSocket message parse error:', e)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setIsConnected(false)
        }

        ws.onclose = () => {
          setIsConnected(false)
          // Автоматическое переподключение с экспоненциальной задержкой
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect()
          }, 5000)
        }
      } catch (e) {
        console.error('WebSocket connection error:', e)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [userId, queryClient])

  return { isConnected }
}
```

**Интеграция в существующие хуки:**
```typescript
// usePet.ts - отключаем polling при наличии WebSocket
export function useAllPets() {
  const userId = useMemo(() => getStoredUserId(), [])
  const { isConnected } = usePetWebSocket()

  const {
    data: petsData,
    isLoading,
    error,
  } = useQuery(['allPets', userId], () => petApi.getAllPets(userId), {
    // Отключаем polling если WebSocket подключен
    refetchInterval: isConnected ? false : 5000,
    refetchIntervalInBackground: false,
    staleTime: isConnected ? Infinity : 2000, // При WS данные всегда свежие
    cacheTime: 300000,
  })

  // ... остальной код
}
```

#### 2. **Кеширование на бэкенде (Redis)**

**Технология:** Redis + FastAPI Cache

**Реализация:**

```python
# telepets-platform/backend/cache/redis_client.py
import redis.asyncio as redis
from config.settings import REDIS_URL
import json
from typing import Optional, Any

redis_client = None

async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = await redis.from_url(REDIS_URL or "redis://localhost:6379")
    return redis_client

async def get_cached_pets(user_id: str) -> Optional[dict]:
    r = await get_redis()
    data = await r.get(f"pets:all:{user_id}")
    if data:
        return json.loads(data)
    return None

async def set_cached_pets(user_id: str, data: dict, ttl: int = 30):
    r = await get_redis()
    await r.setex(
        f"pets:all:{user_id}",
        ttl,
        json.dumps(data, default=str)
    )

async def invalidate_pets_cache(user_id: str):
    r = await get_redis()
    await r.delete(f"pets:all:{user_id}")
    await r.delete(f"pets:summary:{user_id}")
```

**Использование в endpoints:**
```python
@router.get("/all")
async def get_all_pets_summary(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    # Проверяем кеш
    cached = await get_cached_pets(user_id)
    if cached:
        # Проверяем ETag
        etag = request.headers.get("if-none-match")
        if etag == cached.get("etag"):
            return Response(status_code=304)
        return cached["data"]
    
    # Выполняем запрос к БД только если нет кеша
    result = await get_all_pets_summary_internal(user_id, db)
    
    # Сохраняем в кеш с ETag
    import hashlib
    etag = hashlib.md5(json.dumps(result, sort_keys=True).encode()).hexdigest()
    await set_cached_pets(user_id, {"data": result, "etag": etag}, ttl=30)
    
    return result
```

#### 3. **Оптимистичные обновления (Optimistic Updates)**

**Уже частично реализовано** в `usePet.ts`, но можно улучшить:

- ✅ Используется `queryClient.setQueryData` для мгновенного обновления UI
- ❌ Нет отката при ошибке
- ❌ Нет синхронизации с сервером после мутации

**Улучшение:**
```typescript
const healthUpMutation = useMutation(
  (petName?: string) => petApi.healthUp(userId, petName),
  {
    onMutate: async (petName) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries(['allPets', userId])
      
      // Сохраняем предыдущее значение для отката
      const previousData = queryClient.getQueryData(['allPets', userId])
      
      // Оптимистичное обновление
      queryClient.setQueryData(['allPets', userId], (old: any) => {
        if (!old?.pets) return old
        return {
          ...old,
          pets: old.pets.map((p: any) => {
            if (p.name === petName) {
              return { ...p, health: Math.min(100, p.health + 25) }
            }
            return p
          })
        }
      })
      
      return { previousData }
    },
    onError: (err, petName, context) => {
      // Откат при ошибке
      if (context?.previousData) {
        queryClient.setQueryData(['allPets', userId], context.previousData)
      }
      notifyError('Ошибка увеличения здоровья')
    },
    onSettled: () => {
      // Синхронизация с сервером после мутации
      queryClient.invalidateQueries(['allPets', userId])
    }
  }
)
```

---

### 🎯 Приоритет 2: Важные улучшения

#### 4. **Использование ETags и условных запросов**

**Backend:**
```python
from fastapi import Header, Response
from typing import Optional

@router.get("/all")
async def get_all_pets_summary(
    user_id: str,
    request: Request,
    if_none_match: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    # Вычисляем ETag на основе данных
    pets = await get_pets_from_db(user_id, db)
    data_hash = hashlib.md5(
        json.dumps(pets, sort_keys=True, default=str).encode()
    ).hexdigest()
    etag = f'"{data_hash}"'
    
    # Если клиент прислал тот же ETag - возвращаем 304
    if if_none_match == etag:
        return Response(status_code=304)
    
    result = await format_pets_response(pets, user_id, db)
    
    # Возвращаем данные с ETag
    return Response(
        content=json.dumps(result),
        headers={"ETag": etag, "Cache-Control": "private, max-age=30"}
    )
```

**Frontend:**
```typescript
// Автоматическое использование ETags через axios interceptor
api.interceptors.request.use((config) => {
  // Получаем сохраненный ETag для этого URL
  const cached = sessionStorage.getItem(`etag:${config.url}`)
  if (cached) {
    config.headers['If-None-Match'] = cached
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // Сохраняем ETag для следующего запроса
    const etag = response.headers['etag']
    if (etag && response.config.url) {
      sessionStorage.setItem(`etag:${response.config.url}`, etag)
    }
    return response
  },
  (error) => {
    // 304 Not Modified - данные не изменились, используем кеш
    if (error.response?.status === 304) {
      const cachedData = queryClient.getQueryData(
        extractQueryKey(error.config)
      )
      if (cachedData) {
        return { ...error.response, data: cachedData }
      }
    }
    return Promise.reject(error)
  }
)
```

#### 5. **Батчинг запросов (Request Batching)**

**Создание endpoint для батч-запросов:**
```python
@router.post("/batch")
async def batch_request(
    requests: List[dict],
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Выполняет несколько запросов одним запросом"""
    results = {}
    
    for req in requests:
        endpoint = req.get("endpoint")
        if endpoint == "pets":
            results["pets"] = await get_all_pets_summary_internal(user_id, db)
        elif endpoint == "wallet":
            results["wallet"] = await get_wallet_internal(user_id, db)
        elif endpoint == "summary":
            results["summary"] = await get_summary_internal(user_id, db)
    
    return results
```

**Frontend hook:**
```typescript
export function useBatchData() {
  const userId = useMemo(() => getStoredUserId(), [])
  
  return useQuery(
    ['batch', userId],
    () => api.post('/batch', {
      requests: [
        { endpoint: 'pets' },
        { endpoint: 'wallet' },
        { endpoint: 'summary' }
      ]
    }),
    {
      refetchInterval: 10000,
      select: (data) => ({
        pets: data.pets,
        wallet: data.wallet,
        summary: data.summary
      })
    }
  )
}
```

#### 6. **Умное уменьшение частоты polling**

**Адаптивный polling на основе активности:**
```typescript
export function useAdaptivePolling(queryKey: any[], queryFn: Function) {
  const [pollingInterval, setPollingInterval] = useState(5000)
  const { isConnected: isPageVisible } = usePageVisibility()
  const { isGameRunning } = useGameContext() // Если игра запущена
  
  // Увеличиваем интервал если:
  // - Игра запущена (приоритет производительности)
  // - Вкладка не активна
  useEffect(() => {
    if (isGameRunning) {
      setPollingInterval(30000) // 30 секунд во время игры
    } else if (!isPageVisible) {
      setPollingInterval(60000) // 1 минута в фоне
    } else {
      setPollingInterval(5000) // 5 секунд когда активно
    }
  }, [isGameRunning, isPageVisible])
  
  return useQuery(queryKey, queryFn, {
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
  })
}

function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden)
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  return { isConnected: isVisible }
}
```

#### 7. **Оптимизация запросов к БД**

**Использование JOIN вместо множественных запросов:**
```python
@router.get("/all")
async def get_all_pets_summary_optimized(user_id: str, db: AsyncSession):
    # Один запрос вместо двух
    result = await db.execute(
        select(Pet, Wallet)
        .outerjoin(Wallet, Wallet.user_id == Pet.user_id)
        .where(Pet.user_id == user_id)
        .order_by(Pet.created_at.desc())
    )
    
    # Группировка данных в памяти
    pets_data = []
    wallet = None
    
    for row in result:
        pet, wallet_row = row
        if wallet_row and not wallet:
            wallet = wallet_row
        # Обработка pet...
    
    return {"pets": pets_data, "wallet": wallet}
```

**Индексирование БД:**
```sql
-- Добавить индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_pet_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pet_user_status ON pets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallets(user_id);
```

---

### 🎯 Приоритет 3: Дополнительные улучшения

#### 8. **Server-Sent Events (SSE) как альтернатива WebSocket**

Для случаев, когда нужен только односторонний поток данных:

```python
from fastapi.responses import StreamingResponse

@router.get("/events/{user_id}")
async def stream_events(user_id: str):
    async def event_generator():
        while True:
            # Проверяем изменения каждые 5 секунд
            pets_data = await get_all_pets_summary_internal(user_id, db)
            yield f"data: {json.dumps(pets_data)}\n\n"
            await asyncio.sleep(5)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

#### 9. **Дебаунсинг и троттлинг запросов**

```typescript
import { useMemo } from 'react'

// Дебаунс для редких операций
function useDebouncedQuery(queryKey: any[], queryFn: Function, delay: number) {
  const debouncedKey = useMemo(
    () => debounce(() => queryKey, delay),
    [queryKey, delay]
  )
  
  return useQuery(debouncedKey, queryFn)
}

// Троттлинг для частых обновлений
function useThrottledRefetch(refetch: Function, delay: number) {
  const lastRefetchRef = useRef(0)
  
  return useCallback(() => {
    const now = Date.now()
    if (now - lastRefetchRef.current >= delay) {
      lastRefetchRef.current = now
      refetch()
    }
  }, [refetch, delay])
}
```

#### 10. **Использование React Query's `useQueries` для параллельных запросов**

```typescript
export function useAllPetData() {
  const userId = useMemo(() => getStoredUserId(), [])
  
  const queries = useQueries({
    queries: [
      {
        queryKey: ['pets', userId],
        queryFn: () => petApi.getAllPets(userId),
        refetchInterval: 5000,
      },
      {
        queryKey: ['wallet', userId],
        queryFn: () => economyApi.getWallet(userId),
        refetchInterval: 10000,
      },
      {
        queryKey: ['summary', userId],
        queryFn: () => petApi.getSummary(userId),
        refetchInterval: 10000,
      },
    ],
  })
  
  return {
    pets: queries[0],
    wallet: queries[1],
    summary: queries[2],
    isLoading: queries.some(q => q.isLoading),
  }
}
```

---

## 📈 Ожидаемые результаты

### После внедрения WebSocket + Redis:

| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Запросов/мин на пользователя | 24 | ~2 (только при изменениях) | **-92%** |
| Задержка обновлений | 5-10 сек | Мгновенно | **~100%** |
| Нагрузка на БД | Высокая | Низкая (кеш) | **-80%** |
| Торможение Phaser игр | Частое | Редкое | **-90%** |
| Сетевой трафик | Высокий | Низкий | **-85%** |

---

## 🛠 План внедрения

### Этап 1: Подготовка (1-2 дня)
1. ✅ Установка Redis на сервер
2. ✅ Настройка Redis клиента в backend
3. ✅ Добавление WebSocket поддержки в FastAPI

### Этап 2: Backend (2-3 дня)
1. ✅ Реализация WebSocket endpoint для pets
2. ✅ Добавление кеширования в Redis
3. ✅ Интеграция broadcast при изменениях (health_up, create, etc.)
4. ✅ Добавление ETag поддержки

### Этап 3: Frontend (2-3 дня)
1. ✅ Создание `usePetWebSocket` hook
2. ✅ Интеграция в существующие хуки
3. ✅ Отключение polling при активном WebSocket
4. ✅ Fallback на polling при отсутствии WebSocket

### Этап 4: Тестирование (1-2 дня)
1. ✅ Тестирование на разных браузерах
2. ✅ Проверка работы Phaser игр
3. ✅ Нагрузочное тестирование
4. ✅ Мониторинг производительности

### Этап 5: Оптимизации (1-2 дня)
1. ✅ Оптимизация запросов к БД
2. ✅ Добавление индексов
3. ✅ Настройка адаптивного polling
4. ✅ Финальная оптимизация

**Общее время:** 7-12 дней

---

## 🔧 Технические детали

### Зависимости для установки

**Backend:**
```txt
# requirements.txt
redis==5.0.1
aioredis==2.0.1
websockets==12.0
python-socketio==5.10.0  # Опционально, для более продвинутого WebSocket
```

**Frontend:**
```json
{
  "dependencies": {
    "reconnecting-websocket": "^4.4.0"  // Для автоматического переподключения
  }
}
```

### Конфигурация

**Backend settings:**
```python
# config/settings.py
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
WEBSOCKET_ENABLED = os.getenv("WEBSOCKET_ENABLED", "true").lower() == "true"
WEBSOCKET_PING_INTERVAL = int(os.getenv("WEBSOCKET_PING_INTERVAL", "30"))
CACHE_TTL_PETS = int(os.getenv("CACHE_TTL_PETS", "30"))
```

**Frontend env:**
```env
VITE_API_URL=https://telepets-api-docker.onrender.com
VITE_WS_ENABLED=true
VITE_FALLBACK_POLLING=true
```

---

## 📚 Рекомендации и best practices

### 1. **Градуальное внедрение**

Начать с WebSocket для самого критичного endpoint (`/api/summary/all`), затем расширить на другие.

### 2. **Graceful degradation**

Всегда иметь fallback на polling при отсутствии WebSocket поддержки или при ошибках подключения.

### 3. **Мониторинг**

Добавить метрики:
- Количество активных WebSocket соединений
- Частота обновлений через WebSocket vs polling
- Производительность Phaser игр (FPS)
- Задержка обновлений данных

### 4. **Безопасность**

- ✅ Авторизация WebSocket соединений
- ✅ Rate limiting для WebSocket
- ✅ Валидация всех входящих сообщений
- ✅ Защита от DDoS через WebSocket

### 5. **Производительность Phaser**

- Использовать `requestAnimationFrame` для игр
- Отдельный Web Worker для тяжелых вычислений (если нужно)
- Минимизация работы в основном потоке во время игры

---

## 🎯 Заключение

Текущая архитектура с агрессивным polling создает значительную нагрузку на систему и ухудшает UX, особенно при работе с Phaser играми.

**Рекомендуемый подход:**
1. **Немедленно:** Внедрить WebSocket для реального времени
2. **Параллельно:** Добавить Redis кеширование на бэкенде
3. **Постепенно:** Оптимизировать запросы к БД и добавить ETag поддержку

Этот подход обеспечит:
- ✅ Мгновенные обновления данных
- ✅ Снижение нагрузки на сервер на 80-90%
- ✅ Улучшение производительности Phaser игр
- ✅ Лучший пользовательский опыт

---

## 📖 Ссылки на документацию

- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [TanStack Query Real-time](https://tanstack.com/query/latest/docs/react/guides/realtime-updates)
- [React Query WebSocket Integration](https://tkdodo.eu/blog/practical-react-query#real-time-updates-with-websockets)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
- [HTTP Caching (ETag)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

**Документ подготовлен:** 2025-10-31  
**Версия:** 1.0  
**Статус:** Рекомендации готовы к реализации

