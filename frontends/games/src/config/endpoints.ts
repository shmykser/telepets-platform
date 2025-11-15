/**
 * Централизованная конфигурация эндпоинтов для разных окружений
 * 
 * ВАЖНО: Backend endpoints находятся по пути /api/...
 * - В dev: используем относительные пути, которые проксируются через Vite
 * - В prod: используем полные URL с /api/...
 */

const isDev = (import.meta as any).env.DEV;
const isProd = (import.meta as any).env.PROD;

// Константы для путей API
const API_BASE_URL_DEV = ''; // Относительный путь для проксирования
const API_BASE_URL_PROD = import.meta.env.VITE_API_BASE_URL ?? 'https://telepets-api-docker.onrender.com';
const API_PET_IMAGES_PATH = '/api/pet-images'; // Backend endpoint: /api/pet-images

const DEV_CONFIG = {
  petImages: {
    // В dev: используем относительный путь /api/pet-images, который проксируется через vite.config.ts
    // См. vite.config.ts: proxy['/api'] -> target: 'http://localhost:8080'
    url: '/api/pet-images',
  },
} as const;

const PROD_CONFIG = {
  petImages: {
    // ВАЖНО: В production используем полный URL с /api/pet-images
    // Backend endpoint находится по /api/pet-images
    url: `${API_BASE_URL_PROD}${API_PET_IMAGES_PATH}`,
  },
} as const;

export const CONFIG = isDev ? DEV_CONFIG : PROD_CONFIG;

export const buildUrl = {
  /**
   * Формирует URL для получения изображения питомца
   * @param userId - ID пользователя
   * @param petName - Имя питомца
   * @param stage - Стадия питомца (egg, baby, adult). Если не указана, используется текущая стадия
   * @param transparent - Использовать ли прозрачное изображение (по умолчанию false)
   */
  petImage: (userId: string, petName: string, stage?: string, transparent: boolean = false): string => {
    const imagesBase = CONFIG.petImages.url;
    const baseUrl = imagesBase.startsWith('/')
      ? `${imagesBase}/${userId}/${petName}`
      : `${imagesBase}/${userId}/${petName}`;

    const params = new URLSearchParams();
    if (stage) {
      params.append('stage', stage);
    }
    if (transparent) {
      params.append('transparent', 'true');
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  },
};

export const ENV_INFO = {
  isDev,
  isProd,
  mode: (import.meta as any).env.MODE,
  apiUrl: CONFIG.petImages.url,
} as const;

export default CONFIG;

