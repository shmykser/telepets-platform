/**
 * Базовая стратегия восстановления
 * Абстрактный класс для всех стратегий восстановления здоровья
 */
export class RecoveryStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.isActive = false;
        this.lastRecoveryTime = 0;
        this.recoveryCooldown = config.get('recoveryCooldown', 1000);
        
        // Параметры восстановления
        this.maxRecovery = config.get('maxRecovery', 0); // 0 = без ограничений
        this.totalRecovered = 0; // Общее количество восстановленного здоровья
        
        this.initialize();
    }

    /**
     * Инициализация стратегии
     */
    initialize() {
        this.isActive = true;
        console.log(`💚 [RecoveryStrategy] Инициализация стратегии восстановления для ${this.gameObject.enemyType || 'объект'}`);
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

        // Проверяем кулдаун
        if (time - this.lastRecoveryTime < this.recoveryCooldown) {
            return;
        }

        // Проверяем, можем ли восстановить здоровье
        if (this.canRecover()) {
            this.performRecovery(time, delta);
        }
    }

    /**
     * Проверка, может ли объект восстанавливать здоровье
     * @returns {boolean}
     */
    canRecover() {
        if (!this.gameObject || !this.gameObject.isAlive) {
            return false;
        }

        // Проверяем, не достиг ли объект максимального восстановления
        if (this.maxRecovery > 0 && this.totalRecovered >= this.maxRecovery) {
            return false;
        }

        // Проверяем, не полное ли у объекта здоровье
        if (this.gameObject.health >= this.gameObject.maxHealth) {
            return false;
        }

        return true;
    }

    /**
     * Выполнение восстановления (переопределяется в наследниках)
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    performRecovery(time, delta) {
        // Абстрактный метод - должен быть переопределен в наследниках
        console.warn(`⚠️ [RecoveryStrategy] performRecovery не переопределен для ${this.constructor.name}`);
    }

    /**
     * Восстановление здоровья
     * @param {number} amount - Количество здоровья для восстановления
     * @param {number} time - Текущее время
     */
    recoverHealth(amount, time) {
        if (!this.gameObject || !this.gameObject.isAlive) {
            return false;
        }

        // Ограничиваем восстановление максимальным здоровьем
        const maxRecoverable = this.gameObject.maxHealth - this.gameObject.health;
        const actualRecovery = Math.min(amount, maxRecoverable);
        
        if (actualRecovery <= 0) {
            return false;
        }

        // Восстанавливаем здоровье
        this.gameObject.health = Math.min(this.gameObject.health + actualRecovery, this.gameObject.maxHealth);
        this.totalRecovered += actualRecovery;
        this.lastRecoveryTime = time;

        console.log(`💚 [RecoveryStrategy] ${this.gameObject.enemyType || 'объект'} восстановил ${actualRecovery.toFixed(1)} HP (${this.gameObject.health.toFixed(1)}/${this.gameObject.maxHealth})`);

        // Эффект восстановления
        this.playRecoveryEffect();

        // Уведомляем о восстановлении
        this.onRecoveryPerformed(actualRecovery, time);

        return true;
    }

    /**
     * Эффект восстановления (переопределяется в наследниках)
     */
    playRecoveryEffect() {
        // Базовый эффект - изменение альфы на короткое время
        if (this.gameObject && this.gameObject.scene) {
            const originalAlpha = this.gameObject.alpha;
            this.gameObject.setAlpha(0.7);
            
            this.gameObject.scene.time.delayedCall(200, () => {
                if (this.gameObject) {
                    this.gameObject.setAlpha(originalAlpha);
                }
            });
        }
    }

    /**
     * Обработчик выполненного восстановления
     * @param {number} amount - Количество восстановленного здоровья
     * @param {number} time - Текущее время
     */
    onRecoveryPerformed(amount, time) {
        // Уведомляем систему событий
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('recovery:healthRestored', {
                gameObject: this.gameObject,
                amount: amount,
                totalRecovered: this.totalRecovered,
                time: time
            });
        }
    }

    /**
     * Получение текущего состояния восстановления
     * @returns {Object}
     */
    getRecoveryState() {
        return {
            isActive: this.isActive,
            totalRecovered: this.totalRecovered,
            maxRecovery: this.maxRecovery,
            lastRecoveryTime: this.lastRecoveryTime,
            canRecover: this.canRecover(),
            healthPercentage: this.gameObject ? (this.gameObject.health / this.gameObject.maxHealth * 100) : 0
        };
    }

    /**
     * Активация стратегии
     */
    activate() {
        this.isActive = true;
        console.log(`💚 [RecoveryStrategy] Стратегия восстановления активирована для ${this.gameObject.enemyType || 'объект'}`);
    }

    /**
     * Деактивация стратегии
     */
    deactivate() {
        this.isActive = false;
        console.log(`💚 [RecoveryStrategy] Стратегия восстановления деактивирована для ${this.gameObject.enemyType || 'объект'}`);
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.deactivate();
        this.gameObject = null;
        this.config = null;
    }
}
