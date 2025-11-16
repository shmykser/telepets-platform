import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Target } from 'lucide-react';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { cn } from '@/utils';

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

interface Enemy {
  id: string;
  x: number;
  y: number;
  speed: number;
  angle: number;
  health: number;
}

interface EggDefenseGameProps {
  pet: Pet;
  trigger: ReactNode;
  className?: string;
  difficulty?: 'easy' | 'normal' | 'hard';
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, spawnInterval: 1400, enemySpeed: 55, tapDamage: 60 },
  normal: { duration: 60000, spawnInterval: 1100, enemySpeed: 70, tapDamage: 45 },
  hard: { duration: 75000, spawnInterval: 900, enemySpeed: 85, tapDamage: 35 }
};

const createEnemyId = () => `enemy-${Math.random().toString(36).slice(2, 9)}`;

export function EggDefenseGame({
  pet,
  trigger,
  className,
  difficulty = 'normal'
}: EggDefenseGameProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_CONFIG[difficulty].duration);
  const [eggHealth, setEggHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const eggHealthRef = useRef(100);
  const timeLeftRef = useRef(DIFFICULTY_CONFIG[difficulty].duration);
  const scoreRef = useRef(0);

  const config = DIFFICULTY_CONFIG[difficulty];

  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 360,
    height: typeof window !== 'undefined' ? window.innerHeight : 640
  });

  const canvasSize = useMemo(() => {
    const target = Math.max(240, Math.min(viewport.width * 0.9, viewport.height * 0.9));
    return {
      width: Math.floor(target),
      height: Math.floor(target)
    };
  }, [viewport.height, viewport.width]);

  const eggPosition = useMemo(
    () => ({
      x: canvasSize.width / 2,
      y: canvasSize.height / 2
    }),
    [canvasSize.height, canvasSize.width]
  );

  const resetGameState = useCallback(() => {
    enemiesRef.current = [];
    lastTimestampRef.current = performance.now();
    eggHealthRef.current = 100;
    timeLeftRef.current = config.duration;
    scoreRef.current = 0;
    setEggHealth(100);
    setTimeLeft(config.duration);
    setScore(0);
    setStatus('playing');
  }, [config.duration]);

  const spawnEnemy = useCallback(() => {
    const perimeter = Math.random() * (canvasSize.width + canvasSize.height) * 2;
    let x: number;
    let y: number;

    if (perimeter < canvasSize.width) {
      x = perimeter;
      y = 0;
    } else if (perimeter < canvasSize.width + canvasSize.height) {
      x = canvasSize.width;
      y = perimeter - canvasSize.width;
    } else if (perimeter < canvasSize.width * 2 + canvasSize.height) {
      x = perimeter - (canvasSize.width + canvasSize.height);
      y = canvasSize.height;
    } else {
      x = 0;
      y = perimeter - (canvasSize.width * 2 + canvasSize.height);
    }

    const dx = eggPosition.x - x;
    const dy = eggPosition.y - y;
    const angle = Math.atan2(dy, dx);

    enemiesRef.current.push({
      id: createEnemyId(),
      x,
      y,
      speed: config.enemySpeed + Math.random() * 20,
      angle,
      health: 100
    });
  }, [canvasSize.height, canvasSize.width, config.enemySpeed, eggPosition.x, eggPosition.y]);

  const handlePointer = useCallback(
    (event: PointerEvent) => {
      if (status !== 'playing') return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const x = (event.clientX - rect.left) * ratio;
      const y = (event.clientY - rect.top) * ratio;

      const hitRadius = 55 * ratio;

      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        const enemyX = enemy.x * ratio;
        const enemyY = enemy.y * ratio;
        const distance = Math.hypot(enemyX - x, enemyY - y);
        if (distance <= hitRadius) {
          const nextHealth = enemy.health - config.tapDamage;
          if (nextHealth <= 0) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            return false;
          }
          enemy.health = nextHealth;
        }
        return true;
      });
    },
    [config.tapDamage, status]
  );

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.removeEventListener('pointerdown', handlePointer);
    }
  }, [handlePointer]);

  const updateGame = useCallback(
    (timestamp: number) => {
      if (status !== 'playing') return;
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      timeLeftRef.current = Math.max(0, timeLeftRef.current - delta);
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        setStatus('won');
        cleanup();
        return;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      // background
      const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      // Update enemies
      const enemies = enemiesRef.current;
      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];
        enemy.x += Math.cos(enemy.angle) * enemy.speed * (delta / 1000);
        enemy.y += Math.sin(enemy.angle) * enemy.speed * (delta / 1000);

        const distance = Math.hypot(enemy.x - eggPosition.x, enemy.y - eggPosition.y);
        if (distance <= 60) {
          eggHealthRef.current = Math.max(0, eggHealthRef.current - 10);
          setEggHealth(eggHealthRef.current);
          enemies.splice(i, 1);
          if (eggHealthRef.current <= 0) {
            setStatus('lost');
            cleanup();
            break;
          }
        }
      }

      // draw egg
      const eggGradient = ctx.createRadialGradient(
        eggPosition.x - 10,
        eggPosition.y - 10,
        10,
        eggPosition.x,
        eggPosition.y,
        120
      );
      eggGradient.addColorStop(0, '#fef3c7');
      eggGradient.addColorStop(1, '#f97316');
      ctx.fillStyle = eggGradient;
      ctx.beginPath();
      ctx.ellipse(eggPosition.x, eggPosition.y, 70, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // draw aura
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(eggPosition.x, eggPosition.y, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // draw enemies
      enemies.forEach((enemy) => {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐞', enemy.x, enemy.y);
      });

      // draw egg as emoji
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥚', eggPosition.x, eggPosition.y);
    },
    [cleanup, canvasSize.height, canvasSize.width, eggPosition.x, eggPosition.y, status]
  );

  const gameLoop = useCallback(
    (timestamp: number) => {
      updateGame(timestamp);
      if (status === 'playing') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    },
    [status, updateGame]
  );

  useEffect(() => {
    if (!open) {
      cleanup();
      setStatus('idle');
      return;
    }

    resetGameState();
    const canvas = canvasRef.current;
    if (canvas) {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvasSize.width * ratio;
      canvas.height = canvasSize.height * ratio;
      canvas.style.width = `${canvasSize.width}px`;
      canvas.style.height = `${canvasSize.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      canvas.addEventListener('pointerdown', handlePointer);
    }

    spawnEnemy();
    spawnTimerRef.current = window.setInterval(spawnEnemy, config.spawnInterval);
    lastTimestampRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return cleanup;
  }, [canvasSize.height, canvasSize.width, cleanup, config.spawnInterval, gameLoop, handlePointer, open, resetGameState, spawnEnemy]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateLayout = () => {
      setIsCompactLayout(window.innerWidth < 768);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
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
          className="relative flex h-full w-full flex-col bg-gradient-to-b from-black/80 via-black/60 to-black/80"
          style={{
            paddingTop: isCompactLayout ? safeAreaInsets.top + 12 : undefined,
            paddingBottom: isCompactLayout ? safeAreaInsets.bottom + 12 : undefined
          }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
            <div className="absolute inset-0 opacity-40 blur-3xl bg-gradient-to-br from-rose-500/30 via-orange-500/20 to-emerald-400/30 animate-pulse" />
          </div>

          <motion.div
            className="relative flex-1 overflow-hidden rounded-[32px]"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '90vh' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/45 to-black/65" />

            {/* Топ-виджет статуса */}
            <div className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 px-4 text-center text-white">
              <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/35 px-6 py-2 backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-[0.35em] text-white/70">
                  Режим
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  Egg Defender · {difficulty}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="tabular-nums">{(timeLeft / 1000).toFixed(1)}s</span>
                  <span className="opacity-50">·</span>
                  <span className="tabular-nums">{eggHealth}% HP</span>
                  <span className="opacity-50">·</span>
                  <span className="tabular-nums">{score} очк.</span>
                </div>
              </div>
            </div>

            {/* Правый вертикальный индикатор (здоровье яйца) */}
            <div className="absolute right-3 sm:right-6 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col text-end text-[10px] text-white/60">
                <span>Здоровье</span>
                <span>{eggHealth}%</span>
              </div>
              <div className="relative flex h-56 w-12 flex-col items-center rounded-2xl border border-white/15 bg-white/5 px-2.5 py-4 backdrop-blur-lg">
                <Shield className="mb-2 h-5 w-5 text-white/80" />
                <div className="relative h-full w-3 rounded-full bg-white/10">
                  <motion.div
                    className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-emerald-400 via-teal-400 to-cyan-400"
                    style={{ height: `${Math.max(0, Math.min(100, eggHealth))}%` }}
                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                  />
                </div>
              </div>
            </div>

            {/* Низ — прогресс таймера */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex w-full justify-center px-6 sm:px-10">
              <motion.div
                className="w-full max-w-md rounded-full border border-white/15 bg-black/40 px-6 py-4 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-200/80">
                  <span>Раунд</span>
                  <span>
                    {Math.round(
                      Math.max(0, Math.min(1, 1 - timeLeft / DIFFICULTY_CONFIG[difficulty].duration)) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-300"
                    animate={{
                      width: `${
                        Math.max(0, Math.min(1, 1 - timeLeft / DIFFICULTY_CONFIG[difficulty].duration)) * 100
                      }%`
                    }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-1 text-center text-[10px] text-white/60">
                  {status === 'playing' ? 'Защищайте яйцо!' : status === 'won' ? 'Раунд завершён' : 'Яйцо разрушено'}
                </div>
              </motion.div>
            </div>

            {/* Игровая сцена (canvas) */}
            <div className="relative z-10 flex h-full w-full items-center justify-center px-4 pb-4 md:px-8">
              <div
                className="relative w-full overflow-hidden rounded-[36px] border border-white/10 bg-black/30 shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
                style={{ maxWidth: canvasSize.width }}
              >
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="block w-full"
                  style={{ touchAction: 'none' }}
                />

                <AnimatePresence>
                  {status !== 'playing' && status !== 'idle' && (
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 text-center backdrop-blur-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Target className="h-10 w-10 text-white" />
                      <p className="text-2xl font-bold">
                        {status === 'won' ? 'Победа!' : 'Яйцо разрушено'}
                      </p>
                      <p className="text-sm text-white/70">
                        Очки: {score} · Здоровье яйца: {eggHealth}%
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogEnhanced>
    </>
  );
}

export default EggDefenseGame;

