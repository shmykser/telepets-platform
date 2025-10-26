/**
 * Система управления питомцем для Pet Thief
 * Обрабатывает клики по миру и управляет движением питомца
 */

import { ISystem } from './interfaces/ISystem.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

export class PetControlSystem extends ISystem {
    constructor(scene, pet) {
        super(scene);
        
        this.scene = scene; // Явно сохраняем ссылку на сцену
        this.pet = pet;
        this.camera = scene.cameras.main;
        this.isEnabled = true;
        
        // Параметры движения
        this.moveSpeed = pet.getConfigValue ? pet.getConfigValue('speed', 150) : 150;
        this.stopDistance = 5; // Расстояние до цели для остановки
        
        console.log('🎮 [PetControlSystem] Система управления инициализирована');
        
        // Настраиваем обработчики ввода
        this.setupInputHandlers();
    }
    
    /**
     * Настройка обработчиков ввода
     */
    setupInputHandlers() {
        // Обрабатываем клик/тап по миру
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        
        console.log('🎮 [PetControlSystem] Обработчики ввода настроены');
    }
    
    /**
     * Обработчик нажатия указателя
     * @param {Phaser.Input.Pointer} pointer 
     */
    onPointerDown(pointer) {
        if (!this.isEnabled || !this.pet || !this.pet.isAlive) {
            return;
        }
        
        // Конвертируем экранные координаты в мировые
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        
        console.log(`🎮 [PetControlSystem] Клик по миру:`, { worldX, worldY });
        
        // Проверяем, кликнули ли на интерактивный объект
        const clickedObject = this.getObjectAtPosition(worldX, worldY);
        
        if (clickedObject) {
            this.handleObjectClick(clickedObject);
        } else {
            // Просто перемещаемся к точке клика
            this.moveToPosition(worldX, worldY);
        }
    }
    
    /**
     * Получить объект в указанной позиции
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {Phaser.GameObjects.GameObject|null}
     */
    getObjectAtPosition(worldX, worldY) {
        // Получаем все объекты под указателем
        const objects = this.scene.children.list.filter(obj => {
            if (!obj.getData) return false;
            
            // Проверяем интересующие нас типы объектов
            const isCoin = obj.getData('isCoin');
            const isLockpick = obj.getData('isLockpick');
            const isHouse = obj.getData('isHouse');
            const isPlayerHouse = obj.getData('isPlayerHouse');
            
            if (!isCoin && !isLockpick && !isHouse && !isPlayerHouse) return false;
            
            // Проверяем, находится ли объект в радиусе клика
            const distance = GeometryUtils.distance(obj.x, obj.y, worldX, worldY);
            return distance < 30; // Радиус клика
        });
        
        // Возвращаем ближайший объект
        if (objects.length > 0) {
            objects.sort((a, b) => {
                const distA = GeometryUtils.distance(a.x, a.y, worldX, worldY);
                const distB = GeometryUtils.distance(b.x, b.y, worldX, worldY);
                return distA - distB;
            });
            return objects[0];
        }
        
        return null;
    }
    
    /**
     * Обработка клика на объект
     * @param {Phaser.GameObjects.GameObject} object 
     */
    handleObjectClick(object) {
        const isCoin = object.getData('isCoin');
        const isLockpick = object.getData('isLockpick');
        const isHouse = object.getData('isHouse');
        const isPlayerHouse = object.getData('isPlayerHouse');
        
        if (isCoin) {
            // Перемещаемся к монете для сбора
            console.log('💰 [PetControlSystem] Клик на монету');
            this.moveToAndCollect(object);
        } else if (isLockpick) {
            // Перемещаемся к отмычке для сбора
            console.log('🔧 [PetControlSystem] Клик на отмычку');
            this.moveToAndCollect(object);
        } else if (isHouse) {
            // Перемещаемся к дому для взаимодействия
            console.log('🏠 [PetControlSystem] Клик на дом');
            this.moveToAndInteract(object);
        } else if (isPlayerHouse) {
            // Перемещаемся к своему дому
            console.log('🏡 [PetControlSystem] Клик на свой дом');
            this.moveToPosition(object.x, object.y);
        }
    }
    
    /**
     * Перемещение к позиции
     * @param {number} x 
     * @param {number} y 
     */
    moveToPosition(x, y) {
        if (!this.pet || !this.pet.isAlive) return;
        
        // Устанавливаем целевую позицию
        this.pet.moveTo(x, y);
        
        console.log(`🐾 [PetControlSystem] Перемещение к позиции:`, { x, y });
    }
    
    /**
     * Перемещение к объекту для сбора
     * @param {Phaser.GameObjects.GameObject} object 
     */
    moveToAndCollect(object) {
        this.moveToPosition(object.x, object.y);
        
        // Сохраняем ссылку на объект для сбора
        this.targetObject = object;
        this.targetAction = 'collect';
    }
    
    /**
     * Перемещение к объекту для взаимодействия
     * @param {Phaser.GameObjects.GameObject} object 
     */
    moveToAndInteract(object) {
        this.moveToPosition(object.x, object.y);
        
        // Сохраняем ссылку на объект для взаимодействия
        this.targetObject = object;
        this.targetAction = 'interact';
    }
    
    /**
     * Обновление системы (вызывается каждый кадр)
     * @param {number} time 
     * @param {number} delta 
     */
    update(time, delta) {
        if (!this.pet || !this.pet.isAlive || !this.isEnabled) {
            return;
        }
        
        // Если питомец движется
        if (this.pet.isMoving && this.pet.targetPosition) {
            this.updateMovement(time, delta);
        }
    }
    
    /**
     * Обновление движения питомца
     * @param {number} time 
     * @param {number} delta 
     */
    updateMovement(time, delta) {
        const target = this.pet.targetPosition;
        
        // Вычисляем направление к цели
        const dx = target.x - this.pet.x;
        const dy = target.y - this.pet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Проверяем, достигли ли цели
        if (distance < this.stopDistance) {
            this.pet.stopMovement();
            this.onTargetReached();
            return;
        }
        
        // Нормализуем направление
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Устанавливаем скорость
        const velocityX = dirX * this.moveSpeed;
        const velocityY = dirY * this.moveSpeed;
        
        if (this.pet.physicsBody) {
            this.pet.physicsBody.setVelocity(velocityX, velocityY);
        }
        
        // Поворачиваем питомца в сторону движения
        const angle = Math.atan2(dirY, dirX);
        this.pet.setRotation(angle);
    }
    
    /**
     * Обработчик достижения цели
     */
    onTargetReached() {
        console.log('🎯 [PetControlSystem] Цель достигнута');
        
        this.scene.events.emit('pet:targetReached', {
            position: this.pet.targetPosition
        });
        
        // Если есть целевой объект и действие
        if (this.targetObject && this.targetAction) {
            this.executeAction();
        }
        
        // Сбрасываем целевой объект
        this.targetObject = null;
        this.targetAction = null;
    }
    
    /**
     * Выполнить действие с целевым объектом
     */
    executeAction() {
        if (!this.targetObject) return;
        
        if (this.targetAction === 'collect') {
            this.collectObject(this.targetObject);
        } else if (this.targetAction === 'interact') {
            this.interactWithObject(this.targetObject);
        }
    }
    
    /**
     * Собрать объект (монета, предмет)
     * @param {Phaser.GameObjects.GameObject} object 
     */
    collectObject(object) {
        const isCoin = object.getData('isCoin');
        const isLockpick = object.getData('isLockpick');
        const isCollected = object.getData('collected');
        
        if (isCoin && !isCollected) {
            // Собираем монету
            const coinData = object.getData('coinData');
            this.pet.addCoins(coinData.value || 1);
            
            // Помечаем как собранную
            object.setData('collected', true);
            
            // Визуальный эффект сбора
            this.scene.tweens.add({
                targets: object,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => {
                    object.destroy();
                }
            });
            
            console.log('💰 [PetControlSystem] Монета собрана');
        } else if (isLockpick && !isCollected) {
            // Собираем отмычку
            const lockpickData = object.getData('lockpickData');
            this.pet.addLockpicks(1);
            
            // Помечаем как собранную
            object.setData('collected', true);
            lockpickData.collected = true;
            
            // Визуальный эффект сбора
            this.scene.tweens.add({
                targets: object,
                alpha: 0,
                scale: 2,
                angle: 720,
                duration: 300,
                onComplete: () => {
                    object.destroy();
                }
            });
            
            console.log('🔧 [PetControlSystem] Отмычка собрана');
        }
    }
    
    /**
     * Взаимодействовать с объектом (дом, NPC)
     * @param {Phaser.GameObjects.GameObject} object 
     */
    interactWithObject(object) {
        const isHouse = object.getData('isHouse');
        
        if (isHouse) {
            const houseData = object.getData('houseData');
            console.log('🏠 [PetControlSystem] Взаимодействие с домом:', houseData.ownerName);
            
            // Эмитим событие входа в дом
            this.scene.events.emit('pet:enterHouse', {
                house: houseData
            });
            
            // TODO: Здесь будет переход в сцену интерьера дома
        }
    }
    
    /**
     * Включить систему управления
     */
    enable() {
        this.isEnabled = true;
        console.log('🎮 [PetControlSystem] Система включена');
    }
    
    /**
     * Выключить систему управления
     */
    disable() {
        this.isEnabled = false;
        console.log('🎮 [PetControlSystem] Система выключена');
    }
    
    /**
     * Очистка системы
     */
    destroy() {
        // Удаляем обработчики ввода
        if (this.scene && this.scene.input) {
            this.scene.input.off('pointerdown', this.onPointerDown, this);
        }
        
        this.pet = null;
        this.camera = null;
        this.targetObject = null;
        
        console.log('🎮 [PetControlSystem] Система уничтожена');
    }
}

