const DEV = import.meta.env.DEV;

export const settings = {
  graphics: {
    backgroundColor: '#0a0f1a',
    baseWidth: 1280,
    baseHeight: 720,
    minWidth: 320,
    minHeight: 180,
    maxWidth: 1920,
    maxHeight: 1080,
    antialias: true,
    pixelArt: false
  },
  debug: {
    physics: DEV && import.meta.env.VITE_PHYSICS_DEBUG === 'true'
  },
  controls: {
    activePointers: 3,
    gamepad: true
  },
  integration: {
    targetOrigin: DEV ? '*' : import.meta.env.VITE_WEBAPP_ORIGIN ?? 'https://t.me'
  },
  telemetry: {
    enabled: import.meta.env.VITE_TELEMETRY_ENABLED === 'true',
    endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT ?? ''
  },
  events: {
    RESET_REQUESTED: 'telepets:scene:reset'
  },
  typography: {
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  },
  game: {
    eggTemperature: {
      // Диапазон температуры
      minTemp: 32,
      maxTemp: 78,
      // Начальная температура (в середине оптимальной зоны)
      initialTemp: 25,
      // Оптимальная зона температуры
      optimalZoneMin: 55,
      optimalZoneMax: 60,
      // Скорость изменения температуры
      heatPerSwipe: 0.3, // Увеличение температуры за единицу расстояния свайпа
      coolingRate: 1, // Падение температуры в секунду
      maxHeatPerSecond: 2.5, // Максимальное увеличение температуры в секунду от свайпов
      // Время удержания в зоне для победы (в секундах)
      targetHoldTime: 20,
      // Логика таймера
      resetTimerOnExit: false, // true - сбрасывать таймер при выходе из зоны, false - сохранять прогресс
      // Визуальные настройки
      gaugeWidth: 60,
      gaugeHeight: 400,
      gaugePadding: 20
    }
  }
} as const;

export type Settings = typeof settings;

