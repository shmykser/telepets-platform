export interface Pet {
  id?: number | string
  user_id?: string
  name?: string
  state?: 'egg' | 'baby' | 'adult'
  health?: number
  status?: 'alive' | 'dead' | 'no_pets' | 'all_dead' | 'success'
  next_stage?: string
  time_to_next_stage_seconds?: number
  image_url?: string
  created_at?: string
  updated_at?: string
  total_pets?: number
  alive_pets?: number
  dead_pets?: number
  wallet?: Wallet
  message?: string
}

export interface Wallet {
  coins: number
  total_earned?: number
  total_spent?: number
  created_at?: string
  updated_at?: string
}

export interface PetSummary {
  user_id: string
  total_pets: number
  alive_pets: number
  dead_pets: number
  pets: Pet[]
  wallet?: Wallet
}

export interface HealthUpResponse {
  message: string
  health: number
  health_increased: number
  stage: string
  pet_id: number
}

export interface CreatePetResponse {
  id: number
  user_id: string
  name: string
  state: string
  health: number
  image_url: string
  wallet: Wallet
}

export interface Transaction {
  id: number
  user_id: string
  type: string
  amount: number
  description?: string
  status: string
  created_at: string
  transaction_data?: any
}

export interface UserStats {
  user_id: string
  total_pets: number
  alive_pets: number
  dead_pets: number
  total_coins_earned: number
  total_coins_spent: number
  total_transactions: number
}

export interface ActionCosts {
  paid_pet: number
  health_up: number
  resurrect: number
}

export interface Auction {
  id: number
  pet_id: number
  seller: string
  start_price: number
  current_price: number
  buy_now_price?: number
  end_time: string
  status: string
  created_at: string
  pet?: Pet
  bids?: AuctionBid[]
}

export interface AuctionBid {
  id: number
  auction_id: number
  bidder: string
  amount: number
  created_at: string
}

export interface UserProfile {
  user_id: string
  username?: string
  display_name?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  display_name?: string
  is_anonymous?: boolean
}

export interface PublicUserInfo {
  user_id: string
  display_name: string
  total_pets: number
  created_at: string
}

