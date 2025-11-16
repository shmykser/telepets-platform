import { ISystem } from './interfaces/ISystem.js';
import { EVENT_TYPES } from '../types/EventTypes.js';
import { STONE_SETTINGS } from '../settings/GameSettings.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

/**
 * Система взаимодействия с препятствиями (камни, ямы и т.д.)
 */
export class ObstacleInteractionSystem extends ISystem {
    constructor(scene) {
        super(scene);
        this.obstacles = [];
        this.avoidanceRadius = STONE_SETTINGS.AVOIDANCE_RADIUS;
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxAttempts = 10;
        this.retryTimer = null;
        this.updateTimer = null;
    }
    
    /**
     * Инициализация системы
     */
    initialize() {
        this.setupEventListeners();
        
        // Если events недоступны, используем fallback метод
        if (!this.isInitialized) {
            console.log('🚧 [ObstacleInteractionSystem] Events недоступны, используем fallback метод');
            this.updateObstaclesFromScene();
            this.isInitialized = true;
        }
        
        // Запускаем периодическое обновление препятствий
        this.startObstacleUpdate();
        
        console.log('🚧 [ObstacleInteractionSystem] Система препятствий инициализирована');
    }

    /**
     * Запуск периодического обновления препятствий
     */
    startObstacleUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        // Обновляем препятствия каждые 2 секунды
        this.updateTimer = setInterval(() => {
            // Проверяем, что сцена все еще валидна
            if (this.scene && this.scene.scene && this.scene.scene.isActive) {
                this.updateObstaclesFromScene();
            } else {
                console.log(`🚧 [ObstacleInteractionSystem] Сцена больше не активна, останавливаем обновление`);
                this.destroy();
            }
        }, 2000);
    }
    
    /**
     * Настройка слушателей событий
     */
    setupEventListeners() {
        // Проверяем, что система уже инициализирована
        if (this.isInitialized) {
            return;
        }

        // Проверяем лимит попыток
        if (this.initializationAttempts >= this.maxAttempts) {
            console.error('🚧 [ObstacleInteractionSystem] Достигнут лимит попыток инициализации');
            return;
        }

        // Проверяем, что events доступны
        if (!this.scene || !this.scene.events) {
            this.initializationAttempts++;
            console.warn(`🚧 [ObstacleInteractionSystem] Events не доступны, попытка ${this.initializationAttempts}/${this.maxAttempts}`);
            
            // Очищаем предыдущий таймер
            if (this.retryTimer) {
                clearTimeout(this.retryTimer);
            }
            
            // Пытаемся инициализировать позже
            this.retryTimer = setTimeout(() => {
                this.setupEventListeners();
            }, 500);
            return;
        }
        
        // Очищаем таймер
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }

        // Слушаем события создания и перемещения камней
        this.scene.events.on(EVENT_TYPES.STONE_CREATED, this.onStoneCreated, this);
        this.scene.events.on(EVENT_TYPES.STONE_MOVED, this.onStoneMoved, this);
        this.scene.events.on(EVENT_TYPES.STONE_DESTROYED, this.onStoneDestroyed, this);
        
        // Отмечаем как инициализированную
        this.isInitialized = true;
        console.log('🚧 [ObstacleInteractionSystem] Система препятствий инициализирована');
    }

    /**
     * Обновление препятствий из сцены (fallback метод)
     */
    updateObstaclesFromScene() {
        if (!this.scene) {
            console.log(`🚧 [ObstacleInteractionSystem] Сцена недоступна`);
            return;
        }

        // Проверяем, что сцена все еще активна
        if (this.scene.scene && !this.scene.scene.isActive) {
            console.log(`🚧 [ObstacleInteractionSystem] Сцена больше не активна`);
            return;
        }

        // Берем только живые препятствия по defenseData.isObstacle
        const allObjects = this.scene.children.list;
        const stones = allObjects.filter(obj => obj.defenseData?.isObstacle && obj.isAlive);

        // Обновляем список препятствий
        this.obstacles = stones;
        console.log(`🚧 [ObstacleInteractionSystem] Найдено препятствий: ${this.obstacles.length}`);
        
        // Уведомляем PathfindingSystem о обновлении препятствий
        this.scene.events.emit(EVENT_TYPES.PATHFINDING_UPDATED, {
            reason: 'obstacles_updated',
            obstacles: this.obstacles
        });
        
        // Выводим информацию о найденных препятствиях
        // при необходимости — можно детализировать вывод для первых нескольких объектов
    }
    
    /**
     * Обработчик создания камня
     * @param {Object} data - Данные события
     */
    onStoneCreated(data) {
        const { stone } = data;
        if (stone && stone.defenseData.isObstacle) {
            this.addObstacle(stone);
            console.log(`🚧 [ObstacleInteractionSystem] Камень добавлен как препятствие (affectsGround: ${stone.defenseData.affectsGround}, affectsFlying: ${stone.defenseData.affectsFlying})`);
        }
    }
    
    /**
     * Обработчик перемещения камня
     * @param {Object} data - Данные события
     */
    onStoneMoved(data) {
        const { stone } = data;
        if (stone && this.obstacles.includes(stone)) {
            // Обновляем позицию препятствия в системе
            this.updateObstaclePosition(stone);
            console.log(`🚧 [ObstacleInteractionSystem] Позиция препятствия обновлена`);
        }
    }
    
    /**
     * Обработчик уничтожения камня
     * @param {Object} data - Данные события
     */
    onStoneDestroyed(data) {
        const { stone } = data;
        this.removeObstacle(stone);
        console.log(`🚧 [ObstacleInteractionSystem] Камень удален из препятствий`);
    }
    
    /**
     * Добавляет препятствие в систему
     * @param {Object} obstacle - Объект препятствия
     */
    addObstacle(obstacle) {
        if (!this.obstacles.includes(obstacle)) {
            this.obstacles.push(obstacle);
            console.log(`🚧 [ObstacleInteractionSystem] Препятствие добавлено, всего: ${this.obstacles.length}`);
        }
    }
    
    /**
     * Удаляет препятствие из системы
     * @param {Object} obstacle - Объект препятствия
     */
    removeObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index !== -1) {
            this.obstacles.splice(index, 1);
            console.log(`🚧 [ObstacleInteractionSystem] Препятствие удалено, всего: ${this.obstacles.length}`);
        }
    }
    
    /**
     * Обновляет позицию препятствия
     * @param {Object} obstacle - Объект препятствия
     */
    updateObstaclePosition(obstacle) {
        // Позиция уже обновлена в объекте, просто эмитируем событие обновления пути
        this.scene.events.emit(EVENT_TYPES.PATHFINDING_UPDATED, {
            reason: 'obstacle_moved',
            obstacle: obstacle
        });
    }
    
    /**
     * Проверяет, должен ли враг обходить препятствие
     * @param {Object} enemy - Объект врага
     * @param {Object} obstacle - Объект препятствия
     * @returns {boolean} true если враг должен обходить препятствие
     */
    shouldAvoidObstacle(enemy, obstacle) {
        // Летающие враги игнорируют камни
        if (enemy.movementType === 'flying' && obstacle.defenseType === 'stone') {
            return false;
        }
        
        // Проверяем, влияет ли препятствие на тип врага
        if (obstacle.defenseData) {
            if (enemy.movementType === 'flying' && !obstacle.defenseData.affectsFlying) {
                return false;
            }
            if (enemy.movementType === 'ground' && !obstacle.defenseData.affectsGround) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Получает препятствия в радиусе от точки
     * @param {number} x - X координата центра
     * @param {number} y - Y координата центра
     * @param {number} radius - Радиус поиска
     * @returns {Array} Массив препятствий в радиусе
     */
    getObstaclesInRadius(x, y, radius) {
        return this.obstacles.filter(obstacle => {
            if (!obstacle.isAlive) return false;
            
            const distance = GeometryUtils.distance(x, y, obstacle.x, obstacle.y);
            return distance <= radius;
        });
    }
    
    /**
     * Получает ближайшее препятствие к точке
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {Object} enemy - Объект врага (для проверки типа)
     * @returns {Object|null} Ближайшее препятствие или null
     */
    getNearestObstacle(x, y, enemy) {
        let nearestObstacle = null;
        let minDistance = Infinity;
        
        for (const obstacle of this.obstacles) {
            if (!obstacle.isAlive) continue;
            if (!this.shouldAvoidObstacle(enemy, obstacle)) continue;
            
            const distance = GeometryUtils.distance(x, y, obstacle.x, obstacle.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestObstacle = obstacle;
            }
        }
        
        return nearestObstacle;
    }
    
    /**
     * Рассчитывает точку обхода препятствия
     * @param {Object} enemy - Объект врага
     * @param {Object} obstacle - Препятствие
     * @param {Object} target - Целевая точка
     * @returns {Object|null} Точка обхода или null
     */
    calculateAvoidancePoint(enemy, obstacle, target) {
        if (!this.shouldAvoidObstacle(enemy, obstacle)) {
            return null;
        }
        
        // Рассчитываем вектор от препятствия к врагу
        const dx = enemy.x - obstacle.x;
        const dy = enemy.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return null;
        
        // Нормализуем вектор
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Рассчитываем точку обхода
        const avoidanceDistance = this.avoidanceRadius + obstacle.radius * 32; // 32 - размер тайла
        const avoidanceX = obstacle.x + nx * avoidanceDistance;
        const avoidanceY = obstacle.y + ny * avoidanceDistance;
        
        // Эмитируем событие обхода препятствия
        this.scene.events.emit(EVENT_TYPES.OBSTACLE_AVOIDANCE, {
            enemy: enemy,
            obstacle: obstacle,
            avoidancePoint: { x: avoidanceX, y: avoidanceY },
            target: target
        });
        
        return { x: avoidanceX, y: avoidanceY };
    }
    
    /**
     * Обновление системы
     */
    update() {
        // Удаляем уничтоженные препятствия
        this.obstacles = this.obstacles.filter(obstacle => obstacle && obstacle.isAlive);
    }
    
    /**
     * Очистка системы
     */
    destroy() {
        // Очищаем таймеры
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        // Удаляем слушатели событий только если events доступны
        if (this.scene && this.scene.events) {
            this.scene.events.off(EVENT_TYPES.STONE_CREATED, this.onStoneCreated, this);
            this.scene.events.off(EVENT_TYPES.STONE_MOVED, this.onStoneMoved, this);
            this.scene.events.off(EVENT_TYPES.STONE_DESTROYED, this.onStoneDestroyed, this);
        }
        
        this.obstacles = [];
        this.isInitialized = false;
        console.log('🚧 [ObstacleInteractionSystem] Система препятствий уничтожена');
    }
}

