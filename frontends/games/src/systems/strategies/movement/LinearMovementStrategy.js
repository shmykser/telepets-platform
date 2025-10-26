import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия линейного движения
 * Простое движение по прямой к цели
 */
export class LinearMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        this.speed = movementConfig.speed || config.get('speed', 100);
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;

        // Поддержка внешней цели (waypoint) от MovementSystem
        this.currentTarget = null;
        
        // Скорость поворота в радианах/секунду
        this.rotationSpeed = movementConfig.rotationSpeed || 18.0;
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления (в миллисекундах)
     */
    update(time, delta) {
        // Простое линейное движение к цели: приоритет внешнему waypoint
        const target = this.currentTarget || this.gameObject.target;
        
        if (target) {
            this.moveToTarget(target, delta);
        }
    }

    /**
     * Движение к цели
     * @param {Object} target - Цель {x, y}
     * @param {number} delta - Время с последнего обновления (в миллисекундах)
     */
    moveToTarget(target, delta) {
        if (!target || !this.gameObject.isAlive) {
            this.stopMovement();
            return;
        }

        // Проверяем, достигнута ли цель
        const targetReached = this.isTargetReached(target);
        
        if (targetReached) {
            this.stopMovement();
            return;
        }

        // Получаем направление к цели
        const direction = this.getDirection(target);
        
        // Вычисляем скорость
        const velocityX = direction.x * this.speed;
        const velocityY = direction.y * this.speed;
        
        // Применяем движение
        this.gameObject.setVelocity(velocityX, velocityY);
        
        // Поворачиваем спрайт к цели (плавно)
        this.rotateToTarget(target, delta);
    }

    /**
     * Установка внешней цели (waypoint) от MovementSystem
     * @param {Object} target - Цель {x, y}
     */
    setTarget(target) {
        this.currentTarget = target;
    }

    /**
     * Остановка движения
     */
    stopMovement() {
        this.gameObject.setVelocity(0, 0);
    }

    /**
     * Поворот к цели (плавный)
     * @param {Object} target - Цель {x, y}
     * @param {number} delta - Время с последнего обновления (в миллисекундах)
     */
    rotateToTarget(target, delta) {
        // Вычисляем целевой угол
        const targetAngle = GeometryUtils.angleToTarget(this.gameObject.x, this.gameObject.y, target.x, target.y);
        
        // Получаем текущий угол
        const currentAngle = this.gameObject.rotation;
        
        // Вычисляем разницу углов (кратчайший путь)
        let angleDiff = targetAngle - currentAngle;
        
        // Нормализуем разницу в диапазон [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Нормализуем rotationSpeed (если больше 1, то это старое значение - приводим к 0.15)
        const normalizedRotationSpeed = this.rotationSpeed > 1 ? 0.15 : this.rotationSpeed;
        
        // Вычисляем максимальный поворот за этот кадр (delta в миллисекундах)
        const maxRotation = normalizedRotationSpeed * (delta / 1000) * Math.PI * 2;
        
        // Ограничиваем поворот
        const actualRotation = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxRotation);
        
        // Применяем новый угол
        this.gameObject.setRotation(currentAngle + actualRotation);
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
        
        // Используем фиксированный tolerance для достижения точек движения (waypoints или финальной цели)
        // Это НЕ то же самое что attack range - радиус атаки проверяется в AttackSystem.isInRange()
        // Задача стратегии движения - просто довести объект до точки назначения, а не проверять радиус атаки
        const MOVEMENT_TOLERANCE = 10;
        
        return distance <= MOVEMENT_TOLERANCE;
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
     * Уничтожение стратегии
     */
    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}
