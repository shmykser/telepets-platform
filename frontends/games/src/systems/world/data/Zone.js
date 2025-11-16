/**
 * Класс зоны мира
 * Зона - это область с одним биомом
 */
export class Zone {
    constructor(id, centerX, centerY, biomeType) {
        this.id = id;
        this.center = { x: centerX, y: centerY };
        this.biomeType = biomeType;
        this.bounds = null; // Вычисляется позже {minX, minY, maxX, maxY}
        this.neighbors = []; // ID соседних зон
        this.connections = []; // Пути к соседям
        this.size = 0; // Приблизительный размер зоны
    }
    
    /**
     * Проверяет, находится ли точка в зоне
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    containsPoint(x, y) {
        if (!this.bounds) {
            return false;
        }
        
        return x >= this.bounds.minX && x <= this.bounds.maxX &&
               y >= this.bounds.minY && y <= this.bounds.maxY;
    }
    
    /**
     * Вычисляет границы зоны из карты биомов
     * @param {Array<Array<string>>} biomeMap 
     * @param {number} resolution 
     */
    calculateBounds(biomeMap, resolution = 10) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        let cellCount = 0;
        
        for (let y = 0; y < biomeMap.length; y++) {
            for (let x = 0; x < biomeMap[y].length; x++) {
                if (biomeMap[y][x] === this.biomeType) {
                    const worldX = x * resolution;
                    const worldY = y * resolution;
                    
                    minX = Math.min(minX, worldX);
                    minY = Math.min(minY, worldY);
                    maxX = Math.max(maxX, worldX + resolution);
                    maxY = Math.max(maxY, worldY + resolution);
                    cellCount++;
                }
            }
        }
        
        this.bounds = { minX, minY, maxX, maxY };
        this.size = cellCount * resolution * resolution;
    }
    
    /**
     * Добавляет соседа
     * @param {number} neighborId 
     */
    addNeighbor(neighborId) {
        if (!this.neighbors.includes(neighborId)) {
            this.neighbors.push(neighborId);
        }
    }
    
    /**
     * Добавляет путь к соседней зоне
     * @param {Object} connection - {toZoneId, path: Array<{x, y}>}
     */
    addConnection(connection) {
        this.connections.push(connection);
    }
    
    /**
     * Возвращает расстояние до другой зоны
     * @param {Zone} otherZone 
     * @returns {number}
     */
    distanceTo(otherZone) {
        const dx = this.center.x - otherZone.center.x;
        const dy = this.center.y - otherZone.center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Сериализация для сохранения
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            center: this.center,
            biomeType: this.biomeType,
            bounds: this.bounds,
            neighbors: this.neighbors,
            connections: this.connections,
            size: this.size
        };
    }
    
    /**
     * Десериализация
     * @param {Object} data 
     * @returns {Zone}
     */
    static fromJSON(data) {
        const zone = new Zone(data.id, data.center.x, data.center.y, data.biomeType);
        zone.bounds = data.bounds;
        zone.neighbors = data.neighbors || [];
        zone.connections = data.connections || [];
        zone.size = data.size || 0;
        return zone;
    }
}


