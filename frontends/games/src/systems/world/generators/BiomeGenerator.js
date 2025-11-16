/**
 * Генератор биомов для мира
 * Использует диаграммы Вороного для разделения мира на зоны
 * И Perlin Noise для создания естественных границ
 */
import { VoronoiDiagram } from '../algorithms/VoronoiDiagram.js';
import { PerlinNoise } from '../algorithms/PerlinNoise.js';
import { Zone } from '../data/Zone.js';
import { BIOME_TYPES } from '../../../types/worldTypes.js';

export class BiomeGenerator {
    constructor(random, config) {
        this.random = random;
        this.config = config;
        this.voronoi = new VoronoiDiagram(random);
        this.perlin = new PerlinNoise(random.getSeed());
    }
    
    /**
     * Генерирует зоны с биомами
     * @param {Object} worldSize - {width, height}
     * @returns {Object} {zones: Array<Zone>, biomeMap: Array<Array<string>>}
     */
    generate(worldSize) {
        console.log('🗺️ [BiomeGenerator] ==========================================');
        console.log('🗺️ [BiomeGenerator] Начало генерации биомов...');
        
        const startTime = performance.now();
        const zoneConfig = this.config.zones;
        const numZones = this.random.nextInt(zoneConfig.count.min, zoneConfig.count.max);
        
        console.log(`🗺️ [BiomeGenerator] Параметры:`);
        console.log(`   - Зон: ${numZones}`);
        console.log(`   - Минимальный размер зоны: ${zoneConfig.minSize}`);
        console.log(`   - Неровность границ: ${zoneConfig.borderNoise}`);
        
        // 1. Генерация центров зон (Voronoi)
        const points = this.voronoi.generatePoints(
            worldSize.width,
            worldSize.height,
            numZones,
            zoneConfig.minSize
        );
        
        // 2. Создание объектов зон с назначением биомов
        const zones = points.map(point => {
            const biomeType = this.selectBiomeType();
            const zone = new Zone(point.id, point.x, point.y, biomeType);
            console.log(`   ✓ Зона ${zone.id}: ${zone.biomeType} в (${Math.round(zone.center.x)}, ${Math.round(zone.center.y)})`);
            return zone;
        });
        
        // 3. Генерация карты биомов (2D массив)
        const biomeMap = this.generateBiomeMap(worldSize, zones);
        
        // 4. Поиск соседей для каждой зоны
        this.findNeighbors(zones, biomeMap);
        
        // 5. Вычисление границ зон
        zones.forEach(zone => zone.calculateBounds(biomeMap, 10));
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log('✅ [BiomeGenerator] Биомы сгенерированы:');
        console.log(`   - Зон создано: ${zones.length}`);
        console.log(`   - Биомы: ${zones.map(z => z.biomeType).join(', ')}`);
        console.log(`   - Время: ${duration}ms`);
        console.log('🗺️ [BiomeGenerator] ==========================================');
        
        return { zones, biomeMap };
    }
    
    /**
     * Выбирает тип биома с учётом весов (вероятностей)
     * @returns {string} тип биома
     */
    selectBiomeType() {
        const biomes = this.config.biomes;
        const entries = Object.entries(biomes);
        const totalWeight = entries.reduce((sum, [_, config]) => sum + config.weight, 0);
        
        let random = this.random.nextFloat() * totalWeight;
        
        for (const [type, config] of entries) {
            random -= config.weight;
            if (random <= 0) {
                return type;
            }
        }
        
        // Fallback на лес
        return BIOME_TYPES.FOREST;
    }
    
    /**
     * Генерирует 2D карту биомов
     * @param {Object} worldSize - {width, height}
     * @param {Array<Zone>} zones 
     * @returns {Array<Array<string>>} карта типов биомов
     */
    generateBiomeMap(worldSize, zones) {
        console.log('📐 [BiomeGenerator] Генерация карты биомов...');
        
        const resolution = 10; // Шаг сэмплирования
        const mapWidth = Math.ceil(worldSize.width / resolution);
        const mapHeight = Math.ceil(worldSize.height / resolution);
        
        const map = [];
        let cellCount = 0;
        
        for (let y = 0; y < worldSize.height; y += resolution) {
            const row = [];
            for (let x = 0; x < worldSize.width; x += resolution) {
                // Находим ближайшую зону
                const closest = this.findClosestZone(x, y, zones);
                
                // Применяем шум на границы для естественности
                const biomeType = this.applyBorderNoise(x, y, closest, zones);
                
                row.push(biomeType);
                cellCount++;
            }
            map.push(row);
        }
        
        console.log(`   ✓ Карта создана: ${mapWidth}x${mapHeight} (${cellCount} клеток)`);
        
        return map;
    }
    
    /**
     * Находит ближайшую зону к точке
     * @param {number} x 
     * @param {number} y 
     * @param {Array<Zone>} zones 
     * @returns {Zone}
     */
    findClosestZone(x, y, zones) {
        let closest = zones[0];
        let minDist = Infinity;
        
        for (const zone of zones) {
            const dx = x - zone.center.x;
            const dy = y - zone.center.y;
            const dist = dx * dx + dy * dy; // Без sqrt для оптимизации
            
            if (dist < minDist) {
                minDist = dist;
                closest = zone;
            }
        }
        
        return closest;
    }
    
    /**
     * Применяет шум Перлина на границах биомов для естественности
     * @param {number} x 
     * @param {number} y 
     * @param {Zone} closestZone 
     * @param {Array<Zone>} zones 
     * @returns {string} тип биома
     */
    applyBorderNoise(x, y, closestZone, zones) {
        const borderNoise = this.config.zones.borderNoise;
        
        if (borderNoise === 0) {
            return closestZone.biomeType;
        }
        
        // Получаем значение шума в этой точке
        const noiseValue = this.perlin.getValue(x, y, 100, 2, 0.5);
        
        // Если шум достаточно сильный, проверяем второго ближайшего соседа
        if (Math.abs(noiseValue) > (1 - borderNoise * 2)) {
            const secondClosest = this.findSecondClosest(x, y, zones, closestZone);
            if (secondClosest) {
                // Вероятность использования второго биома зависит от силы шума
                const threshold = (Math.abs(noiseValue) - (1 - borderNoise * 2)) / (borderNoise * 2);
                if (this.random.nextFloat() < threshold) {
                    return secondClosest.biomeType;
                }
            }
        }
        
        return closestZone.biomeType;
    }
    
    /**
     * Находит вторую ближайшую зону (для границ)
     * @param {number} x 
     * @param {number} y 
     * @param {Array<Zone>} zones 
     * @param {Zone} exclude - исключить эту зону
     * @returns {Zone|null}
     */
    findSecondClosest(x, y, zones, exclude) {
        let second = null;
        let minDist = Infinity;
        
        for (const zone of zones) {
            if (zone === exclude) continue;
            
            const dx = x - zone.center.x;
            const dy = y - zone.center.y;
            const dist = dx * dx + dy * dy;
            
            if (dist < minDist) {
                minDist = dist;
                second = zone;
            }
        }
        
        return second;
    }
    
    /**
     * Находит соседние зоны для каждой зоны
     * @param {Array<Zone>} zones 
     * @param {Array<Array<string>>} biomeMap 
     */
    findNeighbors(zones, biomeMap) {
        console.log('🔗 [BiomeGenerator] Поиск соседних зон...');
        
        // Создаём Map для быстрого поиска зоны по биому
        const biomeToZone = new Map();
        zones.forEach(zone => {
            if (!biomeToZone.has(zone.biomeType)) {
                biomeToZone.set(zone.biomeType, []);
            }
            biomeToZone.get(zone.biomeType).push(zone);
        });
        
        // Проходим по карте и ищем границы
        for (let y = 0; y < biomeMap.length - 1; y++) {
            for (let x = 0; x < biomeMap[0].length - 1; x++) {
                const current = biomeMap[y][x];
                
                // Проверяем соседей справа и снизу
                const right = biomeMap[y][x + 1];
                const bottom = biomeMap[y + 1][x];
                
                // Если биомы разные, это граница
                if (current !== right) {
                    this.addNeighborRelation(zones, current, right);
                }
                
                if (current !== bottom) {
                    this.addNeighborRelation(zones, current, bottom);
                }
            }
        }
        
        // Логируем соседей
        zones.forEach(zone => {
            if (zone.neighbors.length > 0) {
                const neighborBiomes = zone.neighbors.map(id => {
                    const neighbor = zones.find(z => z.id === id);
                    return neighbor ? neighbor.biomeType : '?';
                });
                console.log(`   - Зона ${zone.id} (${zone.biomeType}): соседи [${neighborBiomes.join(', ')}]`);
            }
        });
    }
    
    /**
     * Добавляет взаимное соседство между зонами с разными биомами
     * @param {Array<Zone>} zones 
     * @param {string} biomeType1 
     * @param {string} biomeType2 
     */
    addNeighborRelation(zones, biomeType1, biomeType2) {
        // Находим зоны этих биомов
        const zone1 = zones.find(z => z.biomeType === biomeType1);
        const zone2 = zones.find(z => z.biomeType === biomeType2);
        
        if (zone1 && zone2 && zone1 !== zone2) {
            zone1.addNeighbor(zone2.id);
            zone2.addNeighbor(zone1.id);
        }
    }
    
    /**
     * Получить биом в точке из карты
     * @param {number} x 
     * @param {number} y 
     * @param {Array<Array<string>>} biomeMap 
     * @param {number} resolution 
     * @returns {string}
     */
    static getBiomeAt(x, y, biomeMap, resolution = 10) {
        const mapX = Math.floor(x / resolution);
        const mapY = Math.floor(y / resolution);
        
        if (mapY >= 0 && mapY < biomeMap.length && 
            mapX >= 0 && mapX < biomeMap[0].length) {
            return biomeMap[mapY][mapX];
        }
        
        return BIOME_TYPES.FOREST; // Fallback
    }
}


