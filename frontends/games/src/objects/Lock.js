/**
 * Универсальный класс замка
 * Поддерживает все типы замков: Pin, Maze, Pattern
 */

import { LOCK_TYPES, getLockConfig, getLockCost } from '../types/lockTypes.js';

export class Lock {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Основные свойства
        this.type = config.type || LOCK_TYPES.PIN;
        this.level = config.level || 1;
        this.isLocked = config.isLocked !== false;
        this.ownerId = config.ownerId || null;
        
        // Ссылка на объект, которому принадлежит замок (Chest или Door)
        this.owner = config.owner || null;
        
        // Конфигурация замка
        this.config = getLockConfig(this.type, this.level);
        this.cost = getLockCost(this.level);
        
        // Состояние
        this.isOpened = false;
        this.attempts = 0;
        this.maxAttempts = this.config?.maxAttempts || 3;
        
        // Визуальные элементы
        this.lockIcon = null;
        this.visualElements = [];
        
        console.log(`🔒 [Lock] Замок создан: ${this.type} уровень ${this.level}`);
    }
    
    /**
     * Создание визуала замка
     */
    createVisuals() {
        // Базовый визуал - иконка замка
        this.lockIcon = this.scene.add.text(
            this.x + 25,
            this.y - 25,
            this.getLockEmoji(),
            { fontSize: '32px' }
        ).setDepth(101);
        
        this.lockIcon.setShadow(2, 2, '#000000', 4, true, true);
        this.visualElements.push(this.lockIcon);
        
        // Дополнительные визуальные элементы в зависимости от типа
        if (this.isLocked) {
            this.createTypeSpecificVisuals();
        }
    }
    
    /**
     * Создание специфичных визуальных элементов для каждого типа замка
     */
    createTypeSpecificVisuals() {
        // Показываем уровень сложности
        const levelText = this.scene.add.text(
            this.x + 40,
            this.y - 40,
            `${this.level}`,
            { 
                fontSize: '16px',
                fontFamily: 'Arial',
                color: this.getLevelColor(),
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setDepth(102);
        
        this.visualElements.push(levelText);
        
        // Создаем эффекты в зависимости от типа
        switch (this.type) {
            case LOCK_TYPES.PIN:
                // Пин-замок - только уровень
                break;
            case LOCK_TYPES.MAZE:
                this.createMazeEffect();
                break;
            case LOCK_TYPES.PATTERN:
                this.createPatternEffect();
                break;
        }
    }
    
    /**
     * Получить цвет уровня сложности
     */
    getLevelColor() {
        switch (this.type) {
            case LOCK_TYPES.PIN:
                return '#ffff00'; // Желтый
            case LOCK_TYPES.MAZE:
                return '#00ffff'; // Голубой
            case LOCK_TYPES.PATTERN:
                return '#ff00ff'; // Пурпурный
            default:
                return '#ffffff'; // Белый
        }
    }
    
    /**
     * Создание эффекта лабиринта
     */
    createMazeEffect() {
        const lines = [];
        const radius = 30;
        const numLines = 8;
        
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const startX = this.x + Math.cos(angle) * radius;
            const startY = this.y + Math.sin(angle) * radius;
            const endX = this.x + Math.cos(angle) * (radius + 10);
            const endY = this.y + Math.sin(angle) * (radius + 10);
            
            const line = this.scene.add.line(
                this.x, this.y,
                startX - this.x, startY - this.y,
                endX - this.x, endY - this.y,
                0x888888
            ).setLineWidth(2).setDepth(100);
            
            lines.push(line);
            
            // Анимация линий
            this.scene.tweens.add({
                targets: line,
                alpha: 0.3,
                duration: 1000 + i * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        this.visualElements.push(...lines);
    }
    
    /**
     * Создание эффекта точек для паттерна
     */
    createPatternEffect() {
        const points = [];
        const radius = 25;
        const numPoints = 6;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            const point = this.scene.add.circle(x, y, 3, 0xffffff).setDepth(100);
            
            points.push(point);
            
            // Анимация точек
            this.scene.tweens.add({
                targets: point,
                scale: 1.5,
                duration: 800 + i * 150,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        this.visualElements.push(...points);
    }
    
    /**
     * Получить эмодзи замка в зависимости от типа
     */
    getLockEmoji() {
        switch (this.type) {
            case LOCK_TYPES.PIN:
                return '🔓';
            case LOCK_TYPES.MAZE:
                return '🧩';
            case LOCK_TYPES.PATTERN:
                return '🎯';
            default:
                return '🔒';
        }
    }
    
    /**
     * Попытка взлома замка
     * @param {Object} pet - Питомец с инвентарем
     * @returns {boolean} - Успешно ли начат взлом
     */
    tryPick(pet) {
        if (!this.isLocked || this.isOpened) {
            return false;
        }
        
        // Проверяем наличие отмычек
        const lockpicks = pet.inventory.get('lockpicks') || 0;
        
        if (lockpicks < this.cost) {
            this.showMessage(`❌ Нужно ${this.cost} отмычек! У вас: ${lockpicks}`);
            return false;
        }
        
        // Запускаем мини-игру взлома
        this.startLockpicking(pet);
        return true;
    }
    
    /**
     * Запуск мини-игры взлома
     * @param {Object} pet - Питомец
     */
    startLockpicking(pet) {
        console.log(`🔓 [Lock] Запуск взлома ${this.type} замка`);
        
        // Определяем сцену в зависимости от типа замка
        const sceneKey = this.getLockSceneKey();
        
        // Останавливаем текущую сцену (используем sleep вместо pause для полного скрытия)
        // Проверяем, что сцена в состоянии running перед попыткой sleep
        const currentScene = this.scene.scene;
        if (currentScene && currentScene.isRunning && currentScene.isRunning()) {
            try {
                currentScene.sleep(currentScene.key);
                console.log(`🔓 [Lock] Сцена ${currentScene.key} усыплена`);
            } catch (error) {
                console.warn(`⚠️ [Lock] Не удалось усыпить сцену ${currentScene.key}:`, error);
            }
        } else {
            console.warn(`⚠️ [Lock] Сцена ${currentScene?.key || 'unknown'} не в состоянии running, пропускаем sleep`);
        }
        
        // Запускаем соответствующую сцену взлома
        this.scene.scene.launch(sceneKey, {
            lock: this,
            pet: pet,
            lockType: this.type,
            lockLevel: this.level,
            config: this.config,
            cost: this.cost
        });
    }
    
    /**
     * Получить ключ сцены для типа замка
     * @returns {string}
     */
    getLockSceneKey() {
        const sceneMap = {
            'pin': 'PinLockScene',
            'maze': 'MazeLockScene',
            'pattern': 'PatternLockScene'
        };
        
        return sceneMap[this.type] || 'PinLockScene';
    }
    
    /**
     * Успешный взлом
     */
    onPickSuccess() {
        console.log(`✅ [Lock] Замок ${this.type} успешно взломан!`);
        
        this.isOpened = true;
        this.isLocked = false;
        
        // Обновляем визуал
        this.updateVisuals();
        
        // Уведомляем владельца напрямую
        if (this.owner && this.owner.onLockPicked) {
            console.log(`🔓 [Lock] Уведомляем владельца о взломе:`, this.owner);
            this.owner.onLockPicked(this);
        }
        
        // Эмитим событие для совместимости
        this.scene.events.emit('lock:opened', {
            lock: this,
            type: this.type,
            level: this.level
        });
    }
    
    /**
     * Провал взлома
     */
    onPickFailed() {
        console.log(`❌ [Lock] Провал взлома ${this.type} замка`);
        
        this.attempts++;
        
        // Эмитим событие
        this.scene.events.emit('lock:failed', {
            lock: this,
            type: this.type,
            level: this.level,
            attempts: this.attempts,
            maxAttempts: this.maxAttempts
        });
    }
    
    /**
     * Обновление визуала после взлома
     */
    updateVisuals() {
        if (this.lockIcon) {
            this.lockIcon.setText('🔓'); // Открытый замок
            this.lockIcon.setTint(0x00ff00); // Зеленый цвет
        }
    }
    
    /**
     * Показать сообщение
     * @param {string} message 
     */
    showMessage(message) {
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
     * Очистка ресурсов
     */
    destroy() {
        this.visualElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.visualElements = [];
    }
    
}

// Экспорты дочерних классов убраны - они импортируются напрямую
