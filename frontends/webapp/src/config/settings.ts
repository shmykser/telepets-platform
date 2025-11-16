export const settings = {
  defaults: {
    userId: import.meta.env.VITE_DEFAULT_USER_ID ?? '273065571',
    username: import.meta.env.VITE_DEFAULT_USERNAME ?? 'Shmykser'
  },
  economy: {
    baseDailyReward: Number(import.meta.env.VITE_DAILY_REWARD_BASE ?? 10),
    maxDailyRewardStreak: Number(import.meta.env.VITE_DAILY_REWARD_MAX_STREAK ?? 10)
  },
  telegram: {
    headerColor: '#0a0a0a',
    backgroundColor: '#0a0a0a',
    enableClosingConfirmation: false,
    hideHeader: true
  },
  games: {
    temperature: {
      minTemperature: Number(import.meta.env.VITE_TEMPERATURE_GAME_MIN ?? 20),
      maxTemperature: Number(import.meta.env.VITE_TEMPERATURE_GAME_MAX ?? 100),
      temperatureIncreaseRate: Number(import.meta.env.VITE_TEMPERATURE_GAME_INCREASE_RATE ?? 0.5),
      temperatureDecreaseRate: Number(import.meta.env.VITE_TEMPERATURE_GAME_DECREASE_RATE ?? 0.2),
      swipeSensitivity: Number(import.meta.env.VITE_TEMPERATURE_GAME_SWIPE_SENSITIVITY ?? 50)
    },
    cleaning: {
      sprayImagePath: '/images/spray_128.png',
      spotsCount: Number(import.meta.env.VITE_CLEAN_GAME_SPOTS_COUNT ?? 5),
      spotSize: Number(import.meta.env.VITE_CLEAN_GAME_SPOT_SIZE ?? 128),
      clicksRequired: Number(import.meta.env.VITE_CLEAN_GAME_CLICKS_REQUIRED ?? 20),
      minDistancePercent: Number(import.meta.env.VITE_CLEAN_GAME_MIN_DISTANCE ?? 12),
      spawnDelayMs: Number(import.meta.env.VITE_CLEAN_GAME_SPAWN_DELAY ?? 200)
    }
  }
} as const;

export type Settings = typeof settings;

