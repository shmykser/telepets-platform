/**
 * Класс WorldGraph - представляет граф мира из связанных локаций
 * Управляет всеми локациями и связями между ними
 */

import { Location } from './Location.js';
import { LocationConnection } from './LocationConnection.js';

export class WorldGraph {
    constructor(seed, config = {}) {
        this.seed = seed;
        this.config = config;
        
        // Граф локаций
        this.locations = new Map(); // locationId -> Location
        this.connections = [];      // Все связи между локациями
        
        // Навигация
        this.currentLocationId = null;  // ID текущей локации игрока
        this.startLocationId = null;    // ID стартовой локации
        
        // Метаданные
        this.metadata = {
            createdAt: Date.now(),
            version: '2.0',
            totalLocations: 0,
            totalConnections: 0
        };
    }
    
    /**
     * Добавляет локацию в граф
     * @param {Location} location
     */
    addLocation(location) {
        this.locations.set(location.id, location);
        this.metadata.totalLocations = this.locations.size;
        
        console.log(`🗺️ [WorldGraph] Добавлена локация: ${location.id} (${location.type})`);
    }
    
    /**
     * Удаляет локацию из графа
     * @param {string} locationId
     */
    removeLocation(locationId) {
        const location = this.locations.get(locationId);
        if (!location) return;
        
        // Удаляем все связи с этой локацией
        this.connections = this.connections.filter(
            c => c.fromLocationId !== locationId && c.toLocationId !== locationId
        );
        
        this.locations.delete(locationId);
        this.metadata.totalLocations = this.locations.size;
        this.metadata.totalConnections = this.connections.length;
        
        console.log(`🗑️ [WorldGraph] Удалена локация: ${locationId}`);
    }
    
    /**
     * Получает локацию по ID
     * @param {string} locationId
     * @returns {Location|null}
     */
    getLocation(locationId) {
        return this.locations.get(locationId) || null;
    }
    
    /**
     * Получает текущую локацию игрока
     * @returns {Location|null}
     */
    getCurrentLocation() {
        return this.getLocation(this.currentLocationId);
    }
    
    /**
     * Получает стартовую локацию
     * @returns {Location|null}
     */
    getStartLocation() {
        return this.getLocation(this.startLocationId);
    }
    
    /**
     * Добавляет связь между локациями
     * @param {LocationConnection} connection
     */
    addConnection(connection) {
        // Проверяем, существуют ли локации
        const fromLocation = this.getLocation(connection.fromLocationId);
        const toLocation = this.getLocation(connection.toLocationId);
        
        if (!fromLocation || !toLocation) {
            console.error(`❌ [WorldGraph] Невозможно добавить связь: локации не существуют`);
            return;
        }
        
        this.connections.push(connection);
        this.metadata.totalConnections = this.connections.length;
        
        // Добавляем связь в локацию
        fromLocation.addConnection(connection);
        
        console.log(`🔗 [WorldGraph] Добавлена связь: ${connection.fromLocationId} → ${connection.toLocationId}`);
    }
    
    /**
     * Получает все связи для локации
     * @param {string} locationId
     * @returns {LocationConnection[]}
     */
    getConnections(locationId) {
        return this.connections.filter(
            c => c.fromLocationId === locationId || c.toLocationId === locationId
        );
    }
    
    /**
     * Получает исходящие связи из локации
     * @param {string} locationId
     * @returns {LocationConnection[]}
     */
    getExitConnections(locationId) {
        return this.connections.filter(c => c.fromLocationId === locationId);
    }
    
    /**
     * Получает входящие связи в локацию
     * @param {string} locationId
     * @returns {LocationConnection[]}
     */
    getEntryConnections(locationId) {
        return this.connections.filter(c => c.toLocationId === locationId);
    }
    
    /**
     * Получает соседние локации
     * @param {string} locationId
     * @returns {Location[]}
     */
    getAdjacentLocations(locationId) {
        const connections = this.getConnections(locationId);
        const adjacentIds = new Set();
        
        connections.forEach(c => {
            if (c.fromLocationId === locationId) {
                adjacentIds.add(c.toLocationId);
            }
            if (c.toLocationId === locationId) {
                adjacentIds.add(c.fromLocationId);
            }
        });
        
        return Array.from(adjacentIds).map(id => this.getLocation(id)).filter(Boolean);
    }
    
    /**
     * Проверяет, связаны ли две локации
     * @param {string} locationId1
     * @param {string} locationId2
     * @returns {boolean}
     */
    areConnected(locationId1, locationId2) {
        return this.connections.some(
            c => (c.fromLocationId === locationId1 && c.toLocationId === locationId2) ||
                 (c.fromLocationId === locationId2 && c.toLocationId === locationId1)
        );
    }
    
    /**
     * Находит путь между двумя локациями (BFS)
     * @param {string} fromId
     * @param {string} toId
     * @returns {string[]|null} Массив ID локаций или null
     */
    findPath(fromId, toId) {
        if (fromId === toId) return [fromId];
        
        const queue = [[fromId]];
        const visited = new Set([fromId]);
        
        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];
            
            const adjacent = this.getAdjacentLocations(current);
            
            for (const neighbor of adjacent) {
                if (neighbor.id === toId) {
                    return [...path, neighbor.id];
                }
                
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    queue.push([...path, neighbor.id]);
                }
            }
        }
        
        return null; // Путь не найден
    }
    
    /**
     * Получает все биомы в мире
     * @returns {Location[]}
     */
    getBiomes() {
        return Array.from(this.locations.values()).filter(loc => loc.type === 'biome');
    }
    
    /**
     * Получает все коридоры в мире
     * @returns {Location[]}
     */
    getCorridors() {
        return Array.from(this.locations.values()).filter(loc => loc.type === 'corridor');
    }
    
    /**
     * Устанавливает текущую локацию
     * @param {string} locationId
     */
    setCurrentLocation(locationId) {
        if (!this.getLocation(locationId)) {
            console.error(`❌ [WorldGraph] Локация не найдена: ${locationId}`);
            return;
        }
        
        this.currentLocationId = locationId;
        console.log(`📍 [WorldGraph] Текущая локация: ${locationId}`);
    }
    
    /**
     * Устанавливает стартовую локацию
     * @param {string} locationId
     */
    setStartLocation(locationId) {
        if (!this.getLocation(locationId)) {
            console.error(`❌ [WorldGraph] Локация не найдена: ${locationId}`);
            return;
        }
        
        this.startLocationId = locationId;
        console.log(`🏁 [WorldGraph] Стартовая локация: ${locationId}`);
    }
    
    /**
     * Получает статистику графа
     * @returns {object}
     */
    getStats() {
        return {
            locations: this.locations.size,
            biomes: this.getBiomes().length,
            corridors: this.getCorridors().length,
            connections: this.connections.length,
            generated: Array.from(this.locations.values()).filter(l => l.generated).length
        };
    }
    
    /**
     * Очищает граф
     */
    clear() {
        this.locations.clear();
        this.connections = [];
        this.currentLocationId = null;
        this.startLocationId = null;
        this.metadata.totalLocations = 0;
        this.metadata.totalConnections = 0;
        
        console.log(`🗑️ [WorldGraph] Граф очищен`);
    }
    
    /**
     * Сериализация для сохранения
     * @returns {object}
     */
    toJSON() {
        return {
            seed: this.seed,
            config: this.config,
            locations: Array.from(this.locations.values()).map(loc => loc.toJSON()),
            connections: this.connections.map(conn => conn.toJSON()),
            currentLocationId: this.currentLocationId,
            startLocationId: this.startLocationId,
            metadata: this.metadata
        };
    }
    
    /**
     * Десериализация из JSON
     * @param {object} json
     * @returns {WorldGraph}
     */
    static fromJSON(json) {
        const graph = new WorldGraph(json.seed, json.config);
        
        // Восстанавливаем локации
        json.locations.forEach(locData => {
            const location = Location.fromJSON(locData);
            graph.addLocation(location);
        });
        
        // Восстанавливаем связи
        json.connections.forEach(connData => {
            const connection = LocationConnection.fromJSON(connData);
            graph.addConnection(connection);
        });
        
        graph.currentLocationId = json.currentLocationId;
        graph.startLocationId = json.startLocationId;
        graph.metadata = json.metadata || graph.metadata;
        
        console.log(`✅ [WorldGraph] Граф восстановлен из JSON: ${graph.locations.size} локаций`);
        
        return graph;
    }
    
    /**
     * Получает информацию о графе для отладки
     * @returns {string}
     */
    toString() {
        const stats = this.getStats();
        return `WorldGraph[${this.seed}] locations=${stats.locations} ` +
               `(biomes=${stats.biomes}, corridors=${stats.corridors}) ` +
               `connections=${stats.connections} current=${this.currentLocationId}`;
    }
}


