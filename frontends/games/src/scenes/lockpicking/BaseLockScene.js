/**
 * Базовая сцена для всех типов взлома замков
 * Содержит общую логику: UI, таймер, попытки, работа с инвентарем
 */

export class BaseLockScene extends Phaser.Scene {
    constructor(key) {
        super({ key });
        
        // Данные замка и питомца
        this.lock = null;
        this.pet = null;
        this.lockType = null;
        this.lockLevel = 1;
        this.config = null;
        this.cost = 1;
        
        // Игровые параметры
        this.attempts = 0;
        this.maxAttempts = 3;
        this.timeLeft = 0;
        this.timer = null;
        this.isGameActive = false;
        
        // UI элементы
        this.timerText = null;
        this.attemptsText = null;
        this.infoText = null;
        this.cancelButton = null;
        
        // Флаги состояния
        this.isExiting = false;
    }
    
    /**
     * Инициализация с данными
     */
    init(data) {
        console.log(`🔓 [${this.scene.key}] Инициализация:`, data);
        
        this.lock = data.lock;
        this.pet = data.pet;
        this.lockType = data.lockType;
        this.lockLevel = data.lockLevel || 1;
        this.config = data.config || {};
        this.cost = data.cost || 1;
        
        // Сохраняем коллбэки для дверей (если переданы)
        this.onSuccessCallback = data.onSuccess;
        this.onFailureCallback = data.onFailure;
        
        this.attempts = 0;
        this.maxAttempts = this.config.maxAttempts || 3;
        this.timeLeft = this.config.timeLimit || 0;
        this.isGameActive = false;
        this.isExiting = false;
    }
    
    /**
     * Создание базовой сцены
     */
    create() {
        const { width, height } = this.scale;
        
        // Полупрозрачный фон
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(0);
        
        console.log(`🔓 [${this.scene.key}] Базовая сцена создана`);
    }
    
    /**
     * Создает кнопку на основе Phaser Graphics и Text
     */
    createButton(x, y, width, height, text, style = {}) {
        // Фон кнопки - Graphics с абсолютными координатами
        const bg = this.add.graphics();
        bg.fillStyle(style.backgroundColor || 0x333333, 1);
        bg.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
        bg.lineStyle(2, style.borderColor || 0x666666, 1);
        bg.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
        bg.setDepth(10);
        
        // Текст кнопки
        const label = this.add.text(x, y, text, {
            fontSize: style.fontSize || '16px',
            fontFamily: 'Arial',
            color: style.color || '#ffffff',
            fontStyle: style.fontWeight || 'normal'
        }).setOrigin(0.5).setDepth(11);
        
        // Делаем Graphics интерактивным напрямую
        bg.setInteractive(
            new Phaser.Geom.Rectangle(x - width/2, y - height/2, width, height), 
            Phaser.Geom.Rectangle.Contains
        );
        
        // Эффекты наведения
        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(style.hoverColor || 0x555555, 1);
            bg.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
            bg.lineStyle(2, style.borderColor || 0x666666, 1);
            bg.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
        });
        
        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(style.backgroundColor || 0x333333, 1);
            bg.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
            bg.lineStyle(2, style.borderColor || 0x666666, 1);
            bg.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
        });
        
        // Возвращаем объект с bg как container для совместимости
        return { container: bg, bg, label, x, y, width, height };
    }
    
    /**
     * Создание общего UI (вызывается дочерними классами)
     */
    createBaseUI(title) {
        const { width, height } = this.scale;
        
        // Заголовок
        this.add.text(width / 2, 80, title, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);
        
        // Информация
        const infoY = 120;
        this.infoText = this.add.text(width / 2, infoY, `Уровень: ${this.lockLevel} | Стоимость: ${this.cost} отмычек`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);
        
        // Попытки
        const attemptsY = infoY + 30;
        this.attemptsText = this.add.text(width / 2, attemptsY, `Попытки: ${this.maxAttempts - this.attempts}/${this.maxAttempts}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);
        
        // Таймер (если есть лимит времени)
        if (this.timeLeft > 0) {
            const timerY = attemptsY + 30;
            this.timerText = this.add.text(width / 2, timerY, `⏱️ Время: ${this.timeLeft}с`, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#00ffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(10);
            
            // Запускаем таймер
            this.startTimer();
        }
        
        // Кнопка отмены (увеличена для мобильных)
        this.cancelButton = this.createButton(width / 2, height - 50, 180, 50, '❌ Отмена', {
            fontSize: '18px',
            backgroundColor: 0xf44336,
            borderColor: 0xda190b,
            hoverColor: 0xda190b
        });
        this.cancelButton.container.on('pointerdown', () => this.cancel());
    }
    
    /**
     * Запуск таймера
     */
    startTimer() {
        if (this.timeLeft <= 0) return;
        
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                
                if (this.timerText) {
                    this.timerText.setText(`⏱️ Время: ${this.timeLeft}с`);
                    
                    // Красный цвет когда мало времени
                    if (this.timeLeft <= 10) {
                        this.timerText.setColor('#ff0000');
                    }
                }
                
                // Время вышло
                if (this.timeLeft <= 0) {
                    this.onTimeOut();
                }
            },
            loop: true
        });
    }
    
    /**
     * Остановка таймера
     */
    stopTimer() {
        if (this.timer) {
            this.timer.destroy();
            this.timer = null;
        }
    }
    
    /**
     * Увеличить счетчик попыток
     */
    incrementAttempts() {
        this.attempts++;
        
        if (this.attemptsText) {
            this.attemptsText.setText(`Попытки: ${this.maxAttempts - this.attempts}/${this.maxAttempts}`);
            
            // Красный цвет когда осталась последняя попытка
            if (this.attempts >= this.maxAttempts - 1) {
                this.attemptsText.setColor('#ff0000');
            }
        }
        
        // Проверяем превышение попыток
        if (this.attempts >= this.maxAttempts) {
            this.onFailure();
        }
    }
    
    /**
     * Показать сообщение
     */
    showMessage(text, color = '#ffffff', duration = 2000) {
        const { width, height } = this.scale;
        
        const message = this.add.text(width / 2, height / 2, text, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: color,
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1000);
        
        this.time.delayedCall(duration, () => {
            message.destroy();
        });
    }
    
    /**
     * Эффект успеха
     */
    successEffect() {
        const { width, height } = this.scale;
        
        // Зеленая вспышка
        const flash = this.add.rectangle(width / 2, height / 2, width, height, 0x00ff00, 0.3);
        flash.setDepth(999);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
        
        // Сообщение
        this.showMessage('✅ ЗАМОК ВЗЛОМАН!', '#00ff00', 1500);
    }
    
    /**
     * Эффект провала
     */
    failureEffect() {
        // Красная вспышка
        const { width, height } = this.scale;
        const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.3);
        flash.setDepth(999);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
        
        // Тряска экрана
        this.cameras.main.shake(200, 0.01);
        
        // Сообщение
        this.showMessage('❌ ОТМЫЧКА СЛОМАЛАСЬ!', '#ff0000', 1500);
    }
    
    /**
     * Успешный взлом
     */
    onSuccess() {
        if (!this.isGameActive) return;
        
        console.log(`✅ [${this.scene.key}] Успешный взлом!`);
        
        this.isGameActive = false;
        this.stopTimer();
        
        // Эффект успеха
        this.successEffect();
        
        // Выход через 1.5 секунды
        this.time.delayedCall(1500, () => {
            this.exitLockpicking(true);
        });
    }
    
    /**
     * Провал взлома
     */
    onFailure() {
        if (!this.isGameActive) return;
        
        console.log(`❌ [${this.scene.key}] Провал взлома!`);
        
        this.isGameActive = false;
        this.stopTimer();
        
        // Эффект провала
        this.failureEffect();
        
        // Выход через 1.5 секунды
        this.time.delayedCall(1500, () => {
            this.exitLockpicking(false);
        });
    }
    
    /**
     * Время вышло
     */
    onTimeOut() {
        console.log(`⏰ [${this.scene.key}] Время вышло!`);
        this.showMessage('⏰ ВРЕМЯ ВЫШЛО!', '#ff0000');
        this.time.delayedCall(1000, () => {
            this.onFailure();
        });
    }
    
    /**
     * Отмена взлома
     */
    cancel() {
        console.log(`🚫 [${this.scene.key}] Отмена взлома`);
        this.exitLockpicking(false);
    }
    
    /**
     * Выход из сцены взлома
     */
    exitLockpicking(success) {
        console.log(`🚪 [${this.scene.key}] Выход. Успех:`, success);
        
        // Предотвращаем множественные вызовы
        if (this.isExiting) {
            console.log('⚠️ [BaseLockScene] Выход уже в процессе, пропускаем');
            return;
        }
        this.isExiting = true;
        
        this.stopTimer();
        
        // Скрываем кнопку отмены
        if (this.cancelButton) {
            if (this.cancelButton.element) {
                this.cancelButton.element.style.display = 'none';
            }
        }
        
        // Обновляем отмычки только при успехе
        if (success && this.pet && this.pet.inventory) {
            const currentLockpicks = this.pet.inventory.get('lockpicks');
            this.pet.inventory.set('lockpicks', currentLockpicks - this.cost);
        }
        
        // Вызываем коллбэки замка (для сундуков) - это происходит ПЕРЕД пробуждением сцены
        if (this.lock) {
            if (success && this.lock.onPickSuccess) {
                this.lock.onPickSuccess();
            } else if (!success && this.lock.onPickFailed) {
                this.lock.onPickFailed();
            }
        }
        
        // Прямое уведомление через Lock.onPickSuccess() уже обработано
        // Дополнительные события не нужны благодаря прямой связи Lock ↔ Chest
        
        // Вызываем коллбэки двери (если переданы)
        if (success && this.onSuccessCallback) {
            this.onSuccessCallback();
        } else if (!success && this.onFailureCallback) {
            this.onFailureCallback();
        }
        
        // Пробуждаем предыдущую сцену (HouseInteriorScene или PetThiefScene) ПЕРЕД остановкой текущей
        try {
            // Используем более надежный способ доступа к SceneManager
            let sceneManager = this.scene.scene.manager;
            
            // Если SceneManager недоступен, пробуем альтернативные способы
            if (!sceneManager) {
                sceneManager = this.scene.scene.scene?.manager;
            }
            if (!sceneManager) {
                sceneManager = this.scene.scene.scene?.scene?.manager;
            }
            
            if (sceneManager && sceneManager.isSleeping) {
                // Сначала пробуем пробудить HouseInteriorScene (если мы были в доме)
                if (sceneManager.isSleeping('HouseInteriorScene')) {
                    sceneManager.wake('HouseInteriorScene');
                    console.log('🏠 [BaseLockScene] HouseInteriorScene пробуждена');
                } else if (sceneManager.isSleeping('PetThiefScene')) {
                    sceneManager.wake('PetThiefScene');
                    console.log('🗺️ [BaseLockScene] PetThiefScene пробуждена');
                } else {
                    console.log('ℹ️ [BaseLockScene] Предыдущая сцена не в состоянии sleep');
                }
            } else {
                console.warn('⚠️ [BaseLockScene] Scene Manager недоступен, используем альтернативный способ');
                // Альтернативный способ - запускаем сцену заново
                this.scene.scene.launch('HouseInteriorScene');
            }
        } catch (error) {
            console.warn('⚠️ [BaseLockScene] Не удалось пробудить предыдущую сцену:', error);
            // Fallback - запускаем сцену заново
            try {
                this.scene.scene.launch('HouseInteriorScene');
                console.log('🔄 [BaseLockScene] Запущена HouseInteriorScene как fallback');
            } catch (fallbackError) {
                console.error('❌ [BaseLockScene] Критическая ошибка при возврате к сцене:', fallbackError);
            }
        }
        
        // Возвращаемся к предыдущей сцене
        this.scene.stop();
    }
    
    /**
     * Очистка при завершении сцены
     */
    shutdown() {
        this.stopTimer();
        
        // Удаляем HTML кнопку
        if (this.cancelButton) {
            this.cancelButton.destroy();
            this.cancelButton = null;
        }
    }
}

