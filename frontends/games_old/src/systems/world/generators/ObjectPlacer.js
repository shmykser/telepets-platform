/**
 * Размещение объектов в мире (дома, препятствия, предметы)
 * Использует Poisson Disk Sampling и кластерное размещение
 */
import { PoissonDisk } from '../algorithms/PoissonDisk.js';
import { BiomeGenerator } from './BiomeGenerator.js';
import { BIOME_VISUALS, OBSTACLE_TYPES } from '../../../types/worldTypes.js';

export class ObjectPlacer {
    constructor(random, config) {
        this.random = random;
        this.config = config;
        this.poisson = new PoissonDisk(random);
    }
    
    /**
     * Размещает все объекты в мире
     * @param {WorldData} worldData 
     * @returns {Object} {playerHouse, houses, obstacles, items}
     */
    placeAll(worldData) {
        console.log('🎯 [ObjectPlacer] ==========================================');
        console.log('🎯 [ObjectPlacer] Начало размещения объектов...');
        
        const startTime = performance.now();
        
        // Размещаем дома (включая дом игрока)
        const houses = this.placeHouses(worldData);
        const playerHouse = houses[0]; // Первый дом - дом игрока
        const otherHouses = houses.slice(1);
        
        // Размещаем препятствия (учитываем дома)
        const obstacles = this.placeObstacles(worldData, houses);
        
        // Размещаем предметы (учитываем дома и препятствия)
        const items = this.placeItems(worldData, [...houses, ...obstacles]);
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log('✅ [ObjectPlacer] Объекты размещены:');
        console.log(`   - Домов: ${otherHouses.length} + 1 (игрока)`);
        console.log(`   - Препятствий: ${obstacles.length}`);
        console.log(`   - Предметов: ${items.length}`);
        console.log(`   - Время: ${duration}ms`);
        console.log('🎯 [ObjectPlacer] ==========================================');
        
        return {
            playerHouse,
            houses: otherHouses,
            obstacles,
            items
        };
    }
    
    /**
     * Размещает дома игроков
     * @param {WorldData} worldData 
     * @returns {Array} массив домов (первый - дом игрока)
     */
    placeHouses(worldData) {
        console.log('🏠 [ObjectPlacer] Размещение домов...');
        
        const config = this.config.objects.houses;
        const count = this.random.nextInt(config.count.min, config.count.max);
        const houses = [];
        
        // Генерируем позиции через Poisson Disk
        const positions = this.poisson.generate(
            worldData.size.width,
            worldData.size.height,
            config.minDistance,
            30
        );
        
        // Фильтруем позиции у краёв
        const validPositions = positions.filter(pos => {
            return pos.x > config.avoidEdges && 
                   pos.x < worldData.size.width - config.avoidEdges &&
                   pos.y > config.avoidEdges &&
                   pos.y < worldData.size.height - config.avoidEdges;
        });
        
        console.log(`   - Кандидатов для домов: ${validPositions.length}`);
        
        // Выбираем нужное количество домов
        const selectedPositions = this.random.shuffle(validPositions).slice(0, count);
        
        // Создаём дома
        for (let i = 0; i < selectedPositions.length; i++) {
            const pos = selectedPositions[i];
            const biome = BiomeGenerator.getBiomeAt(pos.x, pos.y, worldData.biomeMap);
            
            houses.push(this.createHouse(i, pos, biome));
        }
        
        // Добавляем дом игрока в центре (первым в списке)
        const playerHouse = this.createPlayerHouse(worldData);
        houses.unshift(playerHouse);
        
        console.log(`   ✓ Размещено домов: ${houses.length} (включая дом игрока)`);
        
        return houses;
    }
    
    /**
     * Создаёт дом обычного игрока
     * @param {number} index 
     * @param {Object} position - {x, y}
     * @param {string} biome 
     * @returns {Object}
     */
    createHouse(index, position, biome) {
        const chestsCount = 2 + Math.floor(this.random.nextFloat() * 2); // 2-3 сундука
        const chests = this.generateChestsForHouse(chestsCount);
        
        const hasSecurity = this.random.nextBool(0.7); // 70% домов защищены
        const lockType = hasSecurity ? this.random.choice(['pin', 'maze', 'pattern']) : null;
        const securityLevel = hasSecurity ? this.random.nextInt(1, 3) : 0;
        
        console.log(`   - Дом ${index + 1}: ${biome}, ${hasSecurity ? `защита ${lockType} Lv.${securityLevel}` : 'без защиты'}`);
        
        return {
            id: `house_${index}`,
            ownerId: `player_${index}`,
            ownerName: `Игрок ${index + 1}`,
            ownerOnline: false,
            position: position,
            type: 'house',
            texture: '🏠',
            security: {
                lockType,
                level: securityLevel,
                traps: []
            },
            chests,
            isPlayerHouse: false
        };
    }
    
    /**
     * Создаёт дом игрока (в центре мира)
     * @param {WorldData} worldData 
     * @returns {Object}
     */
    createPlayerHouse(worldData) {
        console.log(`   - Дом игрока: центр мира (${worldData.size.width / 2}, ${worldData.size.height / 2})`);
        
        return {
            id: 'player_house',
            ownerId: 'player',
            ownerName: 'Мой дом',
            isPlayerHouse: true,
            position: {
                x: worldData.size.width / 2,
                y: worldData.size.height / 2
            },
            type: 'home',
            texture: '🏡',
            chests: [{
                id: 'player_chest_0',
                coins: 0,
                jewels: 0,
                keys: 0,
                isLocked: false,
                lockLevel: 0,
                isOpened: false,
                isEmpty: false
            }]
        };
    }
    
    /**
     * Генерирует сундуки для дома
     * @param {number} count 
     * @returns {Array}
     */
    generateChestsForHouse(count) {
        const chests = [];
        for (let i = 0; i < count; i++) {
            chests.push({
                id: `chest_${i}`,
                coins: 10 + Math.floor(this.random.nextFloat() * 40), // 10-50
                jewels: Math.floor(this.random.nextFloat() * 5), // 0-4
                keys: this.random.nextBool(0.3) ? 1 : 0, // 30% шанс ключа
                isLocked: this.random.nextBool(0.5), // 50% замок
                lockLevel: this.random.nextInt(1, 3),
                isOpened: false,
                isEmpty: false
            });
        }
        return chests;
    }
    
    /**
     * Размещает препятствия
     * @param {WorldData} worldData 
     * @param {Array} houses - дома для избежания пересечений
     * @returns {Array}
     */
    placeObstacles(worldData, houses) {
        console.log('🌲 [ObjectPlacer] Размещение препятствий...');
        
        const method = this.config.objects.obstacles.method;
        
        if (method === 'poisson') {
            return this.placeObstaclesPoisson(worldData, houses);
        } else if (method === 'clustered') {
            return this.placeObstaclesClustered(worldData, houses);
        } else {
            return this.placeObstaclesRandom(worldData, houses);
        }
    }
    
    /**
     * Размещение препятствий через Poisson Disk (равномерно)
     * @param {WorldData} worldData 
     * @param {Array} houses 
     * @returns {Array}
     */
    placeObstaclesPoisson(worldData, houses) {
        console.log('   - Метод: Poisson Disk Sampling');
        
        const config = this.config.objects.obstacles;
        const obstacles = [];
        
        // Генерируем позиции
        const positions = this.poisson.generate(
            worldData.size.width,
            worldData.size.height,
            config.minDistance
        );
        
        console.log(`   - Кандидатов: ${positions.length}`);
        
        // Фильтруем позиции по биому и размещаем препятствия
        for (const pos of positions) {
            // Проверяем, не слишком ли близко к домам
            if (this.isTooCloseToHouses(pos, houses, 100)) {
                continue;
            }
            
            const biome = BiomeGenerator.getBiomeAt(pos.x, pos.y, worldData.biomeMap);
            const biomeConfig = this.config.biomes[biome];
            
            // Применяем плотность биома
            if (this.random.nextFloat() < biomeConfig.obstacles.density) {
                obstacles.push(this.createObstacle(obstacles.length, pos, biome));
            }
        }
        
        console.log(`   ✓ Размещено препятствий: ${obstacles.length}`);
        
        return obstacles;
    }
    
    /**
     * Размещение препятствий кластерами (естественные группы)
     * @param {WorldData} worldData 
     * @param {Array} houses 
     * @returns {Array}
     */
    placeObstaclesClustered(worldData, houses) {
        console.log('   - Метод: Кластерное размещение');
        
        const config = this.config.objects.obstacles;
        const obstacles = [];
        
        // Генерируем центры кластеров
        const clusterCenters = this.poisson.generate(
            worldData.size.width,
            worldData.size.height,
            config.clusters.spacing
        );
        
        console.log(`   - Кластеров: ${clusterCenters.length}`);
        
        // Для каждого кластера генерируем объекты
        for (const center of clusterCenters) {
            // Проверяем расстояние от домов
            if (this.isTooCloseToHouses(center, houses, 150)) {
                continue;
            }
            
            const biome = BiomeGenerator.getBiomeAt(center.x, center.y, worldData.biomeMap);
            const biomeConfig = this.config.biomes[biome];
            
            // Размер кластера зависит от плотности биома
            const baseSize = this.random.nextInt(
                config.clusters.size.min,
                config.clusters.size.max
            );
            const clusterSize = Math.floor(baseSize * biomeConfig.obstacles.density);
            
            // Генерируем объекты вокруг центра кластера
            for (let i = 0; i < clusterSize; i++) {
                const angle = this.random.nextFloat() * Math.PI * 2;
                const radius = this.random.nextFloat() * 120; // Радиус кластера
                
                const pos = {
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius
                };
                
                // Проверка границ
                if (pos.x < 0 || pos.x >= worldData.size.width ||
                    pos.y < 0 || pos.y >= worldData.size.height) {
                    continue;
                }
                
                // Проверка домов
                if (this.isTooCloseToHouses(pos, houses, 80)) {
                    continue;
                }
                
                obstacles.push(this.createObstacle(obstacles.length, pos, biome));
            }
        }
        
        console.log(`   ✓ Размещено препятствий: ${obstacles.length}`);
        
        return obstacles;
    }
    
    /**
     * Простое случайное размещение препятствий
     * @param {WorldData} worldData 
     * @param {Array} houses 
     * @returns {Array}
     */
    placeObstaclesRandom(worldData, houses) {
        console.log('   - Метод: Случайное размещение');
        
        const obstacles = [];
        
        // Вычисляем общее количество препятствий
        let totalCount = 0;
        for (const zone of worldData.zones) {
            const biomeConfig = this.config.biomes[zone.biomeType];
            const zoneArea = zone.size || 1000000;
            const count = Math.floor(zoneArea / 10000 * biomeConfig.obstacles.density);
            totalCount += count;
        }
        
        console.log(`   - Целевое количество: ${totalCount}`);
        
        let attempts = 0;
        const maxAttempts = totalCount * 3;
        
        while (obstacles.length < totalCount && attempts < maxAttempts) {
            const pos = {
                x: this.random.nextFloat() * worldData.size.width,
                y: this.random.nextFloat() * worldData.size.height
            };
            
            // Проверка домов
            if (this.isTooCloseToHouses(pos, houses, 100)) {
                attempts++;
                continue;
            }
            
            const biome = BiomeGenerator.getBiomeAt(pos.x, pos.y, worldData.biomeMap);
            obstacles.push(this.createObstacle(obstacles.length, pos, biome));
            
            attempts++;
        }
        
        console.log(`   ✓ Размещено препятствий: ${obstacles.length}`);
        
        return obstacles;
    }
    
    /**
     * Создаёт препятствие
     * @param {number} id 
     * @param {Object} position 
     * @param {string} biomeType 
     * @returns {Object}
     */
    createObstacle(id, position, biomeType) {
        // Получаем возможные типы препятствий для биома
        const biomeConfig = this.config.biomes[biomeType];
        const obstacleType = this.random.choice(biomeConfig.obstacles.types);
        
        return {
            id: `obstacle_${id}`,
            type: obstacleType,
            position,
            collision: true
        };
    }
    
    /**
     * Размещает предметы (монеты, отмычки)
     * @param {WorldData} worldData 
     * @param {Array} avoidObjects - объекты для избежания
     * @returns {Array}
     */
    placeItems(worldData, avoidObjects) {
        console.log('💎 [ObjectPlacer] Размещение предметов...');
        
        const config = this.config.objects.items;
        const items = [];
        
        // Монеты
        const coinCount = this.random.nextInt(config.coins.count.min, config.coins.count.max);
        const coinPositions = this.poisson.generate(
            worldData.size.width,
            worldData.size.height,
            config.coins.minDistance
        );
        
        const selectedCoins = this.random.shuffle(coinPositions)
            .filter(pos => !this.isTooCloseToObjects(pos, avoidObjects, 50))
            .slice(0, coinCount);
        
        for (let i = 0; i < selectedCoins.length; i++) {
            items.push({
                id: `coin_${i}`,
                type: 'coin',
                position: selectedCoins[i],
                value: 1
            });
        }
        
        console.log(`   - Монет: ${selectedCoins.length}`);
        
        // Отмычки
        const lockpickCount = this.random.nextInt(
            config.lockpicks.count.min,
            config.lockpicks.count.max
        );
        
        const lockpickPositions = this.poisson.generate(
            worldData.size.width,
            worldData.size.height,
            config.lockpicks.minDistance
        );
        
        const selectedLockpicks = this.random.shuffle(lockpickPositions)
            .filter(pos => !this.isTooCloseToObjects(pos, avoidObjects, 50))
            .slice(0, lockpickCount);
        
        for (let i = 0; i < selectedLockpicks.length; i++) {
            items.push({
                id: `lockpick_${i}`,
                type: 'lockpick',
                position: selectedLockpicks[i],
                collected: false
            });
        }
        
        console.log(`   - Отмычек: ${selectedLockpicks.length}`);
        console.log(`   ✓ Всего предметов: ${items.length}`);
        
        return items;
    }
    
    /**
     * Проверяет, не слишком ли близко позиция к домам
     * @param {Object} pos - {x, y}
     * @param {Array} houses 
     * @param {number} minDistance 
     * @returns {boolean}
     */
    isTooCloseToHouses(pos, houses, minDistance) {
        for (const house of houses) {
            const dx = pos.x - house.position.x;
            const dy = pos.y - house.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Проверяет, не слишком ли близко позиция к объектам
     * @param {Object} pos 
     * @param {Array} objects 
     * @param {number} minDistance 
     * @returns {boolean}
     */
    isTooCloseToObjects(pos, objects, minDistance) {
        for (const obj of objects) {
            const objPos = obj.position;
            const dx = pos.x - objPos.x;
            const dy = pos.y - objPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDistance) {
                return true;
            }
        }
        return false;
    }
}


