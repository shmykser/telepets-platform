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

  const canvasSize = useMemo(
    () => ({
      width: isCompactLayout ? 320 : 520,
      height: isCompactLayout ? 420 : 520
    }),
    [isCompactLayout]
  );

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
          className="relative flex h-full w-full flex-col gap-6 bg-gradient-to-b from-indigo-950/90 via-slate-950/85 to-slate-950/90 md:flex-row"
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
            className={cn(
              'relative z-10 flex w-full flex-col justify-between gap-5 border-t border-white/5',
              'bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-slate-950/90 p-5 text-white',
              'rounded-t-3xl md:rounded-none md:rounded-l-3xl md:max-w-[360px]'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Shield className="h-4 w-4 text-amber-300" />
                <span>Egg Defender</span>
              </div>
              <h2 className="text-3xl font-black">
                Защити {pet.name ?? 'питомца'}
              </h2>
              <p className="text-sm text-white/70">
                Враги движутся к яйцу. Тапайте по ним, чтобы защищать питомца. Держите яйцо в безопасности пока таймер не закончится.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Сложность</span>
                  <span className="font-semibold uppercase tracking-wide">{difficulty}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">Время</div>
                <div className="text-2xl font-bold tabular-nums">
                  {(timeLeft / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">Здоровье</div>
                <div className="text-2xl font-bold text-emerald-300">{eggHealth}%</div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">Очки</div>
                <div className="text-2xl font-bold text-cyan-300">{score}</div>
              </div>
            </div>
          </motion.div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-4 md:px-8">
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
        </div>
      </DialogEnhanced>
    </>
  );
}

export default EggDefenseGame;

