/**
 * Базовый интерфейс для всех систем
 * Обеспечивает единообразный API для всех систем
 */
export class ISystem {
    /**
     * Конструктор системы
     * @param {IGameObject} gameObject - Игровой объект
     * @param {SystemConfig} config - Конфигурация системы
     */
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.isActive = true;
        this.enabled = config?.isEnabled() !== false;
    }

    /**
     * Инициализация системы
     */
    initialize() {
        // Переопределяется в наследниках
    }

    /**
     * Обновление системы
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isActive || !this.enabled) {
            return;
        }
        this.updateSystem(time, delta);
    }

    /**
     * Специфичная логика обновления системы
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    updateSystem(time, delta) {
        // Переопределяется в наследниках
    }

    /**
     * Активация системы
     */
    activate() {
        this.isActive = true;
        this.onActivate();
    }

    /**
     * Деактивация системы
     */
    deactivate() {
        this.isActive = false;
        this.onDeactivate();
    }

    /**
     * Обработчик активации (переопределяется в наследниках)
     */
    onActivate() {
        // Переопределяется в наследниках
    }

    /**
     * Обработчик деактивации (переопределяется в наследниках)
     */
    onDeactivate() {
        // Переопределяется в наследниках
    }

    /**
     * Включение/выключение системы
     * @param {boolean} enabled - Включена ли система
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this.activate();
        } else {
            this.deactivate();
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
            config: this.config?.getConfig() || {}
        };
    }

    /**
     * Получение имени системы
     * @returns {string}
     */
    getSystemName() {
        return this.constructor.name;
    }

    /**
     * Уничтожение системы
     */
    destroy() {
        this.deactivate();
        this.gameObject = null;
        this.config = null;
    }

    /**
     * Получение конфигурационного значения
     * @param {string} key - Ключ конфигурации
     * @param {*} defaultValue - Значение по умолчанию
     * @returns {*}
     */
    getConfigValue(key, defaultValue = null) {
        return this.config?.get(key, defaultValue) ?? defaultValue;
    }

    /**
     * Проверка, поддерживает ли система определенную функцию
     * @param {string} functionName - Имя функции
     * @returns {boolean}
     */
    supports(functionName) {
        return typeof this[functionName] === 'function';
    }
}
