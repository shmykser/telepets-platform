export const GAME_CONFIG = {
  world: {
    marginSafePx: 40,
  },
  egg: {
    maxHealth: 100,
    radius: 36,
    yOffsetFromBottom: 60,
  },
  tree: {
    maxHealth: 30,
    damage: 20,
    width: 40,
    height: 80,
  },
  enemies: {
    ant: {
      emoji: '🐜',
      health: 20,
      damage: 5,
      speed: 100, // px/s
      sin: { amplitude: 50, frequency: 2.0 },
    },
    beetle: {
      emoji: '🪲',
      health: 60,
      damage: 20,
      speed: 60,
      bulldozeCharges: 1, // сносит первое препятствие
    },
    spider: {
      emoji: '🕷️',
      health: 30,
      damage: 10,
      speed: 90,
      avoidRadius: 80,
    },
  },
} as const

export type EnemyKind = keyof typeof GAME_CONFIG.enemies


