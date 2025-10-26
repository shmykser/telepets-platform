/**
 * Класс LocationConnection - представляет связь между двумя локациями
 * Описывает переход из одной локации в другую
 */

export class LocationConnection {
    constructor(config = {}) {
        // ID локаций
        this.fromLocationId = config.fromLocationId;
        this.toLocationId = config.toLocationId;
        
        // Геометрия перехода
        this.exitPoint = config.exitPoint || { x: 0, y: 0 };    // Где находится выход в FROM локации
        this.entryPoint = config.entryPoint || { x: 0, y: 0 };  // Где появляется игрок в TO локации
        
        // Направление выхода
        this.direction = config.direction || 'north'; // 'north', 'south', 'east', 'west'
        
        // Тип перехода
        this.type = config.type || 'corridor'; // 'corridor', 'door', 'portal'
        
        // Для коридоров - может быть отдельная локация-коридор
        this.corridorLocationId = config.corridorLocationId || null;
        
        // Дополнительные данные
        this.metadata = config.metadata || {
            requiresKey: false,     // Нужен ли ключ для открытия
            locked: false,          // Заблокирован ли переход
            hidden: false           // Скрыт ли переход
        };
    }
    
    /**
     * Проверяет, является ли переход односторонним
     * @returns {boolean}
     */
    isOneWay() {
        return this.metadata.oneWay || false;
    }
    
    /**
     * Проверяет, доступен ли переход
     * @returns {boolean}
     */
    isAccessible() {
        return !this.metadata.locked && !this.metadata.hidden;
    }
    
    /**
     * Блокирует переход
     */
    lock() {
        this.metadata.locked = true;
    }
    
    /**
     * Разблокирует переход
     */
    unlock() {
        this.metadata.locked = false;
    }
    
    /**
     * Скрывает переход
     */
    hide() {
        this.metadata.hidden = true;
    }
    
    /**
     * Показывает переход
     */
    reveal() {
        this.metadata.hidden = false;
    }
    
    /**
     * Получает обратную связь (для двусторонних переходов)
     * @returns {LocationConnection}
     */
    getReverse() {
        return new LocationConnection({
            fromLocationId: this.toLocationId,
            toLocationId: this.fromLocationId,
            exitPoint: this.entryPoint,
            entryPoint: this.exitPoint,
            direction: this.getOppositeDirection(),
            type: this.type,
            corridorLocationId: this.corridorLocationId,
            metadata: { ...this.metadata }
        });
    }
    
    /**
     * Получает противоположное направление
     * @returns {string}
     */
    getOppositeDirection() {
        const opposites = {
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east'
        };
        return opposites[this.direction] || 'north';
    }
    
    /**
     * Вычисляет расстояние перехода
     * @returns {number}
     */
    getDistance() {
        const dx = this.entryPoint.x - this.exitPoint.x;
        const dy = this.entryPoint.y - this.exitPoint.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Сериализация для сохранения
     * @returns {object}
     */
    toJSON() {
        return {
            fromLocationId: this.fromLocationId,
            toLocationId: this.toLocationId,
            exitPoint: this.exitPoint,
            entryPoint: this.entryPoint,
            direction: this.direction,
            type: this.type,
            corridorLocationId: this.corridorLocationId,
            metadata: this.metadata
        };
    }
    
    /**
     * Десериализация из JSON
     * @param {object} json
     * @returns {LocationConnection}
     */
    static fromJSON(json) {
        return new LocationConnection(json);
    }
    
    /**
     * Получает информацию о связи для отладки
     * @returns {string}
     */
    toString() {
        return `Connection[${this.fromLocationId} → ${this.toLocationId}] ` +
               `type=${this.type} direction=${this.direction} ` +
               `accessible=${this.isAccessible()}`;
    }
}


