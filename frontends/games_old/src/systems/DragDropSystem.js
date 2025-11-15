import { ISystem } from './interfaces/ISystem.js';
import { EVENT_TYPES } from '../types/EventTypes.js';

/** НЕ РЕАЛИЗОВАНО, ОТКЛЮЧЕНО
 * Система drag & drop для перетаскивания объектов
 */
export class DragDropSystem extends ISystem {
    constructor(scene) {
        super(scene);
        this.draggedObject = null;
        this.isEnabled = true;
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxAttempts = 10;
        this.retryTimer = null;
    }
    
    /**
     * Инициализация системы
     */
    initialize() {
        // Временно отключено
        console.log('🎯 [DragDropSystem] Drag & drop временно отключен');
        this.isInitialized = true;
    }
    
    /**
     * Настройка обработчиков ввода
     */
    setupInputHandlers() {
        // Проверяем, что система уже инициализирована
        if (this.isInitialized) {
            return;
        }

        // Проверяем лимит попыток
        if (this.initializationAttempts >= this.maxAttempts) {
            console.error('🎯 [DragDropSystem] Достигнут лимит попыток инициализации');
            return;
        }

        // Проверяем, что input доступен
        if (!this.scene || !this.scene.input) {
            this.initializationAttempts++;
            console.warn(`🎯 [DragDropSystem] Input не доступен, попытка ${this.initializationAttempts}/${this.maxAttempts}`);
            
            // Очищаем предыдущий таймер
            if (this.retryTimer) {
                clearTimeout(this.retryTimer);
            }
            
            // Пытаемся инициализировать позже
            this.retryTimer = setTimeout(() => {
                this.setupInputHandlers();
            }, 500);
            return;
        }
        
        // Очищаем таймер
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }

        // Обработчики для мыши и тача
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
        
        // Обработчики для объектов
        this.scene.input.on('dragstart', this.onDragStart, this);
        this.scene.input.on('drag', this.onDrag, this);
        this.scene.input.on('dragend', this.onDragEnd, this);
        
        // Отмечаем как инициализированную
        this.isInitialized = true;
        console.log('🎯 [DragDropSystem] Система drag & drop инициализирована');
    }
    
    /**
     * Обработчик нажатия указателя
     * @param {Object} pointer - Объект указателя Phaser
     */
    onPointerDown(pointer) {
        if (!this.isEnabled) return;
        
        // Получаем объект под указателем
        const hitObjects = this.scene.input.hitTestPointer(pointer);
        
        for (const obj of hitObjects) {
            // Проверяем, можно ли перетаскивать объект
            if (obj.isDraggable && obj.enableDrag) {
                this.draggedObject = obj;
                obj.startDrag(pointer);
                break;
            }
        }
    }
    
    /**
     * Обработчик движения указателя
     * @param {Object} pointer - Объект указателя Phaser
     */
    onPointerMove(pointer) {
        if (!this.isEnabled || !this.draggedObject) return;
        
        // Обновляем позицию перетаскиваемого объекта
        this.draggedObject.updateDrag(pointer);
    }
    
    /**
     * Обработчик отпускания указателя
     * @param {Object} pointer - Объект указателя Phaser
     */
    onPointerUp(pointer) {
        if (!this.isEnabled || !this.draggedObject) return;
        
        // Завершаем перетаскивание
        this.draggedObject.endDrag(pointer);
        this.draggedObject = null;
    }
    
    /**
     * Обработчик начала перетаскивания (Phaser)
     * @param {Object} pointer - Объект указателя
     * @param {Object} gameObject - Перетаскиваемый объект
     */
    onDragStart(pointer, gameObject) {
        if (!this.isEnabled) return;
        
        console.log(`🎯 [DragDropSystem] Начато перетаскивание ${gameObject.defenseType || 'object'}`);
        
        // Эмитируем событие начала перетаскивания
        this.scene.events.emit(EVENT_TYPES.DRAG_START, {
            object: gameObject,
            pointer: pointer
        });
    }
    
    /**
     * Обработчик перетаскивания (Phaser)
     * @param {Object} pointer - Объект указателя
     * @param {Object} gameObject - Перетаскиваемый объект
     * @param {number} dragX - X координата перетаскивания
     * @param {number} dragY - Y координата перетаскивания
     */
    onDrag(pointer, gameObject, dragX, dragY) {
        if (!this.isEnabled) return;
        
        // Проверяем границы экрана
        const { width, height } = this.scene.scale;
        const margin = 50;
        
        // Ограничиваем позицию границами экрана
        const clampedX = Math.max(margin, Math.min(width - margin, dragX));
        const clampedY = Math.max(margin, Math.min(height - margin, dragY));
        
        // Обновляем позицию объекта
        gameObject.x = clampedX;
        gameObject.y = clampedY;
        
        // Обновляем физическое тело
        if (gameObject.physicsBody) {
            gameObject.physicsBody.setPosition(clampedX, clampedY);
        }
    }
    
    /**
     * Обработчик окончания перетаскивания (Phaser)
     * @param {Object} pointer - Объект указателя
     * @param {Object} gameObject - Перетаскиваемый объект
     */
    onDragEnd(pointer, gameObject) {
        if (!this.isEnabled) return;
        
        console.log(`🎯 [DragDropSystem] Завершено перетаскивание ${gameObject.defenseType || 'object'}`);
        
        // Эмитируем событие окончания перетаскивания
        this.scene.events.emit(EVENT_TYPES.DRAG_END, {
            object: gameObject,
            pointer: pointer
        });
        
        // Если это камень, эмитируем специальное событие
        if (gameObject.defenseType === 'stone') {
            this.scene.events.emit(EVENT_TYPES.STONE_MOVED, {
                stone: gameObject,
                newPosition: { x: gameObject.x, y: gameObject.y }
            });
        }
    }
    
    /**
     * Включает систему drag & drop
     */
    enable() {
        this.isEnabled = true;
        console.log('🎯 [DragDropSystem] Drag & drop включен');
    }
    
    /**
     * Отключает систему drag & drop
     */
    disable() {
        this.isEnabled = false;
        
        // Останавливаем текущее перетаскивание
        if (this.draggedObject) {
            this.draggedObject.stopDrag();
            this.draggedObject = null;
        }
        
        console.log('🎯 [DragDropSystem] Drag & drop отключен');
    }
    
    /**
     * Обновление системы
     */
    update() {
        // Проверяем, что перетаскиваемый объект еще существует
        if (this.draggedObject && !this.draggedObject.isAlive) {
            this.draggedObject = null;
        }
    }
    
    /**
     * Очистка системы
     */
    destroy() {
        // Очищаем таймер
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }

        // Удаляем обработчики событий только если input доступен
        if (this.scene.input) {
            this.scene.input.off('pointerdown', this.onPointerDown, this);
            this.scene.input.off('pointermove', this.onPointerMove, this);
            this.scene.input.off('pointerup', this.onPointerUp, this);
            this.scene.input.off('dragstart', this.onDragStart, this);
            this.scene.input.off('drag', this.onDrag, this);
            this.scene.input.off('dragend', this.onDragEnd, this);
        }
        
        this.isInitialized = false;
        console.log('🎯 [DragDropSystem] Система drag & drop уничтожена');
    }
}

