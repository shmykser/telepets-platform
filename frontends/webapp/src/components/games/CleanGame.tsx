import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { getStageImageUrl } from '@/utils/petUtils';
import { cn } from '@/utils';
import { settings } from '@/config/settings';
import { useCharacteristicAction } from '@/hooks/useCharacteristicAction';

const cleanSettings = settings.games.cleaning;

interface CleanGameProps {
  pet: Pet;
  trigger: ReactNode;
  className?: string;
  imageUrl?: string;
  title?: string;
  instructions?: string;
}

interface SpraySpot {
  id: string;
  x: number;
  y: number;
  progress: number;
}

const createSpotId = () => `spray-${Math.random().toString(36).slice(2, 10)}`;

export function CleanGame({
  pet,
  trigger,
  className,
  imageUrl,
  title = 'Очисти питомца',
  instructions = 'Тапайте по пятнам краски, чтобы полностью очистить вашего детёныша'
}: CleanGameProps) {
  const [open, setOpen] = useState(false);
  const [spots, setSpots] = useState<SpraySpot[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);
  const [totalSpots, setTotalSpots] = useState(0);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const characteristicAction = useCharacteristicAction(pet);
  const [actionApplied, setActionApplied] = useState(false);

  const resolvedImageUrl = useMemo(() => {
    if (imageUrl) return imageUrl;
    return (
      getStageImageUrl(pet, 'baby', false) ??
      pet.image_baby_url ??
      pet.image_url ??
      getStageImageUrl(pet, 'egg', false) ??
      ''
    );
  }, [imageUrl, pet]);

  const progressPerTap = useMemo(
    () => 100 / cleanSettings.clicksRequired,
    []
  );

  const progressPercent = useMemo(() => {
    if (!totalSpots) return 0;
    return Math.round((clearedCount / totalSpots) * 100);
  }, [clearedCount, totalSpots]);

  const generateSpots = useCallback(() => {
    const spotsCount = cleanSettings.spotsCount;
    const minDistance = cleanSettings.minDistancePercent;
    const generated: SpraySpot[] = [];

    for (let i = 0; i < spotsCount; i += 1) {
      let attempts = 0;
      let valid = false;
      let x = 0;
      let y = 0;

      while (!valid && attempts < 120) {
        x = 10 + Math.random() * 80;
        y = 12 + Math.random() * 76;
        valid =
          generated.length === 0 ||
          generated.every((spot) => {
            const dx = x - spot.x;
            const dy = y - spot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance >= minDistance;
          });
        attempts += 1;
      }

      generated.push({
        id: createSpotId(),
        x: Math.max(8, Math.min(92, x)),
        y: Math.max(10, Math.min(90, y)),
        progress: 0
      });
    }

    setClearedCount(0);
    setTotalSpots(generated.length);
    setSpots(generated);
    setIsComplete(false);
  }, []);

  const handleSpotTap = useCallback(
    (spotId: string) => {
      setSpots((prev) => {
        let removed = false;
        const updated = prev
          .map((spot) => {
            if (spot.id !== spotId) return spot;
            const nextProgress = Math.min(100, spot.progress + progressPerTap);
            if (nextProgress >= 100) {
              removed = true;
              return null;
            }
            return { ...spot, progress: nextProgress };
          })
          .filter((spot): spot is SpraySpot => spot !== null);

        if (removed) {
          setClearedCount((prevCount) => prevCount + 1);
        }
        if (removed && updated.length === 0) {
          setIsComplete(true);
        }
        return updated;
      });
    },
    [progressPerTap]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, spotId: string) => {
      event.preventDefault();
      event.stopPropagation();
      handleSpotTap(spotId);
    },
    [handleSpotTap]
  );

  useEffect(() => {
    if (!open) {
      setSpots([]);
      setIsComplete(false);
      setActionApplied(false);
      characteristicAction.reset();
      return;
    }

    const timer = window.setTimeout(() => {
      generateSpots();
    }, cleanSettings.spawnDelayMs);
    return () => window.clearTimeout(timer);
  }, [generateSpots, open]);

  useEffect(() => {
    if (!open || actionApplied || !isComplete) return;
    setActionApplied(true);
    characteristicAction.mutate(
      {
        actionKey: 'clean_game',
        successMessage: 'Питомец снова чистый',
      },
      {
        onError: () => setActionApplied(false),
      }
    );
  }, [actionApplied, characteristicAction, isComplete, open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateLayout = () => {
      setIsCompactLayout(window.innerWidth < 768);
      const rootStyle = getComputedStyle(document.documentElement);
      const top = parseInt(
        rootStyle.getPropertyValue('--tg-content-safe-area-inset-top') || '0',
        10
      );
      const bottom = parseInt(
        rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom') || '0',
        10
      );
      setSafeAreaInsets({
        top: Number.isFinite(top) ? top : 0,
        bottom: Number.isFinite(bottom) ? bottom : 0
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return (
    <>
      <div
        className={cn('inline-flex cursor-pointer select-none', className)}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </div>

      <DialogEnhanced
        open={open}
        onClose={() => setOpen(false)}
        variant="glass"
        fullWidth
        className="max-w-none"
      >
        <div
          className="relative flex h-full w-full flex-col gap-6 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 md:flex-row"
          style={{
            paddingTop: isCompactLayout ? safeAreaInsets.top + 12 : undefined,
            paddingBottom: isCompactLayout ? safeAreaInsets.bottom + 12 : undefined
          }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
            <div className="absolute inset-0 opacity-40 blur-3xl bg-gradient-to-br from-amber-500/30 via-rose-500/20 to-cyan-500/30 animate-pulse" />
          </div>

          <motion.div
            className={cn(
              'relative z-10 flex w-full flex-col justify-between gap-6 border-t border-white/5',
              'bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 p-5 text-white',
              'rounded-t-3xl md:rounded-none md:rounded-l-3xl md:max-w-[360px]'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{title}</span>
              </div>
              <h2 className="text-3xl font-black">
                Уход за {pet.name ?? 'питомцем'}
              </h2>
              <p className="text-sm text-white/70">{instructions}</p>

              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                  />
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Прогресс — {progressPercent}%
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Совет</p>
              <p>
                Двигайтесь быстро — пятна могут появляться в неожиданных местах. Удерживайте
                тап, чтобы стирать непрерывно.
              </p>
            </div>
          </motion.div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-4 md:px-8">
            <div className="relative w-full max-w-3xl">
              <motion.img
                src={resolvedImageUrl}
                alt="Питомец для очистки"
                className="w-full h-auto max-h-[70vh] rounded-[32px] object-contain select-none"
                initial={{ opacity: 0.4, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                draggable={false}
              />

              <AnimatePresence>
                {spots.map((spot) => {
                  const opacity = Math.max(0.25, 1 - (spot.progress / 100) * 0.7);
                  return (
                    <motion.div
                      key={spot.id}
                      className="absolute z-10 select-none"
                      style={{
                        left: `${spot.x}%`,
                        top: `${spot.y}%`,
                        width: `${cleanSettings.spotSize}px`,
                        height: `${cleanSettings.spotSize}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0, rotate: 90, transition: { duration: 0.25 } }}
                      transition={{
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 },
                        type: 'spring',
                        stiffness: 220,
                        damping: 18
                      }}
                      onPointerDown={(event) => handlePointerDown(event, spot.id)}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <img
                        src={cleanSettings.sprayImagePath}
                        alt="Пятно"
                        className="h-full w-full select-none pointer-events-none"
                        draggable={false}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/45 px-2 py-1 text-[11px] font-semibold text-white shadow">
                          {Math.min(100, Math.round(spot.progress))}%
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[32px] bg-black/70 text-center text-white backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Sparkles className="h-12 w-12 text-amber-200" />
                    <p className="text-lg font-bold">Питомец сияет чистотой!</p>
                    <p className="text-sm text-white/70 px-6">
                      Отличная работа. Нажмите по триггеру ещё раз, чтобы повторить.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogEnhanced>
    </>
  );
}

export default CleanGame;

