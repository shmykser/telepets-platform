import { GeometryUtils } from '../../utils/GeometryUtils.js';

/**
 * Стратегия полета
 * Движение с колебаниями и обходом препятствий
 */
export class FlyingMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        this.speed = movementConfig.speed || config.get('speed', 120);
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        
        // Параметры полета
        this.amplitude = movementConfig.amplitude || config.get('amplitude', 35); // Амплитуда колебаний
        this.oscillationSpeed = movementConfig.oscillationSpeed || config.get('oscillationSpeed', 0.02); // Скорость колебаний
        this.targetAttraction = movementConfig.targetAttraction || config.get('targetAttraction', 0.9); // Притяжение к цели
        
        // Состояние полета
        this.flightTime = 0;
        this.baseDirection = { x: 0, y: 0 };
        
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        this.flightTime += delta;
    }

    /**
     * Получение направления к цели с учетом полета
     * @param {Object} target - Цель {x, y}
     * @returns {Object} Направление {x, y}
     */
    getDirection(target) {
        const dx = target.x - this.gameObject.x;
        const dy = target.y - this.gameObject.y;
        const baseDirection = GeometryUtils.normalize(dx, dy);
        
        // Сохраняем базовое направление
        this.baseDirection = baseDirection;
        
        // Добавляем колебания
        const oscillation = this.getOscillation();
        
        return {
            x: baseDirection.x + oscillation.x,
            y: baseDirection.y + oscillation.y
        };
    }

    /**
     * Получение колебаний для полета
     * @returns {Object} Колебания {x, y}
     */
    getOscillation() {
        const time = this.flightTime * this.oscillationSpeed;
        
        // Круговые колебания (убираем лишний множитель 0.01)
        const oscillationX = Math.cos(time) * this.amplitude;
        const oscillationY = Math.sin(time) * this.amplitude;
        
        return { x: oscillationX, y: oscillationY };
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
        return this.speed;
    }

    /**
     * Установка скорости
     * @param {number} speed - Скорость
     */
    setSpeed(speed) {
        this.speed = speed;
    }

    /**
     * Проверка, может ли объект пролететь над препятствием
     * @param {Object} obstacle - Препятствие
     * @returns {boolean}
     */
    canFlyOver(obstacle) {
        // Летящие враги могут пролетать над низкими препятствиями
        return obstacle.height <= 50; // 50 пикселей - высота полета
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}