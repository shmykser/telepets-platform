/**
 * Прямой запуск PetThiefScene без меню
 * Этот файл используется для /petthief маршрута
 */

import Phaser from 'phaser';
import { PetThiefScene } from './scenes/PetThiefScene.js';

// Экспортируем PetThiefScene в глобальную область для petthief.html
window.Phaser = Phaser;
window.PetThiefScene = PetThiefScene;

console.log('🎮 [PetThief Direct] Модули загружены и экспортированы в window');