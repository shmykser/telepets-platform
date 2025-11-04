/**
 * Централизованная конфигурация эндпоинтов для разных окружений
 */

const isDev = (import.meta as any).env.DEV
const isProd = (import.meta as any).env.PROD

const DEV_CONFIG = {
  api: {
    // В dev режиме используем относительные пути для проксирования через Vite
    // Это решает проблему CORS автоматически
    url: '', // Пустая строка = текущий origin (localhost:5174)
    directBackendUrl: 'http://localhost:8080',
  },
  petImages: {
    // Используем относительный путь для проксирования через Vite
    url: '/pet-images',
  },
} as const

const PROD_CONFIG = {
  api: {
    url: 'https://telepets-api-docker.onrender.com',
    directBackendUrl: '',
  },
  petImages: {
    url: 'https://telepets-api-docker.onrender.com/pet-images',
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

