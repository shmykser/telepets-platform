import { GameObject } from './GameObject.js';
import { ITEMS, ITEM_TYPES, ITEM_CONSTANTS } from '../types/itemTypes';
import { DEPTH_CONSTANTS } from '../settings/GameSettings.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

/**
 * Класс предмета для сбора
 */
export class Item extends GameObject {
    constructor(scene, x, y, itemType, abilitySystem = null) {
        // Получаем данные предмета
        const itemData = ITEMS[itemType];
        
        // Создаем конфигурацию предмета
        const itemConfig = {
            x: x,
            y: y,
            texture: itemData.texture,
            spriteKey: itemData.spriteKey, // Добавляем spriteKey для загрузки спрайта
            size: itemData.size, // Добавляем size для выбора размера спрайта
            health: 1, // Предметы не имеют здоровья, но нужны для GameObject
            damage: 0,
            speed: 0,
            cooldown: 0,
            attackRange: 0
        };
        
        super(scene, itemConfig);
        
        // Специфичные для предметов свойства
        this.itemType = itemType;
        this.itemData = itemData;
        this.isCollected = false;
        this.abilitySystem = abilitySystem;
        
        // Настройка спрайта и физики
        this.setupItemBehavior();
    }
    
    /**
     * Настройка поведения предмета
     */
    setupItemBehavior() {
        // Настройка спрайта
        this.setScale(ITEM_CONSTANTS.ITEM_SCALE);
        this.setDepth(DEPTH_CONSTANTS.ITEM);
        
        // Отладочный вывод для проверки глубины (временно отключен)
        // console.log(`🔍 [Item] ${this.itemType} создан с глубиной: ${this.depth}, DEPTH_CONSTANTS.ITEM: ${DEPTH_CONSTANTS.ITEM}`);
        
        // Настройка физики
        this.physicsBody.setSize(this.width * ITEM_CONSTANTS.ITEM_BODY_SCALE, this.height * ITEM_CONSTANTS.ITEM_BODY_SCALE);
        this.physicsBody.setImmovable(true);
        
        // Интерактивность убрана - используем единую систему жестов
        // this.setInteractive();
        // this.on('pointerdown', () => this.handleTap());
        
        // Автоудаление
        this.setupAutoDestroy();
        
        // Регистрация в системе
        this.registerInSystem();
        
        // Подписка на общую очистку
        this.scene.events.on('items:clear-all', this.onClearAll, this);
    }
    
    /**
     * Обработка тапа по предмету
     */
    handleTap() {
        if (this.isCollected) {
            return false;
        }
        
        // Активируем эффект предмета
        this.activate();
        
        // Собираем предмет
        this.collect();
        
        return true;
    }
    
    /**
     * Активирует эффект предмета
     */
    activate() {
        const itemData = ITEMS[this.itemType];
        const increaseAmount = itemData.increase;
        switch (this.itemType) {
            case ITEM_TYPES.HEART:
                // Эффект: увеличение максимального здоровья яйца
                const increased = this.scene.egg.increaseMaxHealth();
                if (increased) {
                    console.log(`💖 [Item] Сердце увеличило максимальное здоровье яйца`);
                } else {
                    console.log(`💔 [Item] Сердце не смогло увеличить здоровье (достигнут максимум)`);
                }
                break;
                
            case ITEM_TYPES.CLOVER:
                // Эффект: увеличение удачи
                if (this.abilitySystem) {
                    this.abilitySystem.upgradeAbility('LUCK');
                }
                break;
            
            case ITEM_TYPES.PATCH:
                // Эффект: лечение текущего здоровья яйца
                const healed = this.scene.egg.heal(increaseAmount);
                if (healed) {
                    console.log(`🩹 [Item] Пластырь вылечил яйцо на ${increaseAmount} HP`);
                } else {
                    console.log(`🩹 [Item] Пластырь не смог вылечить (здоровье уже полное)`);
                }
                break;
            
            case ITEM_TYPES.DOUBLEPATCH:
                // Эффект: усиленное лечение текущего здоровья яйца
                const doubleHealed = this.scene.egg.heal(increaseAmount);
                if (doubleHealed) {
                    console.log(`💊 [Item] Двойной пластырь вылечил яйцо на ${increaseAmount} HP`);
                } else {
                    console.log(`💊 [Item] Двойной пластырь не смог вылечить (здоровье уже полное)`);
                }
                break;
            
            case ITEM_TYPES.SHOVEL:
                // Эффект: увеличение количества доступных лопат
                if (this.abilitySystem) {
                    const upgraded = this.abilitySystem.upgradeAbility('SHOVEL');
                    if (upgraded) {
                        console.log(`🪓 [Item] Лопата добавлена в инвентарь: ${this.abilitySystem.getShovelCount()}`);
                    } else {
                        console.log(`🪓 [Item] Инвентарь лопат полон (достигнут максимум)`);
                    }
                }
                break;
                
            case ITEM_TYPES.ALOE:
                // Эффект: увеличение регенерации яйца
                if (this.abilitySystem) {
                    const upgraded = this.abilitySystem.upgradeAbility('EGG_RECOVERY');
                    if (upgraded) {
                        console.log(`🌿 [Item] Алоэ увеличило регенерацию: ${this.abilitySystem.getEggRecovery()} HP/сек`);
                    } else {
                        console.log(`🌿 [Item] Регенерация уже на максимуме (достигнут максимум)`);
                    }
                }
                break;
                
        case ITEM_TYPES.HONEY:
            // Эффект: замедление времени для всех врагов
            console.log('🍯 [Item] Обрабатываем мёд...');
            this.activateHoneyEffect();
            break;
        }
        
        // Эмитим событие активации
        this.emit('item:activated', {
            itemType: this.itemType,
            effect: increaseAmount
        });
    }
    
    /**
     * Активирует эффект мёда - замедление времени
     */
    activateHoneyEffect() {
        const itemData = ITEMS[this.itemType];
        const duration = itemData.duration || 10000; // 10 секунд из конфигурации
        
        console.log(`🍯 [Item] Мёд активирует замедление времени на ${duration}мс`);
        
        // Замедляем время для всех систем Phaser
        this.scene.time.timeScale = 5;           // События времени (0.5 = в 2 раза медленнее)
        this.scene.tweens.timeScale = 5;         // Твины
        this.scene.anims.globalTimeScale = 5;    // Анимации
        
        // Физика (если есть)
        if (this.scene.physics && this.scene.physics.world) {
            this.scene.physics.world.timeScale = 5;
        }
        
        console.log('🍯 [Item] timeScale установлен:', this.scene.time.timeScale);
        console.log('🍯 [Item] tweens.timeScale:', this.scene.tweens.timeScale);
        console.log('🍯 [Item] anims.globalTimeScale:', this.scene.anims.globalTimeScale);
        if (this.scene.physics && this.scene.physics.world) {
            console.log('🍯 [Item] physics.world.timeScale:', this.scene.physics.world.timeScale);
        }
        
        // Сохраняем ссылку на сцену для колбэка
        const scene = this.scene;
        
        // Используем setTimeout вместо delayedCall, чтобы избежать влияния timeScale
        setTimeout(() => {
            scene.time.timeScale = 1.0;
            scene.tweens.timeScale = 1.0;
            scene.anims.globalTimeScale = 1.0;
            
            if (scene.physics && scene.physics.world) {
                scene.physics.world.timeScale = 1.0;
            }
            
            console.log('🍯 [Item] Время восстановлено к нормальной скорости');
        }, duration);
    }
    
    /**
     * Настройка автоудаления
     */
    setupAutoDestroy() {
        this.scene.time.delayedCall(ITEM_CONSTANTS.AUTO_REMOVE_DELAY, () => {
            if (!this.isCollected) {
                this.autoRemove();
            }
        });
    }
    
    /**
     * Автоматическое удаление по истечении времени
     */
    autoRemove() {
        this.emit('item:expired', this);
        this.unregisterFromSystem();
        this.destroy();
    }
    
    /**
     * Регистрация в системе дропа
     */
    registerInSystem() {
        if (this.scene && this.scene.events) {
            this.scene.events.emit('item:created', this);
        }
    }
    
    /**
     * Отписка от системы дропа
     */
    unregisterFromSystem() {
        if (this.scene && this.scene.events) {
            this.scene.events.emit('item:removed', this);
        }
    }
    
    /**
     * Обработка общей очистки всех предметов
     */
    onClearAll() {
        if (!this.isCollected) {
            this.unregisterFromSystem();
            this.destroy();
        }
    }
    
    
    /**
     * Собирает предмет
     */
    collect() {
        if (this.isCollected) {
            return false;
        }
        
        this.isCollected = true;
        this.emit('item:collected', this);
        this.unregisterFromSystem();
        this.destroy();
        return true;
    }
    
    /**
     * Переопределяем уничтожение для очистки ресурсов
     */
    destroy() {
        // Отписываемся от событий
        if (this.scene && this.scene.events) {
            this.scene.events.off('items:clear-all', this.onClearAll, this);
        }
        
        super.destroy();
    }
    
    
    /**
     * Статический метод для создания предмета с полной настройкой
     */
    static CreateItem(scene, x, y, itemType, abilitySystem = null) {
        const item = new Item(scene, x, y, itemType, abilitySystem);
        
        // Добавляем в сцену
        scene.add.existing(item);
        
        return item;
    }
}
