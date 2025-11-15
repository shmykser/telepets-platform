import Phaser from 'phaser';
import { settings } from '@config/settings';

export const createGameConfig = (parent: HTMLElement | string): Phaser.Types.Core.GameConfig => {
  const { baseWidth, baseHeight, minWidth, minHeight, maxWidth, maxHeight } = settings.graphics;

  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: settings.graphics.backgroundColor,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: baseWidth,
      height: baseHeight,
      min: {
        width: minWidth,
        height: minHeight
      },
      max: {
        width: maxWidth,
        height: maxHeight
      }
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: settings.debug.physics
      }
    },
    input: {
      activePointers: settings.controls.activePointers,
      smoothFactor: 0.5,
      gamepad: settings.controls.gamepad
    },
    render: {
      antialias: settings.graphics.antialias,
      pixelArt: settings.graphics.pixelArt,
      roundPixels: false
    },
    audio: {
      disableWebAudio: true,
      noAudio: false
    },
    scene: []
  };
};

