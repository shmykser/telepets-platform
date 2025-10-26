import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия орбитального движения
 * Объект кружит вокруг цели, всегда повернувшись к ней лицом
 */
export class OrbitalMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.currentTarget = null;
        this.orbitAngle = 0; // Текущий угол на орбите
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        // Параметры орбиты читаем из movement, с безопасным фолбэком на верхний уровень
        this.orbitSpeed = (movementConfig.orbitSpeed !== undefined ? movementConfig.orbitSpeed : config.get('orbitSpeed', 0.02));
        this.approachDistance = (movementConfig.approachDistance !== undefined ? movementConfig.approachDistance : config.get('approachDistance', 250));
        this.minOrbitRadius = (movementConfig.minOrbitRadius !== undefined ? movementConfig.minOrbitRadius : config.get('minOrbitRadius', 150));
        this.maxOrbitRadius = (movementConfig.maxOrbitRadius !== undefined ? movementConfig.maxOrbitRadius : config.get('maxOrbitRadius', 300));
        
        this.speed = movementConfig.speed || config.get('speed', 100);
        this.rotationSpeed = movementConfig.rotationSpeed || config.get('rotationSpeed', 0.15);
        
        // Текущий радиус орбиты (вычисляется случайно при начале орбитального движения)
        this.currentOrbitRadius = null;
        
        // Состояние движения
        this.isOrbiting = false;
        this.isApproaching = false;
        this.lastUpdateTime = 0;
        this.lastDebugTime = 0;
        
        // Направление орбитального движения (1 = по часовой стрелке, -1 = против часовой)
        this.orbitDirection = 1;
        this.lastDirectionChangeTime = 0; // Время последней смены направления
        this.directionChangeCooldown = 1000; // Задержка между сменами направления (1 секунда)
        this.initialDirectionSet = false; // Флаг, что начальное направление уже установлено
        
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

        const distance = GeometryUtils.distance(
            this.gameObject.x, this.gameObject.y,
            this.currentTarget.x, this.currentTarget.y
        );

        // Проверяем столкновения с границами экрана и меняем направление
        this.checkBoundaryCollisions(time, delta);


        // Определяем, какой тип движения использовать
        if (distance > this.approachDistance) {
            // Слишком далеко - приближаемся
            this.isOrbiting = false;
            this.isApproaching = true;
            this.currentOrbitRadius = null; // Сбрасываем радиус для следующего запуска орбиты
            this.approachTarget(time, delta);
        } else if (distance < this.minOrbitRadius) {
            // Слишком близко - отдаляемся
            this.isOrbiting = false;
            this.isApproaching = true;
            this.currentOrbitRadius = null; // Сбрасываем радиус для следующего запуска орбиты
            this.retreatFromTarget(time, delta);
        } else {
            // В нужном диапазоне - орбитальное движение
            if (!this.isOrbiting) {
                // Начинаем орбитальное движение - устанавливаем случайный радиус и направление
                this.startOrbiting();
            }
            this.isOrbiting = true;
            this.isApproaching = false;
            this.orbitTarget(time, delta);
        }

        this.lastUpdateTime = time;
    }

    /**
     * Начало орбитального движения
     * Устанавливает случайный радиус орбиты и случайное направление
     */
    startOrbiting() {
        // Случайный радиус орбиты в заданном диапазоне, ограничиваем сверху зоной подхода
        const maxAllowedRadius = Math.max(this.minOrbitRadius, this.approachDistance - 10);
        const upper = Math.min(this.maxOrbitRadius, maxAllowedRadius);
        this.currentOrbitRadius = Phaser.Math.Between(this.minOrbitRadius, upper);
        
        // Случайное направление движения (только при первом запуске)
        if (!this.initialDirectionSet) {
            this.orbitDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
            this.initialDirectionSet = true;
        }
        
        // Вычисляем начальный угол на основе текущей позиции
        const dx = this.gameObject.x - this.currentTarget.x;
        const dy = this.gameObject.y - this.currentTarget.y;
        this.orbitAngle = Math.atan2(dy, dx);
    }

    /**
     * Проверка столкновений с границами экрана и смена направления
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    checkBoundaryCollisions(time, delta) {
        if (!this.gameObject.scene) return;

        const sceneWidth = this.gameObject.scene.cameras.main.width;
        const sceneHeight = this.gameObject.scene.cameras.main.height;
        const margin = 30; // Отступ от края

        const x = this.gameObject.x;
        const y = this.gameObject.y;

        // Проверяем столкновения с границами
        if (x <= margin || x >= sceneWidth - margin || y <= margin || y >= sceneHeight - margin) {
            // Проверяем, прошло ли достаточно времени с последней смены направления
            if (time - this.lastDirectionChangeTime >= this.directionChangeCooldown) {
                // При столкновении меняем направление орбитального движения
                this.orbitDirection *= -1;
                this.lastDirectionChangeTime = time;
            }
        }
    }


    /**
     * Приближение к цели
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    approachTarget(time, delta) {
        const direction = GeometryUtils.normalize(
            this.currentTarget.x - this.gameObject.x,
            this.currentTarget.y - this.gameObject.y
        );

        const velocityX = direction.x * this.speed;
        const velocityY = direction.y * this.speed;

        this.setVelocity(velocityX, velocityY);
        this.rotateToTarget();
    }

    /**
     * Отступление от цели
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    retreatFromTarget(time, delta) {
        const direction = GeometryUtils.normalize(
            this.gameObject.x - this.currentTarget.x,
            this.gameObject.y - this.currentTarget.y
        );

        const velocityX = direction.x * this.speed;
        const velocityY = direction.y * this.speed;

        this.setVelocity(velocityX, velocityY);
        this.rotateToTarget();
    }

    /**
     * Орбитальное движение вокруг цели
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    orbitTarget(time, delta) {
        // Вычисляем текущее расстояние до цели
        const currentDistance = GeometryUtils.distance(
            this.gameObject.x, this.gameObject.y,
            this.currentTarget.x, this.currentTarget.y
        );

        // Вычисляем текущий угол относительно цели
        const dx = this.gameObject.x - this.currentTarget.x;
        const dy = this.gameObject.y - this.currentTarget.y;
        const currentAngle = Math.atan2(dy, dx);

        // Если мы слишком далеко от идеального радиуса, корректируем
        const distanceDifference = Math.abs(currentDistance - this.currentOrbitRadius);
        if (distanceDifference > 15) {
            this.adjustOrbitRadius(delta, currentDistance);
            return;
        }

        // Вычисляем скорость орбитального движения (перпендикулярно радиусу)
        // Учитываем направление орбиты (по часовой или против часовой стрелки)
        const tangentAngle = currentAngle + Math.PI / 2 * this.orbitDirection;
        
        // Обновляем угол орбиты
        this.orbitAngle += this.orbitSpeed * delta * this.orbitDirection;

        // Вычисляем скорость движения по орбите
        const orbitalSpeed = this.speed * 0.5; // Медленнее чем обычное движение
        const velocityX = Math.cos(tangentAngle) * orbitalSpeed;
        const velocityY = Math.sin(tangentAngle) * orbitalSpeed;


        this.setVelocity(velocityX, velocityY);
        this.rotateToTarget();
    }


    /**
     * Корректировка радиуса орбиты
     * @param {number} delta - Время с последнего обновления
     * @param {number} currentDistance - Текущее расстояние (опционально)
     */
    adjustOrbitRadius(delta, currentDistance = null) {
        if (!currentDistance) {
            currentDistance = GeometryUtils.distance(
                this.gameObject.x, this.gameObject.y,
                this.currentTarget.x, this.currentTarget.y
            );
        }

        const distanceDiff = currentDistance - this.currentOrbitRadius;
        
        // Вычисляем направление к цели
        const direction = GeometryUtils.normalize(
            this.currentTarget.x - this.gameObject.x,
            this.currentTarget.y - this.gameObject.y
        );

        // Движение к идеальному радиусу
        const adjustSpeed = this.speed * 0.3;
        const velocityX = direction.x * adjustSpeed * (distanceDiff > 0 ? 1 : -1);
        const velocityY = direction.y * adjustSpeed * (distanceDiff > 0 ? 1 : -1);

        this.setVelocity(velocityX, velocityY);
        this.rotateToTarget();
    }


    /**
     * Поворот к цели
     */
    rotateToTarget() {
        if (!this.currentTarget) return;

        const direction = GeometryUtils.normalize(
            this.currentTarget.x - this.gameObject.x,
            this.currentTarget.y - this.gameObject.y
        );

        if (direction.x === 0 && direction.y === 0) return;

        const targetAngle = Math.atan2(direction.y, direction.x);
        const currentAngle = this.gameObject.rotation;
        
        // Нормализуем rotationSpeed (если больше 1, то это старое значение)
        const normalizedRotationSpeed = this.rotationSpeed > 1 ? 0.15 : this.rotationSpeed;
        
        // Плавный поворот
        const angleDiff = this.normalizeAngle(targetAngle - currentAngle);
        
        if (Math.abs(angleDiff) > 0.01) {
            const newAngle = currentAngle + angleDiff * normalizedRotationSpeed;
            this.gameObject.setRotation(newAngle);
        } else {
            this.gameObject.setRotation(targetAngle);
        }
    }

    /**
     * Нормализация угла в диапазон [-π, π]
     * @param {number} angle - Угол в радианах
     * @returns {number} Нормализованный угол
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * Установка скорости движения
     * @param {number} x - Скорость по X
     * @param {number} y - Скорость по Y
     */
    setVelocity(x, y) {
        if (this.gameObject.body) {
            this.gameObject.body.setVelocity(x, y);
        } else if (this.gameObject.physicsBody) {
            this.gameObject.physicsBody.setVelocity(x, y);
        }
    }

    /**
     * Установка цели
     * @param {Object} target - Цель
     */
    setTarget(target) {
        // Проверяем, действительно ли цель изменилась
        if (this.currentTarget === target) {
            return; // Цель не изменилась, ничего не делаем
        }
        
        this.currentTarget = target;
        
        // Сбрасываем угол орбиты при смене цели
        if (target) {
            const direction = GeometryUtils.normalize(
                target.x - this.gameObject.x,
                target.y - this.gameObject.y
            );
            this.orbitAngle = Math.atan2(direction.y, direction.x);
        }
    }

    /**
     * Получение текущей цели
     * @returns {Object|null}
     */
    getTarget() {
        return this.currentTarget;
    }

    /**
     * Остановка движения
     */
    stop() {
        this.setVelocity(0, 0);
        this.currentTarget = null;
        this.isOrbiting = false;
        this.isApproaching = false;
    }

    /**
     * Установка радиуса орбиты
     * @param {number} radius - Радиус орбиты
     */
    setOrbitRadius(radius) {
        this.currentOrbitRadius = Math.max(this.minOrbitRadius, Math.min(radius, this.maxOrbitRadius));
    }

    /**
     * Установка скорости орбиты
     * @param {number} speed - Скорость орбиты
     */
    setOrbitSpeed(speed) {
        this.orbitSpeed = Math.max(0, speed);
    }

    /**
     * Получение состояния движения
     * @returns {Object}
     */
    getMovementState() {
        return {
            isOrbiting: this.isOrbiting,
            isApproaching: this.isApproaching,
            orbitAngle: this.orbitAngle,
            orbitRadius: this.currentOrbitRadius,
            orbitSpeed: this.orbitSpeed,
            orbitDirection: this.orbitDirection,
            currentTarget: this.currentTarget
        };
    }

    /**
     * Получение имени стратегии
     * @returns {string}
     */
    getName() {
        return 'OrbitalMovementStrategy';
    }

    destroy() {
        this.stop();
        this.gameObject = null;
        this.config = null;
    }
}
