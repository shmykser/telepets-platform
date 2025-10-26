import { BaseHTMLComponent } from './BaseHTMLComponent.js';
import { TELEGRAM_UI_STYLES, UI_CONSTANTS } from '../settings/GameSettings.js';

/**
 * HTML версия отображения способностей в стиле Telegram WebApp
 * Создает HTML элемент поверх Phaser canvas
 */
export class HTMLAbilitiesDisplay extends BaseHTMLComponent {
    constructor(scene, x, y, abilitySystem, config = {}) {
        const defaultConfig = {
            width: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_WIDTH,
            height: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_HEIGHT,
            backgroundColor: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_BACKGROUND_COLOR,
            textColor: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_TEXT_COLOR,
            fontSize: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_FONT_SIZE,
            fontFamily: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_FONT_FAMILY,
            borderRadius: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_BORDER_RADIUS,
            padding: UI_CONSTANTS.ABILITIES_DISPLAY.DEFAULT_PADDING,
            zIndex: TELEGRAM_UI_STYLES.zIndex.base,
            visible: false // Скрыта по умолчанию
        };
        
        super(scene, x, y, { ...defaultConfig, ...config });
        
        this.abilitySystem = abilitySystem;
        this.titleElement = null;
        this.statsContainer = null;
        this.isVisible = false;
        
        this.createDisplayElements();
        
        // Обновляем значения только если abilitySystem готов
        if (this.abilitySystem && typeof this.abilitySystem.getAllAbilities === 'function') {
            this.updateValues();
        } else {
            // Если abilitySystem еще не готов, создаем заглушку
            this.createPlaceholder();
        }
        
        // Убеждаемся, что таблица скрыта по умолчанию
        this.setVisible(false);
        console.log('🎨 [HTMLAbilitiesDisplay] Таблица создана и скрыта, isVisible:', this.isVisible);
    }
    
    /**
     * Создать элементы отображения
     */
    createDisplayElements() {
        // Создаем заголовок
        this.titleElement = document.createElement('div');
        this.titleElement.textContent = 'Способности';
        this.titleElement.style.fontSize = TELEGRAM_UI_STYLES.fonts.size;
        this.titleElement.style.fontWeight = TELEGRAM_UI_STYLES.fonts.weightBold;
        this.titleElement.style.color = TELEGRAM_UI_STYLES.colors.text;
        this.titleElement.style.textAlign = 'center';
        this.titleElement.style.marginBottom = '8px';
        this.titleElement.style.textShadow = TELEGRAM_UI_STYLES.effects.textShadow;
        
        // Создаем контейнер для статистики
        this.statsContainer = document.createElement('div');
        this.statsContainer.style.display = 'flex';
        this.statsContainer.style.flexDirection = 'column';
        this.statsContainer.style.gap = '4px';
        
        // Добавляем элементы в контейнер
        this.container.appendChild(this.titleElement);
        this.container.appendChild(this.statsContainer);
        
        // Изменяем стили контейнера для вертикального расположения
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'flex-start';
        this.container.style.justifyContent = 'flex-start';
        this.container.style.padding = '12px';
    }
    
    /**
     * Обновить значения способностей
     */
    updateValues() {
        if (!this.abilitySystem || !this.statsContainer) return;
        
        // Проверяем, что метод getAllAbilities существует
        if (typeof this.abilitySystem.getAllAbilities !== 'function') {
            console.warn('🎨 [HTMLAbilitiesDisplay] abilitySystem.getAllAbilities не найден, используем заглушку');
            this.createPlaceholder();
            return;
        }
        
        // Очищаем предыдущие элементы
        this.statsContainer.innerHTML = '';
        
        // Получаем текущие способности
        const abilities = this.abilitySystem.getAllAbilities();
        
        // Создаем элементы для каждой способности
        Object.entries(abilities).forEach(([key, value]) => {
            const statElement = document.createElement('div');
            statElement.style.display = 'flex';
            statElement.style.justifyContent = 'space-between';
            statElement.style.width = '100%';
            statElement.style.fontSize = TELEGRAM_UI_STYLES.fonts.sizeSmall;
            statElement.style.color = TELEGRAM_UI_STYLES.colors.text;
            statElement.style.fontFamily = TELEGRAM_UI_STYLES.fonts.family;
            
            const label = this.getAbilityLabel(key);
            const displayValue = this.formatValue(value);
            
            statElement.innerHTML = `
                <span style="color: ${TELEGRAM_UI_STYLES.colors.textSecondary}">${label}:</span>
                <span style="color: ${TELEGRAM_UI_STYLES.colors.text}">${displayValue}</span>
            `;
            
            this.statsContainer.appendChild(statElement);
        });
    }
    
    /**
     * Получить название способности
     * @param {string} key - Ключ способности
     * @returns {string} Название
     */
    getAbilityLabel(key) {
        const labels = {
            tapDamage: 'Урон тапа',
            tapExplosion: 'Взрыв тапа',
            tapExplosionDamage: 'Урон взрыва',
            eggMaxHealth: 'Здоровье яйца',
            eggDamage: 'Урон яйца',
            eggCooldown: 'Кулдаун',
            eggRadius: 'Радиус',
            luck: 'Удача',
            pitCount: 'Ямы',
            shovelCount: 'Лопаты',
            aura: 'Аура',
            auraDamage: 'Урон ауры',
            eggExplosion: 'Взрыв яйца',
            eggExplosionDamage: 'Урон взрыва яйца',
            eggExplosionRadius: 'Радиус взрыва яйца',
            eggExplosionCooldown: 'Кулдаун взрыва яйца'
        };
        
        return labels[key] || key;
    }
    
    /**
     * Форматировать значение
     * @param {*} value - Значение
     * @returns {string} Отформатированное значение
     */
    formatValue(value) {
        if (typeof value === 'number') {
            if (value % 1 === 0) {
                return value.toString();
            } else {
                return value.toFixed(1);
            }
        }
        return value.toString();
    }
    
    /**
     * Показать/скрыть отображение
     * @param {boolean} visible - Видимость
     */
    show(visible = true) {
        this.setVisible(visible);
    }
    
    /**
     * Скрыть отображение
     */
    hide() {
        this.setVisible(false);
    }
    
    /**
     * Создать заглушку пока abilitySystem не готов
     */
    createPlaceholder() {
        if (!this.statsContainer) return;
        
        this.statsContainer.innerHTML = '';
        
        const placeholderElement = document.createElement('div');
        placeholderElement.textContent = 'Загрузка...';
        placeholderElement.style.fontSize = TELEGRAM_UI_STYLES.fonts.sizeSmall;
        placeholderElement.style.color = TELEGRAM_UI_STYLES.colors.textSecondary;
        placeholderElement.style.fontFamily = TELEGRAM_UI_STYLES.fonts.family;
        placeholderElement.style.textAlign = 'center';
        placeholderElement.style.width = '100%';
        
        this.statsContainer.appendChild(placeholderElement);
    }
    
    /**
     * Обновить отображение
     */
    update() {
        // Проверяем, готов ли abilitySystem
        if (this.abilitySystem && typeof this.abilitySystem.getAllAbilities === 'function') {
            this.updateValues();
        }
        this.updatePosition();
    }
}
