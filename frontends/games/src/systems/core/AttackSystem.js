import { ISystem } from '../interfaces/ISystem.js';
import { GeometryUtils } from '../../utils/GeometryUtils.js';
import { SpawnAttackStrategy } from '../strategies/attack/SpawnAttackStrategy.js';
import { SingleUseAttackStrategy } from '../strategies/attack/SingleUseAttackStrategy.js';
import { SimpleAttackStrategy } from '../strategies/attack/SimpleAttackStrategy.js';

/**
 * Универсальная система атаки для игровых объектов
 * Поддерживает различные типы атак и стратегии
 */
export class AttackSystem extends ISystem {
    constructor(gameObject, config) {
        super(gameObject, config);
        this.currentTarget = null;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        // Получаем конфигурацию атаки
        const attackConfig = this.config.get('attack', {});
        this.attackCooldown = attackConfig.cooldown || this.getConfigValue('cooldown', 1000);
        // Радиус атаки берем ТОЛЬКО из attack.range. Важно: допускаем отрицательные значения
        this.attackRange = (attackConfig.range !== undefined ? attackConfig.range : 0);
        this.damage = attackConfig.damage || this.getConfigValue('damage', 10);
        this.attackType = this.getConfigValue('attackType', 'singleUse');
        
        // Стратегия атаки
        this.strategy = null;
        this.strategyType = this.getConfigValue('strategy', 'simple');
        
        this.initialize();
    }

    initialize() {
        this.setupStrategy();
        
    }

    setupStrategy() {
        const strategyClass = this.getStrategyClass(this.strategyType);
        if (strategyClass) {
            this.strategy = new strategyClass(this.gameObject, this.config);
        } else {
            // Фоллбек: отсутствующая стратегия
            if (this.strategyType && this.strategyType !== 'none') {
                console.warn(`AttackSystem: неизвестная стратегия '${this.strategyType}', переключаюсь на 'simple'`);
            }
            this.strategy = new SimpleAttackStrategy(this.gameObject, this.config);
        }
    }

    getStrategyClass(strategyType) {
        // Динамический импорт стратегий
        switch (strategyType) {
            case 'simple':
                return SimpleAttackStrategy; // Простая стратегия атаки
            case 'area':
                return null; // TODO: реализовать AreaAttackStrategy
            case 'spawn':
                return SpawnAttackStrategy; // Стратегия спавна
            case 'singleUse':
                return SingleUseAttackStrategy; // Стратегия одноразовой атаки (снаряд)
            case 'none':
                return null; // Отключенная атака (используется специальная логика в movement)
            default:
                return null;
        }
    }

    updateSystem(time, delta) {
        if (this.strategy) {
            this.strategy.update(time, delta);
        } else {
            this.defaultAttack(time, delta);
        }
    }

    defaultAttack(time, delta) {
        if (!this.currentTarget || !this.canAttack()) {
            return;
        }

        if (this.isInRange()) {
            this.performAttack();
        }
    }

    /**
     * Установка цели для атаки
     * @param {Object} target - Цель атаки
     */
    setTarget(target) {
        const oldTarget = this.currentTarget;
        this.currentTarget = target;
        
        this.emit('targetChanged', {
            oldTarget,
            newTarget: target,
            gameObject: this.gameObject
        });
    }

    /**
     * Атака цели
     * @param {Object} target - Цель атаки
     * @returns {boolean} - Успешность атаки
     */
    attack(target) {
        if (!target) {
            return this.attackCurrentTarget();
        }

        this.setTarget(target);
        return this.attackCurrentTarget();
    }

    /**
     * Атака текущей цели
     * @returns {boolean} - Успешность атаки
     */
    attackCurrentTarget() {
        if (!this.currentTarget) {
            return false;
        }
        
        const canAttackNow = this.canAttack();
        if (!canAttackNow) {
            return false;
        }

        if (!this.isInRange()) {
            return false;
        }
        
        return this.performAttack();
    }

    /**
     * Проверка возможности атаки
     * @returns {boolean}
     */
    canAttack() {
        if (!this.gameObject || !this.gameObject.isAlive) {
            return false;
        }

        const currentTime = this.gameObject.scene?.time?.now || Date.now();
        return (currentTime - this.lastAttackTime) >= this.attackCooldown;
    }

    /**
     * Проверка, находится ли цель в радиусе атаки
     * @returns {boolean}
     */
    isInRange() {
        if (!this.currentTarget || !this.gameObject) {
            return false;
        }

        const distance = GeometryUtils.distance(this.gameObject.x, this.gameObject.y, this.currentTarget.x, this.currentTarget.y);
        // Используем такой же расчет, как и в движении: половины реальных спрайтов + baseRange (может быть отрицательным)
        const effectiveRange = GeometryUtils.effectiveAttackRange(this.gameObject, this.currentTarget, this.attackRange);
        return distance <= effectiveRange;
    }

    /**
     * Выполнение атаки
     * @returns {boolean} - Успешность атаки
     */
    performAttack() {
        if (!this.currentTarget) {
            return false;
        }

        const currentTime = this.gameObject.scene?.time?.now || Date.now();
        this.lastAttackTime = currentTime;
        this.isAttacking = true;

        // Эмитируем событие перед выполнением атаки (на случай если стратегия уничтожит объект)
        this.emit('attackPerformed', {
            target: this.currentTarget,
            damage: this.damage,
            gameObject: this.gameObject
        });

        // Выполняем атаку через стратегию или базовую логику
        let success = false;
        if (this.strategy && this.strategy.performAttack) {
            success = this.strategy.performAttack(this.currentTarget);
        } else {
            success = this.performBasicAttack(this.currentTarget);
        }

        // Сброс состояния атаки (только если объект еще существует)
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.time) {
            this.gameObject.scene.time.delayedCall(100, () => {
                if (this.gameObject) {
                    this.isAttacking = false;
                }
            });
        } else {
            // Fallback если сцена недоступна
            setTimeout(() => {
                this.isAttacking = false;
            }, 100);
        }

        return success;
    }

    /**
     * Базовая атака
     * @param {Object} target - Цель атаки
     * @returns {boolean}
     */
    performBasicAttack(target) {
        if (!target || typeof target.takeDamage !== 'function') {
            console.warn('AttackSystem: Target cannot take damage');
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
     * Создание снаряда для дальнобойной атаки
     * @param {Object} target - Цель
     * @returns {Object|null} - Снаряд или null
     */
    createProjectile(target) {
        if (this.attackType !== 'ranged') {
            return null;
        }

        const projectileSpeed = this.getConfigValue('projectileSpeed', 400);
        const projectileDamage = this.getConfigValue('projectileDamage', this.damage);

        // Создаем снаряд (заглушка, будет реализовано позже)
        const projectile = {
            x: this.gameObject.x,
            y: this.gameObject.y,
            target: target,
            speed: projectileSpeed,
            damage: projectileDamage,
            update: function(time, delta) {
                // Логика движения снаряда
            }
        };

        return projectile;
    }

    /**
     * Областная атака
     * @param {number} x - X координата центра
     * @param {number} y - Y координата центра
     * @param {number} radius - Радиус атаки
     * @returns {Array} - Массив пораженных целей
     */
    performAreaAttack(x, y, radius) {
        if (this.attackType !== 'area') {
            return [];
        }

        const affectedTargets = [];
        const areaDamage = this.getConfigValue('areaDamage', this.damage * 0.7);

        // Находим все цели в радиусе (заглушка)
        // В реальной реализации здесь будет поиск целей в сцене
        const targets = this.findTargetsInRadius(x, y, radius);
        
        targets.forEach(target => {
            if (target.takeDamage) {
                target.takeDamage(areaDamage);
                affectedTargets.push(target);
            }
        });

        this.emit('areaAttackPerformed', {
            center: { x, y },
            radius,
            affectedTargets,
            damage: areaDamage,
            gameObject: this.gameObject
        });

        return affectedTargets;
    }

    /**
     * Поиск целей в радиусе (заглушка)
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {number} radius - Радиус
     * @returns {Array} - Массив целей
     */
    findTargetsInRadius(x, y, radius) {
        // В реальной реализации здесь будет поиск в сцене
        return [];
    }

    /**
     * Установка урона
     * @param {number} damage - Урон
     */
    setDamage(damage) {
        this.damage = Math.max(0, damage);
        this.config.setOverride('damage', this.damage);
    }

    /**
     * Установка радиуса атаки
     * @param {number} range - Радиус
     */
    setAttackRange(range) {
        // Разрешаем отрицательные значения для визуального наложения
        this.attackRange = range;
        this.config.setOverride('range', this.attackRange);
    }

    /**
     * Установка кулдауна атаки
     * @param {number} cooldown - Кулдаун в миллисекундах
     */
    setCooldown(cooldown) {
        this.attackCooldown = Math.max(0, cooldown);
        this.config.setOverride('cooldown', this.attackCooldown);
    }

    /**
     * Установка типа атаки
     * @param {string} attackType - Тип атаки
     */
    setAttackType(attackType) {
        this.attackType = attackType;
        this.config.setOverride('attackType', attackType);
    }

    /**
     * Установка стратегии атаки
     * @param {string} strategyType - Тип стратегии
     */
    setStrategy(strategyType) {
        this.strategyType = strategyType;
        this.setupStrategy();
    }

    /**
     * Получение времени до следующей атаки
     * @returns {number} - Время в миллисекундах
     */
    getTimeToNextAttack() {
        const currentTime = this.gameObject.scene?.time?.now || Date.now();
        const timeSinceLastAttack = currentTime - this.lastAttackTime;
        return Math.max(0, this.attackCooldown - timeSinceLastAttack);
    }

    /**
     * Проверка, атакует ли объект
     * @returns {boolean}
     */
    isCurrentlyAttacking() {
        return this.isAttacking;
    }

    /**
     * Получение текущей цели
     * @returns {Object|null}
     */
    getCurrentTarget() {
        return this.currentTarget;
    }

    /**
     * Получение состояния атаки
     * @returns {Object}
     */
    getAttackState() {
        return {
            isAttacking: this.isAttacking,
            currentTarget: this.currentTarget,
            attackType: this.attackType,
            strategy: this.strategyType,
            damage: this.damage,
            attackRange: this.attackRange,
            cooldown: this.attackCooldown,
            timeToNextAttack: this.getTimeToNextAttack()
        };
    }

    /**
     * Эмит события
     * @param {string} event - Событие
     * @param {Object} data - Данные
     */
    emit(event, data) {
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit(`attack:${event}`, data);
        }
    }

    destroy() {
        this.currentTarget = null;
        if (this.strategy && this.strategy.destroy) {
            this.strategy.destroy();
        }
        super.destroy();
    }
}
