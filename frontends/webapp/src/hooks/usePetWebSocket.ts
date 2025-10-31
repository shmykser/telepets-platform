/**
 * WebSocket hook для real-time обновлений данных питомцев.
 * 
 * Подключается к WebSocket серверу и автоматически обновляет кеш React Query
 * при получении обновлений от сервера.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from 'react-query'
import { getStoredUserId } from '@/utils'
import { buildUrl } from '@/config/endpoints'

interface WebSocketMessage {
  type: 'pets_update' | 'pet_created' | 'health_changed' | 'stage_changed' | 'wallet_updated' | 'ping' | 'error'
  data: any
  timestamp?: string
}

export function usePetWebSocket() {
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const heartbeatIntervalRef = useRef<number | null>(null)

  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY = 3000 // 3 секунды
  const HEARTBEAT_INTERVAL = 30000 // 30 секунд

  const connect = useCallback(() => {
    if (!userId) {
      console.warn('usePetWebSocket: userId не найден')
      return
    }

    // Закрываем существующее соединение если есть
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (e) {
        // Игнорируем ошибки закрытия
      }
    }

    try {
      // Получаем API URL и конвертируем в WebSocket URL
      // buildUrl.api('') возвращает что-то вроде 'https://telepets-api-docker.onrender.com/api'
      // Нужно убрать /api и заменить https на wss
      const apiBase = buildUrl.api('').replace(/\/api$/, '') // Убираем /api префикс
      const wsUrl = apiBase
        .replace(/^https/, 'wss')
        .replace(/^http/, 'ws')
        + `/api/ws/pets/${userId}`

      console.log('🔌 [WebSocket] Подключение к:', wsUrl)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ [WebSocket] Подключено')
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0

        // Запускаем heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, HEARTBEAT_INTERVAL)
      }

      ws.onmessage = (event) => {
        try {
          // Обрабатываем текстовые и JSON сообщения
          let message: WebSocketMessage
          
          if (typeof event.data === 'string') {
            // Простой текст (например, "pong")
            if (event.data === 'pong') {
              return // Heartbeat ответ, игнорируем
            }
            
            // JSON сообщение
            message = JSON.parse(event.data)
          } else {
            // Бинарные данные - не ожидаем
            console.warn('[WebSocket] Получены бинарные данные, игнорируем')
            return
          }

          console.log('📨 [WebSocket] Получено сообщение:', message.type, message.data)

          // Обрабатываем разные типы сообщений
          switch (message.type) {
            case 'pets_update':
              // Полное обновление всех питомцев
              queryClient.setQueryData(['allPets', userId], message.data)
              // Также обновляем summary если есть активный питомец
              if (message.data?.pets?.[0]) {
                queryClient.setQueryData(['pet', userId], {
                  ...message.data.pets[0],
                  wallet: message.data.wallet,
                })
              }
              break

            case 'pet_created':
              // Создан новый питомец - инвалидируем запросы чтобы получить свежие данные
              queryClient.invalidateQueries(['allPets', userId])
              queryClient.invalidateQueries(['pet', userId])
              break

            case 'health_changed':
              // Изменилось здоровье - обновляем конкретного питомца
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
              // Обновляем summary если это активный питомец
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
              // Переход стадии - полная инвалидация для получения новых данных
              console.log('🔄 [WebSocket] Переход стадии:', message.data)
              queryClient.invalidateQueries(['allPets', userId])
              queryClient.invalidateQueries(['pet', userId])
              break

            case 'wallet_updated':
              // Обновление кошелька - используем setQueryData вместо invalidateQueries,
              // чтобы не вызывать лишний HTTP запрос при активном WebSocket
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
              // Обновление аукционов - используем setQueryData для обновления всех активных query ключей
              // Поддерживаем различные комбинации status, page, pageSize
              if (message.data && message.data.items) {
                // Обновляем все возможные комбинации query keys для аукционов
                queryClient.setQueriesData(['auctions'], (oldData: any) => {
                  if (!oldData) return oldData
                  // Если данные соответствуют структуре ответа API
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
                // Если данных нет, инвалидируем все запросы аукционов
                queryClient.invalidateQueries(['auctions'])
              }
              break

            case 'error':
              console.error('❌ [WebSocket] Ошибка от сервера:', message.data)
              break

            case 'ping':
              // Ping от сервера - отвечаем pong
              if (ws.readyState === WebSocket.OPEN) {
                ws.send('pong')
              }
              break

            default:
              console.warn('⚠️ [WebSocket] Неизвестный тип сообщения:', message.type)
          }
        } catch (e) {
          console.error('❌ [WebSocket] Ошибка обработки сообщения:', e, event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ [WebSocket] Ошибка соединения:', error)
        setConnectionError('Ошибка WebSocket соединения')
        setIsConnected(false)
      }

      ws.onclose = (event) => {
        console.log('🔌 [WebSocket] Соединение закрыто', event.code, event.reason)
        setIsConnected(false)

        // Очищаем heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // Автоматическое переподключение с экспоненциальной задержкой
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current++
          
          console.log(`🔄 [WebSocket] Переподключение через ${delay}мс (попытка ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`)
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.warn('⚠️ [WebSocket] Достигнуто максимальное количество попыток переподключения')
          setConnectionError('Не удалось подключиться к серверу')
        }
      }
    } catch (e) {
      console.error('❌ [WebSocket] Ошибка создания соединения:', e)
      setConnectionError('Ошибка создания WebSocket соединения')
      setIsConnected(false)
    }
  }, [userId, queryClient])

  // Подключаемся при монтировании или изменении userId
  useEffect(() => {
    if (!userId) {
      return
    }

    connect()

    // Cleanup при размонтировании
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch (e) {
          // Игнорируем ошибки
        }
        wsRef.current = null
      }
      setIsConnected(false)
    }
  }, [userId, connect])

  return {
    isConnected,
    connectionError,
    reconnect: () => {
      reconnectAttemptsRef.current = 0
      connect()
    },
  }
}

