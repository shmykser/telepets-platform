import axios from 'axios'
import type { 
  Pet, 
  Wallet, 
  PetSummary,
  HealthUpResponse,
  CreatePetResponse,
} from '@/types'
import { buildUrl } from '@/config/endpoints'
import { getStoredUsername } from '@/utils'

const API_BASE_URL = buildUrl.api()

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const AUTH_TOKEN_PATH = '/auth/token'
let isIssuingToken = false

api.interceptors.request.use(
  async (config) => {
    if ((config.url || '').includes(AUTH_TOKEN_PATH)) {
      return config
    }

    let token = localStorage.getItem('auth_token')

    if (!token && !isIssuingToken) {
      try {
        isIssuingToken = true
        const userId = localStorage.getItem('user_id') || '273065571'
        const username = getStoredUsername()
        const params: any = { user_id: userId }
        if (username) params.username = username
        const resp = await authClient.post(AUTH_TOKEN_PATH, null, { params })
        token = resp.data?.access_token
        if (token) {
          localStorage.setItem('auth_token', token)
        }
      } catch (error) {
        console.warn('Не удалось автоматически получить токен:', error)
      } finally {
        isIssuingToken = false
      }
    }

    if (token) {
      (config.headers = config.headers || {}).Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(error)
  }
)

export const petApi = {
  createPet: async (user_id: string, name: string, override: boolean = false): Promise<CreatePetResponse> => {
    const response = await api.post<CreatePetResponse>('/create', null, {
      params: { user_id, name, override: override ? 'true' : 'false' },
      timeout: 60000,
    })
    return response.data
  },

  getSummary: async (user_id: string): Promise<Pet> => {
    const response = await api.get<Pet>('/summary', {
      params: { user_id }
    })
    return response.data
  },

  getAllPets: async (user_id: string): Promise<PetSummary> => {
    const response = await api.get<PetSummary>('/summary/all', {
      params: { user_id }
    })
    return response.data
  },

  healthUp: async (user_id: string, pet_name?: string): Promise<HealthUpResponse> => {
    const response = await api.post<HealthUpResponse>('/health_up', null, {
      params: { user_id, pet_name }
    })
    return response.data
  },

  healthUpWithCost: async (user_id: string, pet_name?: string): Promise<HealthUpResponse> => {
    const response = await api.post<any>(`/economy/actions/${encodeURIComponent(user_id)}/health_up`, null, {
      params: { pet_name }
    })
    return response.data?.pet_info as HealthUpResponse
  },
}

export const economyApi = {
  getWallet: async (user_id: string): Promise<Wallet> => {
    const response = await api.get<Wallet>(`/economy/wallet/${user_id}`)
    return response.data
  },

  resurrectPet: async (user_id: string, pet_name: string): Promise<{
    success: boolean
    coins_spent: number
    new_balance: number
    pet: { id: number; name: string; state: string; health: number; status: string }
  }> => {
    const response = await api.post(`/economy/actions/${encodeURIComponent(user_id)}/resurrect`, null, {
      params: { pet_name }
    })
    return response.data
  },
}

