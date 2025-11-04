/**
 * Хук для адаптивного polling на основе состояния приложения.
 * 
 * Увеличивает интервал polling во время Phaser игр для улучшения производительности.
 */
import { useState, useEffect, useMemo } from 'react'
import { usePetWebSocket } from './usePetWebSocket'

/**
 * Хук для отслеживания видимости страницы (Page Visibility API)
 */
function usePageVisibility(): boolean {
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

  return isVisible
}

/**
 * Хук для отслеживания активности Phaser игр
 * 
 * Проверяет наличие активных Phaser игр через:
 * - canvas элементы (Phaser использует canvas)
 * - элементы с классами игр (GameWindow, phaser-game)
 * - fullscreen режим (часто используется для игр)
 */
function useGameActive(): boolean {
  const [isGameActive, setIsGameActive] = useState(false)

  useEffect(() => {
    const checkGameActive = () => {
      // Проверяем fullscreen режим (игры часто используют fullscreen)
      const isFullscreen = !!document.fullscreenElement
      
      // Проверяем наличие активных canvas элементов (Phaser использует canvas)
      const canvases = document.querySelectorAll('canvas')
      const hasActiveCanvas = Array.from(canvases).some((canvas) => {
        const rect = canvas.getBoundingClientRect()
        const style = window.getComputedStyle(canvas)
        // Canvas считается активным если:
        // - Видим на экране (размер > 0)
        // - Не скрыт (display !== 'none')
        // - Не прозрачен (opacity > 0)
        return rect.width > 100 && rect.height > 100 && 
               style.display !== 'none' &&
               parseFloat(style.opacity) > 0
      })
      
      // Проверяем наличие контейнеров игр
      const gameContainers = document.querySelectorAll('[class*="game"], [class*="Game"], [id*="game"]')
      const hasGameContainer = Array.from(gameContainers).some((el) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)
        return rect.width > 0 && rect.height > 0 && 
               style.display !== 'none'
      })
      
      setIsGameActive(isFullscreen || hasActiveCanvas || hasGameContainer)
    }

    // Проверяем каждые 2 секунды
    const interval = setInterval(checkGameActive, 2000)
    checkGameActive() // Первая проверка
    
    // Также слушаем события fullscreen
    document.addEventListener('fullscreenchange', checkGameActive)
    document.addEventListener('webkitfullscreenchange', checkGameActive)
    document.addEventListener('mozfullscreenchange', checkGameActive)

    return () => {
      clearInterval(interval)
      document.removeEventListener('fullscreenchange', checkGameActive)
      document.removeEventListener('webkitfullscreenchange', checkGameActive)
      document.removeEventListener('mozfullscreenchange', checkGameActive)
    }
  }, [])

  return isGameActive
}

/**
 * Основной хук для адаптивного polling
 * 
 * Возвращает интервал polling на основе:
 * - WebSocket подключения (polling отключен если подключен)
 * - Активности игры (больший интервал во время игры)
 * - Видимости страницы (больший интервал в фоне)
 */
export function useAdaptivePollingInterval(
  baseInterval: number = 10000, // Базовый интервал (10 секунд)
  gameInterval: number = 30000,  // Интервал во время игры (30 секунд)
  backgroundInterval: number = 60000 // Интервал в фоне (60 секунд)
): number | false {
  const { isConnected: isWebSocketConnected } = usePetWebSocket()
  const isPageVisible = usePageVisibility()
  const isGameActive = useGameActive()

  return useMemo(() => {
    // Если WebSocket подключен - polling отключен
    if (isWebSocketConnected) {
      return false
    }

    // Если игра активна - используем больший интервал
    if (isGameActive) {
      return gameInterval
    }

    // Если страница в фоне - используем еще больший интервал
    if (!isPageVisible) {
      return backgroundInterval
    }

    // В остальных случаях - базовый интервал
    return baseInterval
  }, [isWebSocketConnected, isPageVisible, isGameActive, baseInterval, gameInterval, backgroundInterval])
}

/**
 * Хук для использования в компонентах с адаптивным polling
 * 
 * Использование:
 * ```tsx
 * const pollingInterval = useAdaptivePollingInterval()
 * const { data } = useQuery(['key'], fetchFn, {
 *   refetchInterval: pollingInterval
 * })
 * ```
 */
export default useAdaptivePollingInterval

