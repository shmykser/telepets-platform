import { Defense } from '../objects/Defense.js';
import { STONE_SETTINGS } from '../settings/GameSettings.js';
import { defenseTypes } from '../types/defenseTypes.js';
import { EVENT_TYPES } from '../types/EventTypes.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

/**
 * Менеджер камней - управляет созданием и размещением камней на поле
 */
export class StoneManager {
    constructor(scene) {
        this.scene = scene;
        this.stones = [];
        // Читаем диапазон генерации из defenseTypes.stone.spawn, с fallback на GameSettings
        const stoneSpawn = defenseTypes.stone?.spawn || {};
        this.minStones = stoneSpawn.minCount ?? STONE_SETTINGS.MIN_STONES;
        this.maxStones = stoneSpawn.maxCount ?? STONE_SETTINGS.MAX_STONES;
        this.spawnMargin = stoneSpawn.margin ?? STONE_SETTINGS.STONE_SPAWN_MARGIN;
    }
    
    /**
     * Инициализация камней при старте сцены
     */
    initializeStones() {
        const count = GeometryUtils.randomBetween(this.minStones, this.maxStones);
        console.log(`🗿 [StoneManager] Инициализация ${count} камней`);
        
        for (let i = 0; i < count; i++) {
            const position = this.getRandomValidPosition();
            if (position) {
                const stone = Defense.createDefense(this.scene, 'stone', position.x, position.y);
                
                // Включаем возможность перетаскивания
                if (stone.enableDrag) {
                    stone.enableDrag();
                }
                
                this.stones.push(stone);
                
                // Эмитируем событие создания камня
                this.scene.events.emit(EVENT_TYPES.STONE_CREATED, {
                    stone: stone,
                    position: position,
                    index: i
                });
                
                console.log(`🗿 [StoneManager] Камень ${i + 1} создан в (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`);
            }
        }
        
        console.log(`🗿 [StoneManager] Создано ${this.stones.length} камней из ${count} запланированных`);
    }
    
    /**
     * Получение случайной валидной позиции для камня
     * @returns {Object|null} Позиция {x, y} или null если не найдена
     */
    getRandomValidPosition() {
        const { width, height } = this.scene.scale;
        const maxAttempts = 50;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = GeometryUtils.randomFloat(
                this.spawnMargin, 
                width - this.spawnMargin
            );
            const y = GeometryUtils.randomFloat(
                this.spawnMargin, 
                height - this.spawnMargin
            );
            
            // Проверяем, что позиция не занята другими объектами
            if (this.isPositionValid(x, y)) {
                return { x, y };
            }
        }
        
        console.warn(`🗿 [StoneManager] Не удалось найти валидную позицию после ${maxAttempts} попыток`);
        return null;
    }
    
    /**
     * Проверка валидности позиции
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @returns {boolean} true если позиция валидна
     */
    isPositionValid(x, y) {
        const minDistance = 100; // Минимальное расстояние между камнями
        
        // Проверяем расстояние до существующих камней
        for (const stone of this.stones) {
            const distance = GeometryUtils.distance(x, y, stone.x, stone.y);
            if (distance < minDistance) {
                return false;
            }
        }
        
        // Проверяем расстояние до яйца (если есть)
        if (this.scene.egg) {
            const distanceToEgg = GeometryUtils.distance(x, y, this.scene.egg.x, this.scene.egg.y);
            if (distanceToEgg < 150) { // Минимальное расстояние до яйца
                return false;
            }
        }
        
        // Проверяем расстояние до существующих защитных объектов
        if (this.scene.defenses) {
            for (const defense of this.scene.defenses) {
                if (defense.defenseType !== 'stone') { // Не проверяем другие камни
                    const distance = GeometryUtils.distance(x, y, defense.x, defense.y);
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Получение всех активных камней
     * @returns {Array} Массив активных камней
     */
    getActiveStones() {
        return this.stones.filter(stone => stone && stone.isAlive);
    }
    
    /**
     * Получение камней в радиусе от точки
     * @param {number} x - X координата центра
     * @param {number} y - Y координата центра
     * @param {number} radius - Радиус поиска
     * @returns {Array} Массив камней в радиусе
     */
    getStonesInRadius(x, y, radius) {
        return this.getActiveStones().filter(stone => {
            const distance = GeometryUtils.distance(x, y, stone.x, stone.y);
            return distance <= radius;
        });
    }
    
    /**
     * Удаление камня
     * @param {Object} stone - Объект камня
     */
    removeStone(stone) {
        const index = this.stones.indexOf(stone);
        if (index !== -1) {
            this.stones.splice(index, 1);
            
            // Эмитируем событие удаления камня
            this.scene.events.emit(EVENT_TYPES.STONE_DESTROYED, {
                stone: stone,
                index: index
            });
            
            console.log(`🗿 [StoneManager] Камень удален, осталось: ${this.stones.length}`);
        }
    }
    
    /**
     * Очистка всех камней
     */
    clearAllStones() {
        this.stones.forEach(stone => {
            if (stone && stone.destroy) {
                stone.destroy();
            }
        });
        this.stones = [];
        console.log(`🗿 [StoneManager] Все камни очищены`);
    }
    
    /**
     * Обновление состояния менеджера камней
     */
    update() {
        // Удаляем уничтоженные камни
        this.stones = this.stones.filter(stone => stone && stone.isAlive);
    }
}

