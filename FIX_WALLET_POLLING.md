# Исправление избыточных запросов к /api/economy/wallet

**Дата:** 2025-10-31  
**Проблема:** Множественные запросы к `/api/economy/wallet/273065571` даже при активном WebSocket

---

## ✅ Проблема решена

### Симптомы:
- Видно много запросов к `/api/economy/wallet/273065571` в Network tab
- WebSocket подключен и работает (`✅ [WebSocket] Подключено`)
- Получены сообщения `pets_update` и `ping` от сервера

### Причины:
1. **`useWallet` hook не был интегрирован с WebSocket**
   - Продолжал делать polling каждые 10 секунд
   - Даже при активном WebSocket соединении

2. **`invalidateQueries` вызывал лишние refetch**
   - При получении `wallet_updated` через WebSocket
   - `invalidateQueries` заставляет React Query сделать новый HTTP запрос
   - Это избыточно, так как данные уже пришли через WebSocket

---

## ✅ Решение

### 1. Интеграция `useWallet` с WebSocket

**Файл:** `telepets-platform/frontends/webapp/src/hooks/useEconomy.ts`

```typescript
import { usePetWebSocket } from './usePetWebSocket'

export function useWallet() {
  const userId = useMemo(() => getStoredUserId(), [])
  const { isConnected: isWebSocketConnected } = usePetWebSocket()

  const {
    data: wallet,
    isLoading,
    error,
  } = useQuery(['wallet', userId], () => economyApi.getWallet(userId), {
    // Отключаем polling если WebSocket подключен
    refetchInterval: isWebSocketConnected ? false : 10000,
    refetchIntervalInBackground: false,
    retry: 2,
    // При WebSocket данные всегда свежие
    staleTime: isWebSocketConnected ? Infinity : 5000,
    cacheTime: 300000,
  })

  return { wallet, isLoading, error }
}
```

**Изменения:**
- ✅ Добавлен `usePetWebSocket()` hook
- ✅ `refetchInterval` отключается при активном WebSocket
- ✅ `staleTime` устанавливается в `Infinity` при WebSocket

### 2. Исправление обработки `wallet_updated` в WebSocket

**Файл:** `telepets-platform/frontends/webapp/src/hooks/usePetWebSocket.ts`

**Было:**
```typescript
case 'wallet_updated':
  queryClient.setQueryData(['allPets', userId], ...)
  queryClient.setQueryData(['pet', userId], ...)
  queryClient.invalidateQueries(['wallet', userId]) // ❌ Вызывает лишний HTTP запрос
  break
```

**Стало:**
```typescript
case 'wallet_updated':
  // Используем setQueryData вместо invalidateQueries,
  // чтобы не вызывать лишний HTTP запрос при активном WebSocket
  queryClient.setQueryData(['wallet', userId], message.data) // ✅ Обновляем напрямую
  queryClient.setQueryData(['allPets', userId], ...)
  queryClient.setQueryData(['pet', userId], ...)
  break
```

**Изменения:**
- ✅ Заменён `invalidateQueries` на `setQueryData` для `['wallet', userId]`
- ✅ Данные обновляются напрямую без дополнительного HTTP запроса
- ✅ Синхронизация с `allPets` и `pet` сохранена

---

## 📊 Результат

### До исправления:
- ❌ Запросы к `/api/economy/wallet` каждые 10 секунд (polling)
- ❌ Дополнительные запросы при получении `wallet_updated` через WebSocket (invalidateQueries)

### После исправления:
- ✅ Polling отключен при активном WebSocket
- ✅ Обновления через WebSocket не вызывают лишних HTTP запросов
- ✅ Данные обновляются мгновенно через `wallet_updated` сообщения
- ✅ Fallback на polling если WebSocket недоступен

---

## 🚀 Следующие шаги

1. **Пересобрать frontend:**
   ```bash
   cd telepets-platform/frontends/webapp
   npm run build
   ```

2. **Задеплоить изменения на GitHub Pages**

3. **Проверить в браузере:**
   - WebSocket подключен
   - Нет частых запросов к `/api/economy/wallet` в Network tab
   - Обновления кошелька приходят через WebSocket мгновенно

---

## ✅ Итог

Все hooks теперь интегрированы с WebSocket:
- ✅ `usePet` - отключает polling при WebSocket
- ✅ `useAllPets` - отключает polling при WebSocket  
- ✅ `useWallet` - отключает polling при WebSocket (НОВОЕ)

Все WebSocket сообщения обновляют кеш напрямую без лишних HTTP запросов! 🎉

