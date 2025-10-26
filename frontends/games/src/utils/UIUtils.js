import Phaser from 'phaser';

/**
 * Утилиты для создания UI элементов
 * Следует принципу Single Responsibility Principle
 */
export class UIUtils {
    /**
     * Создает фон для UI элемента
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} width - Ширина
     * @param {number} height - Высота
     * @param {number} color - Цвет
     * @param {number} alpha - Прозрачность
     * @param {number} strokeColor - Цвет рамки
     * @param {number} strokeWidth - Толщина рамки
     * @returns {Phaser.GameObjects.Rectangle}
     */
    static createBackground(scene, width, height, color = 0x000000, alpha = 0.8, strokeColor = 0xffffff, strokeWidth = 2) {
        const background = scene.add.rectangle(0, 0, width, height, color, alpha);
        if (strokeColor && strokeWidth > 0) {
            background.setStrokeStyle(strokeWidth, strokeColor);
        }
        return background;
    }

    /**
     * Создает текст для UI элемента
     * @param {Phaser.Scene} scene - Сцена
     * @param {string} text - Текст
     * @param {Object} options - Опции текста
     * @returns {Phaser.GameObjects.Text}
     */
    static createText(scene, text, options = {}) {
        const defaultOptions = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        };
        
        const textObject = scene.add.text(0, 0, text, { ...defaultOptions, ...options });
        textObject.setOrigin(0.5);
        return textObject;
    }

    /**
     * Создает прогресс-бар
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} width - Ширина
     * @param {number} height - Высота
     * @param {number} progress - Прогресс (0-1)
     * @param {number} color - Цвет
     * @returns {Phaser.GameObjects.Rectangle}
     */
    static createProgressBar(scene, width, height, progress = 1, color = 0x00ff00) {
        const progressBar = scene.add.rectangle(0, 0, width * progress, height, color);
        return progressBar;
    }

    /**
     * Создает кнопку с фоном и текстом
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {string} text - Текст кнопки
     * @param {Object} options - Опции кнопки
     * @returns {Object} Объект с background и text
     */
    static createButton(scene, x, y, text, options = {}) {
        const defaultOptions = {
            width: 200,
            height: 50,
            backgroundColor: 0x4a4a4a,
            textColor: '#ffffff',
            fontSize: '16px',
            fontFamily: 'Arial',
            strokeColor: 0xffffff,
            strokeWidth: 2
        };

        const config = { ...defaultOptions, ...options };
        
        const background = this.createBackground(
            scene, 
            config.width, 
            config.height, 
            config.backgroundColor, 
            1, 
            config.strokeColor, 
            config.strokeWidth
        );
        
        const textObject = this.createText(scene, text, {
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            color: config.textColor
        });
        
        background.setPosition(x, y);
        textObject.setPosition(x, y);
        
        return { background, text: textObject };
    }

    /**
     * Создает индикатор с фоном и текстом
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {string} text - Текст индикатора
     * @param {Object} options - Опции индикатора
     * @returns {Object} Объект с background и text
     */
    static createIndicator(scene, x, y, text, options = {}) {
        const defaultOptions = {
            width: 250,
            height: 70,
            backgroundColor: 0x000000,
            textColor: '#ffffff',
            fontSize: '18px',
            fontFamily: 'Arial',
            strokeColor: 0xffffff,
            strokeWidth: 2
        };

        const config = { ...defaultOptions, ...options };
        
        const background = this.createBackground(
            scene, 
            config.width, 
            config.height, 
            config.backgroundColor, 
            0.8, 
            config.strokeColor, 
            config.strokeWidth
        );
        
        const textObject = this.createText(scene, text, {
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            color: config.textColor
        });
        
        background.setPosition(x, y);
        textObject.setPosition(x, y);
        
        return { background, text: textObject };
    }

    /**
     * Создает таймер с фоном и текстом
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {string} text - Текст таймера
     * @param {Object} options - Опции таймера
     * @returns {Object} Объект с background, text и statusBar
     */
    static createTimer(scene, x, y, text, options = {}) {
        const defaultOptions = {
            width: 150,
            height: 45,
            backgroundColor: 0x000000,
            textColor: '#ffffff',
            fontSize: '24px',
            fontFamily: 'Arial',
            strokeColor: 0xffffff,
            strokeWidth: 2,
            statusBarColor: 0x00ff00
        };

        const config = { ...defaultOptions, ...options };
        
        const background = this.createBackground(
            scene, 
            config.width, 
            config.height, 
            config.backgroundColor, 
            0.8, 
            config.strokeColor, 
            config.strokeWidth
        );
        
        const textObject = this.createText(scene, text, {
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            color: config.textColor
        });
        
        const statusBar = this.createProgressBar(
            scene, 
            config.width, 
            4, 
            1, 
            config.statusBarColor
        );
        
        background.setPosition(x, y);
        textObject.setPosition(x, y);
        statusBar.setPosition(x, y + 22);
        
        
        return { background, text: textObject, statusBar };
    }

    /**
     * Создает полосу здоровья
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} width - Ширина
     * @param {number} height - Высота
     * @param {Object} options - Опции полосы
     * @returns {Object} Объект с background, health и border
     */
    static createHealthBar(scene, width, height, options = {}) {
        const defaultOptions = {
            backgroundColor: 0x000000,
            healthColor: 0x00ff00,
            borderColor: 0xffffff,
            alpha: 0.8
        };

        const config = { ...defaultOptions, ...options };
        
        const background = scene.add.graphics();
        const health = scene.add.graphics();
        const border = scene.add.graphics();
        
        // Фон
        background.fillStyle(config.backgroundColor, config.alpha);
        background.fillRect(-width / 2, 0, width, height);
        
        // Граница
        border.lineStyle(1, config.borderColor, 1);
        border.strokeRect(-width / 2, 0, width, height);
        
        return { background, health, border };
    }

    /**
     * Создает индикатор урона
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {string} text - Текст урона
     * @param {Object} options - Опции индикатора
     * @returns {Phaser.GameObjects.Text}
     */
    static createDamageIndicator(scene, x, y, text, options = {}) {
        // Проверяем, что сцена готова и WebGL контекст доступен
        if (!scene || !scene.sys || !scene.sys.game || !scene.sys.game.canvas) {
            return null;
        }

        const defaultOptions = {
            fontSize: '24px',
            color: '#ff0000',
            strokeColor: '#000000',
            strokeThickness: 2,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const textObject = scene.add.text(x, y, text, {
                fontSize: config.fontSize,
                fill: config.color,
                stroke: config.strokeColor,
                strokeThickness: config.strokeThickness,
                fontFamily: config.fontFamily,
                fontStyle: config.fontStyle
            });
            
            textObject.setOrigin(0.5, 0.5);
            return textObject;
        } catch (error) {
            // Если не удалось создать текст, возвращаем null
            return null;
        }
    }

    /**
     * Создает контейнер с автоматическим добавлением в сцену
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @returns {Phaser.GameObjects.Container}
     */
    static createContainer(scene, x, y) {
        const container = scene.add.container(x, y);
        scene.add.existing(container);
        return container;
    }

    /**
     * Устанавливает интерактивность для объекта
     * @param {Phaser.GameObjects.GameObject} object - Объект
     * @param {boolean} interactive - Интерактивность
     */
    static setInteractive(object, interactive = true) {
        if (interactive) {
            object.setInteractive();
        } else {
            object.disableInteractive();
        }
    }

    /**
     * Создает анимированный элемент
     * @param {Phaser.Scene} scene - Сцена
     * @param {Phaser.GameObjects.GameObject} object - Объект
     * @param {Object} animationConfig - Конфигурация анимации
     * @returns {Phaser.Tweens.Tween}
     */
    static createAnimation(scene, object, animationConfig) {
        return scene.tweens.add({
            targets: object,
            ...animationConfig
        });
    }
}
