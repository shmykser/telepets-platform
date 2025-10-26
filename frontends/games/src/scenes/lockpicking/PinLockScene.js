/**
 * Сцена взлома пин-замка
 * Мини-игра: подбор пинов - нажать кнопку когда индикатор в зеленой зоне
 */

import { BaseLockScene } from './BaseLockScene.js';
// HTMLButton удален - используем нативные Phaser компоненты

export class PinLockScene extends BaseLockScene {
    constructor() {
        super('PinLockScene');
        
        // Элементы игры
        this.pins = [];
        this.currentPin = 0;
        this.indicator = null;
        this.pickButton = null;
    }
    
    /**
     * Создание сцены
     */
    create() {
        super.create();
        
        // ВАЖНО: Полная очистка состояния от предыдущего прохождения
        this.pins = [];
        this.currentPin = 0;
        this.indicator = null;
        this.pickButton = null;
        
        // Создаем базовый UI
        this.createBaseUI('🔓 ВЗЛОМ ПИН-ЗАМКА');
        
        // Инструкция (адаптивная под механики)
        const { width } = this.scale;
        let instructionText = 'Нажми ВЗЛОМАТЬ когда индикатор в зеленой зоне!';
        
        if (this.config.twoPhaseMode) {
            instructionText = 'Попади в ЗЕЛЕНУЮ, затем в ЖЕЛТУЮ зону!';
        }
        
        this.add.text(width / 2, 180, instructionText, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(10);
        
        // Дополнительные подсказки об активных механиках
        const hints = [];
        if (this.config.resetOnFail) {
            hints.push('⚠️ Промах сбрасывает на 1-й пин');
        }
        if (this.config.shrinkingZone) {
            hints.push('📉 Зона уменьшается при промахе');
        }
        
        if (hints.length > 0) {
            this.add.text(width / 2, 200, hints.join(' | '), {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#ffaa00',
                stroke: '#000000',
                strokeThickness: 1,
                align: 'center'
            }).setOrigin(0.5).setDepth(10);
        }
        
        // Создаем пины
        this.createPins();
        
        // Создаем индикатор
        this.createIndicator();
        
        // Создаем кнопку взлома
        this.createPickButton();
        
        // Игра активна
        this.isGameActive = true;
        
        console.log('🔓 [PinLockScene] Игра начата');
    }
    
    /**
     * Создание пинов
     */
    createPins() {
        const { width, height } = this.scale;
        const numPins = this.config.pins || 1;
        const pinWidth = 50;
        const spacing = 70;
        const startX = width / 2 - (numPins - 1) * spacing / 2;
        const y = height / 2 - 20;
        
        // Создаем непрозрачный фон для игровой зоны
        const pinsAreaWidth = (numPins - 1) * spacing + pinWidth + 40;
        const pinsAreaHeight = 120;
        this.pinsBackground = this.add.rectangle(
            width / 2,
            y,
            pinsAreaWidth,
            pinsAreaHeight,
            0x2a2a2a // Темно-серый цвет
        ).setDepth(1);
        
        for (let i = 0; i < numPins; i++) {
            const x = startX + i * spacing;
            
            // Основа пина
            const pinBase = this.add.rectangle(x, y, pinWidth, 80, 0x333333).setDepth(5);
            
            // Зеленая зона (успех) - начальный размер из конфига
            const tolerance = this.config.tolerance || 20;
            const greenZone = this.add.rectangle(x, y, pinWidth - 8, tolerance, 0x00ff00).setDepth(6);
            
            // Желтая зона (для двухфазного режима) - создаем но скрываем
            let yellowZone = null;
            if (this.config.twoPhaseMode) {
                const yellowTolerance = this.config.yellowTolerance || 15;
                yellowZone = this.add.rectangle(x, y, pinWidth - 8, yellowTolerance, 0xffff00).setDepth(6);
                yellowZone.setVisible(false); // Изначально скрыта
            }
            
            // Текст пина
            const pinText = this.add.text(x, y + 50, `Пин ${i + 1}`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(10);
            
            // Статус пина
            const status = this.add.text(x, y + 65, '⚪', {
                fontSize: '20px'
            }).setOrigin(0.5).setDepth(10);
            
            this.pins.push({
                base: pinBase,
                greenZone: greenZone,
                yellowZone: yellowZone,
                text: pinText,
                status: status,
                unlocked: false,
                phase: 1, // Фаза 1 (зеленая) или 2 (желтая)
                x: x,
                y: y,
                tolerance: tolerance, // Текущий размер зеленой зоны
                originalTolerance: tolerance // Исходный размер для восстановления
            });
        }
        
        this.currentPin = 0;
        this.highlightCurrentPin();
    }
    
    /**
     * Подсветка текущего пина
     */
    highlightCurrentPin() {
        // Снимаем подсветку со всех
        this.pins.forEach((pin, index) => {
            pin.base.setFillStyle(0x333333);
            
            if (index === this.currentPin) {
                // Подсвечиваем текущий
                pin.base.setFillStyle(0x555555);
                
                // Добавляем желтую рамку
                if (pin.highlight) {
                    pin.highlight.destroy();
                }
                pin.highlight = this.add.rectangle(pin.x, pin.y, 54, 84, 0xffff00, 0).setDepth(4);
                pin.highlight.setStrokeStyle(2, 0xffff00);
            } else if (pin.highlight) {
                pin.highlight.destroy();
                pin.highlight = null;
            }
        });
    }
    
    /**
     * Создание индикатора
     */
    createIndicator() {
        if (!this.pins || !this.pins[this.currentPin]) return;
        
        const pin = this.pins[this.currentPin];
        
        this.indicator = this.add.rectangle(
            pin.x,
            pin.y + 40,
            40,
            8,
            0xff0000
        ).setDepth(7);
        
        // Анимация движения индикатора
        const speed = this.config.indicatorSpeed || 2;
        const duration = 1200 / speed;
        
        this.tweens.add({
            targets: this.indicator,
            y: pin.y - 40,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    /**
     * Создание кнопки взлома
     */
    createPickButton() {
        const { width, height } = this.scale;
        
        this.pickButton = this.createButton(width / 2, height - 120, 250, 60, '🔓 ВЗЛОМАТЬ', {
            fontSize: '18px',
            backgroundColor: 0x4CAF50,
            borderColor: 0x45a049,
            hoverColor: 0x45a049
        });
        
        this.pickButton.container.on('pointerdown', () => this.tryPick());
        
        // МОБИЛЬНАЯ ПОДДЕРЖКА: тап по области игры (не по кнопкам)
        const gameArea = this.add.rectangle(width / 2, height / 2 - 80, width, 400, 0x000000, 0.01);
        gameArea.setInteractive();
        gameArea.on('pointerdown', (pointer) => {
            // Проверяем что тап не по кнопке
            if (pointer.y < height - 150) {
                this.tryPick();
            }
        });
        
        // Обработка клавиши пробела (для ПК)
        this.input.keyboard.on('keydown-SPACE', () => {
            this.tryPick();
        });
        
        // Инструкция для мобильных
        this.add.text(width / 2, height - 180, 'Тапайте по экрану или кнопке', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5).setDepth(10);
    }
    
    /**
     * Попытка взлома
     */
    tryPick() {
        if (!this.isGameActive) return;
        if (!this.pins || !this.pins[this.currentPin]) return;
        
        const pin = this.pins[this.currentPin];
        const indicatorY = this.indicator.y;
        
        // Определяем текущую зону для проверки
        let targetZone, targetTolerance, currentPhase;
        
        if (this.config.twoPhaseMode && pin.phase === 1) {
            // Фаза 1: проверяем зеленую зону
            targetZone = pin.greenZone;
            targetTolerance = pin.tolerance;
            currentPhase = 1;
        } else if (this.config.twoPhaseMode && pin.phase === 2) {
            // Фаза 2: проверяем желтую зону
            targetZone = pin.yellowZone;
            targetTolerance = this.config.yellowTolerance || 15;
            currentPhase = 2;
        } else {
            // Обычный режим: только зеленая зона
            targetZone = pin.greenZone;
            targetTolerance = pin.tolerance;
            currentPhase = 1;
        }
        
        const zoneTop = targetZone.y - targetTolerance / 2;
        const zoneBottom = targetZone.y + targetTolerance / 2;
        const isSuccess = indicatorY >= zoneTop && indicatorY <= zoneBottom;
        
        console.log(`🔓 [PinLockScene] Попытка взлома пина ${this.currentPin + 1}, фаза ${currentPhase}:`, {
            indicatorY,
            zoneTop,
            zoneBottom,
            isSuccess,
            tolerance: targetTolerance
        });
        
        if (isSuccess) {
            // Попадание в зону!
            
            if (this.config.twoPhaseMode && pin.phase === 1) {
                // Фаза 1 успешна - переходим к фазе 2
                pin.phase = 2;
                pin.greenZone.setVisible(false);
                pin.yellowZone.setVisible(true);
                
                if (pin.status && pin.status.scene) {
                    pin.status.setText('🟡');
                    pin.status.setColor('#ffff00');
                }
                
                console.log(`🟢 [PinLockScene] Пин ${this.currentPin + 1}: Фаза 1 пройдена, переход к фазе 2`);
                
            } else {
                // Полный успех (либо фаза 2, либо обычный режим)
                pin.unlocked = true;
                
                if (pin.status && pin.status.scene) {
                    pin.status.setText('✅');
                    pin.status.setColor('#00ff00');
                }
                
                // Переходим к следующему пину
                this.currentPin++;
                
                if (this.currentPin >= this.pins.length) {
                    // Все пины взломаны!
                    this.onSuccess();
                } else {
                    // Переключаемся на следующий пин
                    this.highlightCurrentPin();
                    this.updateIndicator();
                }
            }
            
        } else {
            // Промах!
            this.handleFailure(pin);
        }
    }
    
    /**
     * Обработка неудачной попытки
     */
    handleFailure(pin) {
        this.incrementAttempts();
        
        // Визуальный эффект провала
        if (pin.status && pin.status.scene) {
            pin.status.setText('❌');
            pin.status.setColor('#ff0000');
        }
        
        // МЕХАНИКА 2: Сужающаяся зона
        if (this.config.shrinkingZone) {
            const shrinkAmount = this.config.shrinkAmount || 3;
            const minTolerance = this.config.minTolerance || 10;
            
            if (pin.tolerance > minTolerance) {
                pin.tolerance = Math.max(minTolerance, pin.tolerance - shrinkAmount);
                
                // Обновляем размер зеленой зоны
                pin.greenZone.setDisplaySize(pin.greenZone.width, pin.tolerance);
                
                console.log(`📉 [PinLockScene] Зона уменьшена до ${pin.tolerance}px`);
            }
        }
        
        // МЕХАНИКА 3: Сброс на первый пин
        if (this.config.resetOnFail && this.currentPin > 0) {
            console.log(`🔄 [PinLockScene] Сброс на первый пин!`);
            
            // Сбрасываем все пины
            this.pins.forEach((p, index) => {
                p.unlocked = false;
                p.phase = 1;
                
                // Восстанавливаем исходный размер зоны
                if (this.config.shrinkingZone) {
                    p.tolerance = p.originalTolerance;
                    p.greenZone.setDisplaySize(p.greenZone.width, p.tolerance);
                }
                
                // Восстанавливаем визуальное состояние
                if (p.greenZone) p.greenZone.setVisible(true);
                if (p.yellowZone) p.yellowZone.setVisible(false);
                
                if (p.status && p.status.scene) {
                    p.status.setText('⚪');
                    p.status.setColor('#ffffff');
                }
            });
            
            // Возвращаемся на первый пин
            this.currentPin = 0;
            this.highlightCurrentPin();
            this.updateIndicator();
            
            return; // Выходим, чтобы не выполнять обычный таймаут
        }
        
        // Двухфазный режим: сброс фазы при провале фазы 2
        if (this.config.twoPhaseMode && pin.phase === 2) {
            pin.phase = 1;
            pin.greenZone.setVisible(true);
            pin.yellowZone.setVisible(false);
            console.log(`🔄 [PinLockScene] Пин ${this.currentPin + 1}: Сброс на фазу 1`);
        }
        
        // Восстановление визуального статуса через 500мс
        this.time.delayedCall(500, () => {
            if (this.isGameActive && pin.status && pin.status.scene) {
                if (pin.phase === 1) {
                    pin.status.setText('⚪');
                    pin.status.setColor('#ffffff');
                } else if (pin.phase === 2) {
                    pin.status.setText('🟡');
                    pin.status.setColor('#ffff00');
                }
            }
        });
    }
    
    /**
     * Обновление индикатора для нового пина
     */
    updateIndicator() {
        if (!this.indicator) return;
        if (!this.pins || !this.pins[this.currentPin]) return;
        
        const pin = this.pins[this.currentPin];
        
        // Останавливаем текущую анимацию
        this.tweens.killTweensOf(this.indicator);
        
        // Перемещаем индикатор к новому пину
        this.indicator.setPosition(pin.x, pin.y + 40);
        
        // Запускаем новую анимацию
        const speed = this.config.indicatorSpeed || 2;
        const duration = 1200 / speed;
        
        this.tweens.add({
            targets: this.indicator,
            y: pin.y - 40,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    /**
     * Очистка
     */
    shutdown() {
        super.shutdown();
        
        // Очищаем фон пинов
        if (this.pinsBackground) {
            this.pinsBackground.destroy();
            this.pinsBackground = null;
        }
        
        // Останавливаем анимации
        if (this.indicator) {
            this.tweens.killTweensOf(this.indicator);
        }
        
        // Очищаем обработчики клавиш
        if (this.input && this.input.keyboard) {
            this.input.keyboard.off('keydown-SPACE');
        }
        
        // Полная очистка состояния
        this.pins = [];
        this.currentPin = 0;
        this.indicator = null;
        this.pickButton = null;
        
        console.log('🔓 [PinLockScene] Полная очистка состояния');
    }
}

