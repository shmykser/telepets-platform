import { useEffect, useRef, useState } from 'react'
import { Pet } from '@/types'
import { useGameFullscreen } from '@/hooks/games/useGameFullscreen'
import { buildUrl, ENV_INFO } from '@/config/endpoints'

interface EggDefenderGameProps {
  pet: Pet
  onGameEnd: (score: number) => void
  onClose: () => void
}

export default function EggDefenderGame({ pet, onGameEnd, onClose }: EggDefenderGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [hasRequestedFullscreen, setHasRequestedFullscreen] = useState(false)

  const { 
    isFullscreen, 
    isRequestingFullscreen, 
    fullscreenError,
    requestFullscreen 
  } = useGameFullscreen(containerRef)

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalWidth = document.body.style.width
    const originalHeight = document.body.style.height

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.classList.add('game-fullscreen-active')

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.width = originalWidth
      document.body.style.height = originalHeight
      document.body.classList.remove('game-fullscreen-active')
    }
  }, [])

  useEffect(() => {
    if (hasRequestedFullscreen) return
    setHasRequestedFullscreen(true)
    requestFullscreen()
  }, [hasRequestedFullscreen, requestFullscreen])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.BackButton) return

    const version = tg.version ? parseFloat(tg.version) : 0
    if (version < 6.1) return

    const handleBackButton = () => setConfirmExit(true)
    try {
      tg.BackButton.onClick(handleBackButton)
      tg.BackButton.show()
    } catch {}

    return () => {
      try {
        tg.BackButton.offClick(handleBackButton)
        tg.BackButton.hide()
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || iframeRef.current) return

    const loadGame = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const iframe = document.createElement('iframe')
        iframeRef.current = iframe

        const gameUrl = buildUrl.game({
          pet_name: pet.name || '',
          user_id: pet.user_id || '',
          game_type: 'egg_defense',
        })

        console.log('🎮 [EggDefenderGame] Loading game from:', gameUrl)
        console.log('🎮 [EggDefenderGame] Pet:', { name: pet.name, user_id: pet.user_id })
        iframe.src = gameUrl
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.border = 'none'
        iframe.style.display = 'block'
        iframe.allow = 'fullscreen'
        iframe.setAttribute('allowfullscreen', 'true')

        const handleMessage = (event: MessageEvent) => {
          if (ENV_INFO.isDev) {
            if (!event.origin.startsWith('http://localhost:')) return
          } else {
            if (event.origin !== window.location.origin) return
          }

          if (event.data.type === 'GAME_END') {
            const { score } = event.data.payload || event.data
            onGameEnd(typeof score === 'number' ? score : 0)
            onClose()
          } else if (event.data.type === 'GAME_READY') {
            setIsLoading(false)
          } else if (event.data.type === 'GAME_ERROR') {
            setError(event.data.payload?.message || event.data.message || 'Ошибка в игре')
          }
        }

        window.addEventListener('message', handleMessage)

        if (containerRef.current) {
          containerRef.current.appendChild(iframe)
        }

        iframe.onload = () => {
          setIsLoading(false)
        }

        iframe.onerror = () => {
          setError('Не удалось загрузить игру')
          setIsLoading(false)
        }

        return () => {
          window.removeEventListener('message', handleMessage)
          if (iframeRef.current?.parentNode) {
            iframeRef.current.parentNode.removeChild(iframeRef.current)
            iframeRef.current = null
          }
        }
      } catch (err) {
        setError('Ошибка при загрузке игры')
        setIsLoading(false)
      }
    }

    loadGame()
  }, [pet.name, pet.user_id, onGameEnd, onClose])

  const handleClose = () => setConfirmExit(true)
  const handleConfirmExit = () => onClose()
  const handleCancelExit = () => setConfirmExit(false)

  return (
    <div 
      ref={containerRef}
      className="game-fullscreen-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        margin: 0,
        padding: 0,
        zIndex: 9999,
        backgroundColor: '#000',
      }}
    >
      {!confirmExit && (
        <button
          onClick={handleClose}
          className="absolute z-[10000] bg-red-600/90 backdrop-blur hover:bg-red-700 active:bg-red-800 text-white w-10 h-10 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center text-xl"
          style={{ 
            top: 'calc(1rem + env(safe-area-inset-top, 0px))',
            right: 'calc(1rem + env(safe-area-inset-right, 0px))',
          }}
        >
          ✕
        </button>
      )}

      {isRequestingFullscreen && (
        <div className="absolute top-4 left-4 z-[10000] bg-blue-600/80 backdrop-blur text-white px-3 py-2 rounded-lg text-sm">
          🔄 Включаем полноэкранный режим...
        </div>
      )}

      {fullscreenError && !isFullscreen && (
        <div className="absolute top-16 left-4 right-4 z-[10000] bg-yellow-600/80 backdrop-blur text-white px-3 py-2 rounded-lg text-sm">
          ⚠️ {fullscreenError}
        </div>
      )}

      <div className="w-full h-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-[9000]">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
              <p className="text-lg font-medium">Загрузка игры...</p>
              <p className="text-sm text-gray-400 mt-2">{pet.name}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-[9000]">
            <div className="text-white text-center max-w-md px-6">
              <div className="text-red-500 text-7xl mb-6">⚠️</div>
              <h2 className="text-2xl font-bold mb-3">Ошибка загрузки игры</h2>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmExit && (
        <div className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Выйти из игры?</h3>
            <p className="text-slate-300 mb-6 text-sm">
              Прогресс игры будет сохранен. Вы уверены, что хотите выйти?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


