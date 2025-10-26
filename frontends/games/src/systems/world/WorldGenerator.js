/**
 * Главный генератор открытого мира для Pet Thief v2.0
 * Использует профессиональные алгоритмы процедурной генерации:
 * - Voronoi Diagrams для зонирования биомов
 * - Perlin Noise для естественного рельефа
 * - Poisson Disk Sampling для равномерного размещения объектов
 * - Cellular Automata для органичных форм (пещеры, озёра)
 */

import { SeededRandom } from './utils/SeededRandom.js';
import { BiomeGenerator } from './generators/BiomeGenerator.js';
import { TerrainGenerator } from './generators/TerrainGenerator.js';
import { ObjectPlacer } from './generators/ObjectPlacer.js';
import { WorldData } from './data/WorldData.js';
import { settings } from '../../../config/settings.js';

export class WorldGenerator {
    constructor(seed = null) {
        // Seed для воспроизводимости
        this.seed = seed || this.generateSeed();
        
        // Инициализация генератора случайных чисел
        this.random = new SeededRandom(this.seed);
        
        // Конфигурация из settings
        this.config = settings.worldGeneration;
        
        // Инициализация под-генераторов
        this.biomeGenerator = new BiomeGenerator(this.random, this.config);
        this.terrainGenerator = new TerrainGenerator(this.random, this.config);
        this.objectPlacer = new ObjectPlacer(this.random, this.config);
        
        console.log('🌍 ============================================================');
        console.log('🌍 [WorldGenerator] Инициализирован');
        console.log(`🌍 [WorldGenerator] Seed: ${this.seed}`);
        console.log(`🌍 [WorldGenerator] Размер мира: ${this.config.worldSize.width}x${this.config.worldSize.height}`);
        console.log('🌍 ============================================================');
    }
    
    /**
     * Генерирует seed на основе текущей даты (для дневного цикла)
     * @returns {string}
     */
    generateSeed() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }
    
    /**
     * Главный метод генерации мира
     * @returns {WorldData} полные данные мира
     */
    generate() {
        console.log('🌍 ============================================================');
        console.log('🌍 [WorldGenerator] НАЧАЛО ГЕНЕРАЦИИ МИРА');
        console.log('🌍 ============================================================');
        
        const startTime = performance.now();
        
        // Создаём структуру данных мира
        const worldData = new WorldData(this.seed, this.config.worldSize);
        
        try {
            // ============================================================
            // ШАГ 1: Генерация биомов (зонирование мира)
            // ============================================================
            console.log('\n📍 ШАГ 1/4: Генерация биомов...');
            const { zones, biomeMap } = this.biomeGenerator.generate(this.config.worldSize);
            
            // Сохраняем зоны и карту биомов
            zones.forEach(zone => worldData.addZone(zone));
            worldData.biomeMap = biomeMap;
            
            // ============================================================
            // ШАГ 2: Генерация рельефа (высоты, влажность, температура)
            // ============================================================
            console.log('\n📍 ШАГ 2/4: Генерация рельефа...');
            const { heightMap, moistureMap, temperatureMap } = this.terrainGenerator.generate(this.config.worldSize);
            
            // Сохраняем карты рельефа
            worldData.heightMap = heightMap;
            worldData.moistureMap = moistureMap;
            worldData.temperatureMap = temperatureMap;
            
            // ============================================================
            // ШАГ 3: Размещение объектов (дома, препятствия, предметы)
            // ============================================================
            console.log('\n📍 ШАГ 3/4: Размещение объектов...');
            const { playerHouse, houses, obstacles, items } = this.objectPlacer.placeAll(worldData);
            
            // Сохраняем объекты
            worldData.objects.playerHouse = playerHouse;
            worldData.objects.houses = houses;
            worldData.objects.obstacles = obstacles;
            worldData.objects.items = items;
            
            // Разделяем монеты и отмычки
            worldData.objects.coins = items.filter(item => item.type === 'coin');
            worldData.objects.lockpicks = items.filter(item => item.type === 'lockpick');
            
            // ============================================================
            // ШАГ 4: Постобработка и финализация
            // ============================================================
            console.log('\n📍 ШАГ 4/4: Постобработка...');
            this.postProcess(worldData);
            
            // ============================================================
            // Финализация
            // ============================================================
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            worldData.metadata.generationTime = duration;
            worldData.metadata.generatedAt = Date.now();
            
            console.log('\n🌍 ============================================================');
            console.log('🌍 [WorldGenerator] ГЕНЕРАЦИЯ ЗАВЕРШЕНА');
            console.log('🌍 ============================================================');
            console.log('📊 Статистика мира:');
            console.log(`   - Seed: ${this.seed}`);
            console.log(`   - Размер: ${this.config.worldSize.width}x${this.config.worldSize.height}`);
            console.log(`   - Зон/Биомов: ${zones.length}`);
            console.log(`   - Домов: ${houses.length + 1} (включая дом игрока)`);
            console.log(`   - Препятствий: ${obstacles.length}`);
            console.log(`   - Монет: ${worldData.objects.coins.length}`);
            console.log(`   - Отмычек: ${worldData.objects.lockpicks.length}`);
            console.log(`   - Время генерации: ${duration}ms`);
            console.log('🌍 ============================================================\n');
            
            // Логируем сводку для дебага
            if (this.config.debug.logGeneration) {
                console.log('📋 Детальная сводка:', worldData.getSummary());
            }
            
            return worldData;
            
        } catch (error) {
            console.error('❌ [WorldGenerator] ОШИБКА при генерации мира:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    /**
     * Постобработка мира (валидация, оптимизация)
     * @param {WorldData} worldData 
     */
    postProcess(worldData) {
        console.log('🔧 [WorldGenerator] Постобработка мира...');
        
        // 1. Валидация данных
        this.validateWorld(worldData);
        
        // 2. Оптимизация (если нужно)
        // Например, удаление дублирующихся объектов, объединение близких препятствий и т.д.
        
        // 3. Дополнительные вычисления
        // Например, вычисление путей между зонами, создание мини-карты и т.д.
        
        console.log('   ✓ Постобработка завершена');
    }
    
    /**
     * Валидация сгенерированного мира
     * @param {WorldData} worldData 
     */
    validateWorld(worldData) {
        const errors = [];
        
        // Проверка основных данных
        if (!worldData.seed) {
            errors.push('Отсутствует seed');
        }
        
        if (!worldData.biomeMap || worldData.biomeMap.length === 0) {
            errors.push('Отсутствует карта биомов');
        }
        
        if (worldData.zones.length === 0) {
            errors.push('Отсутствуют зоны');
        }
        
        if (!worldData.objects.playerHouse) {
            errors.push('Отсутствует дом игрока');
        }
        
        // Проверка домов
        if (worldData.objects.houses.length === 0) {
            console.warn('⚠️  Не создано ни одного дома для других игроков');
        }
        
        // Проверка препятствий
        if (worldData.objects.obstacles.length < 10) {
            console.warn('⚠️  Слишком мало препятствий');
        }
        
        // Если есть критические ошибки
        if (errors.length > 0) {
            console.error('❌ Валидация мира провалена:');
            errors.forEach(err => console.error(`   - ${err}`));
            throw new Error('Мир не прошёл валидацию');
        }
        
        console.log('   ✓ Валидация пройдена');
    }
    
    /**
     * Получить seed текущего генератора
     * @returns {string}
     */
    getSeed() {
        return this.seed;
    }
    
    /**
     * Получить конфигурацию
     * @returns {Object}
     */
    getConfig() {
        return this.config;
    }
}
