import { settings } from '@config/settings';

type GameEvent =
  | 'GAME_READY'
  | 'GAME_RESET_REQUESTED'
  | 'SCENE_RESTARTED'
  | 'SCENE_STARTED'
  | 'SCENE_COMPLETED'
  | 'GAME_ERROR';

interface GameEventPayload {
  [key: string]: unknown;
}

export const sendGameEvent = (type: GameEvent, payload: GameEventPayload = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  const targetOrigin = settings.integration.targetOrigin ?? '*';

  window.parent?.postMessage(
    {
      source: 'telepets-games',
      type,
      payload,
      timestamp: Date.now()
    },
    targetOrigin
  );
};

