/**
 * Базовый класс конфигурации системы
 * Поддерживает множественные источники конфигурации с приоритетами
 */
export class SystemConfig {
    /**
     * Конструктор конфигурации
     * @param {Array|Object} sources - Источники конфигурации (массив или объект)
     * @param {Object} overrides - Переопределения конфигурации
     */
    constructor(sources = [], overrides = {}) {
        this.sources = Array.isArray(sources) ? sources : [sources];
        this.overrides = overrides;
        this.enabled = true;
        this.cache = new Map(); // Кэш для оптимизации
    }

    /**
     * Получение значения конфигурации с учетом приоритетов
     * @param {string} key - Ключ конфигурации
     * @param {*} defaultValue - Значение по умолчанию
     * @returns {*}
     */
    get(key, defaultValue = null) {
        // Проверяем кэш
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        let value = defaultValue;

        // 1. Сначала проверяем переопределения (высший приоритет)
        if (this.overrides.hasOwnProperty(key)) {
            value = this.overrides[key];
        } else {
            // 2. Затем проверяем источники в обратном порядке (последний источник имеет приоритет)
            for (let i = this.sources.length - 1; i >= 0; i--) {
                const source = this.sources[i];
                if (!source) continue;

                // Поддержка источников типа SystemConfig
                if (typeof source.get === 'function') {
                    const nestedValue = source.get(key, undefined);
                    if (nestedValue !== undefined) {
                        value = nestedValue;
                        break;
                    }
                    continue;
                }

                // Обычные plain-объекты
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    value = source[key];
                    break;
                }
            }
        }

        // Кэшируем результат
        this.cache.set(key, value);
        return value;
    }

    /**
     * Установка переопределения конфигурации
     * @param {string} key - Ключ
     * @param {*} value - Значение
     */
    setOverride(key, value) {
        this.overrides[key] = value;
        this.cache.delete(key); // Очищаем кэш
    }

    /**
     * Удаление переопределения
     * @param {string} key - Ключ
     */
    removeOverride(key) {
        delete this.overrides[key];
        this.cache.delete(key);
    }

    /**
     * Добавление источника конфигурации
     * @param {Object} source - Источник конфигурации
     * @param {number} priority - Приоритет (чем больше, тем выше приоритет)
     */
    addSource(source, priority = 0) {
        this.sources.push({ source, priority });
        this.sources.sort((a, b) => b.priority - a.priority);
        this.cache.clear(); // Очищаем кэш
    }

    /**
     * Проверка, включена ли система
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled && this.get('enabled', true) !== false;
    }

    /**
     * Включение/выключение системы
     * @param {boolean} enabled - Включена ли система
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Получение всех значений конфигурации
     * @returns {Object}
     */
    getAll() {
        const result = {};
        const allKeys = new Set();

        // Собираем все ключи из всех источников
        this.sources.forEach(sourceObj => {
            const source = sourceObj.source || sourceObj;
            Object.keys(source).forEach(key => allKeys.add(key));
        });
        Object.keys(this.overrides).forEach(key => allKeys.add(key));

        // Получаем значения для всех ключей
        allKeys.forEach(key => {
            result[key] = this.get(key);
        });

        return result;
    }

    /**
     * Проверка наличия ключа в конфигурации
     * @param {string} key - Ключ
     * @returns {boolean}
     */
    has(key) {
        return this.get(key, undefined) !== undefined;
    }

    /**
     * Получение конфигурации как объект
     * @returns {Object}
     */
    getConfig() {
        return {
            enabled: this.isEnabled(),
            sources: this.sources.length,
            overrides: Object.keys(this.overrides).length,
            values: this.getAll()
        };
    }

    /**
     * Создание копии конфигурации
     * @returns {SystemConfig}
     */
    clone() {
        return new SystemConfig(
            [...this.sources],
            { ...this.overrides }
        );
    }

    /**
     * Слияние с другой конфигурацией
     * @param {SystemConfig} other - Другая конфигурация
     * @returns {SystemConfig}
     */
    merge(other) {
        const merged = this.clone();
        merged.overrides = { ...merged.overrides, ...other.overrides };
        merged.sources.push(...other.sources);
        return merged;
    }

    /**
     * Очистка кэша
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Валидация конфигурации
     * @param {Object} schema - Схема валидации
     * @returns {Object} {valid: boolean, errors: Array}
     */
    validate(schema) {
        const errors = [];
        const config = this.getAll();

        for (const [key, rules] of Object.entries(schema)) {
            const value = config[key];
            
            if (rules.required && value === undefined) {
                errors.push(`Required field '${key}' is missing`);
                continue;
            }

            if (value !== undefined) {
                if (rules.type && typeof value !== rules.type) {
                    errors.push(`Field '${key}' must be of type ${rules.type}`);
                }

                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`Field '${key}' must be >= ${rules.min}`);
                }

                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`Field '${key}' must be <= ${rules.max}`);
                }

                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`Field '${key}' must be one of: ${rules.enum.join(', ')}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
