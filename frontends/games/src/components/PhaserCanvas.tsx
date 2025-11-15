import React, { useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';

import { settings } from '@config/settings';
import { createGameConfig } from '@phaser/createConfig';
import { sendGameEvent } from '@integration/postMessage';
import type { SceneRegistryEntry } from '@data/sceneRegistry';
import { useFullscreen } from '@hooks/useFullscreen';

import styles from './PhaserCanvas.module.css';

type CanvasStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SceneParams {
  userId?: string;
  petName?: string;
}

export interface PhaserCanvasProps {
  sceneEntry: SceneRegistryEntry;
  stageSegments: string[];
  sceneParams?: SceneParams;
}

const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ sceneEntry, stageSegments, sceneParams }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const activeSceneKeyRef = useRef<string | null>(null);

  const [status, setStatus] = useState<CanvasStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fullscreen = useFullscreen(wrapperRef);


  const stageKey = useMemo(() => stageSegments.filter(Boolean).join('/'), [stageSegments]);
  const normalizedStage = useMemo(() => (stageKey ? stageKey.split('/') : []), [stageKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    setStatus('loading');
    setErrorMessage(null);

    const bootstrap = async () => {
      try {
        const { Scene, key } = await sceneEntry.loader({ stageSegments: normalizedStage });
        if (disposed) {
          return;
        }

        const config = createGameConfig(container);
        const game = new Phaser.Game(config);
        gameRef.current = game;

        const sceneKey = key ?? sceneEntry.sceneKey ?? sceneEntry.slug;

        game.events.once(Phaser.Core.Events.READY, () => {
          if (disposed) {
            return;
          }

          game.scene.add(sceneKey, Scene, true, {
            stageSegments: normalizedStage,
            sceneMeta: sceneEntry,
            userId: sceneParams?.userId,
            petName: sceneParams?.petName
          });

          activeSceneKeyRef.current = sceneKey;
          setStatus('ready');
          sendGameEvent('GAME_READY', {
            scene: sceneEntry.slug,
            stage: normalizedStage
          });
        });
      } catch (error) {
        if (disposed) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        console.error('[PhaserCanvas] bootstrap failed', error);
        setErrorMessage(message);
        setStatus('error');
        sendGameEvent('GAME_ERROR', {
          scene: sceneEntry.slug,
          stage: normalizedStage,
          message
        });
      }
    };

    bootstrap();

    return () => {
      disposed = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      activeSceneKeyRef.current = null;
      setStatus('idle');
      setErrorMessage(null);
    };
  }, [sceneEntry, normalizedStage, stageKey, sceneParams]);

  const handleReset = () => {
    const game = gameRef.current;
    const activeKey = activeSceneKeyRef.current;
    if (!game || !activeKey) {
      return;
    }

    const targetScene = game.scene.getScene(activeKey);
    if (targetScene) {
      targetScene.events.emit(settings.events.RESET_REQUESTED);
      targetScene.scene.restart();
    }

    sendGameEvent('GAME_RESET_REQUESTED', {
      scene: sceneEntry.slug,
      stage: normalizedStage
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${fullscreen.isFullscreen ? styles.wrapperFullscreen : ''}`}
    >
      <div ref={containerRef} className={styles.canvasHost} aria-live="polite" />

      {status !== 'ready' && (
        <div className={styles.overlay}>
          {status === 'loading' && (
            <>
              <span className={styles.spinner} />
              <p>Инициализация игровой сцены…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <p className={styles.errorTitle}>Не удалось загрузить сцену</p>
              <p className={styles.errorBody}>{errorMessage}</p>
            </>
          )}
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.meta}>
          <span
            className={`${styles.statusDot} ${status === 'ready' ? styles.statusReady : ''}`}
            aria-hidden
          />
          {status === 'ready'
            ? 'Готово к интеграции'
            : status === 'error'
              ? 'Ошибка загрузки'
              : 'Загрузка движка'}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.fullscreenButton}
            type="button"
            onClick={fullscreen.toggle}
          >
            {fullscreen.isFullscreen ? 'Выйти из полноэкранного' : 'На весь экран'}
          </button>
          <button
            className={styles.resetButton}
            type="button"
            onClick={handleReset}
            disabled={status !== 'ready'}
          >
            Сбросить сцену
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PhaserCanvas;

