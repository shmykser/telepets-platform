/**
 * Система инвентаря для питомца
 * Управляет всеми предметами: монеты, драгоценности, ключи, отмычки, сокровища
 */

import { PET_CONFIG } from '../types/worldTypes.js';

export class Inventory {
    constructor(scene, pet) {
        this.scene = scene;
        this.pet = pet;
        
        // Инициализируем инвентарь
        this.items = { ...PET_CONFIG.DEFAULT_INVENTORY };
        
        console.log('🎒 [Inventory] Инвентарь создан:', this.items);
    }
    
    /**
     * Получить количество предмета
     * @param {string} itemType - Тип предмета
     * @returns {number}
     */
    get(itemType) {
        return this.items[itemType] || 0;
    }
    
    /**
     * Добавить предметы
     * @param {string} itemType - Тип предмета
     * @param {number} amount - Количество
     */
    add(itemType, amount) {
        if (typeof this.items[itemType] === 'number') {
            this.items[itemType] += amount;
            console.log(`🎒 [Inventory] Добавлено ${itemType}: +${amount} (всего: ${this.items[itemType]})`);
            
            // Эмитим событие
            this.scene.events.emit(`pet:${itemType}Collected`, {
                amount: amount,
                total: this.items[itemType]
            });
        } else if (itemType === 'treasures' && Array.isArray(this.items[itemType])) {
            this.items[itemType].push(amount);
            console.log(`🎒 [Inventory] Добавлено сокровище: ${amount.name || 'неизвестно'}`);
            
            // Эмитим событие
            this.scene.events.emit('pet:treasureCollected', {
                treasure: amount
            });
        }
    }
    
    /**
     * Использовать предметы
     * @param {string} itemType - Тип предмета
     * @param {number} amount - Количество
     * @returns {boolean} - Успешно ли использованы
     */
    use(itemType, amount) {
        if (this.has(itemType, amount)) {
            this.items[itemType] -= amount;
            console.log(`🎒 [Inventory] Использовано ${itemType}: -${amount} (осталось: ${this.items[itemType]})`);
            
            // Эмитим событие
            this.scene.events.emit(`pet:${itemType}Used`, {
                amount: amount,
                total: this.items[itemType]
            });
            
            return true;
        }
        return false;
    }
    
    /**
     * Проверить наличие предметов
     * @param {string} itemType - Тип предмета
     * @param {number} amount - Количество
     * @returns {boolean}
     */
    has(itemType, amount = 1) {
        return this.items[itemType] >= amount;
    }
    
    /**
     * Установить количество предметов (для тестирования)
     * @param {string} itemType - Тип предмета
     * @param {number} amount - Количество
     */
    set(itemType, amount) {
        if (typeof this.items[itemType] === 'number') {
            const oldAmount = this.items[itemType];
            this.items[itemType] = Math.max(0, amount);
            console.log(`🎒 [Inventory] Установлено ${itemType}: ${oldAmount} → ${this.items[itemType]}`);
            
            // Эмитим событие изменения
            this.scene.events.emit(`pet:${itemType}Changed`, {
                oldAmount: oldAmount,
                newAmount: this.items[itemType],
                difference: this.items[itemType] - oldAmount
            });
        }
    }
    
    /**
     * Добавить отмычки (специальный метод для удобства)
     * @param {number} amount 
     */
    addLockpicks(amount) {
        this.add('lockpicks', amount);
    }
    
    /**
     * Использовать отмычки (специальный метод для удобства)
     * @param {number} amount 
     * @returns {boolean}
     */
    useLockpicks(amount) {
        return this.use('lockpicks', amount);
    }
    
    /**
     * Получить все предметы
     * @returns {Object}
     */
    getAll() {
        return { ...this.items };
    }
    
    /**
     * Очистить инвентарь
     */
    clear() {
        this.items = { ...PET_CONFIG.DEFAULT_INVENTORY };
        console.log('🎒 [Inventory] Инвентарь очищен');
        
        // Эмитим событие очистки
        this.scene.events.emit('pet:inventoryCleared');
    }
    
    /**
     * Заполнить инвентарь для тестирования
     */
    fillForTesting() {
        this.set('coins', 1000);
        this.set('jewels', 50);
        this.set('keys', 10);
        this.set('lockpicks', 20);
        this.items.treasures = [];
        
        console.log('🎒 [Inventory] Инвентарь заполнен для тестирования');
        
        // Эмитим событие
        this.scene.events.emit('pet:inventoryFilledForTesting');
    }
    
    /**
     * Получить информацию об инвентаре
     * @returns {Object}
     */
    getInfo() {
        return {
            coins: this.items.coins,
            jewels: this.items.jewels,
            keys: this.items.keys,
            lockpicks: this.items.lockpicks,
            treasuresCount: this.items.treasures.length,
            totalItems: Object.values(this.items).reduce((sum, val) => {
                return sum + (typeof val === 'number' ? val : val.length);
            }, 0)
        };
    }
}





