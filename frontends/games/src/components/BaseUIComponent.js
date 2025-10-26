import Phaser from 'phaser';
import { PropertyUtils } from '../utils/PropertyUtils.js';

/**
 * Базовый класс для UI компонентов
 * Следует принципу Open/Closed Principle
 */
export class BaseUIComponent extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        this.visible = true;
        this.active = true;
        this.alpha = 1;
        this.scale = 1;
        
        // Применяем конфигурацию
        this.applyConfig(config);
        
        // Инициализация компонента
        this.init();
    }

    /**
     * Применяет конфигурацию к компоненту
     * @param {Object} config - Конфигурация
     */
    applyConfig(config) {
        Object.keys(config).forEach(key => {
            if (this.hasOwnProperty(key) || key in this) {
                this[key] = config[key];
            }
        });
    }

    /**
     * Инициализация компонента (переопределяется в наследниках)
     */
    init() {
        // Базовая реализация
    }

    /**
     * Обновление компонента
     * @param {number} time - Время
     * @param {number} delta - Дельта времени
     */
    update(time, delta) {
        if (!this.active) return;
        this.onUpdate(time, delta);
    }

    /**
     * Переопределяемый метод обновления
     * @param {number} time - Время
     * @param {number} delta - Дельта времени
     */
    onUpdate(time, delta) {
        // Переопределяется в наследниках
    }

    /**
     * Показывает компонент
     */
    show() {
        this.visible = true;
        this.onShow();
    }

    /**
     * Скрывает компонент
     */
    hide() {
        this.visible = false;
        this.onHide();
    }

    /**
     * Активирует компонент
     */
    activate() {
        this.active = true;
        this.onActivate();
    }

    /**
     * Деактивирует компонент
     */
    deactivate() {
        this.active = false;
        this.onDeactivate();
    }

    /**
     * Уничтожает компонент
     */
    destroy() {
        this.onDestroy();
        this.scene = null;
    }

    // Переопределяемые методы жизненного цикла
    onShow() {}
    onHide() {}
    onActivate() {}
    onDeactivate() {}
    onDestroy() {}

    /**
     * Устанавливает позицию компонента
     * @param {number} x - X координата
     * @param {number} y - Y координата
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.onPositionChanged(x, y);
    }

    /**
     * Переопределяемый метод изменения позиции
     * @param {number} x - X координата
     * @param {number} y - Y координата
     */
    onPositionChanged(x, y) {
        // Переопределяется в наследниках
    }

    /**
     * Устанавливает альфу компонента
     * @param {number} alpha - Значение альфы (0-1)
     */
    setAlpha(alpha) {
        this.alpha = PropertyUtils.clamp(alpha, 0, 1);
        this.onAlphaChanged(this.alpha);
    }

    /**
     * Переопределяемый метод изменения альфы
     * @param {number} alpha - Значение альфы
     */
    onAlphaChanged(alpha) {
        // Переопределяется в наследниках
    }

    /**
     * Устанавливает масштаб компонента
     * @param {number} scale - Значение масштаба
     */
    setScale(scale) {
        this.scale = PropertyUtils.isPositiveNumber(scale) ? scale : 1;
        this.onScaleChanged(this.scale);
    }

    /**
     * Переопределяемый метод изменения масштаба
     * @param {number} scale - Значение масштаба
     */
    onScaleChanged(scale) {
        // Переопределяется в наследниках
    }

    /**
     * Создает фон для UI элемента
     * @param {number} width - Ширина
     * @param {number} height - Высота
     * @param {number} color - Цвет
     * @param {number} alpha - Прозрачность
     * @param {number} strokeColor - Цвет рамки
     * @param {number} strokeWidth - Толщина рамки
     */
    createBackground(width, height, color = 0x000000, alpha = 0.8, strokeColor = 0xffffff, strokeWidth = 2) {
        const background = this.scene.add.rectangle(0, 0, width, height, color, alpha);
        if (strokeColor && strokeWidth > 0) {
            background.setStrokeStyle(strokeWidth, strokeColor);
        }
        this.add(background);
        return background;
    }

    /**
     * Создает текст для UI элемента
     * @param {string} text - Текст
     * @param {Object} options - Опции текста
     */
    createText(text, options = {}) {
        const defaultOptions = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        };
        
        const textObject = this.scene.add.text(0, 0, text, { ...defaultOptions, ...options });
        textObject.setOrigin(0.5);
        this.add(textObject);
        return textObject;
    }

    /**
     * Создает прогресс-бар
     * @param {number} width - Ширина
     * @param {number} height - Высота
     * @param {number} progress - Прогресс (0-1)
     * @param {number} color - Цвет
     */
    createProgressBar(width, height, progress = 1, color = 0x00ff00) {
        const progressBar = this.scene.add.rectangle(0, 0, width * progress, height, color);
        this.add(progressBar);
        return progressBar;
    }

    /**
     * Создает контейнер с автоматическим добавлением в сцену
     */
    createContainer() {
        this.scene.add.existing(this);
        return this;
    }

    /**
     * Устанавливает интерактивность
     * @param {boolean} interactive - Интерактивность
     */
    setInteractive(interactive = true) {
        if (interactive) {
            this.setInteractive();
        } else {
            this.disableInteractive();
        }
    }

    /**
     * Устанавливает размеры компонента
     * @param {number} width - Ширина
     * @param {number} height - Высота
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.onSizeChanged(width, height);
    }

    /**
     * Переопределяемый метод изменения размера
     * @param {number} width - Ширина
     * @param {number} height - Высота
     */
    onSizeChanged(width, height) {
        // Переопределяется в наследниках
    }

    /**
     * Устанавливает видимость компонента
     * @param {boolean} visible - Видимость
     */
    setVisible(visible) {
        this.visible = visible;
        this.onVisibilityChanged(visible);
    }

    /**
     * Переопределяемый метод изменения видимости
     * @param {boolean} visible - Видимость
     */
    onVisibilityChanged(visible) {
        // Переопределяется в наследниках
    }
}
