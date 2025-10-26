import Phaser from 'phaser';
import { BaseUIComponent } from './BaseUIComponent.js';
import { UIUtils } from '../utils/UIUtils.js';
import { UI_THEME } from '../utils/UITheme.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';
import { UI_CONSTANTS } from '../settings/GameSettings.js';

/**
 * Компонент таймера игры
 * Показывает оставшееся время до конца игры
 */
export class GameTimer extends BaseUIComponent {
    constructor(scene, x, y, options = {}) {
        const defaultConfig = {
            fontSize: UI_THEME.fonts.sizes.large,
            fontFamily: UI_THEME.fonts.family,
            color: UI_THEME.colors.text,
            backgroundColor: UI_THEME.colors.background,
            padding: { x: UI_CONSTANTS.GAME_TIMER.DEFAULT_PADDING_X, y: UI_CONSTANTS.GAME_TIMER.DEFAULT_PADDING_Y },
            showMilliseconds: false,
            warningTime: UI_CONSTANTS.GAME_TIMER.DEFAULT_WARNING_TIME,
            criticalTime: UI_CONSTANTS.GAME_TIMER.DEFAULT_CRITICAL_TIME,
            ...options
        };
        
        super(scene, x, y, defaultConfig);
        
        // Сохраняем опции как свойства
        this.showMilliseconds = defaultConfig.showMilliseconds;
        this.warningTime = defaultConfig.warningTime;
        this.criticalTime = defaultConfig.criticalTime;
        
        // Состояние
        this.totalTime = 0;
        this.remainingTime = 0;
        this.isRunning = false;
        this.isWarning = false;
        this.isCritical = false;
        
        // Создаем UI элементы
        this.createUI();
        
        // Создаем контейнер с автоматическим добавлением в сцену
        this.createContainer();
    }
    
    createUI() {
        // Создаем таймер через UIUtils
        const timerElements = UIUtils.createTimer(
            this.scene, 
            0, 
            0, 
            '10:00', 
            {
                width: UI_THEME.sizes.timer.width,
                height: UI_THEME.sizes.timer.height,
                backgroundColor: this.backgroundColor,
                textColor: this.color,
                fontSize: this.fontSize,
                fontFamily: this.fontFamily,
                strokeColor: UI_THEME.colors.border,
                strokeWidth: UI_THEME.spacing.border.width,
                statusBarColor: UI_THEME.colors.success
            }
        );
        
        this.background = timerElements.background;
        this.timerText = timerElements.text;
        this.statusBar = timerElements.statusBar;
        
        this.add([this.background, this.timerText, this.statusBar]);
    }
    
    /**
     * Запускает таймер
     * @param {number} totalTime - общее время игры в миллисекундах
     */
    start(totalTime) {
        this.totalTime = totalTime;
        this.remainingTime = totalTime;
        this.isRunning = true;
        this.isWarning = false;
        this.isCritical = false;
        
        this.updateDisplay();
        this.startUpdateLoop();
    }
    
    /**
     * Останавливает таймер
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * Паузит/возобновляет таймер
     */
    togglePause() {
        this.isRunning = !this.isRunning;
    }
    
    /**
     * Запускает цикл обновления
     */
    startUpdateLoop() {
        this.updateTimer = this.scene.time.addEvent({
            delay: UI_CONSTANTS.GAME_TIMER.DEFAULT_UPDATE_INTERVAL,
            callback: this.update,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Обновляет таймер
     */
    update() {
        if (!this.isRunning) return;
        
        this.remainingTime -= UI_CONSTANTS.GAME_TIMER.DEFAULT_UPDATE_INTERVAL;
        
        // Проверяем предупреждения
        this.checkWarnings();
        
        // Обновляем отображение
        this.updateDisplay();
        
        // Проверяем окончание времени
        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.isRunning = false;
            this.emit('timeUp');
        }
    }
    
    /**
     * Проверяет предупреждения
     */
    checkWarnings() {
        const wasWarning = this.isWarning;
        const wasCritical = this.isCritical;
        
        this.isWarning = this.remainingTime <= this.warningTime;
        this.isCritical = this.remainingTime <= this.criticalTime;
        
        // Эмитим события при изменении состояния
        if (!wasWarning && this.isWarning) {
            this.emit('warningTime');
        }
        if (!wasCritical && this.isCritical) {
            this.emit('criticalTime');
        }
    }
    
    /**
     * Обновляет отображение
     */
    updateDisplay() {
        const minutes = GeometryUtils.floor(this.remainingTime / 60000);
        const seconds = GeometryUtils.floor((this.remainingTime % 60000) / 1000);
        const milliseconds = GeometryUtils.floor((this.remainingTime % 1000) / 100);
        
        let timeString;
        if (this.showMilliseconds) {
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
        } else {
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        this.timerText.setText(timeString);
        
        // Обновляем цвета в зависимости от состояния
        if (this.isCritical) {
            this.timerText.setColor('#ff0000');
            this.statusBar.setFillStyle(0xff0000);
            this.background.setStrokeStyle(2, 0xff0000);
        } else if (this.isWarning) {
            this.timerText.setColor('#ffaa00');
            this.statusBar.setFillStyle(0xffaa00);
            this.background.setStrokeStyle(2, 0xffaa00);
        } else {
            this.timerText.setColor(this.color);
            this.statusBar.setFillStyle(0x00ff00);
            this.background.setStrokeStyle(2, 0xffffff);
        }
        
        // Обновляем прогресс-бар
        const progress = this.remainingTime / this.totalTime;
        this.statusBar.setScale(progress, 1);
    }
    
    /**
     * Получает оставшееся время в миллисекундах
     */
    getRemainingTime() {
        return this.remainingTime;
    }
    
    /**
     * Получает прогресс игры (0-1)
     */
    getProgress() {
        return 1 - (this.remainingTime / this.totalTime);
    }
    
    /**
     * Получает оставшееся время в секундах
     */
    getRemainingSeconds() {
        return Math.ceil(this.remainingTime / 1000);
    }
    
    /**
     * Переопределяем метод уничтожения
     */
    onDestroy() {
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
    }
}
