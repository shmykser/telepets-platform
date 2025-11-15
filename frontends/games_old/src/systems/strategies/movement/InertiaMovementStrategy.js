import { GeometryUtils } from '../../../utils/GeometryUtils.js';
/**
 * Стратегия движения по инерции (рино)
 * Использует физику Phaser для реалистичного движения с инерцией
 * Быстро набирает скорость к цели, затем тормозит с инерцией
 */
export class InertiaMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        // Параметры движения
        this.baseSpeed = movementConfig.speed || config.get('speed', 80);
        this.maxSpeed = movementConfig.maxSpeed || config.get('maxSpeed', 120);
        this.minSpeed = movementConfig.minSpeed || config.get('minSpeed', 5);
        this.acceleration = movementConfig.acceleration || config.get('acceleration', 600);
        this.deceleration = movementConfig.deceleration || config.get('deceleration', 400);
        this.rotationSpeed = movementConfig.rotationSpeed || config.get('rotationSpeed', 0.15);
        
        // Физические параметры
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        this.mass = movementConfig.mass || config.get('mass', 1.5);
        this.drag = movementConfig.drag || config.get('drag', 0.95);
        this.bounce = movementConfig.bounce || config.get('bounce', 0.3);
        
        // Состояние движения
        this.currentTarget = null;
        this.currentVelocity = { x: 0, y: 0 };
        this.targetAngle = 0;
        this.hasPassedTarget = false;
        this.isAccelerating = true;
        
        // Атака
        this.lastAttackTime = 0;
        this.attackCooldown = attackConfig.cooldown || config.get('cooldown', 1000);
        
        
        // Инициализируем физическое тело
        this.setupPhysics();
    }

    /**
     * Настройка физического тела Phaser
     */
    setupPhysics() {
        if (!this.gameObject.scene || !this.gameObject.scene.physics) {
            console.warn('InertiaMovementStrategy: Physics не доступна');
            return;
        }

        // Создаем физическое тело если его нет
        if (!this.gameObject.body) {
            this.gameObject.scene.physics.add.existing(this.gameObject);
        }

        // Настраиваем физические свойства
        this.gameObject.body.setCollideWorldBounds(true);
        this.gameObject.body.setBounce(this.bounce);
        this.gameObject.body.setDrag(this.drag);
        this.gameObject.body.setMass(this.mass);
        this.gameObject.body.setMaxVelocity(this.maxSpeed);
    }

    /**
     * Поворот спрайта строго в сторону цели
     */
    rotateToDirection(direction) {
        if (direction.x === 0 && direction.y === 0) return;

        const targetAngle = Math.atan2(direction.y, direction.x);
        const currentAngle = this.gameObject.rotation;
        const angleDiff = this.normalizeAngle(targetAngle - currentAngle);
        
        // Нормализуем rotationSpeed (если больше 1, то это старое значение)
        const normalizedRotationSpeed = this.rotationSpeed > 1 ? 0.15 : this.rotationSpeed;
        
        if (Math.abs(angleDiff) > 0.01) {
            const newAngle = currentAngle + angleDiff * normalizedRotationSpeed;
            this.gameObject.setRotation(newAngle);
        } else {
            this.gameObject.setRotation(targetAngle);
        }

    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.currentTarget) return;

        const deltaSeconds = delta / 1000;
        const distanceToTarget = Phaser.Math.Distance.Between(
            this.gameObject.x, this.gameObject.y,
            this.currentTarget.x, this.currentTarget.y
        );

        // Вычисляем угол к цели
        this.targetAngle = Math.atan2(
            this.currentTarget.y - this.gameObject.y,
            this.currentTarget.x - this.gameObject.x
        );

        // Проверяем, прошли ли через цель
        if (!this.hasPassedTarget && distanceToTarget < this.attackRange) {
            this.hasPassedTarget = true;
            this.attackTarget(time);
        }

        // Вычисляем направление к цели
        const direction = this.calculateDirection();
        
        // Поворачиваем спрайт к цели
        this.rotateToDirection(direction);

        // Применяем физические силы
        this.applyPhysicsForces(direction, deltaSeconds);
        
        // Проверяем, нужно ли развернуться
        this.checkTurnCondition(distanceToTarget);
    }

    /**
     * Вычисление направления к цели
     * @returns {Object} Нормализованный вектор направления
     */
    calculateDirection() {
        if (!this.currentTarget) return { x: 0, y: 0 };

        const dx = this.currentTarget.x - this.gameObject.x;
        const dy = this.currentTarget.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: 0, y: 0 };
        
        return {
            x: dx / distance,
            y: dy / distance
        };
    }

    /**
     * Применение физических сил
     * @param {Object} direction - Направление к цели
     * @param {number} deltaSeconds - Время в секундах
     */
    applyPhysicsForces(direction, deltaSeconds) {
        if (!this.gameObject.body) return;

        const currentSpeed = Math.sqrt(
            this.gameObject.body.velocity.x ** 2 + 
            this.gameObject.body.velocity.y ** 2
        );

        // Определяем, ускоряемся или тормозим
        let forceX, forceY;
        if (this.hasPassedTarget) {
            // После прохождения цели - тормозим против текущего направления движения
            const velocityX = this.gameObject.body.velocity.x;
            const velocityY = this.gameObject.body.velocity.y;
            const velocityLength = Math.sqrt(velocityX ** 2 + velocityY ** 2);
            
            if (velocityLength > 0) {
                // Нормализуем вектор скорости и применяем тормозящую силу против него
                const normalizedVelX = velocityX / velocityLength;
                const normalizedVelY = velocityY / velocityLength;
                forceX = -normalizedVelX * this.deceleration * deltaSeconds;
                forceY = -normalizedVelY * this.deceleration * deltaSeconds;
            } else {
                forceX = 0;
                forceY = 0;
            }
        } else {
            // До цели - ускоряемся в направлении цели
            forceX = direction.x * this.acceleration * deltaSeconds;
            forceY = direction.y * this.acceleration * deltaSeconds;
        }

        // Применяем силу к физическому телу
        this.gameObject.body.setAcceleration(forceX, forceY);


        // Ограничиваем максимальную скорость
        if (currentSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / currentSpeed;
            this.gameObject.body.setVelocity(
                this.gameObject.body.velocity.x * scale,
                this.gameObject.body.velocity.y * scale
            );
        }
    }

    /**
     * Проверка условия для разворота
     * @param {number} distanceToTarget - Расстояние до цели
     */
    checkTurnCondition(distanceToTarget) {
        if (!this.hasPassedTarget) return;

        const currentSpeed = Math.sqrt(
            this.gameObject.body.velocity.x ** 2 + 
            this.gameObject.body.velocity.y ** 2
        );

        // Разворачиваемся, если скорость стала очень маленькой
        if (currentSpeed <= this.minSpeed) {
            this.turnToTarget();
        }
    }

    /**
     * Разворот к цели
     */
    turnToTarget() {
        if (!this.currentTarget) return;

        // Сбрасываем скорость и направляем к цели
        this.gameObject.body.setVelocity(0, 0);
        this.hasPassedTarget = false;
        this.isAccelerating = true;
    }

    /**
     * Установка начальной скорости при старте движения
     */
    setInitialVelocity() {
        if (!this.gameObject.body || !this.currentTarget) return;
        
        const direction = this.calculateDirection();
        const initialSpeed = this.baseSpeed * 0.3; // 30% от базовой скорости для плавного старта
        
        this.gameObject.body.setVelocity(
            direction.x * initialSpeed,
            direction.y * initialSpeed
        );
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
     * Атака цели при прохождении через неё
     * @param {number} time - Текущее время
     */
    attackTarget(time) {
        const timeSinceLastAttack = time - this.lastAttackTime;
        
        if (timeSinceLastAttack < this.attackCooldown) {
            return;
        }
        
        this.lastAttackTime = time;
        
        // Наносим урон цели
        if (this.currentTarget.takeDamage) {
            const attackConfig = this.config.get('attack', {});
            const damage = attackConfig.damage || this.config.get('damage', 10);
            this.currentTarget.takeDamage(damage);
            
            // Эффект атаки
            if (this.gameObject.scene && this.gameObject.scene.events) {
                this.gameObject.scene.events.emit('enemy:attack', {
                    attacker: this.gameObject,
                    target: this.currentTarget,
                    damage: damage,
                    type: 'inertia_charge'
                });
            }
        }
    }

    /**
     * Установка цели
     * @param {Object} target - Цель для движения
     */
    setTarget(target) {
        if (this.currentTarget === target) return;
        
        this.currentTarget = target;
        this.hasPassedTarget = false;
        this.isAccelerating = true;
        
        if (target) {
            // Устанавливаем начальную скорость при смене цели
            if (this.gameObject.body) {
                const direction = this.calculateDirection();
                this.gameObject.body.setVelocity(
                    direction.x * this.baseSpeed,
                    direction.y * this.baseSpeed
                );
            }
        }
    }

    /**
     * Получение текущего состояния движения
     * @returns {Object}
     */
    getMovementState() {
        const velocity = this.gameObject.body ? this.gameObject.body.velocity : { x: 0, y: 0 };
        const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        
        return {
            currentSpeed: currentSpeed,
            maxSpeed: this.maxSpeed,
            isAccelerating: this.isAccelerating,
            hasPassedTarget: this.hasPassedTarget,
            velocity: velocity
        };
    }

    /**
     * Обновление cooldown атаки из конфигурации
     * @param {number} cooldown - Новый cooldown
     */
    updateAttackCooldown(cooldown) {
        this.attackCooldown = cooldown;
    }

    /**
     * Сброс стратегии
     */
    reset() {
        this.currentTarget = null;
        this.hasPassedTarget = false;
        this.isAccelerating = true;
        this.lastAttackTime = 0;
        
        if (this.gameObject.body) {
            this.gameObject.body.setVelocity(0, 0);
            this.gameObject.body.setAcceleration(0, 0);
        }
    }

    isTargetReached(target) {
        if (!target || !this.gameObject) return false;
        const distance = GeometryUtils.distance(this.gameObject.x, this.gameObject.y, target.x, target.y);
        const effectiveRange = GeometryUtils.effectiveAttackRange(this.gameObject, target, this.attackRange);
        return distance <= effectiveRange;
    }
}
