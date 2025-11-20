import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import DialogEnhanced from '@/components/DialogEnhanced';
import type { Pet } from '@/types';
import { cn } from '@/utils';
import { useCharacteristicAction } from '@/hooks/useCharacteristicAction';
// @ts-ignore — Phaser типы подтягиваются из внешнего пакета игр
import Phaser from 'phaser';
// ВАЖНО: используем сцену из каталога games (ранее games_old)
// Путь относительный к этому файлу: up 4 уровней к frontends/, затем в games/src/scenes
// eslint-disable-next-line import/no-relative-packages
// @ts-ignore — сцена на JS из соседнего пакета
import { EggDefense } from '../../../../games/src/scenes/EggDefense.js';

export interface EggDefencePhaserProps {
  pet: Pet;
  trigger: React.ReactNode;
  className?: string;
  difficulty?: 'easy' | 'normal' | 'hard';
  startWave?: number;  // стартовая волна/минута (с 1)
}

const DIFFICULTY_LABEL: Record<'easy' | 'normal' | 'hard', string> = {
  easy: 'easy',
  normal: 'normal',
  hard: 'hard',
};

export function EggDefencePhaser({
  pet: _pet,
  trigger,
  className,
  difficulty = 'normal',
  startWave,
}: EggDefencePhaserProps) {
  const [open, setOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  // viewport не используется для избежания лишних пересчётов во время сессии
  const [roundStartAt, setRoundStartAt] = useState<number | null>(null);
  const [roundDurationMs, setRoundDurationMs] = useState<number | null>(null);
  const [roundProgressPct, setRoundProgressPct] = useState<number>(0);
  const [roundLabel, setRoundLabel] = useState<string>('0%');
  const roundTimerRef = useRef<number | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<any>(null);
  const originalSearchRef = useRef<string | null>(null);

  // Мутация изменения характеристики через бэкенд
  const characteristicAction = useCharacteristicAction(_pet);

  // Размеры контейнера вычисляются по факту при открытии (через getBoundingClientRect)

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateLayout = () => {
      // Обновляем параметры только когда игра закрыта,
      // чтобы не триггерить перерасчёты размеров во время сессии
      if (!open) {
        setIsCompactLayout(window.innerWidth < 768);
        const rootStyle = getComputedStyle(document.documentElement);
        const top = parseInt(rootStyle.getPropertyValue('--tg-content-safe-area-inset-top') || '0', 10);
        const bottom = parseInt(
          rootStyle.getPropertyValue('--tg-content-safe-area-inset-bottom') || '0',
          10
        );
        setSafeAreaInsets({
          top: Number.isFinite(top) ? top : 0,
          bottom: Number.isFinite(bottom) ? bottom : 0,
        });
      }
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [open]);

  // Подписка на события игры из сцены (CustomEvent — telepets:game)
  useEffect(() => {
    if (!open) return;
    const onGameEvent = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (!detail || typeof detail !== 'object') return;
      const { type, payload } = detail;
      if (type === 'GAME_START' && payload) {
        const startAt = Number(payload.startAt) || Date.now();
        const duration = Number(payload.durationMs) || 0;
        setRoundStartAt(startAt);
        setRoundDurationMs(duration);
      }
      if (type === 'GAME_END') {
        // Останавливаем локальный таймер и финализируем прогресс
        if (roundTimerRef.current) {
          window.clearInterval(roundTimerRef.current);
          roundTimerRef.current = null;
        }
        setRoundProgressPct(100);
        // Применяем изменение характеристики через бэкенд по результату игры
        try {
          const won = Boolean(payload?.won);
          const actionKey = won ? 'egg_defense_game_win' : 'egg_defense_game_lose';
          // delta не передаём — сервер возьмёт из конфигурации recovery[actionKey]
          characteristicAction.mutate({
            actionKey,
            successMessage: won ? 'Защита увеличена за победу в игре' : 'Защита снижена из-за поражения',
            metadata: {
              source: 'egg_defense',
              game: 'egg_defense',
              result: won ? 'win' : 'lose',
            }
          });
        } catch {}
      }
    };
    window.addEventListener('telepets:game', onGameEvent as EventListener);
    return () => {
      window.removeEventListener('telepets:game', onGameEvent as EventListener);
    };
  }, [open]);

  // Локальный таймер прогресса (1 Гц) — считаем оставшееся время по startAt+duration
  useEffect(() => {
    // Если диалог закрыт, немедленно очищаем таймер и сбрасываем состояние
    if (!open) {
      if (roundTimerRef.current) {
        window.clearInterval(roundTimerRef.current);
        roundTimerRef.current = null;
      }
      setRoundProgressPct(0);
      setRoundLabel('0%');
      return;
    }
    if (!roundStartAt || !roundDurationMs) return;
    if (roundTimerRef.current) {
      window.clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    const tick = () => {
      const now = Date.now();
      const endAt = roundStartAt + roundDurationMs;
      const remaining = Math.max(0, endAt - now);
      const pct = roundDurationMs > 0 ? Math.round(((roundDurationMs - remaining) / roundDurationMs) * 100) : 0;
      setRoundProgressPct(Math.max(0, Math.min(100, pct)));
      const mm = Math.floor(remaining / 60000);
      const ss = Math.floor((remaining % 60000) / 1000);
      setRoundLabel(`${mm}:${String(ss).padStart(2, '0')}`);
      if (remaining <= 0) {
        // Дадим сцене завершить игру и прислать GAME_END
        if (roundTimerRef.current) {
          window.clearInterval(roundTimerRef.current);
          roundTimerRef.current = null;
        }
      }
    };
    tick();
    roundTimerRef.current = window.setInterval(tick, 1000);
    return () => {
      if (roundTimerRef.current) {
        window.clearInterval(roundTimerRef.current);
        roundTimerRef.current = null;
      }
    };
  }, [open, roundStartAt, roundDurationMs]);

  // Инициализация Phaser с загрузкой сцены EggDefense сразу в центральный контейнер
  useEffect(() => {
    if (!open) {
      // Закрыли диалог — разрушим игру и восстановим URL
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      // Останавливаем таймер немедленно при закрытии
      if (roundTimerRef.current) {
        window.clearInterval(roundTimerRef.current);
        roundTimerRef.current = null;
      }
      // Шлём событие о выключении игрового режима (для паузы фоновых процессов)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('telepets:game-mode', { detail: { active: false } }));
      }
      // Сброс прогресса раунда
      setRoundStartAt(null);
      setRoundDurationMs(null);
      setRoundProgressPct(0);
      setRoundLabel('0%');
      if (originalSearchRef.current !== null && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.search = originalSearchRef.current;
        window.history.replaceState({}, '', url.toString());
        originalSearchRef.current = null;
      }
      return;
    }
    if (!phaserContainerRef.current) return;
    if (gameRef.current) return; // уже создано

    // Временный параметр ?game_type=egg_defense для автозапуска в сцене
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      originalSearchRef.current = url.search; // сохранить оригинальные параметры
      url.searchParams.set('game_type', 'egg_defense');
      // Пробрасываем ТОЛЬКО startWave
      if (typeof startWave === 'number' && Number.isFinite(startWave)) {
        url.searchParams.set('startWave', String(Math.max(1, Math.floor(startWave))));
      } else {
        url.searchParams.delete('startWave');
      }
      window.history.replaceState({}, '', url.toString());
      // Сообщаем приложению, что активирован режим игры
      window.dispatchEvent(new CustomEvent('telepets:game-mode', { detail: { active: true } }));
    }

    // Берём фактические размеры контейнера один раз при запуске
    const bounds = phaserContainerRef.current.getBoundingClientRect();
    const gameWidth = Math.max(320, Math.floor(bounds.width));
    const gameHeight = Math.max(480, Math.floor(bounds.height));

    const config: any = {
      type: Phaser.AUTO,
      parent: phaserContainerRef.current,
      backgroundColor: '#000000',
      width: gameWidth,
      height: gameHeight,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameWidth,
        height: gameHeight,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      render: {
        powerPreference: 'high-performance',
        antialias: true,
      },
      scene: [EggDefense],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      if (originalSearchRef.current !== null && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.search = originalSearchRef.current;
        window.history.replaceState({}, '', url.toString());
        originalSearchRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Оборачиваем триггер принудительным onClick, чтобы гарантировать открытие
  const triggerWithHandler = useMemo(() => {
    if (React.isValidElement(trigger)) {
      const originalOnClick = (trigger as any).props?.onClick;
      return React.cloneElement(trigger as React.ReactElement<any>, ({
        onClick: (event: React.MouseEvent) => {
          // сначала открываем диалог
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
          // затем вызываем исходный обработчик, если был
          if (typeof originalOnClick === 'function') {
            originalOnClick(event);
          }
        },
      } as any));
    }
    return (
      <div
        className={cn('inline-flex cursor-pointer select-none', className)}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {trigger}
      </div>
    );
  }, [trigger, className]);

  return (
    <>
      {triggerWithHandler}

      <DialogEnhanced
        open={open}
        onClose={() => setOpen(false)}
        variant="glass"
        fullWidth
        className="max-w-none"
      >
        <div
          className="relative flex h-full w-full flex-col bg-black/75"
          style={{
            paddingTop: isCompactLayout ? safeAreaInsets.top + 12 : undefined,
            paddingBottom: isCompactLayout ? safeAreaInsets.bottom + 12 : undefined,
          }}
        >
          {/* Убрали тяжёлые blur/animate-pulse слои для снижения overdraw */}

          <motion.div
            className="relative flex-1 overflow-hidden rounded-[32px]"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '90vh' }}
          >
            {/* Лёгкий затемняющий слой */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Топ-виджет: только «Режим» */}
            <div className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 px-4 text-center text-white">
              <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/35 px-6 py-2 backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-[0.35em] text-white/70">Режим</div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  Egg Defender · {DIFFICULTY_LABEL[difficulty]}
                </div>
              </div>
            </div>

            {/* Центральный контейнер под Phaser: отступы 10% со всех сторон */}
            <div className="absolute inset-[10%] z-10">
              <div
                ref={phaserContainerRef}
                className="h-full w-full overflow-hidden rounded-[36px] border border-white/10 bg-black/30 shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
              />
            </div>

            {/* Низ — «Раунд» с процентом (пока 0%) */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex w-full justify-center px-6 sm:px-10">
              <motion.div
                className="w-full max-w-md rounded-full border border-white/15 bg-black/40 px-6 py-4 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-200/80">
                  <span>Раунд</span>
                  <span>{roundLabel}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-300"
                    animate={{ width: `${roundProgressPct}%` }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </DialogEnhanced>
    </>
  );
}

export default EggDefencePhaser;


