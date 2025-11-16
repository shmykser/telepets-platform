import Phaser from 'phaser';

/**
 * Компонент отображения текущих способностей
 * Показывает компактную табличку с характеристиками во время игры
 */
export class AbilitiesDisplay extends Phaser.GameObjects.Container {
    constructor(scene, x, y, abilitySystem, config = {}) {
        super(scene, x, y);
        
        // Сохраняем ссылку на систему способностей
        this.abilitySystem = abilitySystem;
        
        // Настройки отображения
        this.displayConfig = {
            width: 180,
            height: 200,  // Увеличиваем высоту для нового поля
            backgroundColor: 0x000000,
            backgroundAlpha: 0.8,
            borderColor: 0x00ff00,
            borderWidth: 2,
            textColor: '#ffffff',
            fontSize: '10px',
            padding: 6,
            lineHeight: 10,
            ...config
        };
        
        // Создаем UI элементы
        this.createDisplayElements();
        
        // Обновляем значения
        this.updateValues();
        
        // Добавляем в сцену
        scene.add.existing(this);
    }
    
    /**
     * Создает элементы отображения
     */
    createDisplayElements() {
        const cfg = this.displayConfig;
        
        // Фон
        this.background = this.scene.add.rectangle(0, 0, cfg.width, cfg.height, cfg.backgroundColor, cfg.backgroundAlpha);
        this.background.setStrokeStyle(cfg.borderWidth, cfg.borderColor);
        this.add(this.background);
        
        // Заголовок
        this.titleText = this.scene.add.text(0, -cfg.height/2 + 15, 'СПОСОБНОСТИ', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffff00',
            fontFamily: 'Arial'
        });
        this.titleText.setOrigin(0.5, 0.5);
        this.add(this.titleText);
        
        // Создаем текстовые элементы для каждой характеристики
        this.abilityTexts = {};
        const abilities = this.getDisplayAbilities();
        
        abilities.forEach((ability, index) => {
            const y = -cfg.height/2 + 35 + (index * cfg.lineHeight);
            
            // Иконка и название (уменьшили отступ)
            const labelText = this.scene.add.text(-cfg.width/2 + cfg.padding + 5, y, `${ability.icon} ${ability.name}:`, {
                fontSize: cfg.fontSize,
                color: cfg.textColor,
                fontFamily: 'Arial'
            });
            labelText.setOrigin(0, 0.5);
            this.add(labelText);
            
            // Значение (приблизили к названию)
            const valueText = this.scene.add.text(cfg.width/2 - cfg.padding - 5, y, '0', {
                fontSize: cfg.fontSize,
                color: '#00ff00',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            });
            valueText.setOrigin(1, 0.5);
            this.add(valueText);
            
            this.abilityTexts[ability.key] = {
                label: labelText,
                value: valueText
            };
        });
    }
    
    /**
     * Получает список способностей для отображения
     */
    getDisplayAbilities() {
        return [
            {
                key: 'tapDamage',
                name: 'Урон тапа',
                icon: '⚔️'
            },
            {
                key: 'tapExplosion',
                name: 'Взрыв тапа',
                icon: '💥'
            },
            {
                key: 'tapExplosionDamage',
                name: 'Урон взрыва',
                icon: '💥'
            },
            {
                key: 'eggMaxHealth',
                name: 'Здоровье яйца',
                icon: '❤️'
            },
            {
                key: 'eggDamage',
                name: 'Урон яйца',
                icon: '🥚'
            },
            {
                key: 'eggCooldown',
                name: 'Кулдаун',
                icon: '⏱️'
            },
            {
                key: 'eggRadius',
                name: 'Радиус',
                icon: '🎯'
            },
            {
                key: 'luck',
                name: 'Удача',
                icon: '🍀'
            },
            {
                key: 'pitCount',
                name: 'Ямы',
                icon: '🕳️'
            },
            {
                key: 'shovelCount',
                name: 'Лопаты',
                icon: '🪓'
            },
            {
                key: 'aura',
                name: 'Аура',
                icon: '✨'
            },
            {
                key: 'auraDamage',
                name: 'Урон ауры',
                icon: '✨'
            },
            {
                key: 'eggExplosion',
                name: 'Взрыв яйца',
                icon: '💥'
            },
            {
                key: 'eggExplosionDamage',
                name: 'Урон взрыва',
                icon: '💥'
            },
            {
                key: 'eggExplosionRadius',
                name: 'Радиус взрыва',
                icon: '🎯'
            },
            {
                key: 'eggExplosionCooldown',
                name: 'Кулдаун взрыва',
                icon: '⏱️'
            }
        ];
    }
    
    /**
     * Обновляет отображаемые значения
     */
    updateValues() {
        if (!this.abilitySystem) return;
        
        const values = this.abilitySystem.getAllAbilities();
        
        // Обновляем текст для каждой способности
        Object.keys(this.abilityTexts).forEach(abilityKey => {
            const textElements = this.abilityTexts[abilityKey];
            let displayValue = values[abilityKey] || 0;
            
            // Форматируем значения для отображения
            switch (abilityKey) {
                case 'eggCooldown':
                    // Отображаем в секундах для удобства
                    displayValue = `${(displayValue / 1000).toFixed(1)}с`;
                    break;
                case 'eggRadius':
                case 'eggExplosionRadius':
                    displayValue = `${displayValue}px`;
                    break;
                case 'eggExplosionCooldown':
                    // Отображаем в секундах для удобства
                    displayValue = `${(displayValue / 1000).toFixed(1)}с`;
                    break;
                case 'tapExplosionDamage':
                case 'auraDamage':
                case 'eggExplosionDamage':
                    // Показываем урон только если больше 0
                    displayValue = displayValue > 0 ? displayValue : '0';
                    break;
                default:
                    displayValue = displayValue.toString();
            }
            
            textElements.value.setText(displayValue);
        });
    }
    
    /**
     * Переопределяем метод обновления
     */
    update(time, delta) {
        // Обновляем значения каждые 500мс для производительности
        if (!this.lastUpdate || time - this.lastUpdate > 500) {
            this.updateValues();
            this.lastUpdate = time;
        }
    }
    
    /**
     * Показывает/скрывает дисплей
     */
    toggle() {
        this.visible = !this.visible;
    }
    
    /**
     * Скрывает дисплей
     */
    hide() {
        this.visible = false;
    }
    
    /**
     * Показывает дисплей
     */
    show() {
        this.visible = true;
    }
    
    /**
     * Устанавливает позицию дисплея
     */
    setDisplayPosition(x, y) {
        this.setPosition(x, y);
    }
    
    /**
     * Уничтожение компонента
     */
    destroy() {
        this.abilityTexts = null;
        this.abilitySystem = null;
        super.destroy();
    }
}