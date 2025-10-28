/**
 * Централизованная конфигурация эндпоинтов для разных окружений
 * 
 * Все URL и порты должны быть определены ТОЛЬКО в этом файле
 */

// Определяем режим (dev/prod)
const isDev = (import.meta as any).env.DEV
const isProd = (import.meta as any).env.PROD

/**
 * Development endpoints
 */
const DEV_CONFIG = {
  // WebApp
  webapp: {
    url: 'http://localhost:3001',
    port: 3001,
  },
  
  // Games (Phaser)
  games: {
    url: 'http://localhost:3002',
    port: 3002,
    basePath: '/games/',
  },
  
  // Backend API (напрямую или через Vite proxy)
  api: {
    url: 'http://localhost:8080', // БЕЗ /api - он добавляется в роутерах
    directBackendUrl: 'http://localhost:3000', // Прямой доступ к backend (для проксирования Vite)
  },
  
  // Static assets
  petImages: {
    url: 'http://localhost:8080/pet-images',
  },
} as const

/**
 * Production endpoints (GitHub Pages + Render)
 */
const PROD_CONFIG = {
  // WebApp
  webapp: {
    url: 'https://shmykser.github.io/telepets-platform/', // GitHub Pages
    port: 443,
  },
  
  // Games (Phaser)
  games: {
    url: 'https://shmykser.github.io/telepets-platform/games/', // GitHub Pages
    port: 443,
    basePath: '/games/',
  },
  
  // Backend API (Render)
  api: {
    url: 'https://telepets-api-docker.onrender.com', // БЕЗ /api - он добавляется в роутерах
    directBackendUrl: '', // Не используется в prod
  },
  
  // Static assets (через Render API)
  petImages: {
    url: 'https://telepets-api-docker.onrender.com/pet-images',
  },
} as const

/**
 * Текущая конфигурация (автоматически выбирается по окружению)
 */
export const CONFIG = isDev ? DEV_CONFIG : PROD_CONFIG

/**
 * Утилиты для построения URL
 */
export const buildUrl = {
  /**
   * Получить полный URL для игры с параметрами
   */
  game: (params: { pet_name?: string; user_id?: string; game_type?: string } = {}) => {
    const baseUrl = CONFIG.games.url
    const basePath = CONFIG.games.basePath
    const searchParams = new URLSearchParams()
    
    if (params.pet_name) searchParams.set('pet_name', params.pet_name)
    if (params.user_id) searchParams.set('user_id', params.user_id)
    if (params.game_type) searchParams.set('game_type', params.game_type)
    
    const queryString = searchParams.toString()
    return `${baseUrl}${basePath}${queryString ? '?' + queryString : ''}`
  },
  
  /**
   * Получить URL API
   */
  api: (path: string = '') => {
    const apiBase = CONFIG.api.url
    // Убираем начальный слеш если он есть
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    // Добавляем /api префикс для всех запросов
    const apiPath = cleanPath ? `/api/${cleanPath}` : '/api'
    return `${apiBase}${apiPath}`
  },
  
  /**
   * Получить URL изображения питомца
   */
  petImage: (userId: string, petName: string) => {
    return `${CONFIG.petImages.url}/${userId}/${petName}`
  },
}

/**
 * Информация о текущем окружении
 */
export const ENV_INFO = {
  isDev,
  isProd,
  mode: (import.meta as any).env.MODE,
  apiUrl: CONFIG.api.url,
  gamesUrl: CONFIG.games.url,
} as const

// Логирование конфигурации в dev режиме
if (isDev) {
  console.log('🔧 [Config] Environment:', ENV_INFO.mode)
  console.log('🔧 [Config] API URL:', ENV_INFO.apiUrl)
  console.log('🔧 [Config] Games URL:', ENV_INFO.gamesUrl)
  console.log('🔧 [Config] Full config:', CONFIG)
}

export default CONFIG

