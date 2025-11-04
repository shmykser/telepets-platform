export interface HealthEntity {
  maxHealth: number
  health: number
  isAlive(): boolean
  takeDamage(amount: number): void
}

export interface DamageDealer {
  damage: number
}

export interface Enemy extends HealthEntity, DamageDealer {
  kind: string
  vx: number
  vy: number
  update(dt: number): void
}

export interface Obstacle extends HealthEntity {}


