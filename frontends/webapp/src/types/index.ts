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

