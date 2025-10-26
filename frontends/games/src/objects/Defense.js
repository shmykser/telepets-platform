import { GameObject } from './GameObject.js';
import { defenseTypes } from '../types/defenseTypes';
import { PropertyUtils } from '../utils/PropertyUtils.js';
import { PHYSICS_CONSTANTS, COLORS, DEPTH_CONSTANTS, STONE_SETTINGS } from '../settings/GameSettings.js';
import { EVENT_TYPES } from '../types/EventTypes.js';

export class Defense extends GameObject {
    constructor(scene, config) {
        const defenseType = config.defenseType || 'sugar';
        const defenseData = defenseTypes[defenseType];
        
        // Настройки из типа защиты (приоритет у переданных значений)
        const defenseConfig = {
            health: config.health !== undefined ? config.health : defenseData.health,
            maxHealth: config.maxHealth !== undefined ? config.maxHealth : defenseData.maxHealth,
            speed: 0, // Защитные сооружения неподвижны
            x: config.x,
            y: config.y,
            texture: config.texture || defenseData.texture, // fallback эмодзи
            spriteKey: config.spriteKey || defenseData.spriteKey, // ключ для спрайта
            size: config.size || defenseData.size // размер для выбора спрайта
        };
        
        super(scene, defenseConfig);
        
        // Специфичные для защиты свойства
        PropertyUtils.defineProperty(this, "_defenseType", undefined);
        PropertyUtils.defineProperty(this, "_defenseData", undefined);
        
        // Инициализация свойств защиты
        this._defenseType = defenseType;
        this._defenseData = defenseData;

        // Свойства для drag & drop (из defenseData)
        this.isDraggable = defenseData.isDraggable || false;
        this.isBeingDragged = false;
        this.dragOffset = { x: 0, y: 0 };
        this.originalScale = { x: this.scaleX, y: this.scaleY };
        this.originalAlpha = this.alpha;

        // Настраиваем физику для защитных сооружений
        this.physicsBody.setImmovable(true);
        this.physicsBody.setBounce(PHYSICS_CONSTANTS.DEFAULT_BOUNCE);
        this.physicsBody.setDrag(PHYSICS_CONSTANTS.DEFAULT_DRAG, PHYSICS_CONSTANTS.DEFAULT_DRAG);
    }

    // Геттеры
    get defenseType() { return this._defenseType; }
    get defenseData() { return this._defenseData; }

    /**
     * Статический метод для создания защиты с полной настройкой
     */
    static createDefense(scene, defenseType, x, y) {
        const defenseData = defenseTypes[defenseType];
        
        // Создаем защиту с базовыми характеристиками
        const defense = new Defense(scene, {
            x, y, defenseType,
            ...defenseData // Все данные из defenseTypes
        });
        
        // Настраиваем размер
        const defenseSize = PHYSICS_CONSTANTS.BASE_ENEMY_SIZE * defenseData.size;
        defense.setScale(defenseSize / PHYSICS_CONSTANTS.DEFAULT_TEXTURE_SIZE);
        
        // Устанавливаем глубину отрисовки
        defense.setDepth(DEPTH_CONSTANTS.DEFENSE);
        
        // Создаем полосу здоровья (если у защиты есть здоровье)
        if (defenseData.health > 0) {
            const healthBarConfig = {
                showWhenFull: false,
                showWhenEmpty: true,
                colors: {
                    background: COLORS.BLACK,
                    health: COLORS.HEALTH_GREEN,
                    border: COLORS.WHITE
                },
                offsetY: -(defenseSize / 2 + PHYSICS_CONSTANTS.HEALTH_BAR_OFFSET)
            };
            
            // Для ям добавляем цифровое отображение
            if (defenseType === 'pit') {
                healthBarConfig.showDigits = true;
                healthBarConfig.showBar = false; // Только цифры для ям
            }
            
            defense.createHealthBar(healthBarConfig);
        }
        
        return defense;
    }

    // ========== DRAG & DROP МЕТОДЫ ==========
    
    /**
     * Включает возможность перетаскивания
     */
    enableDrag() {
        if (!this.isDraggable) return;
        
        this.setInteractive();
        console.log(`🗿 [Defense] Drag & drop включен для ${this.defenseType}`);
    }
    
    /**
     * Отключает возможность перетаскивания
     */
    disableDrag() {
        this.disableInteractive();
        this.stopDrag();
        console.log(`🗿 [Defense] Drag & drop отключен для ${this.defenseType}`);
    }
    
    /**
     * Начинает перетаскивание
     * @param {Object} pointer - Объект указателя Phaser
     */
    startDrag(pointer) {
        if (!this.isDraggable || this.isBeingDragged) return;
        
        this.isBeingDragged = true;
        this.dragOffset.x = this.x - pointer.x;
        this.dragOffset.y = this.y - pointer.y;
        
        // Визуальная обратная связь
        this.setAlpha(STONE_SETTINGS.DRAG_FEEDBACK.ALPHA);
        this.setScale(
            this.originalScale.x * STONE_SETTINGS.DRAG_FEEDBACK.SCALE_MULTIPLIER,
            this.originalScale.y * STONE_SETTINGS.DRAG_FEEDBACK.SCALE_MULTIPLIER
        );
        
        // Эмитируем событие начала перетаскивания
        this.scene.events.emit(EVENT_TYPES.DRAG_START, {
            object: this,
            pointer: pointer
        });
        
        console.log(`🗿 [Defense] Начато перетаскивание ${this.defenseType}`);
    }
    
    /**
     * Обновляет позицию при перетаскивании
     * @param {Object} pointer - Объект указателя Phaser
     */
    updateDrag(pointer) {
        if (!this.isBeingDragged) return;
        
        this.x = pointer.x + this.dragOffset.x;
        this.y = pointer.y + this.dragOffset.y;
        
        // Обновляем физическое тело
        this.physicsBody.setPosition(this.x, this.y);
    }
    
    /**
     * Завершает перетаскивание
     * @param {Object} pointer - Объект указателя Phaser
     */
    endDrag(pointer) {
        if (!this.isBeingDragged) return;
        
        this.isBeingDragged = false;
        
        // Возвращаем нормальный вид
        this.setAlpha(this.originalAlpha);
        this.setScale(this.originalScale.x, this.originalScale.y);
        
        // Эмитируем событие перемещения камня
        if (this.defenseType === 'stone') {
            this.scene.events.emit(EVENT_TYPES.STONE_MOVED, {
                stone: this,
                newPosition: { x: this.x, y: this.y }
            });
        }
        
        // Эмитируем событие окончания перетаскивания
        this.scene.events.emit(EVENT_TYPES.DRAG_END, {
            object: this,
            pointer: pointer
        });
        
        console.log(`🗿 [Defense] Завершено перетаскивание ${this.defenseType} в (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    }
    
    /**
     * Останавливает перетаскивание (принудительно)
     */
    stopDrag() {
        if (this.isBeingDragged) {
            this.isBeingDragged = false;
            this.setAlpha(this.originalAlpha);
            this.setScale(this.originalScale.x, this.originalScale.y);
        }
    }

}