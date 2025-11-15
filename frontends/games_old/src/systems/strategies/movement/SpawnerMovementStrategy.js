import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия спавнера (самка паука, крот)
 * Не двигается, но спавнит маленьких врагов
 */
export class SpawnerMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        this.speed = movementConfig.speed || 0; // Не двигается
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        
        // Параметры спавна
        this.spawnInterval = config.get('spawnInterval', 5000); // Интервал спавна (мс)
        this.minSpawnCount = config.get('minSpawnCount', 1); // Минимальное количество врагов за раз
        this.maxSpawnCount = config.get('maxSpawnCount', 5); // Максимальное количество врагов за раз
        this.spawnRange = config.get('spawnRange', 100); // Радиус спавна
        this.spawnType = config.get('spawnType', 'spider'); // Тип спавнимого врага
        this.spawnDirection = config.get('spawnDirection', 'circle'); // Направление спавна: 'circle' или 'target'
        this.lastSpawnTime = 0;
        
        // Условный спавн (для крота)
        this.conditionalSpawn = config.get('conditionalSpawn', false); // Спавнить только при определенных условиях
        this.conditionCallback = null; // Функция проверки условий
        
        // Состояние
        this.isSpawning = false;
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Проверяем, нужно ли спавнить
        if (time - this.lastSpawnTime > this.spawnInterval) {
            // Если условный спавн, проверяем условия
            if (this.conditionalSpawn && this.conditionCallback) {
                if (this.conditionCallback()) {
                    this.spawnEnemies(time);
                }
            } else {
                // Обычный спавн (самка паука)
                this.spawnEnemies(time);
            }
        }
    }

    /**
     * Спавн врагов
     * @param {number} time - Текущее время
     */
    spawnEnemies(time) {
        if (this.isSpawning) return;
        
        this.isSpawning = true;
        this.lastSpawnTime = time;
        
        // Вычисляем случайное количество врагов для спавна
        const spawnCount = Math.floor(Math.random() * (this.maxSpawnCount - this.minSpawnCount + 1)) + this.minSpawnCount;
        
        // Спавним врагов
        for (let i = 0; i < spawnCount; i++) {
            let spawnX, spawnY;
            
            if (this.spawnDirection === 'target' && this.gameObject.aiCoordinator && this.gameObject.aiCoordinator.currentTarget) {
                // Спавн в направлении цели (для крота)
                const target = this.gameObject.aiCoordinator.currentTarget;
                const angleToTarget = Math.atan2(target.y - this.gameObject.y, target.x - this.gameObject.x);
                
                spawnX = this.gameObject.x + Math.cos(angleToTarget) * this.spawnRange;
                spawnY = this.gameObject.y + Math.sin(angleToTarget) * this.spawnRange;
            } else {
                // Круговой спавн (для самки паука)
                const angle = (Math.PI * 2 * i) / spawnCount;
                const distance = Math.random() * this.spawnRange;
                
                spawnX = this.gameObject.x + Math.cos(angle) * distance;
                spawnY = this.gameObject.y + Math.sin(angle) * distance;
            }
            
            // Эмитим событие спавна
            if (this.gameObject.scene && this.gameObject.scene.events) {
                this.gameObject.scene.events.emit('enemy:spawn', {
                    enemyType: this.spawnType,
                    x: spawnX,
                    y: spawnY,
                    parent: this.gameObject,
                    target: this.spawnDirection === 'target' ? this.gameObject.aiCoordinator?.currentTarget : null
                });
            }
        }
        
        // Эффект спавна
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:spawnEffect', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y,
                count: spawnCount
            });
        }
        
        this.isSpawning = false;
    }

    /**
     * Установка функции проверки условий для условного спавна
     * @param {Function} callback - Функция, возвращающая true если можно спавнить
     */
    setConditionCallback(callback) {
        this.conditionCallback = callback;
    }

    /**
     * Установка цели (игнорируется для spawner стратегии)
     * @param {Object} target - Цель {x, y}
     * @param {number} time - Текущее время
     */
    setTarget(target, time) {
        // Спавнер не двигается, игнорируем внешние цели
    }

    /**
     * Получение направления к цели (не двигается)
     * @param {Object} target - Цель {x, y}
     * @returns {Object} Направление {x, y}
     */
    getDirection(target) {
        // Спавнер не двигается
        return { x: 0, y: 0 };
    }

    /**
     * Проверка, достигнута ли цель
     * @param {Object} target - Цель
     * @returns {boolean}
     */
    isTargetReached(target) {
        if (!target || !this.gameObject) return false;
        const distance = GeometryUtils.distance(this.gameObject.x, this.gameObject.y, target.x, target.y);
        const effectiveRange = GeometryUtils.effectiveAttackRange(this.gameObject, target, this.attackRange);
        return distance <= effectiveRange;
    }

    /**
     * Получение скорости движения
     * @returns {number}
     */
    getSpeed() {
        return 0; // Не двигается
    }

    /**
     * Установка скорости (игнорируется)
     * @param {number} speed - Скорость
     */
    setSpeed(speed) {
        // Спавнер не двигается
    }

    /**
     * Проверка, может ли атаковать
     * @returns {boolean}
     */
    canAttack() {
        return true; // Может атаковать на месте
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}
