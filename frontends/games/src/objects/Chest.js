/**
 * Сундук с ценностями
 * Размещается в интерьерах домов
 */

import { Lock } from './Lock.js';
import { LOCK_TYPES, getRandomLockType, getRandomLockLevel } from '../types/lockTypes.js';

export class Chest extends Phaser.GameObjects.Text {
    constructor(scene, x, y, config = {}) {
        // Создаем текстовый объект с эмодзи
        super(scene, x, y, '🎁', {
            fontSize: '64px',
            fontFamily: 'Arial'
        });
        
        // Добавляем на сцену
        scene.add.existing(this);
        
        // Устанавливаем origin в центр
        this.setOrigin(0.5);
        
        // Добавляем тень для лучшей видимости
        this.setShadow(2, 2, '#000000', 4, true, true);
        
        // Содержимое сундука
        this.contents = {
            coins: config.coins || 0,
            jewels: config.jewels || 0,
            keys: config.keys || 0
        };
        
        // Статус
        this.isOpened = false;
        this.isLocked = config.isLocked || false;
        this.lockLevel = config.lockLevel || 0; // 0 = нет замка, 1-3 = уровень замка
        
        // ID владельца (для отслеживания чей дом)
        this.ownerId = config.ownerId || null;
        
        // Создаем замок если нужно
        if (this.isLocked && !this.lock) {
            this.createLock(config);
            this.setupLockEvents();
        }
        
        // Сохраняем ссылку на сцену
        this.scene = scene;
        
        // Визуал
        this.setupVisuals();
        
        // Интерактивность
        this.setInteractive();
        this.setupInteraction();
        
        console.log(`💰 [Chest] Сундук создан в (${x}, ${y}), содержимое:`, this.contents);
    }
    
    /**
     * Создание замка для сундука
     * @param {Object} config - Конфигурация замка
     */
    createLock(config) {
        const lockType = config.lockType || getRandomLockType();
        const lockLevel = config.lockLevel || getRandomLockLevel();
        
        console.log(`🔒 [Chest] Создание замка: ${lockType} уровень ${lockLevel}`);
        
        this.lock = new Lock(this.scene, this.x, this.y, {
            type: lockType,
            level: lockLevel,
            ownerId: this.ownerId,
            owner: this  // Передаем ссылку на сундук как владельца замка
        });
    }
    
    /**
     * Настройка событий замка
     */
    setupLockEvents() {
        if (!this.lock) return;
        
        // Слушаем события замка для совместимости (fallback)
        // НО только если прямая связь не сработала
        this.scene.events.on('lock:opened', (data) => {
            if (data.lock === this.lock && this.isLocked) {
                console.log('🔓 [Chest] Замок сундука взломан через событие lock:opened (fallback)!');
                this.isLocked = false;
                this.isOpened = true;
                this.open();
            }
        });
        
        this.scene.events.on('lock:failed', (data) => {
            if (data.lock === this.lock) {
                console.log('❌ [Chest] Провал взлома замка сундука');
                // Можно добавить дополнительные эффекты
            }
        });
        
        console.log('🔓 [Chest] События замка настроены (прямая связь Lock ↔ Chest приоритетна)');
    }
    
    /**
     * Настройка визуала сундука
     */
    setupVisuals() {
        // Устанавливаем глубину
        this.setDepth(100);
        
        // Замок создается в createLock()
        // Дополнительные визуальные элементы можно добавить здесь
    }
    
    /**
     * Настройка интерактивности
     */
    setupInteraction() {
        this.on('pointerover', () => {
            if (!this.isOpened) {
                this.setScale(1.15);
                this.scene.input.setDefaultCursor('pointer');
            }
        });
        
        this.on('pointerout', () => {
            if (!this.isOpened) {
                this.setScale(1.0);
                this.scene.input.setDefaultCursor('default');
            }
        });
        
        this.on('pointerdown', () => {
            if (!this.isOpened) {
                this.tryOpen();
            }
        });
    }
    
    /**
     * Попытка открыть сундук
     */
    tryOpen() {
        console.log(`💰 [Chest] Попытка открыть сундук`);
        
        // Проверяем, не открыт ли уже сундук
        if (this.isOpened) {
            console.log(`💰 [Chest] Сундук уже открыт`);
            return true;
        }
        
        // Проверяем замок
        if (this.isLocked && this.lock) {
            console.log(`🔒 [Chest] Сундук заперт! Тип замка: ${this.lock.type}, уровень: ${this.lock.level}`);
            
            // Синхронизируем состояние с замком
            this.syncWithLock(this.lock);
            
            // Проверяем, не взломан ли уже замок
            if (this.lock.isOpened) {
                console.log(`🔓 [Chest] Замок уже взломан, открываем сундук`);
                this.isLocked = false;
                this.isOpened = true;
                this.open();
                return true;
            }
            
            // Получаем питомца из сцены
            const pet = this.scene.pet || (this.scene.scene && this.scene.scene.pet);
            if (!pet) {
                console.warn('🔒 [Chest] Питомец не найден');
                this.showLockedMessage('Ошибка: питомец не найден');
                return false;
            }
            
            // Пытаемся взломать замок
            return this.lock.tryPick(pet);
        }
        
        // Открываем сундук
        this.open();
        return true;
    }
    
    /**
     * Показать сообщение о запертом сундуке
     * @param {string} message 
     */
    showLockedMessage(message) {
        const { width, height } = this.scene.scale;
        
        const messageText = this.scene.add.text(
            width / 2,
            height / 2,
            message,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);
        
        // Удаляем через 2 секунды
        this.scene.time.delayedCall(2000, () => {
            messageText.destroy();
        });
    }
    
    /**
     * Открыть сундук
     */
    open() {
        if (this.isOpened) {
            return;
        }
        
        console.log(`💰 [Chest] Сундук открыт! Содержимое:`, this.contents);
        
        this.isOpened = true;
        
        // Меняем визуал
        this.setText('📦'); // Открытый сундук
        
        // Убираем замок
        if (this.lockIcon) {
            this.lockIcon.destroy();
            this.lockIcon = null;
        }
        
        // Создаем эффект открытия
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.setScale(0.9);
                this.setAlpha(0.7);
            }
        });
        
        // Событие открытия
        this.emit('chest:opened', {
            chest: this,
            contents: this.contents
        });
        
        // Делаем неинтерактивным
        this.disableInteractive();
    }
    
    /**
     * Забрать содержимое сундука
     * @returns {Object} Содержимое сундука
     */
    collectContents() {
        if (!this.isOpened) {
            console.warn(`💰 [Chest] Нельзя забрать содержимое из закрытого сундука`);
            return null;
        }
        
        const contents = { ...this.contents };
        
        // Очищаем содержимое
        this.contents = {
            coins: 0,
            jewels: 0,
            keys: 0
        };
        
        console.log(`💰 [Chest] Содержимое собрано:`, contents);
        
        // Событие сбора
        this.emit('chest:collected', {
            chest: this,
            contents: contents
        });
        
        return contents;
    }
    
    /**
     * Открыть замок (с помощью отмычки или ключа)
     * @param {number} skillLevel - Уровень навыка взлома
     */
    unlock(skillLevel = 0) {
        if (!this.isLocked) {
            return true;
        }
        
        console.log(`🔓 [Chest] Попытка взлома замка. Навык: ${skillLevel}, Уровень замка: ${this.lockLevel}`);
        
        // Простая проверка
        if (skillLevel >= this.lockLevel) {
            this.isLocked = false;
            
            if (this.lockIcon) {
                this.lockIcon.destroy();
                this.lockIcon = null;
            }
            
            console.log(`🔓 [Chest] Замок взломан!`);
            
            this.emit('chest:unlocked', {
                chest: this
            });
            
            // Автоматически открываем
            this.open();
            
            return true;
        }
        
        console.log(`🔒 [Chest] Не удалось взломать замок`);
        return false;
    }
    
    /**
     * Обработка взлома замка (вызывается напрямую от Lock)
     * @param {Lock} lock - Замок, который был взломан
     */
    onLockPicked(lock) {
        console.log('🔓 [Chest] Замок сундука взломан напрямую от Lock!');
        
        // Синхронизируем состояние
        this.syncWithLock(lock);
        
        // Открываем сундук
        this.open();
    }
    
    /**
     * Синхронизация состояния с замком
     * @param {Lock} lock - Замок для синхронизации
     */
    syncWithLock(lock) {
        if (lock && lock === this.lock) {
            this.isLocked = !lock.isOpened;
            this.isOpened = lock.isOpened;
            console.log('🔄 [Chest] Состояние синхронизировано с замком:', {
                isLocked: this.isLocked,
                isOpened: this.isOpened,
                lockOpened: lock.isOpened
            });
        }
    }
    
    /**
     * Проверка, пустой ли сундук
     */
    isEmpty() {
        return this.contents.coins === 0 && 
               this.contents.jewels === 0 && 
               this.contents.keys === 0;
    }
    
    /**
     * Уничтожение сундука
     */
    destroy() {
        if (this.lockIcon) {
            this.lockIcon.destroy();
        }
        super.destroy();
    }
}

