import { useEffect, useCallback, useState } from 'react'

/**
 * Хук для управления fullscreen режимом игры с поддержкой Telegram WebApp API
 * 
 * Best practices:
 * 1. Сначала expand viewport, затем requestFullscreen
 * 2. Проверка доступности методов через isAvailable
 * 3. Fallback на браузерный Fullscreen API
 * 4. Обработка событий fullscreen_changed и fullscreen_failed
 * 5. Автоматический выход при unmount
 */
export function useGameFullscreen(containerRef: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)

  // Проверка поддержки Telegram WebApp
  const getTelegramWebApp = useCallback(() => {
    if (typeof window === 'undefined') return null
    return (window as any).Telegram?.WebApp
  }, [])

  // Запрос fullscreen режима
  const requestFullscreen = useCallback(async () => {
    if (isRequestingFullscreen) return
    
    setIsRequestingFullscreen(true)
    setFullscreenError(null)

    try {
      const tg = getTelegramWebApp()
      
      // Проверяем поддержку Telegram fullscreen API
      const telegramSupportsFullscreen = tg && 
        typeof tg.requestFullscreen === 'function' &&
        tg.version && 
        parseFloat(tg.version) >= 6.1
      
      if (telegramSupportsFullscreen) {
        // Telegram WebApp: сначала expand, затем fullscreen
        console.log('🎮 [Fullscreen] Requesting via Telegram WebApp...')
        
        // Expand viewport если еще не expanded
        if (!tg.isExpanded) {
          tg.expand()
          console.log('📱 [Fullscreen] Viewport expanded')
        }

        // Request fullscreen через Telegram API
        await tg.requestFullscreen()
        setIsFullscreen(true)
        console.log('✅ [Fullscreen] Telegram fullscreen activated')
      } else {
        // Fallback: браузерный Fullscreen API
        console.log('🌐 [Fullscreen] Using Browser API (Telegram not supported or version < 6.1)...')
        
        // Все равно expand viewport если есть
        if (tg && !tg.isExpanded) {
          tg.expand()
          console.log('📱 [Fullscreen] Viewport expanded')
        }
        
        const el = containerRef.current
        if (!el) {
          console.warn('⚠️ [Fullscreen] Container not found, using CSS fullscreen')
          // Даже без браузерного API, CSS overlay работает
          setIsFullscreen(true)
          return
        }

        // Пытаемся браузерный fullscreen
        if (el.requestFullscreen) {
          await el.requestFullscreen()
          setIsFullscreen(true)
          console.log('✅ [Fullscreen] Browser fullscreen activated')
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen()
          setIsFullscreen(true)
          console.log('✅ [Fullscreen] Webkit fullscreen activated')
        } else {
          // Нет браузерного API - используем только CSS overlay
          console.log('ℹ️ [Fullscreen] Using CSS fullscreen overlay only')
          setIsFullscreen(true)
        }
      }
    } catch (error: any) {
      console.error('❌ [Fullscreen] Error:', error)
      // Даже при ошибке, CSS overlay работает
      console.log('ℹ️ [Fullscreen] Fallback to CSS fullscreen overlay')
      setIsFullscreen(true)
      setFullscreenError(null) // Не показываем ошибку, т.к. CSS работает
    } finally {
      setIsRequestingFullscreen(false)
    }
  }, [containerRef, getTelegramWebApp, isRequestingFullscreen])

  // Выход из fullscreen режима
  const exitFullscreen = useCallback(async () => {
    try {
      const tg = getTelegramWebApp()
      
      // Проверяем поддержку Telegram exitFullscreen API (версия 6.1+)
      const telegramSupportsExitFullscreen = tg && 
        typeof tg.exitFullscreen === 'function' &&
        tg.version && 
        parseFloat(tg.version) >= 6.1

      if (telegramSupportsExitFullscreen) {
        console.log('🚪 [Fullscreen] Exiting via Telegram WebApp...')
        await tg.exitFullscreen()
        setIsFullscreen(false)
        console.log('✅ [Fullscreen] Telegram fullscreen exited')
      } else if (document.fullscreenElement) {
        console.log('🚪 [Fullscreen] Exiting via Browser API...')
        await document.exitFullscreen()
        setIsFullscreen(false)
        console.log('✅ [Fullscreen] Browser fullscreen exited')
      } else {
        // Даже если нет браузерного fullscreen, убираем состояние
        console.log('ℹ️ [Fullscreen] Exiting CSS fullscreen')
        setIsFullscreen(false)
      }
    } catch (error) {
      // Ошибка не критична - CSS overlay все равно закроется
      console.log('ℹ️ [Fullscreen] Exit completed with fallback')
      setIsFullscreen(false)
    }
  }, [getTelegramWebApp])

  // Обработка событий Telegram WebApp
  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    const handleFullscreenChanged = (data: any) => {
      console.log('📱 [Fullscreen] Changed event:', data)
      setIsFullscreen(data?.is_fullscreen ?? false)
    }

    const handleFullscreenFailed = (data: any) => {
      console.error('❌ [Fullscreen] Failed event:', data)
      setFullscreenError(data?.error || 'Fullscreen request failed')
      setIsFullscreen(false)
      setIsRequestingFullscreen(false)
    }

    // Подписка на события (если есть API для этого)
    if (typeof tg.onEvent === 'function') {
      tg.onEvent('fullscreen_changed', handleFullscreenChanged)
      tg.onEvent('fullscreen_failed', handleFullscreenFailed)
    }

    return () => {
      if (typeof tg.offEvent === 'function') {
        tg.offEvent('fullscreen_changed', handleFullscreenChanged)
        tg.offEvent('fullscreen_failed', handleFullscreenFailed)
      }
    }
  }, [getTelegramWebApp])

  // Обработка браузерных событий fullscreen
  useEffect(() => {
    const handleBrowserFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(document.fullscreenElement)
      setIsFullscreen(isCurrentlyFullscreen)
      console.log('🌐 [Fullscreen] Browser state changed:', isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleBrowserFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleBrowserFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleBrowserFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleBrowserFullscreenChange)
    }
  }, [])

  // Автоматический выход из fullscreen при unmount
  // ВАЖНО: Пустой массив зависимостей - cleanup только при размонтировании!
  useEffect(() => {
    return () => {
      // Используем async для корректного выхода
      const cleanup = async () => {
        const tg = (window as any).Telegram?.WebApp
        const telegramSupportsFullscreen = tg && 
          typeof tg.exitFullscreen === 'function' &&
          tg.version && 
          parseFloat(tg.version) >= 6.1
        
        if (telegramSupportsFullscreen) {
          try {
            await tg.exitFullscreen()
            console.log('🚪 [Fullscreen] Cleanup: Telegram fullscreen exited')
          } catch (e) {
            console.log('ℹ️ [Fullscreen] Cleanup: Telegram exit not available')
          }
        } else if (document.fullscreenElement) {
          try {
            await document.exitFullscreen()
            console.log('🚪 [Fullscreen] Cleanup: Browser fullscreen exited')
          } catch (e) {
            console.log('ℹ️ [Fullscreen] Cleanup: Browser exit failed')
          }
        } else {
          console.log('ℹ️ [Fullscreen] Cleanup: Already exited')
        }
      }
      cleanup()
    }
  }, []) // Пустой массив - cleanup ТОЛЬКО при unmount

  return {
    isFullscreen,
    isRequestingFullscreen,
    fullscreenError,
    requestFullscreen,
    exitFullscreen,
  }
}

export default useGameFullscreen

