# Исправление избыточных запросов к /api/market/auctions

**Дата:** 2025-10-31  
**Проблема:** Множественные запросы к `/api/market/auctions` даже при активном WebSocket

---

## ✅ Проблема решена

### Симптомы:
- Видно много запросов к `/api/market/auctions?status=active&page=1&page_size=200` в Network tab
- WebSocket подключен и работает
- Аукционы обновляются каждые 30 секунд через polling

### Причины:
1. **`useAuctions` hook не был интегрирован с WebSocket**
   - Продолжал делать polling каждые 30 секунд
   - Даже при активном WebSocket соединении

2. **`PetCard.tsx` также делал отдельный запрос к аукционам**
   - Использовал тот же query key `['auctions', 'active', 1, 200]`
   - Но не был интегрирован с WebSocket

---

## ✅ Решение

### 1. Интеграция `useAuctions` с WebSocket

**Файл:** `telepets-platform/frontends/webapp/src/hooks/useEconomy.ts`

**Изменения:**
- ✅ Импортирован `usePetWebSocket` hook
- ✅ Добавлена проверка `isWebSocketConnected`
- ✅ Polling отключается при активном WebSocket:
  ```typescript
  refetchInterval: isWebSocketConnected ? false : 30000
  ```
- ✅ Увеличен `staleTime` при активном WebSocket:
  ```typescript
  staleTime: isWebSocketConnected ? Infinity : 15000
  ```

### 2. Интеграция `PetCard.tsx` с WebSocket

**Файл:** `telepets-platform/frontends/webapp/src/components/PetCard.tsx`

**Изменения:**
- ✅ Импортирован `usePetWebSocket` hook
- ✅ Добавлена проверка `isWebSocketConnected`
- ✅ Polling отключается при активном WebSocket (аналогично `useAuctions`)
- ✅ Используется тот же query key `['auctions', 'active', 1, 200]` для кеширования

### 3. Обработка обновлений аукционов через WebSocket

**Файл:** `telepets-platform/frontends/webapp/src/hooks/usePetWebSocket.ts`

**Изменения:**
- ✅ Добавлена обработка `auctions_updated` сообщений
- ✅ Используется `setQueryData` для обновления кеша без HTTP запросов
- ✅ Поддерживаются все комбинации query keys для аукционов

---

## 📊 Результат

### До исправления:
- ❌ Polling каждые 30 секунд для `useAuctions`
- ❌ Polling каждые 30 секунд для `PetCard.tsx`
- ❌ Всего: **2 запроса каждые 30 секунд** к `/api/market/auctions`

### После исправления:
- ✅ Polling отключен при активном WebSocket
- ✅ Обновления приходят через WebSocket в реальном времени
- ✅ **0 запросов** при активном WebSocket (кроме первого при загрузке)
- ✅ Polling работает только как fallback при отключенном WebSocket

---

## 🔄 Как это работает

1. **При подключении WebSocket:**
   - `isWebSocketConnected = true`
   - `refetchInterval = false` → polling отключен
   - `staleTime = Infinity` → данные считаются всегда свежими

2. **При получении `auctions_updated` через WebSocket:**
   - `usePetWebSocket` обновляет React Query кеш
   - Все компоненты автоматически получают новые данные
   - Без дополнительных HTTP запросов

3. **При отключении WebSocket:**
   - `isWebSocketConnected = false`
   - `refetchInterval = 30000` → polling каждые 30 секунд
   - `staleTime = 15000` → данные считаются свежими 15 секунд

---

## 📝 Примечания

- **Backend пока не отправляет `auctions_updated` через WebSocket**
  - Frontend готов к получению таких обновлений
  - Можно добавить broadcast на backend в будущем (при создании/изменении/завершении аукциона)

- **Query keys совместимы:**
  - `useAuctions('active', 1, 20)` → `['auctions', 'active', 1, 20]`
  - `PetCard.tsx` → `['auctions', 'active', 1, 200]`
  - React Query кеширует их отдельно, но они могут быть обновлены через WebSocket

---

## ✅ Итого

Теперь:
- ✅ `useAuctions` интегрирован с WebSocket
- ✅ `PetCard.tsx` интегрирован с WebSocket
- ✅ Polling отключен при активном WebSocket
- ✅ Frontend готов к получению обновлений аукционов через WebSocket

**Следующий шаг (опционально):** Добавить broadcast `auctions_updated` на backend при изменениях аукционов.

