export function cn(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(' ')
}

export function getStoredUserId(): string {
  if (typeof localStorage === 'undefined') return '273065571'
  
  const storedUserId = localStorage.getItem('user_id')
  if (storedUserId) {
    return storedUserId
  }
  
  const testUserId = import.meta.env.VITE_TEST_USER_ID
  if (testUserId) {
    return testUserId
  }
  
  return '273065571'
}

export function setStoredUserId(userId: string): void {
  try {
    localStorage.setItem('user_id', userId)
  } catch {}
}

export function getStoredUsername(): string {
  if (typeof localStorage === 'undefined') return 'Shmykser'
  
  const storedUsername = localStorage.getItem('username')
  if (storedUsername) {
    return storedUsername
  }
  
  return 'Shmykser'
}

export function setStoredUsername(username: string): void {
  try {
    localStorage.setItem('username', username)
  } catch {}
}

/**
 * Проверяет, открыто ли приложение в Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Telegram?.WebApp
}

/**
 * Получает высоту header Telegram WebApp
 * В Telegram WebApp есть встроенный header с кнопками (обычно 44-56px на мобильных)
 */
export function getTelegramHeaderHeight(): number {
  if (!isTelegramWebApp()) return 0
  
  // Высота header зависит от устройства
  // На мобильных обычно 44-56px, на планшетах может быть больше
  const width = typeof window !== 'undefined' ? window.innerWidth : 0
  if (width < 640) {
    return 44 // Мобильные устройства
  } else if (width < 1024) {
    return 48 // Планшеты
  } else {
    return 56 // Десктопы
  }
}

