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
  }
} as const;

export type Settings = typeof settings;

