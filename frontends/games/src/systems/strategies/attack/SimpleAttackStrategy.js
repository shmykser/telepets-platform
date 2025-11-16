import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия простой атаки
 * Базовая атака при непосредственном контакте с целью
 */
export class SimpleAttackStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию атаки
        const attackConfig = config.get('attack', {});
        
        this.damage = attackConfig.damage || config.get('damage', 10);
        // Радиус атаки берем ТОЛЬКО из attack.range
        this.range = attackConfig.range || 0;
        this.cooldown = attackConfig.cooldown || config.get('cooldown', 1000);
        this.lastAttackTime = 0;
        this.attackDuration = config.get('attackDuration', 200);
        this.isAttacking = false;
    }

    update(time, delta) {
        // Сброс состояния атаки после завершения
        if (this.isAttacking && time - this.lastAttackTime >= this.attackDuration) {
            this.isAttacking = false;
        }
    }

    /**
     * Выполнение атаки
     * @param {Object} target - Цель атаки
     * @returns {boolean} - Успешность атаки
     */
    performAttack(target) {
        if (!this.canAttack()) {
            return false;
        }

        if (!this.isInRange(target)) {
            return false;
        }

        this.isAttacking = true;
        this.lastAttackTime = this.gameObject.scene?.time?.now || Date.now();

        // Применяем урон
        const success = this.applyDamage(target);
        
        if (success) {
            this.onAttackPerformed(target);
        }

        return success;
    }

    /**
     * Проверка возможности атаки
     * @returns {boolean}
     */
    canAttack() {
        if (!this.gameObject || !this.gameObject.isAlive || this.isAttacking) {
            return false;
        }

        const currentTime = this.gameObject.scene?.time?.now || Date.now();
        return (currentTime - this.lastAttackTime) >= this.cooldown;
    }

    /**
     * Проверка, находится ли цель в радиусе атаки
     * @param {Object} target - Цель
     * @returns {boolean}
     */
    isInRange(target) {
        if (!target || !this.gameObject) return false;
        const distance = GeometryUtils.distance(this.gameObject.x, this.gameObject.y, target.x, target.y);
        const effectiveRange = GeometryUtils.effectiveAttackRange(this.gameObject, target, this.range);
        return distance <= effectiveRange;
    }
    
    /**
     * Применение урона к цели
     * @param {Object} target - Цель
     * @returns {boolean}
     */
    applyDamage(target) {
        if (!target || typeof target.takeDamage !== 'function') {
            return false;
        }

        // Применяем урон
        target.takeDamage(this.damage);

        // Эмитим событие атаки
        if (this.gameObject) {
            this.gameObject.emit('attack', target, this.damage);
        }

        return true;
    }

    /**
     * Обработчик выполненной атаки
     * @param {Object} target - Цель
     */
    onAttackPerformed(target) {
        // Эмитим событие атаки
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('simpleAttack', {
                attacker: this.gameObject,
                target: target,
                damage: this.damage,
                range: this.range
            });
        }
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
    }

    /**
     * Получение радиуса атаки
     * @returns {number}
     */
    getRange() {
        return this.range;
    }

    /**
     * Установка радиуса атаки
     * @param {number} range - Радиус
     */
    setRange(range) {
        this.range = Math.max(0, range);
    }

    /**
     * Получение кулдауна
     * @returns {number}
     */
    getCooldown() {
        return this.cooldown;
    }

    /**
     * Установка кулдауна
     * @param {number} cooldown - Кулдаун в миллисекундах
     */
    setCooldown(cooldown) {
        this.cooldown = Math.max(0, cooldown);
    }

    /**
     * Получение времени до следующей атаки
     * @returns {number}
     */
    getTimeToNextAttack() {
        const currentTime = this.gameObject?.scene?.time?.now || Date.now();
        const timeSinceLastAttack = currentTime - this.lastAttackTime;
        return Math.max(0, this.cooldown - timeSinceLastAttack);
    }

    /**
     * Проверка, атакует ли объект
     * @returns {boolean}
     */
    isCurrentlyAttacking() {
        return this.isAttacking;
    }

    /**
     * Получение состояния атаки
     * @returns {Object}
     */
    getAttackState() {
        return {
            isAttacking: this.isAttacking,
            damage: this.damage,
            range: this.range,
            cooldown: this.cooldown,
            timeToNextAttack: this.getTimeToNextAttack(),
            lastAttackTime: this.lastAttackTime
        };
    }

    /**
     * Получение имени стратегии
     * @returns {string}
     */
    getName() {
        return 'SimpleAttackStrategy';
    }

    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}
