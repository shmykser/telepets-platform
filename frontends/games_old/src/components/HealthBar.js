import Phaser from 'phaser';
import { BaseUIComponent } from './BaseUIComponent.js';
import { PropertyUtils } from '../utils/PropertyUtils.js';
import { COLORS, DEPTH_CONSTANTS } from '../settings/GameSettings.js';
/**
 * Универсальный компонент полосы здоровья
 * Может использоваться для врагов, яйца, защиты и любых других объектов
 */
export class HealthBar extends BaseUIComponent {
    constructor(scene, targetObject, options = {}) {
        super(scene, 0, 0, options);
        
        // Используем утилитарную функцию для определения свойств
        PropertyUtils.defineProperty(this, "backgroundBar", undefined);
        PropertyUtils.defineProperty(this, "healthBar", undefined);
        PropertyUtils.defineProperty(this, "borderBar", undefined);
        PropertyUtils.defineProperty(this, "healthText", undefined);
        PropertyUtils.defineProperty(this, "targetObject", undefined);
        // Настройки полосы здоровья - используем утилитарную функцию
        PropertyUtils.defineProperty(this, "barWidth", undefined);
        PropertyUtils.defineProperty(this, "barHeight", undefined);
        PropertyUtils.defineProperty(this, "offsetY", undefined);
        PropertyUtils.defineProperty(this, "offsetX", undefined);
        PropertyUtils.defineProperty(this, "showWhenFull", undefined);
        PropertyUtils.defineProperty(this, "showWhenEmpty", undefined);
        PropertyUtils.defineProperty(this, "showBar", undefined);
        PropertyUtils.defineProperty(this, "showDigits", undefined);
        PropertyUtils.defineProperty(this, "fixed", undefined);
        PropertyUtils.defineProperty(this, "fixedX", undefined);
        PropertyUtils.defineProperty(this, "fixedY", undefined);
        this.targetObject = targetObject;
        // Настройки по умолчанию
        this.barWidth = options.barWidth || this.calculateBarWidth();
        this.barHeight = options.barHeight || 6;
        this.offsetY = options.offsetY || -40;
        this.offsetX = options.offsetX || 0;
        this.showWhenFull = options.showWhenFull || false;
        this.showWhenEmpty = options.showWhenEmpty || true;
        this.showBar = options.showBar !== false; // По умолчанию включено
        this.showDigits = options.showDigits || false; // По умолчанию выключено
        // Настройки фиксированной позиции
        this.fixed = options.fixed || false; // Фиксированная позиция на экране
        this.fixedX = options.fixedX; // Фиксированная координата X
        this.fixedY = options.fixedY; // Фиксированная координата Y
        // Цвета по умолчанию
        const colors = {
            background: COLORS.BLACK,
            health: COLORS.GREEN,
            border: COLORS.WHITE,
            ...options.colors
        };
        // Создаем графические элементы
        this.backgroundBar = scene.add.graphics();
        this.healthBar = scene.add.graphics();
        this.borderBar = scene.add.graphics();
        
        // Создаем текстовый элемент для цифрового отображения
        // Размер шрифта зависит от высоты полосы
        const fontSize = Math.max(10, this.barHeight * 0.8);
        this.healthText = scene.add.text(0, 0, '', {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(1, Math.floor(fontSize / 10))
        }).setOrigin(0.5, 0.5);
        
        // Добавляем в контейнер
        this.add([this.backgroundBar, this.healthBar, this.borderBar, this.healthText]);
        // Настраиваем цвета
        this.setColors(colors);
        // Позиционируем относительно объекта
        this.updatePosition();
        // Устанавливаем высокий depth, чтобы HealthBar был поверх всех объектов
        // Для фиксированных шкал используем еще больший depth
        const depth = this.fixed ? DEPTH_CONSTANTS.HEALTH_BAR + 100 : DEPTH_CONSTANTS.HEALTH_BAR;
        this.setDepth(depth);
        
        // Для фиксированных шкал отключаем скролл камеры
        if (this.fixed) {
            this.setScrollFactor(0, 0);
            console.log(`💚 [HealthBar] Фиксированная шкала создана: позиция (${this.x}, ${this.y}), размер ${this.barWidth}x${this.barHeight}, depth=${depth}`);
        }
        
        // Обновляем отображение
        this.updateHealth();
    }
    /**
     * Вычисляет ширину полосы на основе размера объекта
     */
    calculateBarWidth() {
        const objectWidth = this.targetObject.objectWidth || 64;
        const objectScale = this.targetObject.objectScaleX || 1;
        return Math.max(40, objectWidth * objectScale * 0.8);
    }
    /**
     * Устанавливает цвета полосы здоровья
     */
    setColors(colors) {
        this.backgroundBar.clear();
        this.healthBar.clear();
        this.borderBar.clear();
        // Фон (центрируем по горизонтали)
        this.backgroundBar.fillStyle(colors.background, 0.8);
        this.backgroundBar.fillRect(-this.barWidth / 2, 0, this.barWidth, this.barHeight);
        // Граница (центрируем по горизонтали)
        this.borderBar.lineStyle(1, colors.border, 1);
        this.borderBar.strokeRect(-this.barWidth / 2, 0, this.barWidth, this.barHeight);
    }
    /**
     * Обновляет позицию полосы здоровья относительно объекта или использует фиксированную позицию
     */
    updatePosition() {
        if (this.fixed) {
            // Используем фиксированную позицию на экране
            // Если координаты заданы в процентах (от 0 до 1), вычисляем их от размера камеры
            if (this.fixedX !== undefined && this.fixedX <= 1) {
                this.x = this.scene.cameras.main.width * this.fixedX;
            } else if (this.fixedX !== undefined) {
                this.x = this.fixedX;
            } else {
                this.x = this.scene.cameras.main.centerX;
            }
            
            if (this.fixedY !== undefined && this.fixedY <= 1) {
                this.y = this.scene.cameras.main.height * this.fixedY;
            } else if (this.fixedY !== undefined) {
                this.y = this.fixedY;
            } else {
                this.y = this.scene.cameras.main.height - 30;
            }
        } else {
            // Следуем за объектом
            this.x = this.targetObject.x + this.offsetX;
            this.y = this.targetObject.y + this.offsetY;
        }
    }
    /**
     * Обновляет отображение полосы здоровья
     */
    updateHealth() {
        const healthPercent = this.targetObject.health / this.targetObject.maxHealth;
        
        // Определяем, нужно ли показывать компонент
        const shouldShow = this.shouldShowBar(healthPercent);
        
        // Временный отладочный вывод для фиксированных шкал
        if (this.fixed) {
            console.log(`💚 [HealthBar] updateHealth фиксированной шкалы: shouldShow=${shouldShow}, health=${this.targetObject.health}/${this.targetObject.maxHealth}, visible=${this.visible}`);
        }
        
        this.setVisible(shouldShow);
        if (!shouldShow)
            return;
        
        // Обновляем позицию
        this.updatePosition();
        
        // Обновляем полосу здоровья
        if (this.showBar) {
            this.updateHealthBar(healthPercent);
        } else {
            this.hideHealthBar();
        }
        
        // Обновляем цифровое отображение
        if (this.showDigits) {
            this.updateHealthText();
        } else {
            this.hideHealthText();
        }
    }
    
    /**
     * Обновляет размер полосы здоровья при изменении размера объекта
     */
    updateBarSize() {
        // Пересчитываем ширину на основе нового размера объекта
        this.barWidth = this.calculateBarWidth();
        // Обновляем размер шрифта в зависимости от высоты полосы
        const fontSize = Math.max(10, this.barHeight * 0.8);
        this.healthText.setFontSize(fontSize);
        this.healthText.setStroke('#000000', Math.max(1, Math.floor(fontSize / 10)));
        // Перерисовываем полосу с новыми размерами
        this.setColors({
            background: COLORS.BLACK,
            health: COLORS.GREEN,
            border: COLORS.WHITE
        });
        // Обновляем отображение здоровья
        this.updateHealth();
    }
    /**
     * Определяет, нужно ли показывать полосу здоровья
     */
    shouldShowBar(healthPercent) {
        if (healthPercent <= 0)
            return this.showWhenEmpty;
        if (healthPercent >= 1)
            return this.showWhenFull;
        return true; // Показываем, если здоровье не полное и не пустое
    }
    /**
     * Обновляет полосу здоровья
     */
    updateHealthBar(healthPercent) {
        // Очищаем полосу здоровья
        this.healthBar.clear();
        
        // Вычисляем ширину полосы здоровья
        const healthWidth = this.barWidth * healthPercent;
        
        // Определяем цвет в зависимости от процента здоровья
        const healthColor = this.getHealthColor(healthPercent);
        
        // Рисуем полосу здоровья (центрируем по горизонтали)
        this.healthBar.fillStyle(healthColor, 0.9);
        this.healthBar.fillRect(-this.barWidth / 2, 0, healthWidth, this.barHeight);
    }
    
    /**
     * Скрывает полосу здоровья
     */
    hideHealthBar() {
        this.backgroundBar.clear();
        this.healthBar.clear();
        this.borderBar.clear();
    }
    
    /**
     * Обновляет цифровое отображение здоровья
     */
    updateHealthText() {
        const currentHealth = Math.ceil(this.targetObject.health);
        const maxHealth = Math.ceil(this.targetObject.maxHealth);
        
        this.healthText.setText(`${currentHealth}/${maxHealth}`);
        this.healthText.setVisible(true);
        
        // Позиционируем текст
        if (this.showBar) {
            // Для больших полос (высота >= 16) текст внутри, для маленьких - сверху
            if (this.barHeight >= 16) {
                this.healthText.y = this.barHeight / 2;
            } else {
                this.healthText.y = -this.barHeight - 8;
            }
        } else {
            // Если только цифры - текст по центру
            this.healthText.y = 0;
        }
    }
    
    /**
     * Скрывает цифровое отображение
     */
    hideHealthText() {
        this.healthText.setVisible(false);
    }
    
    /**
     * Определяет цвет полосы здоровья в зависимости от процента
     */
    getHealthColor(healthPercent) {
        if (healthPercent > 0.6)
            return COLORS.GREEN; // Зеленый
        if (healthPercent > 0.3)
            return COLORS.YELLOW; // Желтый
        return COLORS.RED; // Красный
    }
    /**
     * Устанавливает новый целевой объект
     */
    setTargetObject(targetObject) {
        this.targetObject = targetObject;
        this.barWidth = this.calculateBarWidth();
        this.updateHealth();
    }
    /**
     * Обновляет настройки отображения
     */
    updateSettings(options) {
        if (options.showWhenFull !== undefined) {
            this.showWhenFull = options.showWhenFull;
        }
        if (options.showWhenEmpty !== undefined) {
            this.showWhenEmpty = options.showWhenEmpty;
        }
        if (options.offsetY !== undefined) {
            this.offsetY = options.offsetY;
        }
        if (options.offsetX !== undefined) {
            this.offsetX = options.offsetX;
        }
        if (options.showBar !== undefined) {
            this.showBar = options.showBar;
        }
        if (options.showDigits !== undefined) {
            this.showDigits = options.showDigits;
        }
        if (options.fixed !== undefined) {
            this.fixed = options.fixed;
        }
        if (options.fixedX !== undefined) {
            this.fixedX = options.fixedX;
        }
        if (options.fixedY !== undefined) {
            this.fixedY = options.fixedY;
        }
        this.updateHealth();
    }
    /**
     * Уничтожение компонента
     */
    destroy() {
        this.backgroundBar.destroy();
        this.healthBar.destroy();
        this.borderBar.destroy();
        this.healthText.destroy();
        super.destroy();
    }
}
