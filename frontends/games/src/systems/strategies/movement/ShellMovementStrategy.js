import { GeometryUtils } from '../../utils/GeometryUtils.js';

/**
 * Стратегия движения с раковиной (улитка)
 * Уходит в раковину при атаке, медленно движется
 */
export class ShellMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        this.speed = movementConfig.speed || config.get('speed', 20);
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        
        // Параметры раковины
        this.shellProtection = config.get('shellProtection', 0.5); // Защита в раковине (50%)
        this.shellDuration = config.get('shellDuration', 3000); // Время в раковине (мс)
        this.shellCooldown = config.get('shellCooldown', 5000); // Кулдаун раковины (мс)
        
        // Состояние
        this.isInShell = false;
        this.lastShellTime = 0;
        this.lastDamageTime = 0;
        this.originalSpeed = this.speed;
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Проверяем, нужно ли выйти из раковины
        if (this.isInShell && time - this.lastShellTime > this.shellDuration) {
            this.exitShell(time);
        }
    }

    /**
     * Вход в раковину
     * @param {number} time - Текущее время
     */
    enterShell(time) {
        if (this.isInShell || time - this.lastDamageTime < this.shellCooldown) {
            return;
        }
        
        this.isInShell = true;
        this.lastShellTime = time;
        this.speed = this.originalSpeed * 0.3; // Замедляемся в раковине
        
        // Визуальный эффект
        this.gameObject.setScale(0.8); // Уменьшаемся
        this.gameObject.setTint(0x888888); // Серый цвет
        
        // Эффект входа в раковину
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:enterShell', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Выход из раковины
     * @param {number} time - Текущее время
     */
    exitShell(time) {
        this.isInShell = false;
        this.speed = this.originalSpeed;
        
        // Восстанавливаем внешний вид
        this.gameObject.setScale(1.0);
        this.gameObject.clearTint();
        
        // Эффект выхода из раковины
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:exitShell', {
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
        return this.speed;
    }

    /**
     * Установка скорости
     * @param {number} speed - Скорость
     */
    setSpeed(speed) {
        this.originalSpeed = speed;
        this.speed = this.isInShell ? speed * 0.3 : speed;
    }

    /**
     * Получение урона
     * @param {number} damage - Урон
     * @param {number} time - Текущее время
     * @returns {number} Финальный урон
     */
    takeDamage(damage, time) {
        this.lastDamageTime = time;
        
        if (this.isInShell) {
            // В раковине получаем меньше урона
            const finalDamage = damage * (1 - this.shellProtection);
            return Math.max(1, Math.floor(finalDamage));
        } else {
            // Вне раковины - полный урон, но входим в раковину
            this.enterShell(time);
            return damage;
        }
    }

    /**
     * Проверка, находится ли объект в раковине
     * @returns {boolean}
     */
    isInShellNow() {
        return this.isInShell;
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}
