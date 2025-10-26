/**
 * Утилита для сохранения и загрузки миров в LocalStorage
 */
import { WorldData } from '../data/WorldData.js';
import { Zone } from '../data/Zone.js';

const STORAGE_KEY_PREFIX = 'world_';
const STORAGE_INDEX_KEY = 'world_index';

export class WorldStorage {
    /**
     * Сохраняет мир в LocalStorage
     * @param {WorldData} worldData 
     * @returns {boolean} успех операции
     */
    static save(worldData) {
        try {
            console.log(`💾 [WorldStorage] Сохранение мира с seed: ${worldData.seed}`);
            
            const key = `${STORAGE_KEY_PREFIX}${worldData.seed}`;
            const json = JSON.stringify(worldData.toJSON());
            
            // Проверяем размер данных
            const sizeKb = Math.round(json.length / 1024);
            console.log(`   - Размер данных: ${sizeKb} KB`);
            
            // Сохраняем
            localStorage.setItem(key, json);
            
            // Обновляем индекс миров
            this.addToIndex(worldData.seed, worldData.metadata.generatedAt);
            
            console.log(`   ✓ Мир сохранён: ${key}`);
            
            return true;
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка сохранения:', error);
            
            // Проверка переполнения LocalStorage
            if (error.name === 'QuotaExceededError') {
                console.error('   LocalStorage переполнен! Очищаем старые миры...');
                this.cleanupOldWorlds(3); // Оставляем только 3 новых мира
                
                // Пробуем снова
                try {
                    localStorage.setItem(`${STORAGE_KEY_PREFIX}${worldData.seed}`, JSON.stringify(worldData.toJSON()));
                    return true;
                } catch (retryError) {
                    console.error('   Не удалось сохранить даже после очистки');
                }
            }
            
            return false;
        }
    }
    
    /**
     * Загружает мир из LocalStorage
     * @param {string} seed 
     * @returns {WorldData|null}
     */
    static load(seed) {
        try {
            console.log(`📂 [WorldStorage] Загрузка мира с seed: ${seed}`);
            
            const key = `${STORAGE_KEY_PREFIX}${seed}`;
            const json = localStorage.getItem(key);
            
            if (!json) {
                console.log(`   - Мир не найден в хранилище`);
                return null;
            }
            
            const data = JSON.parse(json);
            
            // Восстанавливаем объект WorldData
            const worldData = new WorldData(data.seed, data.size);
            
            // Восстанавливаем зоны
            worldData.zones = data.zones.map(zoneData => {
                const zone = new Zone(zoneData.id, zoneData.center.x, zoneData.center.y, zoneData.biomeType);
                zone.bounds = zoneData.bounds;
                zone.neighbors = zoneData.neighbors || [];
                zone.connections = zoneData.connections || [];
                zone.size = zoneData.size || 0;
                return zone;
            });
            
            // Восстанавливаем карты
            worldData.biomeMap = data.biomeMap;
            worldData.heightMap = data.heightMap;
            worldData.moistureMap = data.moistureMap;
            worldData.temperatureMap = data.temperatureMap;
            
            // Восстанавливаем объекты
            worldData.objects = data.objects;
            
            // Восстанавливаем метаданные
            worldData.metadata = data.metadata;
            
            console.log(`   ✓ Мир загружен: ${key}`);
            console.log(`   - Зон: ${worldData.zones.length}`);
            console.log(`   - Домов: ${worldData.objects.houses.length}`);
            console.log(`   - Препятствий: ${worldData.objects.obstacles.length}`);
            
            return worldData;
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка загрузки:', error);
            return null;
        }
    }
    
    /**
     * Проверяет, существует ли мир с данным seed
     * @param {string} seed 
     * @returns {boolean}
     */
    static exists(seed) {
        const key = `${STORAGE_KEY_PREFIX}${seed}`;
        return localStorage.getItem(key) !== null;
    }
    
    /**
     * Удаляет мир из хранилища
     * @param {string} seed 
     * @returns {boolean}
     */
    static delete(seed) {
        try {
            const key = `${STORAGE_KEY_PREFIX}${seed}`;
            localStorage.removeItem(key);
            this.removeFromIndex(seed);
            
            console.log(`🗑️  [WorldStorage] Мир удалён: ${seed}`);
            return true;
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка удаления:', error);
            return false;
        }
    }
    
    /**
     * Получает список всех сохранённых миров
     * @returns {Array<{seed, timestamp}>}
     */
    static listAll() {
        try {
            const indexJson = localStorage.getItem(STORAGE_INDEX_KEY);
            if (!indexJson) {
                return [];
            }
            
            const index = JSON.parse(indexJson);
            return index.worlds || [];
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка чтения индекса:', error);
            return [];
        }
    }
    
    /**
     * Добавляет мир в индекс
     * @param {string} seed 
     * @param {number} timestamp 
     */
    static addToIndex(seed, timestamp) {
        try {
            let index = { worlds: [] };
            
            const indexJson = localStorage.getItem(STORAGE_INDEX_KEY);
            if (indexJson) {
                index = JSON.parse(indexJson);
            }
            
            // Удаляем старую запись с этим seed (если есть)
            index.worlds = index.worlds.filter(w => w.seed !== seed);
            
            // Добавляем новую
            index.worlds.push({ seed, timestamp });
            
            // Сортируем по времени (новые первые)
            index.worlds.sort((a, b) => b.timestamp - a.timestamp);
            
            // Сохраняем
            localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка обновления индекса:', error);
        }
    }
    
    /**
     * Удаляет мир из индекса
     * @param {string} seed 
     */
    static removeFromIndex(seed) {
        try {
            const indexJson = localStorage.getItem(STORAGE_INDEX_KEY);
            if (!indexJson) return;
            
            const index = JSON.parse(indexJson);
            index.worlds = index.worlds.filter(w => w.seed !== seed);
            
            localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка обновления индекса:', error);
        }
    }
    
    /**
     * Очищает старые миры, оставляя только N новых
     * @param {number} keepCount - количество миров для сохранения
     */
    static cleanupOldWorlds(keepCount = 5) {
        console.log(`🧹 [WorldStorage] Очистка старых миров (оставляем ${keepCount})...`);
        
        const worlds = this.listAll();
        
        if (worlds.length <= keepCount) {
            console.log(`   - Очистка не требуется (миров: ${worlds.length})`);
            return;
        }
        
        // Удаляем старые миры
        const toDelete = worlds.slice(keepCount);
        let deleted = 0;
        
        for (const world of toDelete) {
            if (this.delete(world.seed)) {
                deleted++;
            }
        }
        
        console.log(`   ✓ Удалено миров: ${deleted}`);
    }
    
    /**
     * Получает информацию о использовании LocalStorage
     * @returns {Object} {used, total, percentage}
     */
    static getStorageInfo() {
        try {
            let usedBytes = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(STORAGE_KEY_PREFIX)) {
                    const value = localStorage.getItem(key);
                    usedBytes += key.length + (value ? value.length : 0);
                }
            }
            
            // Примерный лимит LocalStorage (обычно 5-10 MB)
            const estimatedLimit = 5 * 1024 * 1024; // 5 MB
            
            return {
                used: usedBytes,
                usedKB: Math.round(usedBytes / 1024),
                usedMB: (usedBytes / 1024 / 1024).toFixed(2),
                total: estimatedLimit,
                percentage: Math.round((usedBytes / estimatedLimit) * 100)
            };
        } catch (error) {
            console.error('❌ [WorldStorage] Ошибка получения информации:', error);
            return { used: 0, total: 0, percentage: 0 };
        }
    }
    
    /**
     * Очищает все сохранённые миры
     */
    static clearAll() {
        console.log('🧹 [WorldStorage] Очистка всех миров...');
        
        const worlds = this.listAll();
        
        for (const world of worlds) {
            this.delete(world.seed);
        }
        
        localStorage.removeItem(STORAGE_INDEX_KEY);
        
        console.log(`   ✓ Удалено миров: ${worlds.length}`);
    }
}


