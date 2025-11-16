import { TELEGRAM_UI_STYLES } from '../settings/GameSettings.js';

/**
 * Базовый класс для HTML UI компонентов в стиле Telegram WebApp
 * Следует принципу Open/Closed Principle
 */
export class BaseHTMLComponent {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.config = { ...this.getDefaultConfig(), ...config };
        this.container = null;
        this.isVisible = false;
        this.lastCanvasPosition = { left: 0, top: 0 };
        
        this.createElements();
        this.setupEventListeners();
    }
    
    /**
     * Получить конфигурацию по умолчанию
     * @returns {Object} Конфигурация по умолчанию
     */
    getDefaultConfig() {
        return {
            width: 100,
            height: 18,
            backgroundColor: TELEGRAM_UI_STYLES.colors.background,
            textColor: TELEGRAM_UI_STYLES.colors.text,
            fontSize: TELEGRAM_UI_STYLES.fonts.size,
            fontFamily: TELEGRAM_UI_STYLES.fonts.family,
            fontWeight: TELEGRAM_UI_STYLES.fonts.weight,
            borderRadius: TELEGRAM_UI_STYLES.sizes.borderRadius,
            padding: TELEGRAM_UI_STYLES.sizes.padding,
            zIndex: TELEGRAM_UI_STYLES.zIndex.base,
            visible: false
        };
    }
    
    /**
     * Создать HTML элементы
     */
    createElements() {
        this.container = document.createElement('div');
        this.applyStyles();
        document.body.appendChild(this.container);
        
        if (!this.config.visible) {
            this.setVisible(false);
        }
    }
    
    /**
     * Применить стили к контейнеру
     */
    applyStyles() {
        const styles = {
            position: 'absolute',
            left: `${this.x - this.config.width / 2}px`,
            top: `${this.y - this.config.height / 2}px`,
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            minHeight: this.config.height,
            backgroundColor: this.config.backgroundColor,
            borderRadius: this.config.borderRadius,
            border: 'none',
            // display будет установлен в setVisible()
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            fontWeight: this.config.fontWeight,
            lineHeight: TELEGRAM_UI_STYLES.fonts.lineHeight,
            color: this.config.textColor,
            letterSpacing: '0px',
            zIndex: this.config.zIndex,
            boxShadow: TELEGRAM_UI_STYLES.effects.boxShadow,
            userSelect: 'none',
            pointerEvents: 'none',
            padding: this.config.padding,
            transition: TELEGRAM_UI_STYLES.effects.transition,
            backdropFilter: TELEGRAM_UI_STYLES.effects.backdropFilter
        };
        
        Object.assign(this.container.style, styles);
    }
    
    /**
     * Настроить обработчики событий
     */
    setupEventListeners() {
        // Переопределить в дочерних классах
    }
    
    /**
     * Установить видимость
     * @param {boolean} visible - Видимость
     */
    setVisible(visible) {
        if (this.isVisible !== visible) {
            this.isVisible = visible;
            if (visible) {
                this.container.style.display = 'inline-flex';
            } else {
                this.container.style.display = 'none';
            }
        }
    }
    
    /**
     * Установить позицию
     * @param {number} x - X координата
     * @param {number} y - Y координата
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }
    
    /**
     * Обновить позицию относительно Phaser canvas
     */
    updatePosition() {
        if (this.scene && this.scene.game && this.scene.game.canvas) {
            const canvas = this.scene.game.canvas;
            const canvasRect = canvas.getBoundingClientRect();
            
            if (this.lastCanvasPosition.left !== canvasRect.left || 
                this.lastCanvasPosition.top !== canvasRect.top) {
                
                this.lastCanvasPosition.left = canvasRect.left;
                this.lastCanvasPosition.top = canvasRect.top;
                
                this.container.style.left = `${canvasRect.left + this.x - this.config.width / 2}px`;
                this.container.style.top = `${canvasRect.top + this.y - this.config.height / 2}px`;
            }
        }
    }
    
    /**
     * Установить текст
     * @param {string} text - Текст
     */
    setText(text) {
        if (this.textElement && this.textElement.textContent !== text) {
            this.textElement.textContent = text;
        }
    }
    
    /**
     * Установить цвет текста
     * @param {string} color - Цвет
     */
    setTextColor(color) {
        this.config.textColor = color;
        this.container.style.color = color;
    }
    
    /**
     * Установить цвет фона
     * @param {string} color - Цвет
     */
    setBackgroundColor(color) {
        this.config.backgroundColor = color;
        this.container.style.backgroundColor = color;
    }
    
    /**
     * Уничтожить компонент
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}
