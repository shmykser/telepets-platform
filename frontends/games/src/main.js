import Phaser from 'phaser';
import { PHASER_SETTINGS } from './settings/GameSettings.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { EggDefense } from './scenes/EggDefense.js';
import { PetThiefScene } from './scenes/PetThiefScene.js';
import { HouseInteriorScene } from './scenes/HouseInteriorScene.js';
import { PinLockScene } from './scenes/lockpicking/PinLockScene.js';
import { MazeLockScene } from './scenes/lockpicking/MazeLockScene.js';
import { PatternLockScene } from './scenes/lockpicking/PatternLockScene.js';
import { TestLocks } from './scenes/TestLocks.js';
import { TestEffects } from './scenes/TestEffects.js';
import { SpriteTestScene } from './scenes/SpriteTestScene.js';
import { DemoComponents } from './scenes/DemoComponents.js';
import { TestGestures } from './scenes/TestGestures.js';
import { TestBehaviors } from './scenes/TestBehaviors.js';
import { initTelegram } from './telegram/TelegramInit.js';

/**
 * Динамический расчет размера игры с учетом devicePixelRatio
 * Best practices из Phaser документации для мобильных устройств
 */
function getGameDimensions() {
    // Учитываем devicePixelRatio для высокого качества на retina дисплеях
    const dpr = window.devicePixelRatio || 1;
    
    // Базовые размеры viewport
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    console.log('📐 [Phaser] Game dimensions:', {
        viewport: { width, height },
        dpr,
        calculated: { width: width * dpr, height: height * dpr }
    });
    
    return {
        width: width,
        height: height,
        dpr
    };
}

const gameDimensions = getGameDimensions();

/**
 * Phaser конфигурация с динамическими размерами для fullscreen
 * 
 * Изменения:
 * - Убраны жесткие ограничения max width/height
 * - Используется FIT mode для сохранения пропорций БЕЗ черных полос
 * - Динамические размеры на основе window.innerWidth/Height
 * - Учет devicePixelRatio для качества на retina
 */
const config = {
    type: Phaser.AUTO,
    backgroundColor: PHASER_SETTINGS.backgroundColor,
    scale: {
        mode: Phaser.Scale.FIT, // FIT заполняет экран с сохранением пропорций
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameDimensions.width,
        height: gameDimensions.height,
        parent: 'game',
        // Минимальные размеры для мобильных устройств
        min: {
            width: PHASER_SETTINGS.responsive.minWidth,
            height: PHASER_SETTINGS.responsive.minHeight
        },
        // Убираем max ограничения для fullscreen
        // max: убрано
    },
    physics: PHASER_SETTINGS.physics,
    input: {
        activePointers: 3,
        smoothFactor: 0.5
    },
    scene: [PreloadScene, MenuScene, EggDefense, PetThiefScene, HouseInteriorScene, PinLockScene, MazeLockScene, PatternLockScene, TestLocks, TestEffects, SpriteTestScene, DemoComponents, TestGestures, TestBehaviors],
    render: {
        pixelArt: false,
        antialias: true,
        // Для лучшего качества на retina
        powerPreference: 'high-performance'
    }
};

// Инициализируем Telegram WebApp SDK (мягко в вебе)
initTelegram();

console.log('🎮 [Phaser] Initializing game with config:', config);

// eslint-disable-next-line no-new
const game = new Phaser.Game(config);

/**
 * Обработка изменения размера окна - адаптация игры
 * Best practice: динамический resize при изменении viewport
 */
window.addEventListener('resize', () => {
    const newDimensions = getGameDimensions();
    
    console.log('📐 [Phaser] Window resized, updating game dimensions:', newDimensions);
    
    // Обновляем размер игры
    game.scale.resize(newDimensions.width, newDimensions.height);
});

/**
 * Обработка изменения ориентации устройства
 */
window.addEventListener('orientationchange', () => {
    console.log('🔄 [Phaser] Orientation changed');
    
    // Небольшая задержка для корректного обновления размеров
    setTimeout(() => {
        const newDimensions = getGameDimensions();
        game.scale.resize(newDimensions.width, newDimensions.height);
    }, 100);
});
