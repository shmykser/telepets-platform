/**
 * Генератор рельефа мира
 * Использует Perlin Noise для создания карт высот, влажности, температуры
 */
import { PerlinNoise } from '../algorithms/PerlinNoise.js';

export class TerrainGenerator {
    constructor(random, config) {
        this.random = random;
        this.config = config;
        this.perlin = new PerlinNoise(random.getSeed());
    }
    
    /**
     * Генерирует все карты рельефа
     * @param {Object} worldSize - {width, height}
     * @returns {Object} {heightMap, moistureMap, temperatureMap}
     */
    generate(worldSize) {
        console.log('🏔️ [TerrainGenerator] ==========================================');
        console.log('🏔️ [TerrainGenerator] Начало генерации рельефа...');
        
        const startTime = performance.now();
        
        // Генерируем карты
        const heightMap = this.generateHeightMap(worldSize);
        const moistureMap = this.generateMoistureMap(worldSize);
        const temperatureMap = this.generateTemperatureMap(worldSize, heightMap);
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log('✅ [TerrainGenerator] Рельеф сгенерирован');
        console.log(`   - Время: ${duration}ms`);
        console.log('🏔️ [TerrainGenerator] ==========================================');
        
        return { heightMap, moistureMap, temperatureMap };
    }
    
    /**
     * Генерирует карту высот
     * @param {Object} worldSize - {width, height}
     * @returns {Array<Array<number>>} карта высот [0, 1]
     */
    generateHeightMap(worldSize) {
        console.log('⛰️  [TerrainGenerator] Генерация карты высот...');
        
        const config = this.config.terrain.heightMap;
        const map = this.perlin.generateMap(
            worldSize.width,
            worldSize.height,
            10, // resolution
            {
                scale: config.scale,
                octaves: config.octaves,
                persistence: config.persistence
            }
        );
        
        // Вычисляем статистику
        const stats = this.calculateStats(map);
        console.log(`   ✓ Высоты: мин=${stats.min.toFixed(2)}, макс=${stats.max.toFixed(2)}, среднее=${stats.avg.toFixed(2)}`);
        
        return map;
    }
    
    /**
     * Генерирует карту влажности
     * @param {Object} worldSize 
     * @returns {Array<Array<number>>} карта влажности [0, 1]
     */
    generateMoistureMap(worldSize) {
        console.log('💧 [TerrainGenerator] Генерация карты влажности...');
        
        const config = this.config.terrain.moisture;
        const map = this.perlin.generateMap(
            worldSize.width,
            worldSize.height,
            10,
            {
                scale: config.scale,
                octaves: config.octaves,
                persistence: config.persistence
            }
        );
        
        const stats = this.calculateStats(map);
        console.log(`   ✓ Влажность: мин=${stats.min.toFixed(2)}, макс=${stats.max.toFixed(2)}, среднее=${stats.avg.toFixed(2)}`);
        
        return map;
    }
    
    /**
     * Генерирует карту температуры
     * Температура зависит от высоты (выше = холоднее) и широты
     * @param {Object} worldSize 
     * @param {Array<Array<number>>} heightMap 
     * @returns {Array<Array<number>>} карта температуры [0, 1]
     */
    generateTemperatureMap(worldSize, heightMap) {
        console.log('🌡️  [TerrainGenerator] Генерация карты температуры...');
        
        const resolution = 10;
        const map = [];
        
        for (let y = 0; y < worldSize.height; y += resolution) {
            const row = [];
            for (let x = 0; x < worldSize.width; x += resolution) {
                // Широта (0 на севере, 1 на юге, теплее в центре)
                const latitude = y / worldSize.height;
                const latitudeTemp = 1 - Math.abs(latitude - 0.5) * 2;
                
                // Высота (выше = холоднее)
                const mapY = Math.floor(y / resolution);
                const mapX = Math.floor(x / resolution);
                const height = (heightMap[mapY] && heightMap[mapY][mapX]) ? heightMap[mapY][mapX] : 0.5;
                
                // Комбинируем широту и высоту
                let temp = latitudeTemp * 0.7 + 0.3; // Базовая температура от широты
                temp -= height * 0.4; // Уменьшаем температуру с высотой
                
                // Добавляем немного шума для вариативности
                const config = this.config.terrain.temperature;
                const noise = this.perlin.getValue(x, y, config.scale, config.octaves, config.persistence);
                temp += noise * 0.1;
                
                // Нормализация в [0, 1]
                temp = Math.max(0, Math.min(1, temp));
                
                row.push(temp);
            }
            map.push(row);
        }
        
        const stats = this.calculateStats(map);
        console.log(`   ✓ Температура: мин=${stats.min.toFixed(2)}, макс=${stats.max.toFixed(2)}, среднее=${stats.avg.toFixed(2)}`);
        
        return map;
    }
    
    /**
     * Вычисляет статистику по карте
     * @param {Array<Array<number>>} map 
     * @returns {Object} {min, max, avg}
     */
    calculateStats(map) {
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        let count = 0;
        
        for (const row of map) {
            for (const value of row) {
                min = Math.min(min, value);
                max = Math.max(max, value);
                sum += value;
                count++;
            }
        }
        
        return {
            min,
            max,
            avg: sum / count
        };
    }
    
    /**
     * Получить высоту в точке (с интерполяцией)
     * @param {number} x 
     * @param {number} y 
     * @param {Array<Array<number>>} heightMap 
     * @param {number} resolution 
     * @returns {number}
     */
    static getHeightAt(x, y, heightMap, resolution = 10) {
        return PerlinNoise.getValueFromMap(heightMap, x, y, resolution);
    }
    
    /**
     * Применяет функцию к карте высот (например, для создания островов)
     * @param {Array<Array<number>>} heightMap 
     * @param {Function} func - (value, x, y) => newValue
     * @returns {Array<Array<number>>}
     */
    applyFunction(heightMap, func) {
        return PerlinNoise.applyFunction(heightMap, func);
    }
    
    /**
     * Создаёт эффект острова (высоты уменьшаются к краям)
     * @param {Array<Array<number>>} heightMap 
     * @param {Object} worldSize 
     * @param {number} falloffStrength - сила спада (0-1)
     * @returns {Array<Array<number>>}
     */
    applyIslandEffect(heightMap, worldSize, falloffStrength = 0.5) {
        console.log('🏝️  [TerrainGenerator] Применение эффекта острова...');
        
        const centerX = worldSize.width / 2;
        const centerY = worldSize.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        
        return this.applyFunction(heightMap, (value, x, y) => {
            // Расстояние от центра
            const dx = (x * 10) - centerX;
            const dy = (y * 10) - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Коэффициент спада (0 в центре, 1 на краях)
            const falloff = Math.pow(distance / maxDistance, 2);
            
            // Применяем спад
            return value * (1 - falloff * falloffStrength);
        });
    }
}


