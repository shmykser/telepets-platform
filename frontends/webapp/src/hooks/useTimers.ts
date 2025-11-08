import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { timerApi } from '@/lib/api'
import type { SyncTimer, TimerSummary } from '@/types'

interface UseTimersResult {
  data?: TimerSummary
  timers: SyncTimer[]
  serverTime?: string
  stageTimersByPet: Record<string, SyncTimer>
  dailyLoginTimer?: SyncTimer
  isLoading: boolean
  error: unknown
  refetch: () => Promise<any>
}

export function useTimers(userId?: string | null): UseTimersResult {
  const enabled = Boolean(userId)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['timers', userId],
    enabled,
    queryFn: () => timerApi.getTimers(userId!),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const timers = data?.timers ?? []

  const stageTimersByPet = useMemo(() => {
    const map: Record<string, SyncTimer> = {}
    timers.forEach(timer => {
      if (timer.type === 'pet_stage') {
        const petId = timer.meta && typeof timer.meta === 'object' ? (timer.meta as any).pet_id : undefined
        if (petId !== undefined && petId !== null) {
          map[String(petId)] = timer
        }
      }
    })
    return map
  }, [timers])

  const dailyLoginTimer = useMemo(
    () => timers.find(timer => timer.type === 'daily_login'),
    [timers]
  )

  return {
    data,
    timers,
    serverTime: data?.server_time,
    stageTimersByPet,
    dailyLoginTimer,
    isLoading,
    error,
    refetch,
  }
}

export default useTimers

