/**
 * LocationGraphGenerator - генератор графа мира
 * Создаёт локации и связи между ними БЕЗ детализации содержимого
 * 
 * Использует:
 * - Voronoi-подобное размещение для биомов
 * - Minimum Spanning Tree (MST) для связывания
 * - Случайные циклы для альтернативных путей
 */

import { SeededRandom } from '../utils/SeededRandom.js';
import { WorldGraph } from '../data/WorldGraph.js';
import { Location } from '../data/Location.js';
import { LocationConnection } from '../data/LocationConnection.js';

export class LocationGraphGenerator {
    constructor(seed, config) {
        this.seed = seed;
        this.random = new SeededRandom(seed);
        this.config = config;
        
        console.log('🗺️ [LocationGraphGenerator] Инициализирован');
        console.log(`   Seed: ${seed}`);
    }
    
    /**
     * Генерирует граф мира
     * @returns {WorldGraph}
     */
    generate() {
        console.log('🗺️ ========================================');
        console.log('🗺️ [LocationGraphGenerator] НАЧАЛО ГЕНЕРАЦИИ ГРАФА');
        console.log('🗺️ ========================================');
        
        const startTime = performance.now();
        
        try {
            // 1. Создаём WorldGraph
            const worldGraph = new WorldGraph(this.seed, this.config);
            
            // 2. Генерируем главные биомы
            console.log('\n📍 ШАГ 1/5: Генерация биомов...');
            const biomeLocations = this.generateBiomeLocations();
            biomeLocations.forEach(loc => worldGraph.addLocation(loc));
            
            // 3. Размещаем биомы в пространстве (для мини-карты)
            console.log('\n📍 ШАГ 2/5: Размещение биомов в пространстве...');
            this.placeBiomesInSpace(biomeLocations);
            
            // 4. Строим минимальное связующее дерево
            console.log('\n📍 ШАГ 3/5: Построение MST...');
            const mstEdges = this.buildMinimumSpanningTree(biomeLocations);
            
            // 5. Создаём коридоры и связи
            console.log('\n📍 ШАГ 4/5: Создание коридоров...');
            this.createCorridorsAndConnections(worldGraph, mstEdges);
            
            // 6. Добавляем дополнительные циклы
            console.log('\n📍 ШАГ 5/5: Добавление дополнительных связей...');
            this.addExtraConnections(worldGraph, biomeLocations);
            
            // 7. Устанавливаем стартовую локацию
            worldGraph.setStartLocation(biomeLocations[0].id);
            worldGraph.setCurrentLocation(biomeLocations[0].id);
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log('\n🗺️ ========================================');
            console.log('🗺️ [LocationGraphGenerator] ГЕНЕРАЦИЯ ЗАВЕРШЕНА');
            console.log(`   Время: ${duration}ms`);
            console.log(`   Локаций: ${worldGraph.locations.size}`);
            console.log(`   Связей: ${worldGraph.connections.length}`);
            console.log(`   Стартовая локация: ${worldGraph.startLocationId}`);
            console.log('🗺️ ========================================\n');
            
            return worldGraph;
            
        } catch (error) {
            console.error('❌ [LocationGraphGenerator] Ошибка генерации:', error);
            throw error;
        }
    }
    
    /**
     * Генерирует главные биомы
     * @returns {Location[]}
     */
    generateBiomeLocations() {
        const locationsConfig = this.config.locations;
        const biomeCount = this.random.intBetween(
            locationsConfig.biomes.count.min,
            locationsConfig.biomes.count.max
        );
        
        // Доступные типы биомов
        const availableBiomes = ['forest', 'desert', 'snow', 'plains'];
        
        // Веса биомов (лес чаще)
        const biomeWeights = {
            forest: 3,
            desert: 2,
            snow: 2,
            plains: 2
        };
        
        const biomes = [];
        
        for (let i = 0; i < biomeCount; i++) {
            // Выбираем биом с учётом весов
            const biomeType = this.weightedRandomBiome(availableBiomes, biomeWeights);
            const size = this.getBiomeSize(biomeType);
            
            const location = new Location({
                id: `${biomeType}_${i}`,
                type: 'biome',
                biome: biomeType,
                size: size,
                generated: false,
                metadata: {
                    createdAt: Date.now(),
                    difficulty: 1 + i * 0.5,
                    index: i
                }
            });
            
            biomes.push(location);
            console.log(`   ✓ Биом создан: ${location.id} (${size.width}x${size.height})`);
        }
        
        return biomes;
    }
    
    /**
     * Выбирает биом с учётом весов
     * @param {string[]} biomes
     * @param {object} weights
     * @returns {string}
     */
    weightedRandomBiome(biomes, weights) {
        const totalWeight = biomes.reduce((sum, biome) => sum + weights[biome], 0);
        let random = this.random.next() * totalWeight;
        
        for (const biome of biomes) {
            random -= weights[biome];
            if (random <= 0) {
                return biome;
            }
        }
        
        return biomes[0];
    }
    
    /**
     * Получает размер биома
     * @param {string} biomeType
     * @returns {{width: number, height: number}}
     */
    getBiomeSize(biomeType) {
        const biomeSizes = this.config.locations.biomes.sizes;
        
        if (biomeSizes[biomeType]) {
            // Добавляем небольшую вариативность (±10%)
            const baseSize = biomeSizes[biomeType];
            const variance = 0.1;
            
            return {
                width: Math.round(baseSize.width * (1 + (this.random.next() - 0.5) * variance)),
                height: Math.round(baseSize.height * (1 + (this.random.next() - 0.5) * variance))
            };
        }
        
        // Дефолтный размер
        return { width: 1800, height: 1800 };
    }
    
    /**
     * Размещает биомы в пространстве для мини-карты
     * @param {Location[]} biomes
     */
    placeBiomesInSpace(biomes) {
        const spacing = 300; // Расстояние между локациями на мини-карте
        
        // Используем простую сетку
        const gridSize = Math.ceil(Math.sqrt(biomes.length));
        let x = 0, y = 0;
        
        biomes.forEach((biome, i) => {
            // Добавляем небольшое смещение для естественности
            const offsetX = (this.random.next() - 0.5) * 50;
            const offsetY = (this.random.next() - 0.5) * 50;
            
            biome.position = {
                x: x * spacing + offsetX,
                y: y * spacing + offsetY
            };
            
            console.log(`   ✓ Биом ${biome.id} размещён в (${Math.round(biome.position.x)}, ${Math.round(biome.position.y)})`);
            
            x++;
            if (x >= gridSize) {
                x = 0;
                y++;
            }
        });
    }
    
    /**
     * Строит минимальное связующее дерево (Prim's Algorithm)
     * @param {Location[]} locations
     * @returns {Array<{from: Location, to: Location, dist: number}>}
     */
    buildMinimumSpanningTree(locations) {
        if (locations.length === 0) return [];
        
        const visited = new Set();
        const edges = [];
        
        // Начинаем с первой локации
        visited.add(locations[0]);
        
        while (visited.size < locations.length) {
            let minEdge = null;
            let minDist = Infinity;
            
            // Ищем минимальное ребро, соединяющее посещённую и непосещённую локацию
            for (const from of visited) {
                for (const to of locations) {
                    if (!visited.has(to)) {
                        const dist = this.distance(from.position, to.position);
                        if (dist < minDist) {
                            minDist = dist;
                            minEdge = { from, to, dist };
                        }
                    }
                }
            }
            
            if (minEdge) {
                edges.push(minEdge);
                visited.add(minEdge.to);
                console.log(`   ✓ MST ребро: ${minEdge.from.id} ↔ ${minEdge.to.id} (dist: ${Math.round(minEdge.dist)})`);
            } else {
                break; // Не должно произойти
            }
        }
        
        return edges;
    }
    
    /**
     * Вычисляет расстояние между двумя точками
     * @param {{x: number, y: number}} p1
     * @param {{x: number, y: number}} p2
     * @returns {number}
     */
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Создаёт коридоры и связи между биомами
     * @param {WorldGraph} worldGraph
     * @param {Array} mstEdges
     */
    createCorridorsAndConnections(worldGraph, mstEdges) {
        mstEdges.forEach((edge, i) => {
            const from = edge.from;
            const to = edge.to;
            
            // Создаём локацию-коридор
            const corridor = this.createCorridorLocation(from, to, i);
            worldGraph.addLocation(corridor);
            
            // Создаём связи: from -> corridor -> to
            const fromToCorridor = this.createConnection(from, corridor, 'corridor');
            const corridorToTo = this.createConnection(corridor, to, 'corridor');
            
            worldGraph.addConnection(fromToCorridor);
            worldGraph.addConnection(corridorToTo);
            
            // Обратные связи для двустороннего движения
            const corridorToFrom = fromToCorridor.getReverse();
            const toToCorridor = corridorToTo.getReverse();
            
            worldGraph.addConnection(corridorToFrom);
            worldGraph.addConnection(toToCorridor);
            
            console.log(`   ✓ Коридор создан: ${from.id} ↔ ${corridor.id} ↔ ${to.id}`);
        });
    }
    
    /**
     * Создаёт локацию-коридор между двумя биомами
     * @param {Location} from
     * @param {Location} to
     * @param {number} index
     * @returns {Location}
     */
    createCorridorLocation(from, to, index) {
        const corridorConfig = this.config.locations.corridors;
        
        const size = {
            width: this.random.intBetween(corridorConfig.width.min, corridorConfig.width.max),
            height: this.random.intBetween(corridorConfig.height.min, corridorConfig.height.max)
        };
        
        // Позиция коридора - между двумя биомами
        const position = {
            x: (from.position.x + to.position.x) / 2,
            y: (from.position.y + to.position.y) / 2
        };
        
        return new Location({
            id: `corridor_${from.id}_${to.id}`,
            type: 'corridor',
            biome: 'corridor',
            size: size,
            position: position,
            generated: false,
            metadata: {
                createdAt: Date.now(),
                connectsFrom: from.id,
                connectsTo: to.id,
                index: index
            }
        });
    }
    
    /**
     * Создаёт связь между двумя локациями
     * @param {Location} from
     * @param {Location} to
     * @param {string} type
     * @returns {LocationConnection}
     */
    createConnection(from, to, type) {
        // Вычисляем точки выхода и входа
        const exitPoint = this.calculateExitPoint(from, to);
        const entryPoint = this.calculateEntryPoint(to, from);
        const direction = this.calculateDirection(from.position, to.position);
        
        return new LocationConnection({
            fromLocationId: from.id,
            toLocationId: to.id,
            exitPoint: exitPoint,
            entryPoint: entryPoint,
            direction: direction,
            type: type
        });
    }
    
    /**
     * Вычисляет точку выхода из локации
     * @param {Location} from
     * @param {Location} to
     * @returns {{x: number, y: number}}
     */
    calculateExitPoint(from, to) {
        // Точка выхода находится на границе локации в направлении целевой локации
        const center = from.getCenter();
        const direction = this.calculateDirection(from.position, to.position);
        
        switch (direction) {
            case 'north':
                return { x: center.x, y: 50 };
            case 'south':
                return { x: center.x, y: from.size.height - 50 };
            case 'east':
                return { x: from.size.width - 50, y: center.y };
            case 'west':
                return { x: 50, y: center.y };
            default:
                return center;
        }
    }
    
    /**
     * Вычисляет точку входа в локацию
     * @param {Location} to
     * @param {Location} from
     * @returns {{x: number, y: number}}
     */
    calculateEntryPoint(to, from) {
        // Точка входа находится на противоположной стороне от точки выхода
        const center = to.getCenter();
        const direction = this.calculateDirection(to.position, from.position);
        
        switch (direction) {
            case 'north':
                return { x: center.x, y: 50 };
            case 'south':
                return { x: center.x, y: to.size.height - 50 };
            case 'east':
                return { x: to.size.width - 50, y: center.y };
            case 'west':
                return { x: 50, y: center.y };
            default:
                return center;
        }
    }
    
    /**
     * Вычисляет направление от одной точки к другой
     * @param {{x: number, y: number}} from
     * @param {{x: number, y: number}} to
     * @returns {string}
     */
    calculateDirection(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'east' : 'west';
        } else {
            return dy > 0 ? 'south' : 'north';
        }
    }
    
    /**
     * Добавляет дополнительные связи для создания циклов
     * @param {WorldGraph} worldGraph
     * @param {Location[]} biomeLocations
     */
    addExtraConnections(worldGraph, biomeLocations) {
        // Добавляем 1-2 дополнительных связи для альтернативных путей
        const extraCount = Math.min(2, Math.floor(biomeLocations.length / 2));
        let added = 0;
        
        for (let i = 0; i < extraCount * 10 && added < extraCount; i++) {
            const from = biomeLocations[this.random.intBetween(0, biomeLocations.length - 1)];
            const to = biomeLocations[this.random.intBetween(0, biomeLocations.length - 1)];
            
            if (from === to) continue;
            if (worldGraph.areConnected(from.id, to.id)) continue;
            
            // Создаём прямую дверь (без коридора) для дополнительных связей
            const connection = this.createConnection(from, to, 'door');
            const reverse = connection.getReverse();
            
            worldGraph.addConnection(connection);
            worldGraph.addConnection(reverse);
            
            console.log(`   ✓ Дополнительная связь (дверь): ${from.id} ↔ ${to.id}`);
            added++;
        }
        
        if (added === 0) {
            console.log(`   ℹ️ Дополнительных связей не добавлено`);
        }
    }
}


