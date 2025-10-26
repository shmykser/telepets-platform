import { BaseHTMLComponent } from './BaseHTMLComponent.js';
import { TELEGRAM_UI_STYLES } from '../settings/GameSettings.js';

/**
 * HTML версия кнопки в стиле Telegram WebApp
 * Создает HTML элемент поверх Phaser canvas
 */
export class HTMLButton extends BaseHTMLComponent {
    constructor(scene, x, y, config = {}) {
        const defaultConfig = {
            text: 'Button',
            width: 60,
            height: 18,
            backgroundColor: TELEGRAM_UI_STYLES.colors.background,
            textColor: TELEGRAM_UI_STYLES.colors.text,
            fontSize: TELEGRAM_UI_STYLES.fonts.size,
            fontFamily: TELEGRAM_UI_STYLES.fonts.family,
            fontWeight: TELEGRAM_UI_STYLES.fonts.weight,
            borderRadius: TELEGRAM_UI_STYLES.sizes.borderRadius,
            padding: TELEGRAM_UI_STYLES.sizes.padding,
            zIndex: TELEGRAM_UI_STYLES.zIndex.base,
            interactive: true
        };
        
        super(scene, x, y, { ...defaultConfig, ...config });
        
        this.text = this.config.text;
        this.interactive = this.config.interactive;
        this.onClick = null;
        this.textElement = null;
        
        this.createButtonElements();
        this.setupInteractions();
    }
    
    /**
     * Создать элементы кнопки
     */
    createButtonElements() {
        this.textElement = document.createElement('span');
        this.textElement.textContent = this.text;
        this.textElement.style.textShadow = TELEGRAM_UI_STYLES.effects.textShadow;
        this.textElement.style.textAlign = 'center';
        this.textElement.style.width = '100%';
        this.textElement.style.height = '100%';
        this.textElement.style.display = 'flex';
        this.textElement.style.alignItems = 'center';
        this.textElement.style.justifyContent = 'center';
        this.textElement.style.lineHeight = '1.2';
        //this.textElement.style.whiteSpace = 'nowrap';
        this.textElement.style.overflow = 'hidden';
        this.textElement.style.textOverflow = 'ellipsis';
        
        this.container.appendChild(this.textElement);
    }
    
    /**
     * Настроить взаимодействия
     */
    setupInteractions() {
        if (!this.interactive) return;
        
        // Включаем pointer events
        this.container.style.pointerEvents = 'auto';
        this.container.style.cursor = 'pointer';
        
        // Hover эффекты
        this.container.addEventListener('mouseenter', () => {
            this.container.style.backgroundColor = TELEGRAM_UI_STYLES.colors.backgroundHover;
            this.container.style.boxShadow = TELEGRAM_UI_STYLES.effects.boxShadowHover;
            this.container.style.transform = 'scale(1.02)';
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.container.style.backgroundColor = this.config.backgroundColor;
            this.container.style.boxShadow = TELEGRAM_UI_STYLES.effects.boxShadow;
            this.container.style.transform = 'scale(1)';
        });
        
        // Click эффекты
        this.container.addEventListener('mousedown', () => {
            this.container.style.transform = 'scale(0.98)';
        });
        
        this.container.addEventListener('mouseup', () => {
            this.container.style.transform = 'scale(1.02)';
        });
        
        // Обработчик клика
        this.container.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (this.onClick) {
                this.onClick(event);
            }
            
            // Эмитируем событие
            this.emit('click', { button: this, event });
        });
    }
    
    /**
     * Установить текст кнопки
     * @param {string} text - Текст
     */
    setText(text) {
        this.text = text;
        if (this.textElement) {
            this.textElement.textContent = text;
        }
    }
    
    /**
     * Установить обработчик клика
     * @param {Function} callback - Обработчик
     */
    setOnClick(callback) {
        this.onClick = callback;
    }
    
    /**
     * Установить активность кнопки
     * @param {boolean} active - Активность
     */
    setActive(active) {
        this.interactive = active;
        this.container.style.pointerEvents = active ? 'auto' : 'none';
        this.container.style.cursor = active ? 'pointer' : 'default';
        this.container.style.opacity = active ? '1' : '0.5';
    }
    
    /**
     * Установить стиль кнопки
     * @param {string} style - Стиль (primary, secondary, success, warning, error)
     */
    setStyle(style) {
        const styles = {
            primary: {
                backgroundColor: TELEGRAM_UI_STYLES.colors.primary,
                textColor: TELEGRAM_UI_STYLES.colors.text
            },
            secondary: {
                backgroundColor: TELEGRAM_UI_STYLES.colors.background,
                textColor: TELEGRAM_UI_STYLES.colors.text
            },
            success: {
                backgroundColor: TELEGRAM_UI_STYLES.colors.success,
                textColor: TELEGRAM_UI_STYLES.colors.text
            },
            warning: {
                backgroundColor: TELEGRAM_UI_STYLES.colors.warning,
                textColor: TELEGRAM_UI_STYLES.colors.text
            },
            error: {
                backgroundColor: TELEGRAM_UI_STYLES.colors.error,
                textColor: TELEGRAM_UI_STYLES.colors.text
            }
        };
        
        const buttonStyle = styles[style] || styles.primary;
        this.setBackgroundColor(buttonStyle.backgroundColor);
        this.setTextColor(buttonStyle.textColor);
    }
    
    /**
     * Эмитировать событие
     * @param {string} event - Название события
     * @param {*} data - Данные события
     */
    emit(event, data = null) {
        // Создаем кастомное событие
        const customEvent = new CustomEvent(`htmlButton:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }
}
