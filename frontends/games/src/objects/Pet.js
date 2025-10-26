/**
 * Класс питомца игрока для Pet Thief
 * Наследуется от GameObject, управляемый персонаж
 */

import { GameObject } from './GameObject.js';
import { PET_CONFIG, WORLD_CONSTANTS } from '../types/worldTypes.js';
import { PropertyUtils } from '../utils/PropertyUtils.js';
import { Inventory } from './Inventory.js';

export class Pet extends GameObject {
    constructor(scene, x, y, config = {}) {
        // Подготовка конфигурации для GameObject
        const petConfig = {
            x,
            y,
            health: config.health || PET_CONFIG.DEFAULT_HEALTH,
            maxHealth: config.maxHealth || PET_CONFIG.DEFAULT_HEALTH,
            texture: config.texture || PET_CONFIG.TEXTURE,
            spriteKey: config.spriteKey || PET_CONFIG.SPRITE_KEY,
            size: config.size || PET_CONFIG.DEFAULT_SIZE,
            speed: config.speed || PET_CONFIG.DEFAULT_SPEED,
            damage: 0, // Питомец не атакует (пока)
            cooldown: 0
        };
        
        super(scene, petConfig);
        
        // Специфичные свойства питомца
        PropertyUtils.defineProperty(this, "_inventory", new Inventory(scene, this));
        PropertyUtils.defineProperty(this, "_skills", { ...PET_CONFIG.DEFAULT_SKILLS });
        PropertyUtils.defineProperty(this, "_isMoving", false);
        PropertyUtils.defineProperty(this, "_targetPosition", null);
        
        // Настройка питомца
        this.setupPet();
        
        console.log('🐾 [Pet] Питомец создан в позиции', { x, y });
    }
    
    /**
     * Настройка визуала и физики питомца
     */
    setupPet() {
        // Увеличиваем размер спрайта
        this.setScale(1.5);
        
        // Устанавливаем глубину отображения
        this.setDepth(WORLD_CONSTANTS.DEPTH.PET);
        
        // Настройка физического тела
        if (this.physicsBody) {
            this.physicsBody.setCollideWorldBounds(false); // Можем выходить за границы (будут границы мира)
            this.physicsBody.setSize(this.width * 0.8, this.height * 0.8);
            this.physicsBody.setOffset(
                (this.width - this.width * 0.8) / 2,
                (this.height - this.height * 0.8) / 2
            );
        }
        
        // Создаем полоску здоровья
        this.createHealthBar({
            width: 40,
            height: 4,
            offsetY: -30,
            showBackground: true,
            backgroundColor: 0x000000,
            borderColor: 0xffffff
        });
    }
    
    // ===== ГЕТТЕРЫ И СЕТТЕРЫ =====
    
    get inventory() {
        return this._inventory;
    }
    
    get skills() {
        return this._skills;
    }
    
    get isMoving() {
        return this._isMoving;
    }
    
    set isMoving(value) {
        this._isMoving = value;
    }
    
    get targetPosition() {
        return this._targetPosition;
    }
    
    set targetPosition(value) {
        this._targetPosition = value;
    }
    
    // ===== МЕТОДЫ ИНВЕНТАРЯ =====
    
    /**
     * Добавляет монеты в инвентарь
     * @param {number} amount 
     */
    addCoins(amount) {
        this.inventory.add('coins', amount);
    }
    
    /**
     * Добавляет драгоценности в инвентарь
     * @param {number} amount 
     */
    addJewels(amount) {
        this.inventory.add('jewels', amount);
    }
    
    /**
     * Добавляет ключи в инвентарь
     * @param {number} amount 
     */
    addKeys(amount) {
        this.inventory.add('keys', amount);
    }
    
    /**
     * Добавляет отмычки в инвентарь
     * @param {number} amount 
     */
    addLockpicks(amount) {
        this.inventory.add('lockpicks', amount);
    }
    
    /**
     * Добавляет сокровище в инвентарь
     * @param {Object} treasure 
     */
    addTreasure(treasure) {
        this.inventory.add('treasures', treasure);
    }
    
    /**
     * Проверяет наличие предмета в инвентаре
     * @param {string} itemType - Тип предмета
     * @param {number} amount - Необходимое количество
     * @returns {boolean}
     */
    hasItem(itemType, amount = 1) {
        return this.inventory.has(itemType, amount);
    }
    
    /**
     * Использует предмет из инвентаря
     * @param {string} itemType 
     * @param {number} amount 
     * @returns {boolean}
     */
    useItem(itemType, amount = 1) {
        return this.inventory.use(itemType, amount);
    }
    
    // ===== МЕТОДЫ ТЕСТИРОВАНИЯ =====
    
    /**
     * Заполнить инвентарь для тестирования
     */
    fillInventoryForTesting() {
        this.inventory.fillForTesting();
    }
    
    /**
     * Установить количество отмычек (для тестирования)
     * @param {number} amount 
     */
    setLockpicks(amount) {
        this.inventory.set('lockpicks', amount);
    }
    
    /**
     * Установить количество монет (для тестирования)
     * @param {number} amount 
     */
    setCoins(amount) {
        this.inventory.set('coins', amount);
    }
    
    /**
     * Установить количество драгоценностей (для тестирования)
     * @param {number} amount 
     */
    setJewels(amount) {
        this.inventory.set('jewels', amount);
    }
    
    /**
     * Установить количество ключей (для тестирования)
     * @param {number} amount 
     */
    setKeys(amount) {
        this.inventory.set('keys', amount);
    }
    
    /**
     * Очистить инвентарь (для тестирования)
     */
    clearInventory() {
        this.inventory.clear();
    }
    
    // ===== МЕТОДЫ НАВЫКОВ =====
    
    /**
     * Улучшает навык
     * @param {string} skillName 
     * @param {number} amount 
     */
    improveSkill(skillName, amount = 1) {
        if (this._skills.hasOwnProperty(skillName)) {
            this._skills[skillName] += amount;
            console.log(`⭐ [Pet] Навык улучшен: ${skillName} = ${this._skills[skillName]}`);
            
            this.scene.events.emit('pet:skillImproved', {
                skill: skillName,
                level: this._skills[skillName]
            });
        }
    }
    
    /**
     * Получает уровень навыка
     * @param {string} skillName 
     * @returns {number}
     */
    getSkillLevel(skillName) {
        return this._skills[skillName] || 0;
    }
    
    // ===== МЕТОДЫ ДВИЖЕНИЯ =====
    
    /**
     * Начинает движение к целевой позиции
     * @param {number} x 
     * @param {number} y 
     */
    moveTo(x, y) {
        this._targetPosition = { x, y };
        this._isMoving = true;
        
        console.log(`🐾 [Pet] Начало движения к`, this._targetPosition);
        
        this.scene.events.emit('pet:moveStart', {
            target: this._targetPosition
        });
    }
    
    /**
     * Останавливает движение
     */
    stopMovement() {
        this._isMoving = false;
        this._targetPosition = null;
        
        if (this.physicsBody) {
            this.physicsBody.setVelocity(0, 0);
        }
        
        console.log('🐾 [Pet] Движение остановлено');
        
        this.scene.events.emit('pet:moveStop');
    }
    
    /**
     * Проверяет, достиг ли питомец целевой позиции
     * @returns {boolean}
     */
    hasReachedTarget() {
        if (!this._targetPosition) return true;
        
        const dx = this._targetPosition.x - this.x;
        const dy = this._targetPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 5; // Порог достижения цели
    }
    
    // ===== ОБНОВЛЕНИЕ =====
    
    /**
     * Обновление питомца (вызывается каждый кадр)
     * @param {number} time 
     * @param {number} delta 
     */
    update(time, delta) {
        super.update(time, delta);
        
        // Здесь можно добавить логику обновления анимаций и т.д.
    }
    
    // ===== ОЧИСТКА =====
    
    /**
     * Уничтожение питомца
     */
    destroy() {
        console.log('🐾 [Pet] Питомец уничтожен');
        super.destroy();
    }
    
    // ===== СТАТИЧЕСКИЙ МЕТОД СОЗДАНИЯ =====
    
    /**
     * Статический метод для создания питомца
     * @param {Phaser.Scene} scene 
     * @param {number} x 
     * @param {number} y 
     * @param {Object} config 
     * @returns {Pet}
     */
    static CreatePet(scene, x, y, config = {}) {
        return new Pet(scene, x, y, config);
    }
}

