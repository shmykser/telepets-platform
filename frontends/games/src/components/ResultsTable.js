import { BaseUIComponent } from './BaseUIComponent.js';
import { UI_THEME, getColor, getFontSize, getSpacing } from '../utils/UITheme.js';

/**
 * Компонент таблицы результатов игры
 * Следует принципу Single Responsibility Principle
 */
export class ResultsTable extends BaseUIComponent {
    constructor(scene, x, y, config = {}) {
        const defaultConfig = {
            title: 'Game Results',
            data: {}, // Объект {ключ: значение}
            width: 350,
            height: 200,
            backgroundColor: 0x000000,
            backgroundAlpha: 0.8,
            borderColor: 0xffffff,
            borderWidth: 2,
            borderRadius: 10,
            titleColor: '#ffffff',
            titleFontSize: '24px',
            titleFontFamily: 'Arial',
            textColor: '#ffffff',
            textFontSize: '18px',
            textFontFamily: 'Arial',
            padding: 15,
            rowSpacing: 25,
            titleMargin: 10
        };

        super(scene, x, y, { ...defaultConfig, ...config });
    }

    init() {
        console.log('ResultsTable init:', this.title, this.data);
        this.createTable();
        console.log('ResultsTable created with', this.components?.length || 0, 'components');
    }

    createTable() {
        console.log('Creating table with data:', this.data);
        
        // Создаем фон таблицы
        this.background = this.scene.add.graphics();
        this.drawBackground();

        // Создаем заголовок
        this.createTitle();

        // Создаем строки данных
        this.createDataRows();

        // Добавляем все элементы в контейнер
        this.add(this.background);
        if (this.titleText) this.add(this.titleText);
        this.dataTexts.forEach(text => this.add(text));

        // Добавляем контейнер в сцену
        this.scene.add.existing(this);
        
        // Устанавливаем глубину для корректного отображения
        this.setDepth(100);
        
        console.log('Table created successfully, visible:', this.visible, 'alpha:', this.alpha);
    }

    drawBackground() {
        this.background.clear();
        this.background.fillStyle(this.backgroundColor, this.backgroundAlpha);
        this.background.lineStyle(this.borderWidth, this.borderColor);
        this.background.fillRoundedRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height,
            this.borderRadius
        );
        this.background.strokeRoundedRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height,
            this.borderRadius
        );
    }

    createTitle() {
        this.titleText = this.scene.add.text(
            this.x,
            this.y - this.height / 2 + this.padding + this.titleMargin,
            this.title,
            {
                fontSize: this.titleFontSize,
                fontFamily: this.titleFontFamily,
                fill: this.titleColor,
                align: 'center'
            }
        );
        this.titleText.setOrigin(0.5, 0);
    }

    createDataRows() {
        this.dataTexts = [];
        const entries = Object.entries(this.data);
        
        if (entries.length === 0) {
            // Если нет данных, показываем сообщение
            const noDataText = this.scene.add.text(
                this.x,
                this.y,
                'Нет данных',
                {
                    fontSize: this.textFontSize,
                    fontFamily: this.textFontFamily,
                    fill: this.textColor,
                    align: 'center'
                }
            );
            noDataText.setOrigin(0.5, 0.5);
            this.dataTexts.push(noDataText);
            return;
        }

        // Вычисляем начальную позицию для данных
        const startY = this.y - this.height / 2 + this.padding + this.titleMargin + 
                      this.titleText.height + this.titleMargin;
        
        entries.forEach(([key, value], index) => {
            const y = startY + (index * this.rowSpacing);
            
            const rowText = this.scene.add.text(
                this.x,
                y,
                `${key}: ${value}`,
                {
                    fontSize: this.textFontSize,
                    fontFamily: this.textFontFamily,
                    fill: this.textColor,
                    align: 'center'
                }
            );
            rowText.setOrigin(0.5, 0);
            this.dataTexts.push(rowText);
        });
    }

    /**
     * Обновляет данные таблицы
     * @param {Object} newData - Новые данные {ключ: значение}
     */
    updateData(newData) {
        this.data = newData;
        this.recreateTable();
    }

    /**
     * Обновляет заголовок таблицы
     * @param {string} newTitle - Новый заголовок
     */
    updateTitle(newTitle) {
        this.title = newTitle;
        if (this.titleText) {
            this.titleText.setText(newTitle);
        }
    }

    /**
     * Пересоздает таблицу с новыми данными
     */
    recreateTable() {
        // Удаляем старые текстовые элементы
        this.dataTexts.forEach(text => {
            if (text) text.destroy();
        });
        this.dataTexts = [];

        // Пересоздаем строки данных
        this.createDataRows();
        
        // Добавляем новые текстовые элементы в контейнер
        this.dataTexts.forEach(text => this.add(text));
    }

    /**
     * Устанавливает размеры таблицы
     * @param {number} width - Ширина
     * @param {number} height - Высота
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.drawBackground();
        this.recreateTable();
    }

    /**
     * Устанавливает цвет фона
     * @param {number} color - Цвет фона
     * @param {number} alpha - Прозрачность
     */
    setBackgroundColor(color, alpha = 0.8) {
        this.backgroundColor = color;
        this.backgroundAlpha = alpha;
        this.drawBackground();
    }

    /**
     * Устанавливает цвет текста
     * @param {string} color - Цвет текста
     */
    setTextColor(color) {
        this.textColor = color;
        this.dataTexts.forEach(text => {
            if (text) text.setStyle({ fill: color });
        });
    }

    /**
     * Устанавливает цвет заголовка
     * @param {string} color - Цвет заголовка
     */
    setTitleColor(color) {
        this.titleColor = color;
        if (this.titleText) {
            this.titleText.setStyle({ fill: color });
        }
    }

    /**
     * Анимированное появление таблицы
     * @param {number} duration - Длительность анимации
     */
    showAnimated(duration = 500) {
        this.setAlpha(0);
        this.setScale(0.8);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: duration,
            ease: 'Back.easeOut'
        });
    }

    /**
     * Анимированное исчезновение таблицы
     * @param {number} duration - Длительность анимации
     */
    hideAnimated(duration = 300) {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: duration,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }

    destroy() {
        // Уничтожаем все текстовые элементы
        if (this.titleText) {
            this.titleText.destroy();
        }
        
        this.dataTexts.forEach(text => {
            if (text) text.destroy();
        });
        
        if (this.background) {
            this.background.destroy();
        }
        
        super.destroy();
    }
}

/**
 * Создает таблицу результатов с предустановленными стилями
 * @param {Phaser.Scene} scene - Сцена
 * @param {number} x - X координата
 * @param {number} y - Y координата
 * @param {string} title - Заголовок
 * @param {Object} data - Данные {ключ: значение}
 * @param {Object} style - Стиль (опционально)
 * @returns {ResultsTable} Экземпляр таблицы результатов
 */
export function createResultsTable(scene, x, y, title, data, style = {}) {
    const defaultStyle = {
        title: title,
        data: data,
        backgroundColor: 0x1a1a2e,
        backgroundAlpha: 0.9,
        borderColor: 0x4a4a6a,
        borderWidth: 2,
        borderRadius: 12,
        titleColor: '#ffffff',
        titleFontSize: '28px',
        textColor: '#e0e0e0',
        textFontSize: '20px',
        padding: 20,
        rowSpacing: 30
    };

    return new ResultsTable(scene, x, y, { ...defaultStyle, ...style });
}
