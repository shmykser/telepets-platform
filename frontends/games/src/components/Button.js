import { BaseUIComponent } from './BaseUIComponent.js';
import { UI_CONSTANTS } from '../settings/GameSettings.js';

/**
 * Компонент кнопки
 * Следует принципу Single Responsibility Principle
 */
export class Button extends BaseUIComponent {
    constructor(scene, x, y, config = {}) {
        const defaultConfig = {
            width: UI_CONSTANTS.BUTTON.DEFAULT_WIDTH,
            height: UI_CONSTANTS.BUTTON.DEFAULT_HEIGHT,
            text: 'Button',
            backgroundColor: UI_CONSTANTS.BUTTON.DEFAULT_BACKGROUND_COLOR,
            textColor: UI_CONSTANTS.BUTTON.DEFAULT_TEXT_COLOR,
            fontSize: UI_CONSTANTS.BUTTON.DEFAULT_FONT_SIZE,
            fontFamily: UI_CONSTANTS.BUTTON.DEFAULT_FONT_FAMILY,
            borderRadius: UI_CONSTANTS.BUTTON.DEFAULT_BORDER_RADIUS,
            padding: UI_CONSTANTS.BUTTON.DEFAULT_PADDING,
            interactive: true
        };

        super(scene, x, y, { ...defaultConfig, ...config });
    }

    init() {
        this.createButton();
        this.setupInteractions();
    }

    createButton() {
        // Создаем фон кнопки
        this.background = this.scene.add.graphics();
        this.background.x = this.x;
        this.background.y = this.y;
        
        // Создаем текст кнопки
        this.text = this.scene.add.text(this.x, this.y, this.text, {
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fill: this.textColor,
            align: 'center'
        });
        this.text.setOrigin(0.5, 0.5);

        // Рисуем фон
        this.drawBackground();
    }

    drawBackground() {
        this.background.clear();
        this.background.fillStyle(this.backgroundColor);
        this.background.fillRoundedRect(
            -this.width / 2, 
            -this.height / 2, 
            this.width, 
            this.height, 
            this.borderRadius
        );
    }

    setupInteractions() {
        if (!this.interactive) return;

        // Создаем невидимую область для взаимодействия
        this.hitArea = this.scene.add.rectangle(
            this.x, 
            this.y, 
            this.width, 
            this.height, 
            0x000000, 
            0
        );
        this.hitArea.setInteractive();

        // Обработчики событий
        this.hitArea.on('pointerover', () => this.onHover());
        this.hitArea.on('pointerout', () => this.onHoverOut());
        this.hitArea.on('pointerdown', () => this.onClick());
        this.hitArea.on('pointerup', () => this.onClickUp());
    }

    onHover() {
        // Базовая логика при наведении
        // Анимации можно добавить через EffectSystem при необходимости
    }

    onHoverOut() {
        // Базовая логика при уходе курсора
        // Анимации можно добавить через EffectSystem при необходимости
    }

    onClick() {
        // Вызываем пользовательский обработчик
        if (this.onButtonClick) {
            this.onButtonClick();
        }
    }

    onClickUp() {
        // Дополнительная логика при отпускании кнопки
    }

    setText(text) {
        this.text = text;
        this.text.setText(text);
    }

    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.drawBackground();
    }

    setTextColor(color) {
        this.textColor = color;
        this.text.setStyle({ fill: color });
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.drawBackground();
        
        if (this.hitArea) {
            this.hitArea.setSize(width, height);
        }
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        
        if (this.background) {
            this.background.x = x;
            this.background.y = y;
        }
        
        if (this.text) {
            this.text.x = x;
            this.text.y = y;
        }
        
        if (this.hitArea) {
            this.hitArea.x = x;
            this.hitArea.y = y;
        }
    }

    setAlpha(alpha) {
        super.setAlpha(alpha);
        
        if (this.background) {
            this.background.alpha = alpha;
        }
        
        if (this.text) {
            this.text.alpha = alpha;
        }
        
        if (this.hitArea) {
            this.hitArea.alpha = alpha;
        }
    }

    setScale(scale) {
        super.setScale(scale);
        
        if (this.background) {
            this.background.setScale(scale);
        }
        
        if (this.text) {
            this.text.setScale(scale);
        }
        
        if (this.hitArea) {
            this.hitArea.setScale(scale);
        }
    }

    destroy() {
        if (this.background) {
            this.background.destroy();
        }
        
        if (this.text) {
            this.text.destroy();
        }
        
        if (this.hitArea) {
            this.hitArea.destroy();
        }
        
        super.destroy();
    }
}