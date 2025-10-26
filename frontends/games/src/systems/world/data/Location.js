/**
 * Класс Location - представляет одну локацию в мире
 * Локация может быть биомом, коридором, пещерой и т.д.
 */

export class Location {
    constructor(config = {}) {
        // Идентификация
        this.id = config.id || this.generateId();
        this.type = config.type || 'biome'; // 'biome', 'corridor', 'cave', 'house_interior'
        this.biome = config.biome || 'forest'; // Тип биома
        
        // Геометрия
        this.size = config.size || { width: 1000, height: 1000 };
        this.bounds = {
            x: 0,
            y: 0,
            width: this.size.width,
            height: this.size.height
        };
        
        // Позиция в мировом графе (для мини-карты)
        this.position = config.position || { x: 0, y: 0 };
        
        // Связи с другими локациями
        this.connections = config.connections || [];
        
        // Данные локации (генерируются lazy)
        this.generated = config.generated || false;
        this.biomeMap = config.biomeMap || null;
        this.heightMap = config.heightMap || null;
        this.moistureMap = config.moistureMap || null;
        this.temperatureMap = config.temperatureMap || null;
        
        // Объекты в локации
        this.objects = config.objects || {
            playerHouse: null,
            houses: [],
            obstacles: [],
            items: [],
            coins: [],
            lockpicks: []
        };
        
        // Метаданные
        this.metadata = config.metadata || {
            createdAt: Date.now(),
            difficulty: 1
        };
    }
    
    /**
     * Генерирует уникальный ID
     * @returns {string}
     */
    generateId() {
        return `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Добавляет связь с другой локацией
     * @param {LocationConnection} connection
     */
    addConnection(connection) {
        this.connections.push(connection);
    }
    
    /**
     * Получает все связи, ведущие из этой локации
     * @returns {LocationConnection[]}
     */
    getExitConnections() {
        return this.connections.filter(c => c.fromLocationId === this.id);
    }
    
    /**
     * Получает все связи, ведущие в эту локацию
     * @returns {LocationConnection[]}
     */
    getEntryConnections() {
        return this.connections.filter(c => c.toLocationId === this.id);
    }
    
    /**
     * Проверяет, сгенерирована ли локация
     * @returns {boolean}
     */
    isGenerated() {
        return this.generated;
    }
    
    /**
     * Помечает локацию как сгенерированную
     */
    markAsGenerated() {
        this.generated = true;
    }
    
    /**
     * Очищает детали локации (для экономии памяти)
     */
    clearDetails() {
        this.biomeMap = null;
        this.heightMap = null;
        this.moistureMap = null;
        this.temperatureMap = null;
        this.generated = false;
        console.log(`🗑️ [Location] Очищены детали локации: ${this.id}`);
    }
    
    /**
     * Сериализация для сохранения
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            biome: this.biome,
            size: this.size,
            bounds: this.bounds,
            position: this.position,
            connections: this.connections.map(c => c.toJSON ? c.toJSON() : c),
            generated: this.generated,
            // Карты НЕ сохраняем - они регенерируются
            objects: {
                playerHouse: this.objects.playerHouse,
                houses: this.objects.houses,
                obstacles: this.objects.obstacles,
                items: this.objects.items,
                coins: this.objects.coins,
                lockpicks: this.objects.lockpicks
            },
            metadata: this.metadata
        };
    }
    
    /**
     * Десериализация из JSON
     * @param {object} json
     * @returns {Location}
     */
    static fromJSON(json) {
        return new Location(json);
    }
    
    /**
     * Получает центр локации
     * @returns {{x: number, y: number}}
     */
    getCenter() {
        return {
            x: this.size.width / 2,
            y: this.size.height / 2
        };
    }
    
    /**
     * Проверяет, находится ли точка внутри локации
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    containsPoint(x, y) {
        return x >= this.bounds.x && 
               x <= this.bounds.x + this.bounds.width &&
               y >= this.bounds.y && 
               y <= this.bounds.y + this.bounds.height;
    }
    
    /**
     * Получает информацию о локации для отладки
     * @returns {string}
     */
    toString() {
        return `Location[${this.id}] type=${this.type} biome=${this.biome} ` +
               `size=${this.size.width}x${this.size.height} generated=${this.generated}`;
    }
}


