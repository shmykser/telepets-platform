import { SystemConfig } from './config/SystemConfig.js';
import { TimeBasedRecoveryStrategy } from './strategies/recovery/TimeBasedRecoveryStrategy.js';
import { RegenerationRecoveryStrategy } from './strategies/recovery/RegenerationRecoveryStrategy.js';

/**
 * Система восстановления здоровья
 * Управляет стратегиями восстановления для игровых объектов
 */
export class RecoverySystem {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.isActive = true;
        this.enabled = true;
        
        // Стратегия восстановления
        this.recoveryStrategy = null;
        
        this.initialize();
    }

    /**
     * Инициализация системы
     */
    initialize() {
        this.setupRecoveryStrategy();
    }

    /**
     * Настройка стратегии восстановления
     */
    setupRecoveryStrategy() {
        const recoveryConfig = this.config.get('recovery', {});
        
        if (!recoveryConfig || !recoveryConfig.strategy) {
            return;
        }

        const strategy = recoveryConfig.strategy;
        // Порядок источников: родительская конфигурация (низший приоритет), recoveryConfig (высший приоритет)
        const strategyConfig = new SystemConfig([this.config, recoveryConfig]);

        try {
            switch (strategy) {
                case 'timeBased':
                    this.recoveryStrategy = new TimeBasedRecoveryStrategy(this.gameObject, strategyConfig);
                    break;
                    
                case 'regeneration':
                    this.recoveryStrategy = new RegenerationRecoveryStrategy(this.gameObject, strategyConfig);
                    break;
                    
                default:
                    console.warn(`⚠️ [RecoverySystem] Неизвестная стратегия восстановления: ${strategy}`);
                    break;
            }
        } catch (error) {
            console.error(`❌ [RecoverySystem] Ошибка создания стратегии восстановления ${strategy}:`, error);
        }
    }

    /**
     * Обновление системы
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isActive || !this.enabled || !this.gameObject || !this.gameObject.isAlive) {
            return;
        }

        if (this.recoveryStrategy) {
            this.recoveryStrategy.update(time, delta);
        }
    }

    /**
     * Установка стратегии восстановления
     * @param {string} strategy - Название стратегии
     */
    setStrategy(strategy) {
        if (this.recoveryStrategy) {
            this.recoveryStrategy.destroy();
            this.recoveryStrategy = null;
        }

        const recoveryConfig = this.config.get('recovery', {});
        recoveryConfig.strategy = strategy;
        
        this.setupRecoveryStrategy();
    }

    /**
     * Получение информации о восстановлении
     * @returns {Object|null}
     */
    getRecoveryInfo() {
        if (this.recoveryStrategy) {
            return this.recoveryStrategy.getRecoveryInfo ? 
                this.recoveryStrategy.getRecoveryInfo() : 
                this.recoveryStrategy.getRecoveryState();
        }
        return null;
    }

    /**
     * Проверка, активна ли система восстановления
     * @returns {boolean}
     */
    hasActiveRecovery() {
        if (!this.recoveryStrategy) {
            return false;
        }

        const state = this.recoveryStrategy.getRecoveryState();
        return state.isActive && state.canRecover;
    }

    /**
     * Активация системы
     */
    activate() {
        this.isActive = true;
        if (this.recoveryStrategy) {
            this.recoveryStrategy.activate();
        }
    }

    /**
     * Деактивация системы
     */
    deactivate() {
        this.isActive = false;
        if (this.recoveryStrategy) {
            this.recoveryStrategy.deactivate();
        }
    }

    /**
     * Включение/выключение системы
     * @param {boolean} enabled - Включена ли система
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.recoveryStrategy) {
            if (enabled) {
                this.recoveryStrategy.activate();
            } else {
                this.recoveryStrategy.deactivate();
            }
        }
    }

    /**
     * Получение состояния системы
     * @returns {Object}
     */
    getState() {
        return {
            isActive: this.isActive,
            enabled: this.enabled,
            hasStrategy: !!this.recoveryStrategy,
            recoveryInfo: this.getRecoveryInfo()
        };
    }

    /**
     * Уничтожение системы
     */
    destroy() {
        this.deactivate();
        
        if (this.recoveryStrategy) {
            this.recoveryStrategy.destroy();
            this.recoveryStrategy = null;
        }

        this.gameObject = null;
        this.config = null;
    }
}
