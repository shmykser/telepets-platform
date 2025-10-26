import { RecoveryStrategy } from './RecoveryStrategy.js';

/**
 * Стратегия восстановления здоровья со временем
 * Враг медленно восстанавливает здоровье через определенные интервалы
 */
export class TimeBasedRecoveryStrategy extends RecoveryStrategy {
    constructor(gameObject, config) {
        super(gameObject, config);
        
        // Параметры восстановления
        this.recoveryRate = config.get('recoveryRate', 1); // HP/сек
        this.recoveryInterval = config.get('recoveryInterval', 1000); // интервал в мс
        this.recoveryDelay = config.get('recoveryDelay', 3000); // задержка перед началом восстановления
        this.maxRecovery = config.get('maxRecovery', 0); // максимальное восстановление (0 = без ограничений)
        
        // Состояние
        this.isRecoveryActive = false;
        this.recoveryStartTime = 0;
        this.lastRecoveryTime = 0;
        this.totalRecovered = 0;
        
        // Инициализация
        this.initializeRecovery();
    }

    /**
     * Инициализация восстановления
     */
    initializeRecovery() {
        const currentTime = this.gameObject.scene ? this.gameObject.scene.time.now : Date.now();
        this.recoveryStartTime = currentTime + this.recoveryDelay;
        console.log(`💚 [TimeBasedRecoveryStrategy] Восстановление начнется через ${this.recoveryDelay}мс`);
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
        if (time < this.recoveryStartTime) {
            return;
        }

        // Проверяем интервал восстановления
        if (time - this.lastRecoveryTime < this.recoveryInterval) {
            return;
        }

        // Проверяем, можем ли восстановить здоровье
        if (this.canRecover()) {
            this.performRecovery(time, delta);
        }
    }

    /**
     * Выполнение восстановления
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    performRecovery(time, delta) {
        // Вычисляем количество восстановления
        const recoveryAmount = (this.recoveryRate * this.recoveryInterval) / 1000;
        
        // Восстанавливаем здоровье
        const success = this.recoverHealth(recoveryAmount, time);
        
        if (success) {
            console.log(`💚 [TimeBasedRecoveryStrategy] ${this.gameObject.enemyType || 'объект'} восстановил ${recoveryAmount.toFixed(1)} HP за ${this.recoveryInterval}мс`);
        }
    }

    /**
     * Проверка, может ли объект восстанавливать здоровье
     * @returns {boolean}
     */
    canRecover() {
        // Проверяем базовые условия
        if (!super.canRecover()) {
            return false;
        }

        // Проверяем, не достиг ли объект максимального восстановления
        if (this.maxRecovery > 0 && this.totalRecovered >= this.maxRecovery) {
            return false;
        }

        return true;
    }

    /**
     * Эффект восстановления
     */
    playRecoveryEffect() {
        // Специальный эффект для временного восстановления
        if (this.gameObject && this.gameObject.scene) {
            const originalAlpha = this.gameObject.alpha;
            
            // Мигание зеленым цветом
            this.gameObject.setTint(0x00ff00);
            this.gameObject.setAlpha(0.8);
            
            this.gameObject.scene.time.delayedCall(300, () => {
                if (this.gameObject) {
                    this.gameObject.clearTint();
                    this.gameObject.setAlpha(originalAlpha);
                }
            });
        }
    }

    /**
     * Получение информации о восстановлении
     * @returns {Object}
     */
    getRecoveryInfo() {
        const baseState = this.getRecoveryState();
        return {
            ...baseState,
            recoveryRate: this.recoveryRate,
            recoveryInterval: this.recoveryInterval,
            recoveryDelay: this.recoveryDelay,
            isRecoveryActive: this.isRecoveryActive,
            timeUntilRecovery: Math.max(0, this.recoveryStartTime - (this.gameObject.scene ? this.gameObject.scene.time.now : Date.now()))
        };
    }

    /**
     * Установка скорости восстановления
     * @param {number} rate - Скорость восстановления (HP/сек)
     */
    setRecoveryRate(rate) {
        this.recoveryRate = Math.max(0, rate);
        console.log(`💚 [TimeBasedRecoveryStrategy] Скорость восстановления изменена на ${this.recoveryRate} HP/сек`);
    }

    /**
     * Установка интервала восстановления
     * @param {number} interval - Интервал в миллисекундах
     */
    setRecoveryInterval(interval) {
        this.recoveryInterval = Math.max(100, interval);
        console.log(`💚 [TimeBasedRecoveryStrategy] Интервал восстановления изменен на ${this.recoveryInterval}мс`);
    }
}
