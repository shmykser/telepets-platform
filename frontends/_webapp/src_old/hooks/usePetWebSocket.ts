/**
 * WebSocket hook для real-time обновлений данных питомцев.
 * 
 * Подключается к WebSocket серверу и автоматически обновляет кеш React Query
 * при получении обновлений от сервера.
 * 
 * ВАЖНО: Используется singleton паттерн - только одно подключение для всего приложения.
 */
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { getStoredUserId } from '@/utils'
import { buildUrl } from '@/config/endpoints'

interface WebSocketMessage {
  type: 'pets_update' | 'pet_created' | 'health_changed' | 'stage_changed' | 'wallet_updated' | 'auctions_updated' | 'ping' | 'error'
  data: any
  timestamp?: string
}

// Глобальный singleton для WebSocket - один экземпляр на все приложение
let globalWebSocket: WebSocket | null = null
let globalReconnectTimeout: number | null = null
let globalReconnectAttempts = 0
let globalHeartbeatInterval: number | null = null
let globalIsConnected = false
let globalUserId: string | null = null
const subscribers = new Set<() => void>() // Подписчики на изменения состояния
const queryClientSubscribers = new Set<any>() // Подписчики queryClient для обработки сообщений

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 3000 // 3 секунды
const HEARTBEAT_INTERVAL = 30000 // 30 секунд

// Функция для уведомления всех подписчиков об изменении состояния
function notifySubscribers() {
  subscribers.forEach(callback => callback())
}

// Функция для обработки сообщений WebSocket
function handleWebSocketMessage(event: MessageEvent, userId: string) {
  try {
    let message: WebSocketMessage
    
    if (typeof event.data === 'string') {
      if (event.data === 'pong') {
        return // Heartbeat ответ, игнорируем
      }
      message = JSON.parse(event.data)
    } else {
      console.warn('[WebSocket] Получены бинарные данные, игнорируем')
      return
    }

    console.log('📨 [WebSocket] Получено сообщение:', message.type, message.data)

    // Уведомляем все зарегистрированные queryClient о сообщении
    queryClientSubscribers.forEach(({ queryClient, userId: subUserId }) => {
      if (subUserId !== userId) return

      switch (message.type) {
        case 'pets_update':
          queryClient.setQueryData(['allPets', userId], message.data)
          if (message.data?.pets?.[0]) {
            queryClient.setQueryData(['pet', userId], {
              ...message.data.pets[0],
              wallet: message.data.wallet,
            })
          }
          break

        case 'pet_created':
          queryClient.invalidateQueries(['allPets', userId])
          queryClient.invalidateQueries(['pet', userId])
          break

        case 'health_changed':
          queryClient.setQueryData(['allPets', userId], (oldData: any) => {
            if (!oldData?.pets) return oldData
            return {
              ...oldData,
              pets: oldData.pets.map((p: any) =>
                p.id === message.data.pet_id || p.name === message.data.pet_name
                  ? { ...p, ...message.data, updated_at: message.timestamp || new Date().toISOString() }
                  : p
              ),
            }
          })
          queryClient.setQueryData(['pet', userId], (oldData: any) => {
            if (!oldData || (oldData.id !== message.data.pet_id && oldData.name !== message.data.pet_name)) {
              return oldData
            }
            return {
              ...oldData,
              health: message.data.health,
              stage: message.data.stage || oldData.stage,
            }
          })
          break

        case 'stage_changed':
          console.log('🔄 [WebSocket] Переход стадии:', message.data)
          queryClient.invalidateQueries(['allPets', userId])
          queryClient.invalidateQueries(['pet', userId])
          break

        case 'wallet_updated':
          queryClient.setQueryData(['wallet', userId], message.data)
          queryClient.setQueryData(['allPets', userId], (oldData: any) => {
            if (!oldData) return oldData
            return {
              ...oldData,
              wallet: message.data,
            }
          })
          queryClient.setQueryData(['pet', userId], (oldData: any) => {
            if (!oldData) return oldData
            return {
              ...oldData,
              wallet: message.data,
            }
          })
          break

        case 'auctions_updated':
          if (message.data && message.data.items) {
            queryClient.setQueriesData(['auctions'], (oldData: any) => {
              if (!oldData) return oldData
              if (oldData.items && Array.isArray(oldData.items)) {
                return {
                  ...oldData,
                  items: message.data.items,
                  page: message.data.page || oldData.page,
                  page_size: message.data.page_size || oldData.page_size,
                }
              }
              return oldData
            })
          } else {
            queryClient.invalidateQueries(['auctions'])
          }
          break

        case 'ping':
          if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
            globalWebSocket.send('pong')
          }
          break

        case 'error':
          console.error('❌ [WebSocket] Ошибка от сервера:', message.data)
          break

        default:
          console.warn('⚠️ [WebSocket] Неизвестный тип сообщения:', message.type)
      }
    })
  } catch (e) {
    console.error('❌ [WebSocket] Ошибка обработки сообщения:', e, event.data)
  }
}

// Функция для подключения WebSocket
function connectWebSocket(userId: string) {
  if (!userId) {
    console.warn('[WebSocket] userId не найден')
    return
  }

  // Если уже подключены для этого пользователя, не создаем новое подключение
  if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN && globalUserId === userId) {
    console.log('[WebSocket] Уже подключено для пользователя', userId)
    return
  }

  // Закрываем существующее соединение если есть
  if (globalWebSocket) {
    try {
      globalWebSocket.close()
    } catch (e) {
      // Игнорируем ошибки закрытия
    }
    globalWebSocket = null
  }

  try {
    const apiBase = buildUrl.api('').replace(/\/api$/, '')
    const wsUrl = apiBase
      .replace(/^https/, 'wss')
      .replace(/^http/, 'ws')
      + `/api/ws/pets/${userId}`

    console.log('🔌 [WebSocket] Подключение к:', wsUrl)

    const ws = new WebSocket(wsUrl)
    globalWebSocket = ws
    globalUserId = userId

    ws.onopen = () => {
      console.log('✅ [WebSocket] Подключено')
      globalIsConnected = true
      globalReconnectAttempts = 0
      notifySubscribers()

      // Запускаем heartbeat
      if (globalHeartbeatInterval) {
        clearInterval(globalHeartbeatInterval)
      }
      globalHeartbeatInterval = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, HEARTBEAT_INTERVAL)
    }

    ws.onmessage = (event) => {
      handleWebSocketMessage(event, userId)
    }

    ws.onerror = (error) => {
      console.error('❌ [WebSocket] Ошибка соединения:', error)
      globalIsConnected = false
      notifySubscribers()
    }

    ws.onclose = (event) => {
      console.log('🔌 [WebSocket] Соединение закрыто', event.code, event.reason)
      globalIsConnected = false
      globalWebSocket = null
      notifySubscribers()

      // Очищаем heartbeat
      if (globalHeartbeatInterval) {
        clearInterval(globalHeartbeatInterval)
        globalHeartbeatInterval = null
      }

      // Автоматическое переподключение с экспоненциальной задержкой
      if (globalReconnectAttempts < MAX_RECONNECT_ATTEMPTS && globalUserId === userId) {
        const delay = RECONNECT_DELAY * Math.pow(2, globalReconnectAttempts)
        globalReconnectAttempts++
        
        console.log(`🔄 [WebSocket] Переподключение через ${delay}мс (попытка ${globalReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
        
        globalReconnectTimeout = window.setTimeout(() => {
          if (globalUserId === userId) {
            connectWebSocket(userId)
          }
        }, delay)
      } else {
        if (globalUserId === userId) {
          console.warn('⚠️ [WebSocket] Достигнуто максимальное количество попыток переподключения')
        }
      }
    }
  } catch (e) {
    console.error('❌ [WebSocket] Ошибка создания соединения:', e)
    globalIsConnected = false
    notifySubscribers()
  }
}

export function usePetWebSocket() {
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const [isConnected, setIsConnected] = useState(globalIsConnected)
  const subscriberRef = useRef<() => void>()

  // Подписываемся на изменения состояния
  useEffect(() => {
    subscriberRef.current = () => {
      setIsConnected(globalIsConnected)
    }
    subscribers.add(subscriberRef.current)

    // Регистрируем queryClient для обработки сообщений
    const queryClientSub = { queryClient, userId }
    queryClientSubscribers.add(queryClientSub)

    return () => {
      if (subscriberRef.current) {
        subscribers.delete(subscriberRef.current)
      }
      queryClientSubscribers.delete(queryClientSub)
    }
  }, [queryClient, userId])

  // Подключаемся при монтировании или изменении userId
  useEffect(() => {
    if (!userId) {
      return
    }

    connectWebSocket(userId)

    // Cleanup при размонтировании (но НЕ закрываем WebSocket, если его еще используют другие компоненты)
    return () => {
      // Проверяем, есть ли еще подписчики
      if (subscribers.size === 0 && globalWebSocket) {
        if (globalReconnectTimeout) {
          clearTimeout(globalReconnectTimeout)
          globalReconnectTimeout = null
        }
        if (globalHeartbeatInterval) {
          clearInterval(globalHeartbeatInterval)
          globalHeartbeatInterval = null
        }
        try {
          globalWebSocket.close()
        } catch (e) {
          // Игнорируем ошибки
        }
        globalWebSocket = null
        globalIsConnected = false
        globalUserId = null
      }
    }
  }, [userId])

  return {
    isConnected,
    connectionError: null,
    reconnect: () => {
      globalReconnectAttempts = 0
      if (userId) {
        connectWebSocket(userId)
      }
    },
  }
}
