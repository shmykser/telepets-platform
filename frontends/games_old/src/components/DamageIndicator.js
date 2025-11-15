import Phaser from 'phaser';
import { BaseUIComponent } from './BaseUIComponent.js';
import { UIUtils } from '../utils/UIUtils.js';
import { UI_THEME } from '../utils/UITheme.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';
import { UI_CONSTANTS } from '../settings/GameSettings.js';

/**
 * Компонент для отображения цифрового урона
 * Показывает текст с уроном над объектом
 */
export class DamageIndicator extends BaseUIComponent {
    constructor(scene, x, y, damage, options = {}) {
        const defaultConfig = {
            duration: UI_CONSTANTS.DAMAGE_INDICATOR.DEFAULT_DURATION,
            driftDistance: UI_CONSTANTS.DAMAGE_INDICATOR.DEFAULT_DRIFT_DISTANCE,
            fontSize: UI_THEME.sizes.damageIndicator.fontSize,
            color: UI_THEME.colors.error,
            strokeColor: UI_THEME.colors.secondary,
            strokeThickness: UI_THEME.spacing.border.width,
            fontFamily: UI_THEME.fonts.family,
            fontStyle: UI_THEME.fonts.style.bold
        };
        
        super(scene, x, y, { ...defaultConfig, ...options });
        
        this.damage = damage;
        
        // Создаем текст с уроном через UIUtils
        this.damageText = UIUtils.createDamageIndicator(
            scene, 
            0, 
            0, 
            `-${damage}`, 
            {
                fontSize: this.fontSize,
                color: this.color,
                strokeColor: this.strokeColor,
                strokeThickness: this.strokeThickness,
                fontFamily: this.fontFamily,
                fontStyle: this.fontStyle
            }
        );

        // Если не удалось создать текст, создаем простой fallback
        if (!this.damageText) {
            this.damageText = scene.add.text(0, 0, `-${damage}`, {
                fontSize: this.fontSize,
                fill: this.color,
                fontFamily: this.fontFamily
            });
            this.damageText.setOrigin(0.5, 0.5);
        }
        
        // Добавляем текст в контейнер
        this.add(this.damageText);
        
        // Создаем контейнер с автоматическим добавлением в сцену
        this.createContainer();
        
        // Запускаем простой эффект без анимации
        this.startEffect();
    }
    
    /**
     * Запускает простой эффект без анимации
     */
    startEffect() {
        // Простой таймер для автоудаления
        this.scene.time.delayedCall(this.duration, () => {
            this.destroy();
        });
    }
    
    /**
     * Статический метод для создания индикатора урона
     */
    static showDamage(scene, target, damage, options = {}) {
        // Позиция над объектом
        const x = target.x;
        const y = target.y - (target.displayHeight / 2) - 20;
        
        // Создаем индикатор
        return new DamageIndicator(scene, x, y, damage, options);
    }
    
    /**
     * Статический метод для показа урона с случайным смещением
     */
    static showDamageWithOffset(scene, target, damage, options = {}) {
        // Проверяем, что сцена и цель доступны
        if (!scene || !target) {
            return null;
        }

        // Случайное смещение по X для избежания наложения
        const offsetX = GeometryUtils.randomBetween(-20, 20);
        const x = target.x + offsetX;
        const y = target.y - (target.displayHeight / 2) - 20;
        
        try {
            // Создаем индикатор
            return new DamageIndicator(scene, x, y, damage, options);
        } catch (error) {
            // Если не удалось создать индикатор, возвращаем null
            return null;
        }
    }
    
    /**
     * Переопределяем метод уничтожения
     */
    onDestroy() {
        if (this.damageText) {
            this.damageText.destroy();
        }
    }
}