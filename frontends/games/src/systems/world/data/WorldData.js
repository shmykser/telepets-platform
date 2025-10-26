/**
 * Класс для хранения всех данных мира
 * Содержит зоны, карты, объекты
 */
export class WorldData {
    constructor(seed, size) {
        this.seed = seed;
        this.size = size; // {width, height}
        this.zones = []; // Массив Zone объектов
        this.biomeMap = null; // 2D массив биомов
        this.heightMap = null; // 2D массив высот [0, 1]
        this.moistureMap = null; // 2D массив влажности [0, 1]
        this.temperatureMap = null; // 2D массив температуры [0, 1]
        
        // Объекты мира
        this.objects = {
            playerHouse: null,
            houses: [],
            obstacles: [],
            items: [],
            decorations: []
        };
        
        // Метаданные
        this.metadata = {
            generatedAt: Date.now(),
            version: '2.0',
            generationTime: 0 // в миллисекундах
        };
    }
    
    /**
     * Добавляет зону
     * @param {Zone} zone 
     */
    addZone(zone) {
        this.zones.push(zone);
    }
    
    /**
     * Находит зону по ID
     * @param {number} id 
     * @returns {Zone|null}
     */
    findZone(id) {
        return this.zones.find(z => z.id === id) || null;
    }
    
    /**
     * Находит зону по типу биома
     * @param {string} biomeType 
     * @returns {Zone|null}
     */
    findZoneByBiome(biomeType) {
        return this.zones.find(z => z.biomeType === biomeType) || null;
    }
    
    /**
     * Получает биом в точке
     * @param {number} x 
     * @param {number} y 
     * @param {number} resolution 
     * @returns {string}
     */
    getBiomeAt(x, y, resolution = 10) {
        if (!this.biomeMap) {
            return 'forest'; // Fallback
        }
        
        const mapX = Math.floor(x / resolution);
        const mapY = Math.floor(y / resolution);
        
        if (mapY >= 0 && mapY < this.biomeMap.length && 
            mapX >= 0 && mapX < this.biomeMap[0].length) {
            return this.biomeMap[mapY][mapX];
        }
        
        return 'forest';
    }
    
    /**
     * Получает высоту в точке
     * @param {number} x 
     * @param {number} y 
     * @param {number} resolution 
     * @returns {number}
     */
    getHeightAt(x, y, resolution = 10) {
        if (!this.heightMap) {
            return 0.5;
        }
        
        const mapX = Math.floor(x / resolution);
        const mapY = Math.floor(y / resolution);
        
        if (mapY >= 0 && mapY < this.heightMap.length && 
            mapX >= 0 && mapX < this.heightMap[0].length) {
            return this.heightMap[mapY][mapX];
        }
        
        return 0.5;
    }
    
    /**
     * Добавляет объект в мир
     * @param {string} type - 'house', 'obstacle', 'item', 'decoration'
     * @param {Object} object 
     */
    addObject(type, object) {
        if (type === 'playerHouse') {
            this.objects.playerHouse = object;
        } else if (this.objects[type]) {
            this.objects[type].push(object);
        }
    }
    
    /**
     * Получает все объекты заданного типа
     * @param {string} type 
     * @returns {Array}
     */
    getObjects(type) {
        return this.objects[type] || [];
    }
    
    /**
     * Сериализация для сохранения в LocalStorage
     * НЕ сохраняем карты (biomeMap, heightMap и т.д.) - они регенерируются из seed
     * @returns {Object}
     */
    toJSON() {
        return {
            seed: this.seed,
            size: this.size,
            zones: this.zones.map(z => z.toJSON()),
            // Карты НЕ сохраняем - слишком большие (22 MB!)
            // При загрузке регенерируем из seed
            // biomeMap: this.biomeMap,
            // heightMap: this.heightMap,
            // moistureMap: this.moistureMap,
            // temperatureMap: this.temperatureMap,
            objects: this.objects,
            metadata: this.metadata
        };
    }
    
    /**
     * Десериализация из LocalStorage
     * @param {Object} data 
     * @returns {WorldData}
     */
    static fromJSON(data) {
        const worldData = new WorldData(data.seed, data.size);
        
        // Восстанавливаем зоны
        if (data.zones) {
            const { Zone } = require('./Zone.js');
            worldData.zones = data.zones.map(z => Zone.fromJSON(z));
        }
        
        // Восстанавливаем карты
        worldData.biomeMap = data.biomeMap;
        worldData.heightMap = data.heightMap;
        worldData.moistureMap = data.moistureMap;
        worldData.temperatureMap = data.temperatureMap;
        
        // Восстанавливаем объекты
        worldData.objects = data.objects;
        
        // Восстанавливаем метаданные
        worldData.metadata = data.metadata || {
            generatedAt: Date.now(),
            version: '2.0',
            generationTime: 0
        };
        
        return worldData;
    }
    
    /**
     * Получает сводку о мире (для дебага)
     * @returns {Object}
     */
    getSummary() {
        return {
            seed: this.seed,
            size: this.size,
            zonesCount: this.zones.length,
            biomes: this.zones.map(z => z.biomeType),
            housesCount: this.objects.houses.length,
            obstaclesCount: this.objects.obstacles.length,
            itemsCount: this.objects.items.length,
            generatedAt: new Date(this.metadata.generatedAt).toLocaleString(),
            generationTime: `${this.metadata.generationTime}ms`
        };
    }
}

