import { useEffect, useMemo, useRef, useState } from 'react'

interface UseSyncedCountdownOptions {
  /**
   * Абсолютное время завершения таймера (ISO-строка)
   */
  targetAt?: string | null
  /**
   * Секунды до завершения, рассчитанные на сервере (fallback, если targetAt отсутствует)
   */
  initialRemainingSeconds?: number | null
  /**
   * Серверное время (ISO-строка) для расчёта смещения
   */
  serverTime?: string | null
  /**
   * Интервал тикания в миллисекундах
   */
  intervalMs?: number
}

interface SyncedCountdown {
  secondsLeft: number
  isCompleted: boolean
  targetTimestamp?: number
}

const DEFAULT_INTERVAL = 1_000

export function useSyncedCountdown(options: UseSyncedCountdownOptions): SyncedCountdown {
  const { targetAt, initialRemainingSeconds, serverTime, intervalMs = DEFAULT_INTERVAL } = options

  const offsetRef = useRef<number>(0)
  const [targetTimestamp, setTargetTimestamp] = useState<number | undefined>(() =>
    computeTargetTimestamp({ targetAt, initialRemainingSeconds, serverTime, offset: offsetRef.current })
  )
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    computeSecondsLeft(targetTimestamp, offsetRef.current)
  )

  // Обновляем смещение между серверным и локальным временем
  useEffect(() => {
    if (!serverTime) return
    const parsed = Date.parse(serverTime)
    if (!Number.isNaN(parsed)) {
      offsetRef.current = parsed - Date.now()
    }
  }, [serverTime])

  // Пересчитываем целевой таймштамп при изменении входных данных
  useEffect(() => {
    const nextTarget = computeTargetTimestamp({
      targetAt,
      initialRemainingSeconds,
      serverTime,
      offset: offsetRef.current,
    })
    setTargetTimestamp(nextTarget ?? undefined)
    setSecondsLeft(computeSecondsLeft(nextTarget, offsetRef.current))
  }, [targetAt, initialRemainingSeconds, serverTime])

  // Запускаем синхронизированный тикер
  useEffect(() => {
    const tick = () => {
      setSecondsLeft(prev => {
        const next = computeSecondsLeft(targetTimestamp, offsetRef.current)
        return next === prev ? prev : next
      })
    }

    tick()

    if (!targetTimestamp) {
      return
    }

    const timerId = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(timerId)
  }, [targetTimestamp, intervalMs])

  return useMemo(
    () => ({
      secondsLeft,
      isCompleted: secondsLeft <= 0,
      targetTimestamp,
    }),
    [secondsLeft, targetTimestamp]
  )
}

function computeTargetTimestamp({
  targetAt,
  initialRemainingSeconds,
  serverTime,
  offset,
}: {
  targetAt?: string | null
  initialRemainingSeconds?: number | null
  serverTime?: string | null
  offset: number
}): number | null {
  if (targetAt) {
    const parsed = Date.parse(targetAt)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  if (typeof initialRemainingSeconds === 'number') {
    const base = serverTime ? Date.parse(serverTime) : Date.now() + offset
    if (!Number.isNaN(base)) {
      return base + initialRemainingSeconds * 1000
    }
  }

  return null
}

function computeSecondsLeft(targetTimestamp?: number | null, offset: number = 0): number {
  if (!targetTimestamp) {
    return 0
  }

  const now = Date.now() + offset
  return Math.max(0, Math.round((targetTimestamp - now) / 1000))
}

export default useSyncedCountdown

