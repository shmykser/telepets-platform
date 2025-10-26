/**
 * Утилитарные функции для работы с свойствами объектов
 * Следует принципу Single Responsibility Principle
 */
export class PropertyUtils {
    /**
     * Безопасно определяет свойство объекта с дескриптором
     * @param {Object} obj - Объект для определения свойства
     * @param {string} prop - Имя свойства
     * @param {*} value - Значение свойства
     * @param {Object} options - Опции дескриптора
     */
    static defineProperty(obj, prop, value, options = {}) {
        const descriptor = {
            value: value,
            writable: options.writable !== false,
            enumerable: options.enumerable !== false,
            configurable: options.configurable !== false
        };

        if (options.get || options.set) {
            delete descriptor.value;
            delete descriptor.writable;
            if (options.get) descriptor.get = options.get;
            if (options.set) descriptor.set = options.set;
        }

        Object.defineProperty(obj, prop, descriptor);
    }

    /**
     * Создает геттер и сеттер для свойства
     * @param {Object} obj - Объект
     * @param {string} prop - Имя свойства
     * @param {*} initialValue - Начальное значение
     * @param {Function} validator - Функция валидации (опционально)
     */
    static defineAccessor(obj, prop, initialValue, validator = null) {
        let value = initialValue;

        this.defineProperty(obj, prop, null, {
            get: () => value,
            set: (newValue) => {
                if (validator && !validator(newValue)) {
                    return;
                }
                value = newValue;
            },
            enumerable: true,
            configurable: true
        });
    }

    /**
     * Копирует свойства из одного объекта в другой
     * @param {Object} target - Целевой объект
     * @param {Object} source - Источник
     * @param {Array<string>} properties - Массив свойств для копирования
     */
    static copyProperties(target, source, properties) {
        properties.forEach(prop => {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        });
    }

    /**
     * Проверяет, является ли значение числом
     * @param {*} value - Значение для проверки
     * @returns {boolean} true если значение является числом
     */
    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    /**
     * Проверяет, является ли значение положительным числом
     * @param {*} value - Значение для проверки
     * @returns {boolean} true если значение является положительным числом
     */
    static isPositiveNumber(value) {
        return this.isNumber(value) && value > 0;
    }

    /**
     * Проверяет, является ли значение неотрицательным числом
     * @param {*} value - Значение для проверки
     * @returns {boolean} true если значение является неотрицательным числом
     */
    static isNonNegativeNumber(value) {
        return this.isNumber(value) && value >= 0;
    }

    /**
     * Ограничивает значение в заданном диапазоне
     * @param {number} value - Значение для ограничения
     * @param {number} min - Минимальное значение
     * @param {number} max - Максимальное значение
     * @returns {number} Ограниченное значение
     */
    static clamp(value, min, max) {
        if (!this.isNumber(value)) {
            return min;
        }
        return Math.min(Math.max(value, min), max);
    }
}
