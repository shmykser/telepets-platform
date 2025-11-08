export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))

  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  const pad = (value: number) => value.toString().padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }

  return `${pad(minutes)}:${pad(secs)}`
}

export function formatRelativeAvailability(seconds: number): string {
  if (seconds <= 0) {
    return 'доступно'
  }
  return `через ${formatCountdown(seconds)}`
}

