import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { cn } from '@/utils';

type ItemType = 'coin' | 'lockpick' | 'jewel';

interface Item {
  id: string;
  x: number;
  y: number;
  type: ItemType;
  value: number;
}

interface House {
  id: string;
  x: number;
  y: number;
  locked: boolean;
  label: string;
}

interface PetThiefGameProps {
  pet: Pet;
  trigger: ReactNode;
  className?: string;
  comingSoon?: boolean;
}

const createItemId = () => `item-${Math.random().toString(36).slice(2, 9)}`;

const HOUSE_POSITIONS: House[] = [
  { id: 'house-1', x: 0.2, y: 0.25, locked: true, label: 'Дом травника' },
  { id: 'house-2', x: 0.5, y: 0.75, locked: false, label: 'Дом ремесленника' },
  { id: 'house-3', x: 0.8, y: 0.35, locked: true, label: 'Дом коллекционера' }
];

const ITEM_EMOJI: Record<ItemType, { emoji: string; color: string }> = {
  coin: { emoji: '💰', color: '#facc15' },
  lockpick: { emoji: '🗝️', color: '#38bdf8' },
  jewel: { emoji: '💎', color: '#ec4899' }
};

export function PetThiefGame({ pet, trigger, className, comingSoon = false }: PetThiefGameProps) {
  const [open, setOpen] = useState(false);
  const [petPosition, setPetPosition] = useState({ x: 0.5, y: 0.5 });
  const [petTarget, setPetTarget] = useState<{ x: number; y: number } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState({ coins: 0, lockpicks: 0, jewels: 0 });
  const [houseMessage, setHouseMessage] = useState<string | null>(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });

  const boardRef = useRef<HTMLDivElement>(null);
  const movementFrameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);

  const boardSize = useMemo(
    () => ({
      width: isCompactLayout ? 320 : 520,
      height: isCompactLayout ? 360 : 520
    }),
    [isCompactLayout]
  );

  const resetGame = useCallback(() => {
    setPetPosition({ x: 0.5, y: 0.5 });
    setPetTarget(null);
    setItems([]);
    setInventory({ coins: 0, lockpicks: 0, jewels: 0 });
    setHouseMessage(null);
  }, []);

  const spawnItem = useCallback(() => {
    const types: ItemType[] = ['coin', 'lockpick', 'jewel'];
    const type = types[Math.floor(Math.random() * types.length)];
    setItems((prev) => [
      ...prev.slice(-8),
      {
        id: createItemId(),
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        type,
        value: type === 'jewel' ? 3 : 1
      }
    ]);
  }, []);

  const handleBoardTap = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setPetTarget({ x: Math.min(Math.max(x, 0.05), 0.95), y: Math.min(Math.max(y, 0.1), 0.9) });
  }, []);

  const handleHouseTap = useCallback((house: House) => {
    setHouseMessage(
      house.locked
        ? `${house.label} заперт. Нужно больше опыта и отмычек.`
        : `${house.label} приветствует ${pet.name ?? 'питомца'}!`
    );
    setTimeout(() => setHouseMessage(null), 2500);
  }, [pet.name]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      handleBoardTap(event.clientX, event.clientY);
    },
    [handleBoardTap]
  );

  useEffect(() => {
    if (!open || comingSoon) {
      resetGame();
      return;
    }

    spawnItem();
    spawnTimerRef.current = window.setInterval(spawnItem, 1800);
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [comingSoon, open, resetGame, spawnItem]);

  useEffect(() => {
    if (!open || comingSoon) {
      if (movementFrameRef.current) {
        cancelAnimationFrame(movementFrameRef.current);
        movementFrameRef.current = null;
      }
      return;
    }

    const speed = isCompactLayout ? 0.18 : 0.12;

    const movePet = () => {
      setPetPosition((current) => {
        if (!petTarget) return current;
        const dx = petTarget.x - current.x;
        const dy = petTarget.y - current.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 0.003) {
          return petTarget;
        }
        const step = Math.min(speed, distance);
        return {
          x: current.x + (dx / distance) * step,
          y: current.y + (dy / distance) * step
        };
      });
      movementFrameRef.current = requestAnimationFrame(movePet);
    };

    movementFrameRef.current = requestAnimationFrame(movePet);
    return () => {
      if (movementFrameRef.current) {
        cancelAnimationFrame(movementFrameRef.current);
        movementFrameRef.current = null;
      }
    };
  }, [comingSoon, isCompactLayout, open, petTarget]);

  useEffect(() => {
    if (!open || comingSoon) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const dx = item.x - petPosition.x;
        const dy = item.y - petPosition.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 0.05) {
          changed = true;
          setInventory((inv) => ({
            ...inv,
            [item.type === 'coin' ? 'coins' : item.type === 'lockpick' ? 'lockpicks' : 'jewels']:
              inv[item.type === 'coin' ? 'coins' : item.type === 'lockpick' ? 'lockpicks' : 'jewels'] +
              item.value
          }));
          return { ...item, x: -1, y: -1 };
        }
        return item;
      });
      return changed ? next.filter((item) => item.x >= 0) : prev;
    });
  }, [comingSoon, open, petPosition.x, petPosition.y]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateLayout = () => {
      setIsCompactLayout(window.innerWidth < 768);
      const rootStyle = getComputedStyle(document.documentElement);
      const top = parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-top') || '0', 10);
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
            <div className="absolute inset-0 opacity-40 blur-3xl bg-gradient-to-br from-amber-500/30 via-emerald-500/20 to-sky-500/30 animate-pulse" />
          </div>

          <motion.div
            className={cn(
              'relative z-10 flex w-full flex-col justify-between gap-6 border-t border-white/5',
              'bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-slate-950/90 p-5 text-white',
              'rounded-t-3xl md:rounded-none md:rounded-l-3xl md:max-w-[360px]'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Pet Thief</span>
              </div>
              <h2 className="text-3xl font-black">Исследование города</h2>
              <p className="text-sm text-white/70">
                Направляйте {pet.name ?? 'питомца'} тапами по карте. Собирайте лут, обходите запертые дома и ищите богатства.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold text-white">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Монеты</div>
                  <div className="text-2xl">{inventory.coins}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Отмычки</div>
                  <div className="text-2xl">{inventory.lockpicks}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Драгоценн.</div>
                  <div className="text-2xl">{inventory.jewels}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Совет</p>
              <p>
                Сначала собирайте монеты и отмычки, чтобы разблокировать закрытые дома и получить доступ к особым миссиям.
              </p>
            </div>
          </motion.div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-4 md:px-8">
            <div
              ref={boardRef}
              className="relative w-full overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/80 shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
              style={{
                maxWidth: boardSize.width,
                aspectRatio: `${boardSize.width}/${boardSize.height}`,
                backgroundImage:
                  'linear-gradient(transparent 95%, rgba(255,255,255,0.04) 95%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.04) 95%)',
                backgroundSize: '40px 40px'
              }}
              onPointerDown={comingSoon ? undefined : handlePointerDown}
            >
              <AnimatePresence>
                {houseMessage && (
                  <motion.div
                    className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {houseMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {HOUSE_POSITIONS.map((house) => (
                <motion.button
                  key={house.id}
                  type="button"
                  className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl text-white shadow-lg backdrop-blur transition"
                  style={{
                    left: `${house.x * 100}%`,
                    top: `${house.y * 100}%`,
                    opacity: house.locked ? 0.7 : 1
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleHouseTap(house);
                  }}
                >
                  {house.locked ? '🔒' : '🏠'}
                </motion.button>
              ))}

              {items.map((item) => (
                <motion.div
                  key={item.id}
                  className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 shadow-lg backdrop-blur"
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    backgroundColor: `${ITEM_EMOJI[item.type].color}30`
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {ITEM_EMOJI[item.type].emoji}
                </motion.div>
              ))}

              <motion.div
                className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl shadow-2xl"
                style={{
                  left: `${petPosition.x * 100}%`,
                  top: `${petPosition.y * 100}%`
                }}
                animate={{ scale: petTarget ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 1.5, repeat: petTarget ? Infinity : 0 }}
              >
                {pet.state === 'baby' ? '🍼' : '🐾'}
              </motion.div>

              {petTarget && (
                <motion.div
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300/70"
                  style={{
                    left: `${petTarget.x * 100}%`,
                    top: `${petTarget.y * 100}%`
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}

              <AnimatePresence>
                {comingSoon && (
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-center text-white backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Sparkles className="h-10 w-10 text-amber-200" />
                        <p className="text-lg font-semibold">Мини-игра в разработке</p>
                        <p className="text-sm text-white/70 px-8">
                          Скоро появится полноценная сцена путешествий для детёнышей.
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

export default PetThiefGame;

