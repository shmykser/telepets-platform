import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gift, Sparkles, Clock, Flame } from 'lucide-react'
import Button from '@/components/Button'

export interface DailyRewardCardProps {
  rewardAmount: number
  baseAmount: number
  streak: number
  nextStreak: number
  maxStreak: number
  canClaim: boolean
  isClaiming?: boolean
  timeUntilNext?: string
  onClaim: () => void
  className?: string
}

export default function DailyRewardCard({
  rewardAmount,
  baseAmount,
  streak,
  nextStreak,
  maxStreak,
  canClaim,
  isClaiming = false,
  timeUntilNext,
  onClaim,
  className = '',
}: DailyRewardCardProps) {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })
  const safeMaxStreak = useMemo(() => Math.max(maxStreak, 1), [maxStreak])
  const streakClamped = useMemo(
    () => Math.min(Math.max(streak, 0), safeMaxStreak),
    [streak, safeMaxStreak],
  )
  const previewStreak = useMemo(
    () => Math.min(Math.max(nextStreak, 1), safeMaxStreak),
    [nextStreak, safeMaxStreak],
  )
  const rewardPerDay = useMemo(() => Math.max(baseAmount, 0), [baseAmount])
  const effectiveReward = useMemo(
    () => Math.max(rewardAmount, rewardPerDay),
    [rewardAmount, rewardPerDay],
  )

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setGlowPosition({ x, y })
      }}
      onMouseLeave={() => setGlowPosition({ x: 50, y: 50 })}
    >
      <div
        className="absolute -inset-0.5 rounded-3xl opacity-70 blur-xl transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 25%, #D97706 50%, #FBBF24 75%, #F59E0B 100%)',
          backgroundSize: '200% 200%',
          backgroundPosition: `${glowPosition.x}% ${glowPosition.y}%`,
          animation: 'gradientShift 5s ease infinite',
          opacity: canClaim ? 0.85 : 0.45,
        }}
      />

      <div className="relative rounded-3xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 bg-opacity-25"
              animate={
                canClaim
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 4, -4, 0],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: canClaim ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <Gift className="w-8 h-8 text-yellow-400" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-black text-white">Ежедневная награда</h3>
              <p className="text-sm text-gray-400">
                Базовая награда — {rewardPerDay > 0 ? `${rewardPerDay} монет` : '—'} в день. Серия умножает награду до ×{safeMaxStreak}.
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Награда за текущий день</span>
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-3xl font-black text-yellow-400"
                  animate={canClaim ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1.4, repeat: canClaim ? Infinity : 0 }}
                >
                  {effectiveReward > 0 ? effectiveReward : '—'}
                </motion.span>
                <span className="text-yellow-400 text-xl">🪙</span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-300" />
                <span>
                  Текущая серия:&nbsp;
                  <span className="text-white font-semibold">
                    {streakClamped}/{maxStreak}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  После получения:&nbsp;
                  <span className="text-white font-semibold">
                    {previewStreak}/{maxStreak}
                  </span>
                </span>
              </div>
            </div>

            {timeUntilNext && (
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Следующая награда {timeUntilNext}</span>
              </div>
            )}
          </div>

          <Button
            onClick={onClaim}
            disabled={!canClaim || isClaiming}
            loading={isClaiming}
            icon={<Sparkles className="w-5 h-5" />}
            size="lg"
            className="w-full"
          >
            {canClaim ? 'Получить награду' : 'Недоступно сейчас'}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  )
}

