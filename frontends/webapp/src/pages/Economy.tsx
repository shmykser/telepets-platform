import { useMemo } from 'react'
import DailyRewardCard from '@/components/DailyRewardCard'
import { useTimers } from '@/hooks/useTimers'
import { useDailyLogin } from '@/hooks/useEconomy'
import useSyncedCountdown from '@/hooks/useSyncedCountdown'
import { getStoredUserId, formatCountdown } from '@/utils'
import { settings } from '@/config/settings'

const FALLBACK_BASE_REWARD = settings.economy.baseDailyReward
const FALLBACK_MAX_STREAK = settings.economy.maxDailyRewardStreak

export default function Economy() {
  const userId = useMemo(() => getStoredUserId(), [])
  const {
    dailyLoginTimer,
    serverTime,
    isLoading: timersLoading,
    error: timersError,
  } = useTimers(userId)

  const { claimDailyLogin, isClaiming } = useDailyLogin()

  const countdown = useSyncedCountdown({
    targetAt: dailyLoginTimer?.available_at ?? dailyLoginTimer?.ends_at,
    initialRemainingSeconds: dailyLoginTimer?.remaining_seconds ?? null,
    serverTime,
  })

  const metadata = (dailyLoginTimer?.meta ?? dailyLoginTimer?.metadata) as Record<string, any> | undefined
  const baseAmount =
    typeof metadata?.base_amount === 'number' && metadata.base_amount > 0
      ? metadata.base_amount
      : FALLBACK_BASE_REWARD
  const nextRewardAmount =
    typeof metadata?.next_reward_amount === 'number' && metadata.next_reward_amount > 0
      ? metadata.next_reward_amount
      : baseAmount * Math.max(metadata?.next_multiplier ?? 1, 1)
  const currentStreak =
    typeof metadata?.current_streak === 'number' && metadata.current_streak > 0
      ? metadata.current_streak
      : 0
  const nextMultiplier =
    typeof metadata?.next_multiplier === 'number' && metadata.next_multiplier > 0
      ? metadata.next_multiplier
      : currentStreak + 1
  const maxStreak =
    typeof metadata?.max_streak === 'number' && metadata.max_streak > 0
      ? metadata.max_streak
      : FALLBACK_MAX_STREAK
  const canClaim = dailyLoginTimer?.status === 'ready'

  const timeUntilNext =
    dailyLoginTimer && !canClaim && countdown.secondsLeft > 0
      ? `через ${formatCountdown(countdown.secondsLeft)}`
      : undefined

  const title = 'Экономика'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] py-8 px-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Здесь собраны ключевые элементы экономики Telepets. Начните с ежедневной награды, чтобы разогреть кошелёк.
          </p>
        </header>

        {timersError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Не удалось загрузить таймеры. Попробуйте обновить страницу позже.
          </div>
        )}

        <section>
          <DailyRewardCard
            rewardAmount={nextRewardAmount}
            baseAmount={baseAmount}
            streak={currentStreak}
            nextStreak={nextMultiplier}
            maxStreak={maxStreak}
            canClaim={canClaim && !timersLoading}
            isClaiming={isClaiming}
            timeUntilNext={timeUntilNext}
            onClaim={() => claimDailyLogin(undefined)}
          />
        </section>
      </div>
    </div>
  )
}

