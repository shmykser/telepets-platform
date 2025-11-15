export type PetStage = 'egg' | 'baby' | 'adult'

export type CharacteristicStatus = 'normal' | 'warning' | 'critical'

export interface PetCharacteristic {
  value: number
  status: CharacteristicStatus
}

export type PetCharacteristicMap = Record<string, PetCharacteristic>

export interface HealthTickSummary {
  interval_seconds: number
  penalty: number
  regen_amount: number
  last_tick_at?: string
}

export interface Pet {
  id?: number | string
  user_id?: string
  name?: string
  state?: PetStage
  health?: number
  status?: 'alive' | 'dead' | 'no_pets' | 'all_dead' | 'success'
  next_stage?: string
  time_to_next_stage_seconds?: number
  image_url?: string
  image_egg_url?: string
  image_baby_url?: string
  image_adult_url?: string
  image_egg_transparent_url?: string
  image_baby_transparent_url?: string
  image_adult_transparent_url?: string
  created_at?: string
  updated_at?: string
  total_pets?: number
  alive_pets?: number
  dead_pets?: number
  wallet?: Wallet
  message?: string
  creature_json?: any
  creature?: any
  characteristics?: PetCharacteristicMap
  health_tick?: HealthTickSummary
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

export type StageCostMap = Record<string, number>

export interface ActionCostConfig {
  health_up: StageCostMap
  [key: string]: number | StageCostMap
}

export interface PurchaseOption {
  coins: number
  price_usd: number
}

export type PurchaseOptionsMap = Record<string, PurchaseOption>

export interface ActionCostsResponse {
  action_costs: ActionCostConfig
  purchase_options: PurchaseOptionsMap
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

export type TimerStatus = 'running' | 'cooldown' | 'ready' | 'completed' | 'idle'

export interface SyncTimer {
  id: string
  type: string
  label: string
  status: TimerStatus
  remaining_seconds: number
  duration_seconds?: number
  starts_at?: string
  ends_at?: string
  available_at?: string
  meta?: Record<string, unknown>
}

export interface TimerSummary {
  server_time: string
  timers: SyncTimer[]
}

