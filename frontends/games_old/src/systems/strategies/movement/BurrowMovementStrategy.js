import { GeometryUtils } from '../../utils/GeometryUtils.js';

/**
 * Стратегия движения под землей (крот)
 * Движение под землей с периодическим появлением на поверхности
 */
export class BurrowMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        this.speed = movementConfig.speed || config.get('speed', 80);
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        
        // Параметры подземного движения
        this.burrowDepth = config.get('burrowDepth', 20); // Глубина под землей
        this.surfaceTime = config.get('surfaceTime', 2000); // Время на поверхности (мс)
        this.burrowTime = config.get('burrowTime', 3000); // Время под землей (мс)
        
        // Состояние
        this.isUnderground = true;
        this.lastSurfaceTime = 0;
        this.lastBurrowTime = 0;
        this.originalY = this.gameObject.y;
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Переключение между подземным и наземным состоянием
        if (this.isUnderground) {
            if (time - this.lastBurrowTime > this.burrowTime) {
                this.surface(time);
            }
        } else {
            if (time - this.lastSurfaceTime > this.surfaceTime) {
                this.burrow(time);
            }
        }
    }

    /**
     * Выход на поверхность
     * @param {number} time - Текущее время
     */
    surface(time) {
        this.isUnderground = false;
        this.lastSurfaceTime = time;
        
        // Возвращаемся на поверхность
        this.gameObject.y = this.originalY;
        this.gameObject.setAlpha(1.0); // Полная видимость
        
        // Эффект появления
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:surface', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Уход под землю
     * @param {number} time - Текущее время
     */
    burrow(time) {
        this.isUnderground = true;
        this.lastBurrowTime = time;
        
        // Уходим под землю
        this.gameObject.y = this.originalY + this.burrowDepth;
        this.gameObject.setAlpha(0.3); // Полупрозрачность
        
        // Эффект ухода под землю
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:burrow', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Получение направления к цели
     * @param {Object} target - Цель {x, y}
     * @returns {Object} Направление {x, y}
     */
    getDirection(target) {
        const dx = target.x - this.gameObject.x;
        const dy = target.y - this.gameObject.y;
        return GeometryUtils.normalize(dx, dy);
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
        // Под землей движемся быстрее
        return this.isUnderground ? this.speed * 1.5 : this.speed;
    }

    /**
     * Установка скорости
     * @param {number} speed - Скорость
     */
    setSpeed(speed) {
        this.speed = speed;
    }

    /**
     * Проверка, находится ли объект под землей
     * @returns {boolean}
     */
    isUndergroundNow() {
        return this.isUnderground;
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}
