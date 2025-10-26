import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия одноразовой атаки (снаряд)
 * Наносит урон один раз при контакте и самоуничтожается
 */
export class SingleUseAttackStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.damage = config.get('damage', 25);
        const attackConfig = this.config.get('attack', {});
        // Радиус атаки берем ТОЛЬКО из attack.range
        this.range = attackConfig.range || 0;
        this.speed = config.get('speed', 150); // Скорость движения к цели
        this.detectionRange = config.get('detectionRange', 300); // Радиус обнаружения цели
        this.explosionRadius = config.get('explosionRadius', 80); // Радиус взрыва
        this.explosionDamage = config.get('explosionDamage', this.damage); // Урон от взрыва
        this.hasAttacked = false; // Флаг атаки (можно атаковать только один раз)
        this.isMoving = false;
        this.currentTarget = null;
        this.lastUpdateTime = 0;
        this.lastDebugTime = 0;
        
        console.log(`💥 [SingleUseAttackStrategy] Создана с параметрами: урон=${this.damage}, скорость=${this.speed}, радиус взрыва=${this.explosionRadius}`);
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (this.hasAttacked || !this.currentTarget) {
            return;
        }

        // Проверяем, можем ли мы атаковать цель
        if (this.canAttackTarget(this.currentTarget)) {
            this.performAttack(this.currentTarget, time);
            return;
        }

        // Если не можем атаковать, движемся к цели
        if (!this.isMoving) {
            this.moveToTarget(this.currentTarget);
        }

        this.lastUpdateTime = time;
    }

    /**
     * Проверка возможности атаки цели
     * @param {Object} target - Цель
     * @returns {boolean}
     */
    canAttackTarget(target) {
        if (!target || !this.gameObject.isAlive) {
            return false;
        }

        const distance = GeometryUtils.distance(
            this.gameObject.x, this.gameObject.y,
            target.x, target.y
        );

        return distance <= this.range;
    }

    /**
     * Выполнение атаки
     * @param {Object} target - Цель
     * @param {number} time - Текущее время
     */
    performAttack(target, time) {
        if (this.hasAttacked) {
            return;
        }

        this.hasAttacked = true;
        this.isMoving = false;

        // Наносим урон цели
        this.dealDamageToTarget(target);

        // Создаем взрыв
        this.createExplosion(target, time);

        // Эмитим событие атаки
        this.onAttackPerformed(target, time);

        // Уничтожаем объект
        this.destroySelf();
    }

    /**
     * Нанесение урона цели
     * @param {Object} target - Цель
     */
    dealDamageToTarget(target) {
        if (target && typeof target.takeDamage === 'function') {
            target.takeDamage(this.damage);
            console.log(`💥 [SingleUseAttack] Нанесен урон ${this.damage} цели`);
        }
    }

    /**
     * Создание взрыва
     * @param {Object} target - Цель взрыва
     * @param {number} time - Текущее время
     */
    createExplosion(target, time) {
        if (!this.gameObject.scene) {
            return;
        }

        // Находим все объекты в радиусе взрыва
        const explosionTargets = this.getTargetsInRadius(
            this.gameObject.x, this.gameObject.y, 
            this.explosionRadius
        );

        // Наносим урон всем целям в радиусе
        explosionTargets.forEach(explosionTarget => {
            if (explosionTarget !== target && explosionTarget !== this.gameObject) {
                if (typeof explosionTarget.takeDamage === 'function') {
                    explosionTarget.takeDamage(this.explosionDamage);
                    console.log(`💥 [SingleUseAttack] Взрыв нанес урон ${this.explosionDamage} цели`);
                }
            }
        });

        // Эмитим событие взрыва
        if (this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('explosion', {
                x: this.gameObject.x,
                y: this.gameObject.y,
                radius: this.explosionRadius,
                damage: this.explosionDamage,
                targets: explosionTargets.length
            });
        }

        console.log(`💥 [SingleUseAttack] Взрыв в позиции (${this.gameObject.x.toFixed(1)}, ${this.gameObject.y.toFixed(1)}) с радиусом ${this.explosionRadius}`);
    }

    /**
     * Получение целей в радиусе
     * @param {number} x - X координата центра
     * @param {number} y - Y координата центра
     * @param {number} radius - Радиус поиска
     * @returns {Array} - Массив целей в радиусе
     */
    getTargetsInRadius(x, y, radius) {
        if (!this.gameObject.scene) {
            return [];
        }

        const targets = [];
        
        // Получаем все объекты в сцене (заглушка - в реальности нужно получать конкретные объекты)
        if (this.gameObject.scene.children) {
            this.gameObject.scene.children.list.forEach(child => {
                if (child !== this.gameObject && child.isAlive !== false) {
                    const distance = GeometryUtils.distance(x, y, child.x, child.y);
                    if (distance <= radius) {
                        targets.push(child);
                    }
                }
            });
        }

        return targets;
    }

    /**
     * Движение к цели
     * @param {Object} target - Цель
     */
    moveToTarget(target) {
        if (!target || this.hasAttacked) {
            return;
        }

        this.isMoving = true;

        // Вычисляем направление к цели
        const dx = target.x - this.gameObject.x;
        const dy = target.y - this.gameObject.y;
        const direction = GeometryUtils.normalize(dx, dy);

        // Устанавливаем скорость движения
        const velocityX = direction.x * this.speed;
        const velocityY = direction.y * this.speed;

        this.setVelocity(velocityX, velocityY);

        // Поворачиваем к цели
        this.rotateToTarget(target);

        console.log(`💥 [SingleUseAttack] Движение к цели со скоростью ${this.speed}`);
    }

    /**
     * Поворот к цели
     * @param {Object} target - Цель
     */
    rotateToTarget(target) {
        if (!target) return;

        const direction = GeometryUtils.normalize(
            target.x - this.gameObject.x,
            target.y - this.gameObject.y
        );

        if (direction.x === 0 && direction.y === 0) return;

        const targetAngle = Math.atan2(direction.y, direction.x);
        this.gameObject.setRotation(targetAngle);
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
        if (this.currentTarget === target) {
            return;
        }

        this.currentTarget = target;
        
        if (target) {
            console.log(`💥 [SingleUseAttackStrategy] Цель установлена: (${target.x.toFixed(1)}, ${target.y.toFixed(1)})`);
        }
    }

    /**
     * Уничтожение объекта
     */
    destroySelf() {
        console.log(`💥 [SingleUseAttack] Объект самоуничтожается`);
        
        // Эмитим событие уничтожения
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('singleUseAttackDestroyed', {
                attacker: this.gameObject,
                damage: this.damage,
                explosionRadius: this.explosionRadius
            });
        }

        // Уничтожаем объект
        if (this.gameObject.destroy) {
            this.gameObject.destroy();
        }
    }

    /**
     * Обработчик выполненной атаки
     * @param {Object} target - Цель
     * @param {number} time - Время атаки
     */
    onAttackPerformed(target, time) {
        // Эмитим событие атаки
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('singleUseAttack', {
                attacker: this.gameObject,
                target: target,
                damage: this.damage,
                explosionRadius: this.explosionRadius,
                explosionDamage: this.explosionDamage,
                time: time
            });
        }
    }

    /**
     * Проверка, может ли атаковать
     * @returns {boolean}
     */
    canAttack() {
        return !this.hasAttacked && this.gameObject.isAlive && this.currentTarget;
    }

    /**
     * Получение состояния атаки
     * @returns {Object}
     */
    getAttackState() {
        return {
            hasAttacked: this.hasAttacked,
            isMoving: this.isMoving,
            damage: this.damage,
            explosionRadius: this.explosionRadius,
            explosionDamage: this.explosionDamage,
            currentTarget: this.currentTarget,
            speed: this.speed
        };
    }

    /**
     * Получение урона
     * @returns {number}
     */
    getDamage() {
        return this.damage;
    }

    /**
     * Установка урона
     * @param {number} damage - Урон
     */
    setDamage(damage) {
        this.damage = Math.max(0, damage);
        this.explosionDamage = damage;
    }

    /**
     * Получение имени стратегии
     * @returns {string}
     */
    getName() {
        return 'SingleUseAttackStrategy';
    }

    /**
     * Остановка атаки
     */
    stop() {
        this.hasAttacked = true;
        this.isMoving = false;
        this.setVelocity(0, 0);
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.stop();
        this.currentTarget = null;
        this.gameObject = null;
        this.config = null;
    }
}
