import axios from 'axios'
import type { 
  Pet, 
  Wallet, 
  Transaction,
  UserStats,
  ActionCostsResponse,
  PetSummary,
  HealthUpResponse,
  CreatePetResponse,
  Auction,
  AuctionBid,
  UserProfile,
  UpdateProfileRequest,
  PublicUserInfo,
  TimerSummary,
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

  getBalance: async (user_id: string): Promise<{ user_id: string; coins: number }> => {
    const response = await api.get<{ user_id: string; coins: number }>(`/economy/balance/${user_id}`)
    return response.data
  },

  getTransactions: async (user_id: string, limit: number = 20): Promise<{ user_id: string; transactions: Transaction[]; total: number }> => {
    const response = await api.get<{ user_id: string; transactions: Transaction[]; total: number }>(`/economy/transactions/${user_id}`, {
      params: { limit }
    })
    return response.data
  },

  getUserStats: async (user_id: string): Promise<UserStats> => {
    const response = await api.get<UserStats>(`/economy/stats/${user_id}`)
    return response.data
  },

  purchaseCoins: async (user_id: string, package_id: string): Promise<{
    success: boolean
    user_id: string
    coins_added: number
    price_usd: number
    package_id: string
  }> => {
    const response = await api.post<{
      success: boolean
      user_id: string
      coins_added: number
      price_usd: number
      package_id: string
    }>(`/economy/purchase/${user_id}`, null, {
      params: { package_id }
    })
    return response.data
  },

  getActionCosts: async (): Promise<ActionCostsResponse> => {
    const response = await api.get<ActionCostsResponse>('/economy/actions/costs')
    return response.data
  },

  claimDailyLogin: async (user_id: string): Promise<{
    success: boolean
    reward_amount: number
    new_balance: number
    message: string
  }> => {
    const response = await api.post<{
      success: boolean
      user_id: string
      reward_amount: number
      new_balance: number
      message: string
    }>(`/economy/rewards/${user_id}/daily_login`)
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

  claimGameReward: async (user_id: string, game: string, score: number): Promise<{
    success: boolean
    coins_added: number
    new_balance: number
    message: string
  }> => {
    const response = await api.post(`/economy/games/${encodeURIComponent(user_id)}/claim`, null, {
      params: { game, score }
    })
    return response.data
  },
}

export const timerApi = {
  getTimers: async (user_id: string): Promise<TimerSummary> => {
    const response = await api.get<TimerSummary>(`/timers/${encodeURIComponent(user_id)}`)
    return response.data
  },
}

// Market API
export const marketApi = {
  listAuctions: async (params?: { status?: string; page?: number; page_size?: number }): Promise<{ items: Auction[]; page: number; page_size: number }> => {
    const response = await api.get('/market/auctions', { params })
    return response.data
  },

  getAuction: async (auctionId: number): Promise<Auction> => {
    const response = await api.get(`/market/auctions/${auctionId}`)
    return response.data
  },

  createAuction: async (payload: {
    pet_id: number
    start_price: number
    duration_seconds?: number
    buy_now_price?: number
    min_increment_abs?: number
    min_increment_pct?: number
  }): Promise<{ id: number; end_time: string; status: string }> => {
    const { user_id, ...params } = (payload as any)
    const response = await api.post('/market/auctions', null, { params })
    return response.data
  },

  placeBid: async (payload: { auction_id: number; amount: number }): Promise<{ auction: Auction; bid: AuctionBid }> => {
    const response = await api.post(`/market/auctions/${payload.auction_id}/bids`, null, { params: { amount: payload.amount } })
    return response.data
  },

  buyNow: async (payload: { auction_id: number }): Promise<{ id: number; status: string }> => {
    const response = await api.post(`/market/auctions/${payload.auction_id}/buy_now`)
    return response.data
  },

  cancel: async (payload: { auction_id: number }): Promise<{ id: number; status: string }> => {
    const response = await api.post(`/market/auctions/${payload.auction_id}/cancel`)
    return response.data
  },
}

// Auth API (MVP): авто-выдача токена по user_id — используем authClient без интерсепторов
export const authApi = {
  issueToken: async (user_id: string, username?: string): Promise<{ access_token: string; token_type: string; user_id: string }> => {
    const params: any = { user_id }
    if (username) {
      params.username = username
    }
    const response = await authClient.post(AUTH_TOKEN_PATH, null, { params })
    return response.data
  },
}

// User Profile API
export const userProfileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/profile')
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/users/profile', data)
    return response.data
  },

  getPublicInfo: async (userId: string): Promise<PublicUserInfo> => {
    const response = await api.get<PublicUserInfo>(`/users/${userId}/public`)
    return response.data
  },
}

