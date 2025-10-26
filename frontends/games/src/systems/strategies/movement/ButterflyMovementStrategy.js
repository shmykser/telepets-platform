import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия движения бабочки
 * Имитирует порхающий полет с синусоидальными колебаниями и случайными изменениями направления
 */
export class ButterflyMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        // Основные параметры движения
        this.speed = movementConfig.speed || config.get('speed', 80);
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        
        // Параметры порхания
        this.flutterAmplitude = movementConfig.flutterAmplitude || config.get('flutterAmplitude', 40); // Амплитуда порхания
        this.flutterFrequency = movementConfig.flutterFrequency || config.get('flutterFrequency', 0.03); // Частота порхания
        this.flutterSpeed = movementConfig.flutterSpeed || config.get('flutterSpeed', 0.05); // Скорость изменения порхания
        
        // Параметры случайности
        this.randomness = movementConfig.randomness || config.get('randomness', 0.3); // Степень случайности (0-1)
        this.directionChangeInterval = movementConfig.directionChangeInterval || config.get('directionChangeInterval', 2000); // Интервал смены направления
        this.directionChangeChance = movementConfig.directionChangeChance || config.get('directionChangeChance', 0.1); // Вероятность смены направления
        
        // Параметры притяжения к цели
        this.targetAttraction = movementConfig.targetAttraction || config.get('targetAttraction', 0.7); // Сила притяжения к цели
        this.minDistanceToTarget = movementConfig.minDistanceToTarget || config.get('minDistanceToTarget', 50); // Минимальное расстояние до цели
        
        // Состояние движения
        this.flutterTime = 0;
        this.directionChangeTime = 0;
        this.currentDirection = { x: 0, y: 0 };
        this.targetDirection = { x: 0, y: 0 };
        this.isMoving = false;
        this.currentTarget = null;
        
        // Параметры для плавного перехода направления
        this.directionTransitionSpeed = movementConfig.directionTransitionSpeed || config.get('directionTransitionSpeed', 0.02);
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.currentTarget) {
            return;
        }

        this.flutterTime += delta;
        this.directionChangeTime += delta;

        // Проверяем, нужно ли изменить направление
        this.checkDirectionChange(time);

        // Обновляем направление к цели
        this.updateTargetDirection();

        // Обновляем позицию
        this.updatePosition(delta);
    }

    /**
     * Установка цели
     * @param {Object} target - Цель {x, y}
     */
    setTarget(target) {
        this.currentTarget = target;
        this.directionChangeTime = 0;
        
        // Вычисляем начальное направление к цели
        this.updateTargetDirection();
        this.currentDirection = { ...this.targetDirection };
    }

    /**
     * Остановка движения
     */
    stop() {
        this.currentTarget = null;
        this.currentDirection = { x: 0, y: 0 };
        this.targetDirection = { x: 0, y: 0 };
    }

    /**
     * Проверка смены направления
     * @param {number} time - Текущее время
     */
    checkDirectionChange(time) {
        // Случайная смена направления
        if (Math.random() < this.directionChangeChance) {
            this.changeDirection();
            this.directionChangeTime = 0;
        }
        
        // Принудительная смена направления через интервал
        if (this.directionChangeTime > this.directionChangeInterval) {
            this.changeDirection();
            this.directionChangeTime = 0;
        }
    }

    /**
     * Смена направления
     */
    changeDirection() {
        if (!this.currentTarget) return;

        const dx = this.currentTarget.x - this.gameObject.x;
        const dy = this.currentTarget.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Если далеко от цели, направляемся к ней
        if (distance > this.minDistanceToTarget) {
            this.updateTargetDirection();
        } else {
            // Если близко к цели, добавляем случайность
            const randomAngle = (Math.random() - 0.5) * Math.PI * this.randomness;
            const baseAngle = Math.atan2(dy, dx);
            const newAngle = baseAngle + randomAngle;
            
            this.targetDirection = {
                x: Math.cos(newAngle),
                y: Math.sin(newAngle)
            };
        }
    }

    /**
     * Обновление направления к цели
     */
    updateTargetDirection() {
        if (!this.currentTarget) return;

        const dx = this.currentTarget.x - this.gameObject.x;
        const dy = this.currentTarget.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const baseDirection = GeometryUtils.normalize(dx, dy);
            
            // Добавляем случайность в зависимости от расстояния
            const randomnessFactor = Math.min(distance / 200, 1) * this.randomness;
            const randomAngle = (Math.random() - 0.5) * Math.PI * randomnessFactor;
            const baseAngle = Math.atan2(baseDirection.y, baseDirection.x);
            const newAngle = baseAngle + randomAngle;
            
            this.targetDirection = {
                x: Math.cos(newAngle),
                y: Math.sin(newAngle)
            };
        }
    }

    /**
     * Применение порхания
     * @param {Object} direction - Базовое направление {x, y}
     * @returns {Object} Направление с порханием {x, y}
     */
    applyFlutter(direction) {
        // Синусоидальное порхание по вертикали
        const verticalFlutter = Math.sin(this.flutterTime * this.flutterFrequency) * this.flutterAmplitude;
        
        // Дополнительное порхание по горизонтали с другой частотой
        const horizontalFlutter = Math.sin(this.flutterTime * this.flutterSpeed) * (this.flutterAmplitude * 0.3);
        
        // Применяем порхание к направлению
        const flutterX = direction.x + horizontalFlutter * 0.01;
        const flutterY = direction.y + verticalFlutter * 0.01;
        
        // Нормализуем направление с учетом порхания
        return GeometryUtils.normalize(flutterX, flutterY);
    }

    /**
     * Обновление позиции
     * @param {number} delta - Время с последнего обновления
     */
    updatePosition(delta) {
        // Плавный переход к целевому направлению
        this.currentDirection.x += (this.targetDirection.x - this.currentDirection.x) * this.directionTransitionSpeed;
        this.currentDirection.y += (this.targetDirection.y - this.currentDirection.y) * this.directionTransitionSpeed;
        
        // Нормализуем направление
        const normalizedDirection = GeometryUtils.normalize(this.currentDirection.x, this.currentDirection.y);
        
        // Применяем порхание к нормализованному направлению
        const flutterDirection = this.applyFlutter(normalizedDirection);
        
        // Вычисляем скорость с учетом притяжения к цели
        let currentSpeed = this.speed;
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.gameObject.x;
            const dy = this.currentTarget.y - this.gameObject.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Увеличиваем скорость при приближении к цели
            if (distance < this.minDistanceToTarget) {
                currentSpeed *= (1 + this.targetAttraction);
            }
        }
        
        // Применяем движение
        const deltaSeconds = delta / 1000;
        this.gameObject.x += flutterDirection.x * currentSpeed * deltaSeconds;
        this.gameObject.y += flutterDirection.y * currentSpeed * deltaSeconds;
        
        // Поворачиваем бабочку в направлении движения
        this.rotateToDirection(flutterDirection);
    }

    /**
     * Поворот в направлении движения
     * @param {Object} direction - Направление {x, y}
     */
    rotateToDirection(direction) {
        if (this.gameObject && this.gameObject.rotation !== undefined) {
            const angle = Math.atan2(direction.y, direction.x);
            this.gameObject.rotation = angle;
        }
    }

    /**
     * Проверка достижения цели
     * @param {Object} target - Цель {x, y}
     * @returns {boolean}
     */
    isTargetReached(target) {
        if (!target || !this.gameObject) return false;
        const distance = GeometryUtils.distance(this.gameObject.x, this.gameObject.y, target.x, target.y);
        const effectiveRange = GeometryUtils.effectiveAttackRange(this.gameObject, target, this.attackRange);
        return distance <= effectiveRange;
    }

    /**
     * Получение текущего направления
     * @returns {Object} Направление {x, y}
     */
    getDirection() {
        return { ...this.currentDirection };
    }

    /**
     * Получение состояния движения
     * @returns {Object}
     */
    getState() {
        return {
            isMoving: !!this.currentTarget,
            hasTarget: !!this.currentTarget,
            flutterTime: this.flutterTime,
            directionChangeTime: this.directionChangeTime,
            currentDirection: { ...this.currentDirection },
            targetDirection: { ...this.targetDirection }
        };
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.stop();
        this.gameObject = null;
        this.config = null;
    }
}
