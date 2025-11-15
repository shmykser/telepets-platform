/**
 * Централизованная конфигурация эндпоинтов для разных окружений
 * 
 * ВАЖНО: Backend endpoints находятся по пути /api/...
 * - В dev: используем относительные пути, которые проксируются через Vite
 * - В prod: используем полные URL с /api/...
 */

const isDev = (import.meta as any).env.DEV
const isProd = (import.meta as any).env.PROD

// Константы для путей API (для избежания ошибок при копировании)
const API_BASE_URL_DEV = '' // Относительный путь для проксирования
const API_BASE_URL_PROD = 'https://telepets-api-docker.onrender.com'
const API_PET_IMAGES_PATH = '/api/pet-images' // Backend endpoint: /api/pet-images

const DEV_CONFIG = {
  api: {
    // В dev режиме используем относительные пути для проксирования через Vite
    // Это решает проблему CORS автоматически
    url: API_BASE_URL_DEV, // Пустая строка = текущий origin (localhost:3001)
    directBackendUrl: 'http://localhost:8080',
  },
  petImages: {
    // В dev: используем относительный путь /api/pet-images, который проксируется через vite.config.ts
    // См. vite.config.ts: proxy['/api'] -> target: 'http://localhost:8080'
    url: '/api/pet-images',
  },
} as const

const PROD_CONFIG = {
  api: {
    url: API_BASE_URL_PROD,
    directBackendUrl: '',
  },
  petImages: {
    // ВАЖНО: В production используем полный URL с /api/pet-images
    // Backend endpoint находится по /api/pet-images (см. backend/main.py: app.include_router(pet_images.router, prefix="/api"))
    url: `${API_BASE_URL_PROD}${API_PET_IMAGES_PATH}`,
  },
} as const

export const CONFIG = isDev ? DEV_CONFIG : PROD_CONFIG

export const buildUrl = {
  api: (path: string = '') => {
    const apiBase = CONFIG.api.url
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const apiPath = cleanPath ? `/api/${cleanPath}` : '/api'
    // Если apiBase пустой (dev режим), возвращаем относительный путь для проксирования
    if (!apiBase) {
      return apiPath
    }
    return `${apiBase}${apiPath}`
  },
  petImage: (userId: string, petName: string) => {
    const imagesBase = CONFIG.petImages.url
    // Если imagesBase начинается с /, это относительный путь (dev режим)
    if (imagesBase.startsWith('/')) {
      return `${imagesBase}/${userId}/${petName}`
    }
    return `${imagesBase}/${userId}/${petName}`
  },
}

export const ENV_INFO = {
  isDev,
  isProd,
  mode: (import.meta as any).env.MODE,
  apiUrl: CONFIG.api.url,
} as const

export default CONFIG

