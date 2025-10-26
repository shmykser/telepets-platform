/**
 * LocationStateManager - управляет состоянием локаций
 * Сохраняет и восстанавливает изменения в локациях (открытые сундуки, собранные предметы и т.д.)
 */

import { LocationState } from '../data/LocationState.js';

export class LocationStateManager {
    constructor(worldGraph) {
        this.worldGraph = worldGraph;
        this.states = new Map(); // locationId -> LocationState
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 10000; // 10 секунд
        this.autoSaveTimer = null;
        
        console.log('💾 [LocationStateManager] Инициализирован');
        
        // Загружаем сохранённые состояния
        this.loadFromStorage();
        
        // Запускаем автосохранение
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }
    }
    
    /**
     * Сохраняет текущее состояние локации
     * @param {string} locationId
     */
    saveLocationState(locationId) {
        const location = this.worldGraph.getLocation(locationId);
        if (!location) {
            console.warn(`⚠️ [LocationStateManager] Локация не найдена: ${locationId}`);
            return;
        }
        
        let state = this.states.get(locationId);
        if (!state) {
            state = new LocationState(locationId);
            this.states.set(locationId, state);
        }
        
        // Записываем посещение
        state.recordVisit();
        
        // Сохраняем состояния объектов
        this.saveObjectStates(location, state);
        
        console.log(`💾 [LocationStateManager] Состояние сохранено: ${state.toString()}`);
    }
    
    /**
     * Сохраняет состояния объектов в локации
     * @param {Location} location
     * @param {LocationState} state
     */
    saveObjectStates(location, state) {
        // Сохраняем открытые сундуки
        location.objects.houses?.forEach(house => {
            if (house.chestOpened) {
                state.markChestOpened(house.id);
            }
            if (house.unlocked) {
                state.markHouseUnlocked(house.id);
            }
        });
        
        // Сохраняем собранные предметы
        const allItems = [
            ...(location.objects.items || []),
            ...(location.objects.coins || []),
            ...(location.objects.lockpicks || [])
        ];
        
        allItems.forEach(item => {
            if (item.picked) {
                state.markItemPicked(item.id);
            }
        });
        
        // Сохраняем уничтоженные препятствия
        location.objects.obstacles?.forEach(obstacle => {
            if (obstacle.destroyed) {
                state.markObstacleDestroyed(obstacle.id);
            }
        });
    }
    
    /**
     * Применяет сохранённое состояние к локации
     * @param {Location} location
     */
    applyLocationState(location) {
        const state = this.states.get(location.id);
        if (!state) {
            console.log(`   ℹ️ [LocationStateManager] Нет сохранённого состояния для: ${location.id}`);
            return;
        }
        
        console.log(`💾 [LocationStateManager] Применение состояния: ${state.toString()}`);
        
        // Применяем состояния домов
        location.objects.houses?.forEach(house => {
            if (state.isChestOpened(house.id)) {
                house.chestOpened = true;
            }
            if (state.isHouseUnlocked(house.id)) {
                house.unlocked = true;
                house.lockLevel = 0; // Убираем замок
            }
        });
        
        // Удаляем собранные предметы
        if (location.objects.items) {
            location.objects.items = location.objects.items.filter(
                item => !state.isItemPicked(item.id)
            );
        }
        
        if (location.objects.coins) {
            location.objects.coins = location.objects.coins.filter(
                item => !state.isItemPicked(item.id)
            );
        }
        
        if (location.objects.lockpicks) {
            location.objects.lockpicks = location.objects.lockpicks.filter(
                item => !state.isItemPicked(item.id)
            );
        }
        
        // Удаляем уничтоженные препятствия
        if (location.objects.obstacles) {
            location.objects.obstacles = location.objects.obstacles.filter(
                obstacle => !state.isObstacleDestroyed(obstacle.id)
            );
        }
        
        console.log(`   ✓ Применено изменений: ${state.getChangesCount()}`);
    }
    
    /**
     * Получает состояние локации
     * @param {string} locationId
     * @returns {LocationState|null}
     */
    getLocationState(locationId) {
        return this.states.get(locationId) || null;
    }
    
    /**
     * Отмечает предмет как собранный
     * @param {string} locationId
     * @param {string} itemId
     */
    markItemPicked(locationId, itemId) {
        let state = this.states.get(locationId);
        if (!state) {
            state = new LocationState(locationId);
            this.states.set(locationId, state);
        }
        
        state.markItemPicked(itemId);
        this.saveToStorage();
    }
    
    /**
     * Отмечает сундук как открытый
     * @param {string} locationId
     * @param {string} chestId
     */
    markChestOpened(locationId, chestId) {
        let state = this.states.get(locationId);
        if (!state) {
            state = new LocationState(locationId);
            this.states.set(locationId, state);
        }
        
        state.markChestOpened(chestId);
        this.saveToStorage();
    }
    
    /**
     * Отмечает дом как взломанный
     * @param {string} locationId
     * @param {string} houseId
     */
    markHouseUnlocked(locationId, houseId) {
        let state = this.states.get(locationId);
        if (!state) {
            state = new LocationState(locationId);
            this.states.set(locationId, state);
        }
        
        state.markHouseUnlocked(houseId);
        this.saveToStorage();
    }
    
    /**
     * Сохраняет все состояния в LocalStorage
     */
    saveToStorage() {
        try {
            const data = {
                seed: this.worldGraph.seed,
                timestamp: Date.now(),
                states: Array.from(this.states.entries()).map(([id, state]) => ({
                    id,
                    ...state.toJSON()
                }))
            };
            
            const key = `location_states_${this.worldGraph.seed}`;
            localStorage.setItem(key, JSON.stringify(data));
            
            console.log(`💾 [LocationStateManager] Сохранено в LocalStorage: ${this.states.size} состояний`);
        } catch (error) {
            console.error('❌ [LocationStateManager] Ошибка сохранения в LocalStorage:', error);
        }
    }
    
    /**
     * Загружает состояния из LocalStorage
     */
    loadFromStorage() {
        try {
            const key = `location_states_${this.worldGraph.seed}`;
            const json = localStorage.getItem(key);
            
            if (!json) {
                console.log('   ℹ️ [LocationStateManager] Нет сохранённых состояний');
                return;
            }
            
            const data = JSON.parse(json);
            
            data.states.forEach(stateData => {
                const state = LocationState.fromJSON(stateData);
                this.states.set(state.locationId, state);
            });
            
            console.log(`✅ [LocationStateManager] Загружено ${this.states.size} состояний из LocalStorage`);
            
        } catch (error) {
            console.error('❌ [LocationStateManager] Ошибка загрузки из LocalStorage:', error);
        }
    }
    
    /**
     * Запускает автосохранение
     */
    startAutoSave() {
        if (this.autoSaveTimer) return;
        
        this.autoSaveTimer = setInterval(() => {
            this.saveToStorage();
        }, this.autoSaveInterval);
        
        console.log(`🔄 [LocationStateManager] Автосохранение включено (${this.autoSaveInterval}ms)`);
    }
    
    /**
     * Останавливает автосохранение
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log(`⏸️ [LocationStateManager] Автосохранение остановлено`);
        }
    }
    
    /**
     * Очищает все состояния
     */
    clear() {
        this.states.clear();
        this.saveToStorage();
        console.log('🗑️ [LocationStateManager] Все состояния очищены');
    }
    
    /**
     * Получает статистику
     * @returns {object}
     */
    getStats() {
        const totalChanges = Array.from(this.states.values())
            .reduce((sum, state) => sum + state.getChangesCount(), 0);
        
        const visitedLocations = Array.from(this.states.values())
            .filter(state => state.visitCount > 0).length;
        
        return {
            trackedLocations: this.states.size,
            visitedLocations: visitedLocations,
            totalChanges: totalChanges
        };
    }
    
    /**
     * Уничтожает менеджер
     */
    destroy() {
        this.stopAutoSave();
        this.saveToStorage();
        this.states.clear();
        console.log('🗑️ [LocationStateManager] Уничтожен');
    }
}


