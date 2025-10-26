/**
 * Центральная система управления событиями (Event-Driven Architecture)
 * 
 * Реализует паттерн Observer для декомпозиции игровой логики и визуальных эффектов.
 * Позволяет компонентам взаимодействовать через события вместо прямых вызовов.
 */

export class EventSystem {
    constructor() {
        // Мапы для хранения слушателей событий
        this.listeners = new Map();
        this.onceListeners = new Map();
        
        // Статистика для отладки
        this.stats = {
            totalEvents: 0,
            totalListeners: 0,
            eventsByType: new Map()
        };
    }

    /**
     * Подписка на событие
     * @param {string} event - Тип события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} context - Контекст выполнения (this)
     */
    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push({
            callback,
            context,
            once: false
        });
        
        this.stats.totalListeners++;
        return this;
    }

    /**
     * Подписка на событие с автоматической отпиской после первого вызова
     * @param {string} event - Тип события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} context - Контекст выполнения (this)
     */
    once(event, callback, context = null) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        
        this.onceListeners.get(event).push({
            callback,
            context,
            once: true
        });
        
        this.stats.totalListeners++;
        return this;
    }

    /**
     * Отправка события всем подписчикам
     * @param {string} event - Тип события
     * @param {*} data - Данные события
     */
    emit(event, data = null) {
        this.stats.totalEvents++;
        
        // Обновляем статистику по типам событий
        const eventCount = this.stats.eventsByType.get(event) || 0;
        this.stats.eventsByType.set(event, eventCount + 1);

        // Обрабатываем обычные слушатели
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            for (let i = listeners.length - 1; i >= 0; i--) {
                const listener = listeners[i];
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`Ошибка в обработчике события ${event}:`, error);
                }
            }
        }

        // Обрабатываем одноразовые слушатели
        if (this.onceListeners.has(event)) {
            const onceListeners = this.onceListeners.get(event);
            while (onceListeners.length > 0) {
                const listener = onceListeners.pop();
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`Ошибка в одноразовом обработчике события ${event}:`, error);
                }
            }
            this.stats.totalListeners -= onceListeners.length;
        }
        
        return this;
    }

    /**
     * Отписка от события
     * @param {string} event - Тип события
     * @param {Function} callback - Функция-обработчик для удаления
     * @param {Object} context - Контекст для точного поиска
     */
    off(event, callback = null, context = null) {
        // Удаляем из обычных слушателей
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            if (callback) {
                // Удаляем конкретный обработчик
                for (let i = listeners.length - 1; i >= 0; i--) {
                    const listener = listeners[i];
                    if (listener.callback === callback && 
                        (context === null || listener.context === context)) {
                        listeners.splice(i, 1);
                        this.stats.totalListeners--;
                    }
                }
            } else {
                // Удаляем все обработчики события
                this.stats.totalListeners -= listeners.length;
                listeners.length = 0;
            }
        }

        // Удаляем из одноразовых слушателей
        if (this.onceListeners.has(event)) {
            const onceListeners = this.onceListeners.get(event);
            if (callback) {
                for (let i = onceListeners.length - 1; i >= 0; i--) {
                    const listener = onceListeners[i];
                    if (listener.callback === callback && 
                        (context === null || listener.context === context)) {
                        onceListeners.splice(i, 1);
                        this.stats.totalListeners--;
                    }
                }
            } else {
                this.stats.totalListeners -= onceListeners.length;
                onceListeners.length = 0;
            }
        }
        
        return this;
    }

    /**
     * Полная очистка всех слушателей
     */
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
        this.stats.totalListeners = 0;
        return this;
    }

    /**
     * Получение статистики системы событий
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            ...this.stats,
            activeEvents: this.listeners.size,
            activeOnceEvents: this.onceListeners.size
        };
    }

    /**
     * Проверка наличия слушателей для события
     * @param {string} event - Тип события
     * @returns {boolean}
     */
    hasListeners(event) {
        const hasRegular = this.listeners.has(event) && this.listeners.get(event).length > 0;
        const hasOnce = this.onceListeners.has(event) && this.onceListeners.get(event).length > 0;
        return hasRegular || hasOnce;
    }

    /**
     * Получение количества слушателей для события
     * @param {string} event - Тип события
     * @returns {number}
     */
    getListenerCount(event) {
        const regularCount = this.listeners.has(event) ? this.listeners.get(event).length : 0;
        const onceCount = this.onceListeners.has(event) ? this.onceListeners.get(event).length : 0;
        return regularCount + onceCount;
    }

    /**
     * Создание глобального экземпляра системы событий
     * @returns {EventSystem}
     */
    static create() {
        return new EventSystem();
    }
}
