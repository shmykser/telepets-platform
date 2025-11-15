/**
 * LocationGenerator - генератор деталей локации
 * Генерирует содержимое локации по требованию (lazy generation)
 * 
 * Использует существующие генераторы:
 * - TerrainGenerator для рельефа
 * - ObjectPlacer для объектов
 */

import { SeededRandom } from '../utils/SeededRandom.js';

export class LocationGenerator {
    constructor(seed, config) {
        this.seed = seed;
        this.random = new SeededRandom(seed);
        this.config = config;
        
        console.log('🎨 [LocationGenerator] Инициализирован');
    }
    
    /**
     * Генерирует детали локации
     * @param {Location} location
     * @returns {Promise<void>}
     */
    async generateLocationDetails(location) {
        if (location.generated) {
            console.log(`   ℹ️ [LocationGenerator] Локация ${location.id} уже сгенерирована, пропускаем`);
            return;
        }
        
        console.log(`🎨 [LocationGenerator] Генерация деталей: ${location.id}`);
        const startTime = performance.now();
        
        try {
            // Динамический импорт генераторов (для lazy loading)
            const { TerrainGenerator } = await import('./TerrainGenerator.js');
            const { ObjectPlacer } = await import('./ObjectPlacer.js');
            
            // Создаём локальный random с seed на основе ID локации
            const locationSeed = `${this.seed}_${location.id}`;
            const locationRandom = new SeededRandom(locationSeed);
            
            // Создаём генераторы
            const terrainGenerator = new TerrainGenerator(locationRandom, this.config);
            const objectPlacer = new ObjectPlacer(locationRandom, this.config);
            
            // 1. Генерируем terrain (высоты, влажность, температура)
            if (location.type === 'biome') {
                console.log(`   🏔️ Генерация рельефа...`);
                const { heightMap, moistureMap, temperatureMap } = 
                    terrainGenerator.generate(location.size);
                
                location.heightMap = heightMap;
                location.moistureMap = moistureMap;
                location.temperatureMap = temperatureMap;
            }
            
            // 2. Генерируем biomeMap
            console.log(`   🗺️ Генерация карты биома...`);
            location.biomeMap = this.createBiomeMap(location);
            
            // 3. Размещаем объекты
            if (location.type === 'biome') {
                console.log(`   🏠 Размещение объектов...`);
                await this.placeObjectsInBiome(location, objectPlacer);
            } else if (location.type === 'corridor') {
                console.log(`   🌲 Размещение препятствий в коридоре...`);
                this.placeCorridorObstacles(location, objectPlacer);
            }
            
            // 4. Помечаем как сгенерированную
            location.markAsGenerated();
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log(`   ✅ Локация ${location.id} сгенерирована за ${duration}ms`);
            
        } catch (error) {
            console.error(`❌ [LocationGenerator] Ошибка генерации локации ${location.id}:`, error);
            throw error;
        }
    }
    
    /**
     * Создаёт карту биома (заполняет одним биомом)
     * @param {Location} location
     * @returns {string[][]}
     */
    createBiomeMap(location) {
        const map = [];
        const biome = location.biome;
        
        for (let y = 0; y < location.size.height; y++) {
            const row = [];
            for (let x = 0; x < location.size.width; x++) {
                row.push(biome);
            }
            map.push(row);
        }
        
        return map;
    }
    
    /**
     * Размещает объекты в биоме
     * @param {Location} location
     * @param {ObjectPlacer} objectPlacer
     */
    async placeObjectsInBiome(location, objectPlacer) {
        // Создаём временный WorldData для ObjectPlacer
        const tempWorldData = {
            size: location.size,
            zones: [{
                biomeType: location.biome,
                bounds: {
                    x: 0,
                    y: 0,
                    width: location.size.width,
                    height: location.size.height
                }
            }],
            biomeMap: location.biomeMap,
            heightMap: location.heightMap,
            objects: location.objects
        };
        
        // Размещаем все объекты
        const { playerHouse, houses, obstacles, items } = objectPlacer.placeAll(tempWorldData);
        
        // Сохраняем в локацию
        location.objects.playerHouse = playerHouse;
        location.objects.houses = houses;
        location.objects.obstacles = obstacles;
        location.objects.items = items;
        
        // Разделяем монеты и отмычки
        location.objects.coins = items.filter(item => item.type === 'coin');
        location.objects.lockpicks = items.filter(item => item.type === 'lockpick');
        
        console.log(`      ✓ Дома: ${houses.length}`);
        console.log(`      ✓ Препятствия: ${obstacles.length}`);
        console.log(`      ✓ Монеты: ${location.objects.coins.length}`);
        console.log(`      ✓ Отмычки: ${location.objects.lockpicks.length}`);
    }
    
    /**
     * Размещает препятствия в коридоре
     * @param {Location} location
     * @param {ObjectPlacer} objectPlacer
     */
    placeCorridorObstacles(location, objectPlacer) {
        // В коридоре размещаем только несколько препятствий
        const obstacleCount = Math.floor(location.size.width * location.size.height / 10000);
        const obstacles = [];
        
        const attempts = obstacleCount * 10;
        for (let i = 0; i < attempts && obstacles.length < obstacleCount; i++) {
            const x = this.random.next() * location.size.width;
            const y = this.random.next() * location.size.height;
            
            // Проверяем, что не блокируем проход
            const distToEntrance = Math.min(x, location.size.width - x);
            const distToExit = Math.min(y, location.size.height - y);
            
            if (distToEntrance > 100 && distToExit > 100) {
                obstacles.push({
                    id: `obstacle_corridor_${location.id}_${i}`,
                    position: { x: x, y: y },
                    type: 'stone',
                    biome: 'corridor'
                });
            }
        }
        
        // Инициализируем все необходимые поля для коридора
        location.objects.obstacles = obstacles;
        location.objects.houses = []; // В коридорах нет домов
        location.objects.coins = []; // В коридорах нет монет
        location.objects.lockpicks = []; // В коридорах нет отмычек
        location.objects.items = []; // В коридорах нет предметов
        location.objects.playerHouse = null; // В коридорах нет дома игрока
        
        console.log(`      ✓ Препятствия в коридоре: ${obstacles.length}`);
    }
    
    /**
     * Очищает детали локации (для экономии памяти)
     * @param {Location} location
     */
    clearLocationDetails(location) {
        location.clearDetails();
    }
}

