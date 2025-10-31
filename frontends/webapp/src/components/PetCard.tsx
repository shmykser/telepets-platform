import { motion } from 'framer-motion'
import { Heart, Clock, Store, Gamepad2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import HealthBar from '@/components/ui/HealthBar'
import { useState, useMemo } from 'react'
import CreateAuctionModal from '@/components/market/CreateAuctionModal'
import PetThiefGame from './PetThiefGame'
import EggDefenderGame from './EggDefenderGame'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { marketApi, gamesApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
//
import { cn, getHealthColor, getHealthText, getStageInfo, formatTime, getActionCost } from '@/utils'
import type { Pet } from '@/types'
import { useTimer } from '@/hooks/useTimer'

interface PetCardProps {
  pet: Pet
  onHealthUp: () => void
  onHealthUpWithCost: () => void
  onResurrect?: () => void
  isHealthUpLoading: boolean
  isHealthUpWithCostLoading: boolean
  showCost?: boolean
  walletCoins?: number
  resurrectCost?: number
}

export default function PetCard({
  pet,
  onHealthUp,
  onHealthUpWithCost,
  onResurrect,
  isHealthUpLoading,
  isHealthUpWithCostLoading,
  showCost = false,
  walletCoins,
  resurrectCost,
}: PetCardProps) {
  const [showMarketModal, setShowMarketModal] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [showEggGame, setShowEggGame] = useState(false)
  const navigate = useNavigate()
  // Ищем активный аукцион для этого питомца
  // Используем общий query key для всех питомцев, чтобы не делать множественные запросы
  const { data: activeAuctionsData } = useQuery(
    ['auctions', 'active', 1, 200],
    () => marketApi.listAuctions({ status: 'active', page: 1, page_size: 200 }),
    { refetchInterval: 30000, staleTime: 15000 } // Обновляем раз в 30 секунд вместо 5
  )
  const activeAuction = useMemo(() => {
    const items = (activeAuctionsData?.items || []) as any[]
    return items.find((a) => a.pet_id === pet.id)
  }, [activeAuctionsData, pet.id])
  const currentStage = pet.state || 'egg'
  const currentHealth = pet.health ?? 0
  const stageInfo = getStageInfo(currentStage)
  const healthColor = getHealthColor(currentHealth)
  const healthText = getHealthText(currentHealth)
  const actionCost = showCost ? getActionCost(currentStage) : 0
  const balance = typeof walletCoins === 'number' ? walletCoins : (pet.wallet ? pet.wallet.coins : undefined)
  const canAfford = balance !== undefined ? balance >= actionCost : true
  const actionLabel = stageInfo.name === 'Яйцо' ? 'Согреть' : stageInfo.name === 'Детеныш' ? 'Покормить' : stageInfo.name === 'Взрослый' ? 'Развлечь' : 'Помочь'
  const isDead = pet.status === 'dead' || (pet as any).life_status === 'dead'
  const effectiveResurrectCost = typeof resurrectCost === 'number' ? resurrectCost : 500
  const canAffordResurrect = typeof walletCoins === 'number' ? walletCoins >= effectiveResurrectCost : true

  // Обработчики для игры
  const handlePlayGame = () => {
    setShowGame(true)
  }

  const handleGameEnd = async (coinsStolen: number) => {
    try {
      await gamesApi.saveProgress(pet.user_id, pet.name || '', coinsStolen)
      console.log(`Игра завершена! Украдено монет: ${coinsStolen}`)
    } catch (error) {
      console.error('Ошибка при сохранении прогресса игры:', error)
    }
  }

  const handleCloseGame = () => {
    setShowGame(false)
  }

  // Egg Defender: обработчики
  const handlePlayEggGame = () => {
    setShowEggGame(true)
  }

  const handleEggGameEnd = async (score: number) => {
    try {
      // Используем общий эндпоинт начисления награды за игры
      await economyApi.claimGameReward(pet.user_id, 'egg_defender', score)
      console.log(`Egg Defender завершена! Очки: ${score}`)
    } catch (error) {
      console.error('Ошибка при сохранении прогресса Egg Defender:', error)
    }
  }

  const handleCloseEggGame = () => {
    setShowEggGame(false)
  }

  //
  const initialSeconds = typeof pet.time_to_next_stage_seconds === 'number' ? pet.time_to_next_stage_seconds : 0
  const { secondsLeft } = useTimer(initialSeconds, { autoplay: true, pauseWhenHidden: true })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        {/* Background gradient based on stage */}
        <div
          className={cn(
            'absolute inset-0 opacity-10 pointer-events-none',
            stageInfo.color
          )}
        />
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">{stageInfo.emoji}</span>
              <span>{pet.name}</span>
            </CardTitle>
            {!isDead && (
              activeAuction ? (
                <Button size="sm" variant="secondary" onClick={() => navigate('/market', { state: { focusAuctionId: activeAuction.id } })} className="flex items-center space-x-2">
                  <Store size={16} />
                  <span>На аукцион</span>
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setShowMarketModal(true)} className="flex items-center space-x-2">
                  <Store size={16} />
                  <span>Продать</span>
                </Button>
              )
            )}
            <div className="flex items-center space-x-2">
              {initialSeconds > 0 && secondsLeft > 0 && (
                <div className="flex items-center space-x-1 text-slate-300">
                  <Clock size={16} />
                  <span className="text-sm font-medium">{formatTime(secondsLeft)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', stageInfo.color)}>
              {stageInfo.name}
            </span>
            <span>•</span>
            <span>{stageInfo.description}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pet Image - фокус на изображении (занимает большую часть экрана в WebApp) */}
          {pet.image_url && (
            <div className="flex justify-center">
              <div className="relative w-full max-w-3xl aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border border-slate-700">
                <img
                  src={pet.image_url}
                  alt={`${pet.name} - ${stageInfo.name}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.parentElement?.querySelector('.fallback') as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="fallback absolute inset-0 flex items-center justify-center text-[20vmin] bg-gradient-to-br from-blue-100/20 to-purple-100/20" style={{ display: 'none' }}>
                  {stageInfo.emoji}
                </div>
              </div>
            </div>
          )}

          {/* Health bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Heart size={14} className="text-red-400" />
                <span>Здоровье</span>
              </div>
              <span className={cn('font-medium', healthColor === 'health-critical' ? 'text-red-400' : '')}>
                {pet.health}/100
              </span>
            </div>
            <HealthBar value={currentHealth} />
            <p className="text-xs text-slate-400">{healthText}</p>
          </div>

          {/* Timer moved to header (icon + time only) */}

          {/* Action buttons (скрыть для мёртвого питомца) */}
          {!isDead && (
            <div className="flex space-x-2">
              <div className="flex space-x-2 w-full">
                <Button
                  onClick={onHealthUp}
                  loading={isHealthUpLoading}
                  disabled={pet.status === 'dead'}
                  variant="secondary"
                  className="flex-1 flex-col py-3"
                >
                  <span className="text-base font-semibold">{actionLabel}</span>
                  <span className="text-xs text-slate-300">Бесплатно</span>
                </Button>
                <Button
                  onClick={onHealthUpWithCost}
                  loading={isHealthUpWithCostLoading}
                  disabled={pet.status === 'dead' || !canAfford}
                  className="flex-1 flex-col py-3"
                >
                  <span className="text-base font-semibold">{actionLabel}</span>
                  <span className="text-xs text-slate-300">{actionCost} монет</span>
                </Button>
              </div>
            </div>
          )}

          {/* Play game for alive adult/teen pets (Pet Thief) */}
          {!isDead && (pet.state === 'adult' || pet.state === 'baby') && (
            <div className="flex space-x-2">
              <Button
                onClick={handlePlayGame}
                className="flex-1 flex-col py-3 bg-green-600 hover:bg-green-700"
              >
                <Gamepad2 size={20} className="mb-1" />
                <span className="text-base font-semibold">Играть</span>
                <span className="text-xs text-slate-300">Pet Thief</span>
              </Button>
            </div>
          )}

          {/* Play game for egg state (Egg Defender) */}
          {!isDead && pet.state === 'egg' && (
            <div className="flex space-x-2">
              <Button
                onClick={handlePlayEggGame}
                className="flex-1 flex-col py-3 bg-green-600 hover:bg-green-700"
              >
                <Gamepad2 size={20} className="mb-1" />
                <span className="text-base font-semibold">Играть</span>
                <span className="text-xs text-slate-300">Egg Defender</span>
              </Button>
            </div>
          )}

          {/* Resurrect for dead pet */}
          {pet.status === 'dead' && (
            <div className="flex space-x-2">
              <Button
                onClick={onResurrect}
                disabled={!canAffordResurrect}
                className="flex-1 flex-col py-3"
              >
                <span className="text-base font-semibold">Воскресить питомца</span>
                <span className="text-xs text-slate-300">{effectiveResurrectCost} монет</span>
              </Button>
            </div>
          )}

          {/* критическое состояние больше не используется */}
        </CardContent>
      </Card>
      {showMarketModal && (
        <CreateAuctionModal
          initialPetId={pet.id as number}
          onClose={() => setShowMarketModal(false)}
          onSubmitted={() => navigate('/market')}
        />
      )}
      {showGame && (
        <PetThiefGame
          pet={pet}
          onGameEnd={handleGameEnd}
          onClose={handleCloseGame}
        />
      )}
      {showEggGame && (
        <EggDefenderGame
          pet={pet}
          onGameEnd={handleEggGameEnd}
          onClose={handleCloseEggGame}
        />
      )}
    </motion.div>
  )
} 