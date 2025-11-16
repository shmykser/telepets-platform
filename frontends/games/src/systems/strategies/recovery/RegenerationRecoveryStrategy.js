import { RecoveryStrategy } from './RecoveryStrategy.js';

/**
 * Стратегия регенерации здоровья
 * Враг постоянно регенерирует здоровье с возможностью затухания
 */
export class RegenerationRecoveryStrategy extends RecoveryStrategy {
    constructor(gameObject, config) {
        super(gameObject, config);
        
        // Параметры регенерации
        this.regenerationRate = config.get('regenerationRate', 0.5); // HP за кадр
        this.regenerationDelay = config.get('regenerationDelay', 2000); // задержка перед регенерацией (мс)
        this.regenerationCap = config.get('regenerationCap', 1.0); // максимальный уровень регенерации
        this.regenerationDecay = config.get('regenerationDecay', 0.1); // затухание регенерации за кадр
        
        // Состояние регенерации
        this.currentRegenerationLevel = this.regenerationCap; // текущий уровень регенерации
        this.regenerationStartTime = 0;
        this.lastRegenerationTime = 0;
        this.isRegenerating = false;
        
        // Инициализация
        this.initializeRegeneration();
    }

    /**
     * Инициализация регенерации
     */
    initializeRegeneration() {
        const currentTime = this.gameObject.scene ? this.gameObject.scene.time.now : Date.now();
        this.regenerationStartTime = currentTime + this.regenerationDelay;
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isActive || !this.gameObject || !this.gameObject.isAlive) {
            return;
        }

        // Проверяем, прошла ли задержка
        if (time < this.regenerationStartTime) {
            return;
        }

        // Проверяем, можем ли регенерировать
        if (!this.canRegenerate()) {
            return;
        }

        // Вычисляем регенерацию на основе кадров (а не времени)
        // regenerationRate теперь означает HP за кадр, а не HP за секунду
        const regenerationAmount = this.regenerationRate * this.currentRegenerationLevel;
        
        if (regenerationAmount > 0) {
            this.performRegeneration(regenerationAmount, time);
        }

        // Обновляем уровень регенерации (затухание)
        this.updateRegenerationLevel(delta);
    }

    /**
     * Выполнение регенерации
     * @param {number} amount - Количество здоровья для восстановления
     * @param {number} time - Текущее время
     */
    performRegeneration(amount, time) {
        const success = this.recoverHealth(amount, time);
        
        if (success) {
            this.lastRegenerationTime = time;
            this.isRegenerating = true;
            
            // Плавный эффект регенерации
            this.playRegenerationEffect();
        }
    }

    /**
     * Проверка, может ли объект регенерировать
     * @returns {boolean}
     */
    canRegenerate() {
        // Проверяем базовые условия
        if (!super.canRecover()) {
            this.isRegenerating = false;
            return false;
        }

        // Проверяем уровень регенерации
        if (this.currentRegenerationLevel <= 0) {
            this.isRegenerating = false;
            return false;
        }

        return true;
    }

    /**
     * Обновление уровня регенерации (затухание)
     * @param {number} delta - Время с последнего обновления
     */
    updateRegenerationLevel(delta) {
        // Затухание регенерации по кадрам (а не по времени)
        // regenerationDecay теперь означает снижение уровня за кадр
        this.currentRegenerationLevel = Math.max(0, this.currentRegenerationLevel - this.regenerationDecay);
        
        // Если регенерация закончилась, сбрасываем флаг
        if (this.currentRegenerationLevel <= 0) {
            this.isRegenerating = false;
        }
    }

    /**
     * Эффект регенерации
     */
    playRegenerationEffect() {
        // Специальный эффект для регенерации - мягкое свечение
        if (this.gameObject && this.gameObject.scene) {
            const originalAlpha = this.gameObject.alpha;
            
            // Плавное свечение зеленым
            this.gameObject.setTint(0x88ff88);
            this.gameObject.setAlpha(Math.min(1.0, originalAlpha + 0.1));
            
            this.gameObject.scene.time.delayedCall(150, () => {
                if (this.gameObject) {
                    this.gameObject.clearTint();
                    this.gameObject.setAlpha(originalAlpha);
                }
            });
        }
    }

    /**
     * Восстановление уровня регенерации
     * @param {number} amount - Количество для восстановления уровня
     */
    restoreRegenerationLevel(amount = 1.0) {
        this.currentRegenerationLevel = Math.min(this.regenerationCap, this.currentRegenerationLevel + amount);
        console.log(`💚 [RegenerationRecoveryStrategy] Уровень регенерации восстановлен до ${this.currentRegenerationLevel.toFixed(2)}`);
    }

    /**
     * Установка уровня регенерации
     * @param {number} level - Уровень регенерации (0.0 - 1.0)
     */
    setRegenerationLevel(level) {
        this.currentRegenerationLevel = Math.max(0, Math.min(this.regenerationCap, level));
        console.log(`💚 [RegenerationRecoveryStrategy] Уровень регенерации установлен на ${this.currentRegenerationLevel.toFixed(2)}`);
    }

    /**
     * Получение информации о регенерации
     * @returns {Object}
     */
    getRegenerationInfo() {
        const baseState = this.getRecoveryState();
        return {
            ...baseState,
            regenerationRate: this.regenerationRate,
            regenerationDelay: this.regenerationDelay,
            regenerationCap: this.regenerationCap,
            regenerationDecay: this.regenerationDecay,
            currentRegenerationLevel: this.currentRegenerationLevel,
            isRegenerating: this.isRegenerating,
            effectiveRegenerationRate: this.regenerationRate * this.currentRegenerationLevel
        };
    }

    /**
     * Установка скорости регенерации
     * @param {number} rate - Скорость регенерации (HP за кадр)
     */
    setRegenerationRate(rate) {
        this.regenerationRate = Math.max(0, rate);
        console.log(`💚 [RegenerationRecoveryStrategy] Скорость регенерации изменена на ${this.regenerationRate} HP за кадр`);
    }

    /**
     * Обработка получения урона (может снижать регенерацию)
     * @param {number} damage - Полученный урон
     */
    onDamageReceived(damage) {
        // Урон может временно снижать регенерацию
        const damageReduction = Math.min(0.5, damage / this.gameObject.maxHealth * 2);
        this.currentRegenerationLevel = Math.max(0, this.currentRegenerationLevel - damageReduction);
        
        console.log(`💚 [RegenerationRecoveryStrategy] Урон ${damage} снизил регенерацию на ${damageReduction.toFixed(2)}`);
    }
}
