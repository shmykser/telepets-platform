import { Item } from '../objects/Item.js';
import { ITEM_TYPES, ITEMS, ENEMY_DROP_MODIFIERS } from '../types/itemTypes.js';
import { enemyTypes } from '../types/enemyTypes.js';

/**
 * Система дропа предметов
 */
export class ItemDropSystem {
    constructor(scene, egg, probabilitySystem = null, abilitySystem = null) {
        this.scene = scene;
        this.egg = egg;
        this.probabilitySystem = probabilitySystem;
        this.abilitySystem = abilitySystem;
        this.items = []; // Отслеживание активных предметов
        
        // Подписываемся на события предметов
        this.scene.events.on('item:created', this.onItemCreated.bind(this));
        this.scene.events.on('item:removed', this.onItemRemoved.bind(this));
    }
    
    
    /**
     * Создание случайного предмета для конкретного врага
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {string} enemyType - Тип врага
     * @param {number} gameMinute - Текущая минута игры
     * @returns {Item|null} Созданный предмет или null
     */
    dropRandomItem(x, y, enemyType = 'unknown', gameMinute = 1) {
        const enemyConfig = enemyTypes[enemyType];
        if (!enemyConfig || !enemyConfig.dropList || enemyConfig.dropList.length === 0) {
            console.log(`🎁 [ItemDropSystem] У врага ${enemyType} нет доступных предметов для дропа`);
            return null;
        }
        
        const playerLuck = this.abilitySystem ? this.abilitySystem.getLuck() : 5;
        
        // Проверяем каждый предмет из списка врага
        for (const itemType of enemyConfig.dropList) {
            if (this.checkItemDrop(playerLuck, itemType, enemyType, gameMinute)) {
                console.log(`🎁 [ItemDropSystem] Враг ${enemyType} дропает предмет: ${itemType}`);
                return Item.CreateItem(this.scene, x, y, itemType, this.abilitySystem);
            }
        }
        
        return null; // Ничего не выпало
    }
    
    /**
     * Проверка вероятности дропа конкретного предмета
     * @param {number} playerLuck - Удача игрока (5-30)
     * @param {string} itemType - Тип предмета
     * @param {string} enemyType - Тип врага
     * @param {number} gameMinute - Текущая минута игры
     * @returns {boolean} true если предмет должен выпасть
     */
    checkItemDrop(playerLuck, itemType, enemyType, gameMinute) {
        const itemConfig = ITEMS[itemType];
        if (!itemConfig) {
            console.warn(`[ItemDropSystem] Неизвестный тип предмета: ${itemType}`);
            return false;
        }
        
        const itemDropChance = itemConfig.dropChance;
        const timeModifier = 1 + (gameMinute - 1) * 0.1; // +10% за минуту
        const enemyModifier = ENEMY_DROP_MODIFIERS[enemyType] || 1.0;
        
        const finalChance = (playerLuck / 100) * itemDropChance * timeModifier * enemyModifier;
        
        // Ограничиваем максимальную вероятность до 75%
        const cappedChance = Math.min(finalChance, 0.75);
        
        const roll = Math.random();
        const success = roll < cappedChance;
        
        if (success) {
            console.log(`🎲 [ItemDropSystem] ${itemType}: удача=${playerLuck}, предмет=${(itemDropChance*100).toFixed(1)}%, время=${(timeModifier*100).toFixed(1)}%, враг=${(enemyModifier*100).toFixed(1)}%, итого=${(cappedChance*100).toFixed(1)}%`);
        }
        
        return success;
    }
    
    
    /**
     * Обработка создания предмета (событие)
     */
    onItemCreated(item) {
        this.items.push(item);
    }
    
    /**
     * Обработка удаления предмета (событие)
     */
    onItemRemoved(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }
    
    /**
     * Очистка всех предметов
     */
    clearAllItems() {
        // Эмитим событие - предметы сами себя уничтожат
        this.scene.events.emit('items:clear-all');
        
        // Очищаем массив отслеживания
        this.items = [];
    }
    
    /**
     * Уничтожение системы
     */
    destroy() {
        // Отписываемся от событий
        this.scene.events.off('item:created', this.onItemCreated.bind(this));
        this.scene.events.off('item:removed', this.onItemRemoved.bind(this));
        
        this.clearAllItems();
    }
}
