import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Thermometer } from 'lucide-react';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { getStageImageUrl } from '@/utils/petUtils';
import { cn } from '@/utils';
import { settings } from '@/config/settings';
import { useCharacteristicAction } from '@/hooks/useCharacteristicAction';

const temperatureConfig = settings.games.temperature;

export interface TemperatureGameProps {
  pet: Pet;
  trigger: ReactNode;
  className?: string;
}

const TEMPERATURE_LABELS = [
  { max: 40, label: 'Холодно', color: 'from-blue-400 to-cyan-400' },
  { max: 60, label: 'Тепло', color: 'from-yellow-400 to-orange-400' },
  { max: 80, label: 'Жарко', color: 'from-orange-400 to-red-400' },
  { max: Infinity, label: 'Очень жарко!', color: 'from-red-500 to-red-700' }
] as const;

interface HeatState {
  temperature: number
  progress: number
}

const MAX_PROGRESS = 100

export function TemperatureGame({ pet, trigger, className }: TemperatureGameProps) {
  const initialTemperature = useMemo(() => {
    const value = pet.characteristics?.temperature?.value
    if (typeof value === 'number') {
      return value
    }
    return temperatureConfig.minTemperature
  }, [pet.characteristics?.temperature?.value])

  const [open, setOpen] = useState(false);
  const [heatState, setHeatState] = useState<HeatState>({ temperature: initialTemperature, progress: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  const characteristicAction = useCharacteristicAction(pet);
  const [actionApplied, setActionApplied] = useState(false);

  const swipeDistance = useRef(0);

  const stageImageUrl = useMemo(() => {
    const url = getStageImageUrl(pet, 'egg', false) ?? pet.image_egg_url ?? pet.image_url;
    return url ?? '';
  }, [pet]);

  const {
    minTemperature,
    maxTemperature,
    temperatureIncreaseRate,
    temperatureDecreaseRate,
    swipeSensitivity
  } = temperatureConfig;

  const handleClose = useCallback(() => {
    setOpen(false);
    setIsSwiping(false);
    swipeDistance.current = 0;
  }, []);

  const handleTrigger = useCallback(
    (event?: ReactMouseEvent<HTMLDivElement> | ReactKeyboardEvent<HTMLDivElement>) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      setOpen(true);
    },
    []
  );

  const applyHeatGain = useCallback(
    (gain: number) => {
      setHeatState((prev) => {
        let temperature = prev.temperature;
        let progress = prev.progress + gain;

        while (progress >= MAX_PROGRESS && temperature < maxTemperature) {
          progress -= MAX_PROGRESS;
          temperature += 1;
        }

        if (temperature >= maxTemperature) {
          progress = MAX_PROGRESS;
        }

        return {
          temperature: Math.min(maxTemperature, temperature),
          progress: Math.max(0, Math.min(MAX_PROGRESS, progress)),
        };
      });
    },
    [maxTemperature]
  );

  const applyHeatLoss = useCallback(
    (loss: number) => {
      setHeatState((prev) => {
        if (isSwiping) return prev;
        let temperature = prev.temperature;
        let progress = prev.progress - loss;

        while (progress < 0 && temperature > minTemperature) {
          temperature -= 1;
          progress += MAX_PROGRESS;
        }

        if (temperature <= minTemperature) {
          temperature = minTemperature;
          progress = Math.max(0, progress);
        }

        return {
          temperature,
          progress: Math.max(0, Math.min(MAX_PROGRESS, progress)),
        };
      });
    },
    [isSwiping, minTemperature]
  );

  const handlePan = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const distance = Math.sqrt(info.delta.x ** 2 + info.delta.y ** 2);
      const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);

      swipeDistance.current += distance;
      setIsSwiping(true);

      if (swipeDistance.current < swipeSensitivity) {
        return;
      }

      const gain =
        (velocity / 750) * temperatureIncreaseRate +
        (swipeDistance.current / swipeSensitivity) * 0.15;

      applyHeatGain(gain);

      swipeDistance.current = 0;
    },
    [applyHeatGain, swipeSensitivity, temperatureIncreaseRate]
  );

  const handlePanStart = useCallback(() => {
    setIsSwiping(true);
    swipeDistance.current = 0;
  }, []);

  const handlePanEnd = useCallback(() => {
    setIsSwiping(false);
    swipeDistance.current = 0;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateLayout = () => {
      setIsCompactLayout(window.innerWidth < 768);
      const rootStyle = getComputedStyle(document.documentElement);
      const top = parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-top') || '0', 10);
      const bottom = parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom') || '0', 10);
      setSafeAreaInsets({
        top: Number.isFinite(top) ? top : 0,
        bottom: Number.isFinite(bottom) ? bottom : 0
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    if (!open) {
      setActionApplied(false);
      characteristicAction.reset();
      return;
    }

    const interval = window.setInterval(() => {
      applyHeatLoss(temperatureDecreaseRate);
    }, 120);

    return () => {
      window.clearInterval(interval);
    };
  }, [applyHeatLoss, open]);

  useEffect(() => {
    if (!open) return;
    setHeatState({ temperature: initialTemperature, progress: 0 });
    setIsSwiping(false);
    swipeDistance.current = 0;
    setActionApplied(false);
  }, [open, initialTemperature]);

  useEffect(() => {
    if (!open || actionApplied) return;
    if (heatState.temperature >= maxTemperature) {
      setActionApplied(true);
      characteristicAction.mutate(
        {
          actionKey: 'temperature_game',
          successMessage: 'Температура яйца восстановлена',
        },
        {
          onError: () => setActionApplied(false),
        }
      );
    }
  }, [actionApplied, characteristicAction, heatState.temperature, maxTemperature, open]);

  const temperaturePercentage = useMemo(() => {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          ((heatState.temperature - minTemperature) / (maxTemperature - minTemperature || 1)) * 100
        )
      )
    );
  }, [heatState.temperature, maxTemperature, minTemperature]);

  const temperatureDescriptor =
    TEMPERATURE_LABELS.find((label) => heatState.temperature < label.max) ??
    TEMPERATURE_LABELS[TEMPERATURE_LABELS.length - 1];

  return (
    <>
      <div
        className={cn('inline-flex cursor-pointer select-none', className)}
        role="button"
        tabIndex={0}
        onClick={handleTrigger}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleTrigger(event);
          }
        }}
      >
        {trigger}
      </div>

      <DialogEnhanced
        open={open}
        onClose={handleClose}
        variant="glass"
        fullWidth
        className="max-w-none"
      >
        <div
          className="relative flex h-full w-full flex-col bg-gradient-to-b from-black/80 via-black/60 to-black/80 md:flex-row"
          style={{
            paddingTop: isCompactLayout ? safeAreaInsets.top + 12 : undefined,
            paddingBottom: isCompactLayout ? safeAreaInsets.bottom + 12 : undefined
          }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
            <div className="absolute inset-0 opacity-40 blur-3xl bg-gradient-to-br from-purple-700/40 via-indigo-500/20 to-emerald-500/30 animate-pulse" />
          </div>

          <motion.div
            className="relative flex-1 overflow-hidden rounded-[32px]"
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.6 }}
            transition={{ duration: 0.4 }}
            onPan={handlePan}
            onPanStart={handlePanStart}
            onPanEnd={handlePanEnd}
            style={{
              minHeight: isCompactLayout ? '60vh' : '65vh',
              touchAction: 'none',
            }}
          >
            {stageImageUrl ? (
              <motion.img
                src={stageImageUrl}
                alt={pet.name ?? 'pet'}
                className="h-full w-full object-cover"
                draggable={false}
                initial={{ scale: 1 }}
                animate={{ scale: isSwiping ? 1.03 : 1 }}
                transition={{ duration: 0.25 }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">🥚</div>
            )}

            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />

            <AnimatePresence>
              {isSwiping && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/25 to-orange-500/20 blur-3xl" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 px-4 text-center text-white">
              <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/35 px-6 py-2 backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-[0.35em] text-white/70">
                  Состояние
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                  {temperatureDescriptor.label}
                </div>
                <div className="text-4xl font-black">
                  {Math.round(heatState.temperature)}°
                </div>
              </div>
            </div>

            <div className="absolute right-3 sm:right-6 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col text-end text-[10px] text-white/60">
                <span>Макс {maxTemperature}°</span>
                <span>Мин {minTemperature}°</span>
              </div>
              <div className="relative flex h-56 w-12 flex-col items-center rounded-2xl border border-white/15 bg-white/5 px-2.5 py-4 backdrop-blur-lg">
                <Thermometer className="mb-2 h-5 w-5 text-white/80" />
                <div className="relative h-full w-3 rounded-full bg-white/10">
                  <motion.div
                    className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-orange-400 via-red-400 to-rose-500"
                    style={{ height: `${temperaturePercentage}%` }}
                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 z-20 flex w-full justify-center px-6 sm:px-10">
              <motion.div
                className="w-full max-w-md rounded-full border border-white/15 bg-black/40 px-6 py-4 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-200/80">
                  <span>Цикл</span>
                  <span>{Math.round((heatState.progress / MAX_PROGRESS) * 100)}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-300"
                    animate={{ width: `${Math.min(100, (heatState.progress / MAX_PROGRESS) * 100)}%` }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-1 text-center text-[10px] text-white/60">
                  {isSwiping ? 'Нагрев...' : 'Свайпайте, чтобы поднять температуру'}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <style>{`
          @keyframes gradientShiftGame {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </DialogEnhanced>
    </>
  );
}

export default TemperatureGame;

