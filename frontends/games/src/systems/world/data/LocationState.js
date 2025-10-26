/**
 * Класс LocationState - хранит состояние локации
 * Отслеживает изменения объектов (открытые сундуки, собранные предметы и т.д.)
 */

export class LocationState {
    constructor(locationId) {
        this.locationId = locationId;
        
        // Изменённые объекты
        this.openedChests = new Set();      // ID открытых сундуков
        this.pickedItems = new Set();       // ID собранных предметов
        this.unlockedHouses = new Set();    // ID взломанных домов
        this.destroyedObstacles = new Set(); // ID уничтоженных препятствий
        
        // Статистика посещений
        this.visitedAt = null;              // Когда первый раз посетили
        this.lastVisitedAt = null;          // Когда последний раз посетили
        this.visitCount = 0;                // Сколько раз посещали
        
        // Дополнительные данные
        this.customData = {};               // Произвольные данные
    }
    
    /**
     * Отмечает сундук как открытый
     * @param {string} chestId
     */
    markChestOpened(chestId) {
        this.openedChests.add(chestId);
        console.log(`💎 [LocationState] Сундук открыт: ${chestId}`);
    }
    
    /**
     * Проверяет, открыт ли сундук
     * @param {string} chestId
     * @returns {boolean}
     */
    isChestOpened(chestId) {
        return this.openedChests.has(chestId);
    }
    
    /**
     * Отмечает предмет как собранный
     * @param {string} itemId
     */
    markItemPicked(itemId) {
        this.pickedItems.add(itemId);
        console.log(`🎯 [LocationState] Предмет собран: ${itemId}`);
    }
    
    /**
     * Проверяет, собран ли предмет
     * @param {string} itemId
     * @returns {boolean}
     */
    isItemPicked(itemId) {
        return this.pickedItems.has(itemId);
    }
    
    /**
     * Отмечает дом как взломанный
     * @param {string} houseId
     */
    markHouseUnlocked(houseId) {
        this.unlockedHouses.add(houseId);
        console.log(`🏠 [LocationState] Дом взломан: ${houseId}`);
    }
    
    /**
     * Проверяет, взломан ли дом
     * @param {string} houseId
     * @returns {boolean}
     */
    isHouseUnlocked(houseId) {
        return this.unlockedHouses.has(houseId);
    }
    
    /**
     * Отмечает препятствие как уничтоженное
     * @param {string} obstacleId
     */
    markObstacleDestroyed(obstacleId) {
        this.destroyedObstacles.add(obstacleId);
        console.log(`💥 [LocationState] Препятствие уничтожено: ${obstacleId}`);
    }
    
    /**
     * Проверяет, уничтожено ли препятствие
     * @param {string} obstacleId
     * @returns {boolean}
     */
    isObstacleDestroyed(obstacleId) {
        return this.destroyedObstacles.has(obstacleId);
    }
    
    /**
     * Обновляет статистику посещения
     */
    recordVisit() {
        const now = Date.now();
        
        if (!this.visitedAt) {
            this.visitedAt = now;
        }
        
        this.lastVisitedAt = now;
        this.visitCount++;
        
        console.log(`📍 [LocationState] Посещение #${this.visitCount} локации: ${this.locationId}`);
    }
    
    /**
     * Получает количество изменений в локации
     * @returns {number}
     */
    getChangesCount() {
        return this.openedChests.size + 
               this.pickedItems.size + 
               this.unlockedHouses.size + 
               this.destroyedObstacles.size;
    }
    
    /**
     * Проверяет, есть ли изменения в локации
     * @returns {boolean}
     */
    hasChanges() {
        return this.getChangesCount() > 0;
    }
    
    /**
     * Очищает все изменения
     */
    reset() {
        this.openedChests.clear();
        this.pickedItems.clear();
        this.unlockedHouses.clear();
        this.destroyedObstacles.clear();
        this.customData = {};
        console.log(`🔄 [LocationState] Состояние локации сброшено: ${this.locationId}`);
    }
    
    /**
     * Сериализация для сохранения
     * @returns {object}
     */
    toJSON() {
        return {
            locationId: this.locationId,
            openedChests: Array.from(this.openedChests),
            pickedItems: Array.from(this.pickedItems),
            unlockedHouses: Array.from(this.unlockedHouses),
            destroyedObstacles: Array.from(this.destroyedObstacles),
            visitedAt: this.visitedAt,
            lastVisitedAt: this.lastVisitedAt,
            visitCount: this.visitCount,
            customData: this.customData
        };
    }
    
    /**
     * Десериализация из JSON
     * @param {object} json
     * @returns {LocationState}
     */
    static fromJSON(json) {
        const state = new LocationState(json.locationId);
        
        state.openedChests = new Set(json.openedChests || []);
        state.pickedItems = new Set(json.pickedItems || []);
        state.unlockedHouses = new Set(json.unlockedHouses || []);
        state.destroyedObstacles = new Set(json.destroyedObstacles || []);
        state.visitedAt = json.visitedAt;
        state.lastVisitedAt = json.lastVisitedAt;
        state.visitCount = json.visitCount || 0;
        state.customData = json.customData || {};
        
        return state;
    }
    
    /**
     * Получает информацию о состоянии для отладки
     * @returns {string}
     */
    toString() {
        return `LocationState[${this.locationId}] ` +
               `chests=${this.openedChests.size} items=${this.pickedItems.size} ` +
               `houses=${this.unlockedHouses.size} visits=${this.visitCount}`;
    }
}


