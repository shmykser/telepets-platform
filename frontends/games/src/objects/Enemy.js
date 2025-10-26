import { GameObject } from './GameObject.js';
import { enemyTypes } from '../types/enemyTypes';
import { PropertyUtils } from '../utils/PropertyUtils.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';
import { PHYSICS_CONSTANTS, COLORS, DEPTH_CONSTANTS } from '../settings/GameSettings.js';
import { ItemDropSystem } from '../systems/ItemDropSystem.js';
import { EVENT_TYPES } from '../types/EventTypes.js';
import { EnemyEffectSystem } from '../systems/EnemyEffectSystem.js';
import { AICoordinator } from '../systems/core/AICoordinator.js';
import { SystemConfig } from '../systems/config/SystemConfig.js';
import { BehaviorAdapter } from '../systems/adapters/BehaviorAdapter.js';
export class Enemy extends GameObject {
    // Статическая система дропа для всех врагов
    static itemDropSystem = null;
    static probabilitySystem = null;
    // Статическая система событий для всех врагов
    static eventSystem = null;
    // Статическая система эффектов для всех врагов
    static effectSystem = null;

    constructor(scene, config) {
        const enemyType = config.enemyType || 'unknown';
        const enemyData = enemyTypes[enemyType];
        // Настройки из типа врага (приоритет у переданных значений)
        const enemyConfig = {
            health: config.health !== undefined ? config.health : enemyData.health,
            damage: config.damage !== undefined ? config.damage : (enemyData.damage || enemyData.attack?.damage),
            speed: config.speed !== undefined ? config.speed : (enemyData.speed || enemyData.movement?.speed), // скорость в пикселях в секунду
            cooldown: config.cooldown !== undefined ? config.cooldown : (enemyData.cooldown || enemyData.attack?.cooldown), // уже в миллисекундах
            // Радиус атаки берем ТОЛЬКО из attack.range
            attackRange: enemyData.attack?.range !== undefined ? enemyData.attack.range : 0,
            size: config.size !== undefined ? config.size : enemyData.size, // размер врага
            x: config.x,
            y: config.y,
            texture: config.texture || enemyData.texture, // fallback эмодзи
            spriteKey: config.spriteKey || enemyData.spriteKey, // ключ для спрайта
            behaviorParams: enemyData.behaviorParams || {} // Параметры поведения
        };
        super(scene, enemyConfig);
        
        // Специфичные для врагов свойства
        PropertyUtils.defineProperty(this, "_damage", undefined);
        PropertyUtils.defineProperty(this, "_speed", undefined);
        PropertyUtils.defineProperty(this, "_cooldown", undefined);
        PropertyUtils.defineProperty(this, "_attackRange", undefined);
        PropertyUtils.defineProperty(this, "_lastAttackTime", 0);
        PropertyUtils.defineProperty(this, "_target", null);
        PropertyUtils.defineProperty(this, "_enemyType", undefined);
        PropertyUtils.defineProperty(this, "_enemyData", undefined);
        PropertyUtils.defineProperty(this, "_id", undefined);
        PropertyUtils.defineProperty(this, "_size", undefined);
        
        // Новая система ИИ
        PropertyUtils.defineProperty(this, "_aiCoordinator", undefined);
        PropertyUtils.defineProperty(this, "_behaviorAdapter", undefined);
        PropertyUtils.defineProperty(this, "_useNewAI", true);
        
        // Инициализация свойств врага
        this._damage = enemyConfig.damage;
        this._speed = enemyConfig.speed;
        this._cooldown = enemyConfig.cooldown;
        this._attackRange = enemyConfig.attackRange;
        this._size = enemyConfig.size;
        
        this._lastAttackTime = 0;
        this._target = null;
        this._id = `${enemyType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this._enemyType = enemyType;
        this._enemyData = enemyData;
        
        
        // Инициализация новой системы ИИ
        this._aiCoordinator = null;
        this._behaviorAdapter = null;
        
        // Система иммунитета к урону
        this.isImmuneToDamage = false;

        this.body.setBounce(PHYSICS_CONSTANTS.ENEMY_BOUNCE);
        this.body.setDrag(PHYSICS_CONSTANTS.ENEMY_DRAG_X, PHYSICS_CONSTANTS.ENEMY_DRAG_Y);
        
        // Инициализируем новую систему ИИ
        this.setupNewAI(enemyType);
        
        // Для улья выводим успешную инициализацию
        if (enemyType === 'hive') {
            console.log(`🏠 [HIVE] Enemy создан успешно, ИИ инициализирован`);
        }
        
        // Отправляем событие появления врага
        if (Enemy.eventSystem) {
            const intensity = this.size > 1 ? this.size : 0.8;
            Enemy.eventSystem.emit(EVENT_TYPES.ENEMY_SPAWN, {
                enemy: this,
                intensity: intensity
            });
        }
        // Дублируем событие на scene.events, чтобы системы сцены (например, жестов) могли подписаться
        if (this.scene && this.scene.events) {
            this.scene.events.emit(EVENT_TYPES.ENEMY_SPAWN, { enemy: this });
        }
    }
        // Геттеры для врагов
        get damage() { return this._damage; }
        get speed() { return this._speed; }
        get cooldown() { return this._cooldown; }
        get attackRange() { return this._attackRange; }
        get size() { return this._size; }
        get target() { return this._target; }
        get id() { return this._id; }
        get enemyType() { return this._enemyType; }
        get enemyData() { return this._enemyData; }
        get canFly() { return this._enemyData?.canFly || false; }
        get aiCoordinator() { return this._aiCoordinator; }
        
        // Методы для совместимости с новой системой ИИ
        setVelocity(x, y) {
            if (this.body) {
                this.body.setVelocity(x, y);
            } else if (this.physicsBody) {
                this.physicsBody.setVelocity(x, y);
            }
        }
        
        stopMovement() {
            this.setVelocity(0, 0);
        }
        
        // Совместимость с IGameObject - используем прямое обращение к physicsBody
        
        // Сеттеры для врагов
        set damage(value) { this._damage = Math.max(0, value); }
        set speed(value) { this._speed = Math.max(0, value); }
        set cooldown(value) { this._cooldown = Math.max(0, value); }
        set attackRange(value) { this._attackRange = value; }
        set target(value) { 
            const oldTarget = this._target;
            this._target = value; 
            
            // Отправляем событие смены цели через EventSystem
            if (Enemy.eventSystem) {
                Enemy.eventSystem.emit(EVENT_TYPES.ENEMY_TARGET_CHANGED, {
                    enemy: this,
                    oldTarget: oldTarget,
                    newTarget: value
                });
            }
        }
        set enemyType(value) {
            this._enemyType = value;
            this._enemyData = enemyTypes[value];
            this.setupEnemyBehavior();
        }
    // Переопределяем update для ИИ поведения
    update(_time, _delta) {
        if (!this._isAlive || !this.scene)
            return;
        
        // Обновляем новую систему ИИ
        if (this._useNewAI && this._aiCoordinator) {
            // Только для улья логируем раз в 5 секунд
            if (this._enemyType === 'hive' && (_time % 5000 < 100)) {
                console.log(`🏠 [HIVE] Enemy.update() вызывается, time=${Math.round(_time)}, вызываем aiCoordinator.update()`);
            }
            this._aiCoordinator.update(_time, _delta);
        } else {
            // Fallback к базовому поведению
            super.update(_time, _delta);
        }
        
        // Обновляем HealthBar при движении врага
        this.updateHealthBar();
    }
    
    
    // Неиспользуемые методы движения удалены
    
    // stopMovement наследуется от GameObject
    // Переопределяем атаку для разных типов врагов
    attack(target) {
        if (!this._isAlive || !this.scene)
            return false;
            
        // Проверяем кулдаун
        const currentTime = this.scene.time.now;
        if (currentTime - this._lastAttackTime < this.cooldown) {
            return false; // Еще на перезарядке
        }
        
        const attackTarget = target || this._target;
        if (!attackTarget || !attackTarget.isAlive)
            return false;
            
        
        const distance = GeometryUtils.distance(this.x, this.y, attackTarget.x, attackTarget.y);
        if (distance > this.attackRange)
            return false;
            
        // Обновляем время последней атаки
        this._lastAttackTime = currentTime;
        
        // Отправляем событие атаки
        if (Enemy.eventSystem) {
            Enemy.eventSystem.emit(EVENT_TYPES.ENEMY_ATTACK, {
                enemy: this,
                target: attackTarget,
                damage: this.damage
            });
        }
        
        // Базовая атака для всех типов врагов
        this.performBasicAttack(attackTarget);
        return true;
    }
    performBasicAttack(target) {
        // Базовая атака - только если цель имеет метод takeDamage
        if (target && typeof target.takeDamage === 'function') {
            target.takeDamage(this.damage);
            this.emit('attack', target, this.damage);
        } else {
            // Если цель не может получать урон, просто логируем атаку

            this.emit('attack', target, this.damage);
        }
    }

    
    // Метод для работы с целями
    setTarget(target) {
        this.target = target;
        this._target = target; // Устанавливаем и приватное свойство для совместимости
    }
    

    /**
     * Переопределяем takeDamage для добавления эффектов и иммунитета
     */
    takeDamage(damage) {
        // Проверяем иммунитет к урону
        if (this.isImmuneToDamage) {
            // Эмитим событие заблокированного урона для визуального эффекта
            if (Enemy.eventSystem) {
                Enemy.eventSystem.emit(EVENT_TYPES.ENEMY_DAMAGE, {
                    enemy: this,
                    damage: 0, // Заблокированный урон
                    intensity: 0.1, // Слабый эффект для показа блокировки
                    blocked: true // Флаг заблокированного урона
                });
            }
            return false; // Урон заблокирован
        }
        
        // Вызываем родительский метод
        super.takeDamage(damage);
        
        // Применяем эффект урона
        if (Enemy.effectSystem) {
            Enemy.effectSystem.applyEffect('damage', this, {
                damage: damage,
                color: 0xff4444
            });
        }
        
        // Передаем урон в AICoordinator для стратегии стелса
        if (this._aiCoordinator) {
            this._aiCoordinator.takeDamage(damage, this.scene.time.now);
        }

        // Обрабатываем спавн при уроне (для улья)
        if (this.damageSpawnStrategy) {
            this.damageSpawnStrategy.onDamageReceived(damage, this.lastDamageSource);
        }

        // Отправляем событие получения урона
        if (Enemy.eventSystem) {
            const intensity = damage / this.maxHealth;
            Enemy.eventSystem.emit(EVENT_TYPES.ENEMY_DAMAGE, {
                enemy: this,
                damage: damage,
                intensity: Math.min(intensity, 1.0)
            });
        }
        
        return true; // Урон нанесен
    }
    
    /**
     * Устанавливает иммунитет к урону
     * @param {boolean} immune - Иммунитет включен/выключен
     */
    setDamageImmunity(immune) {
        this.isImmuneToDamage = immune;
    }
    
    /**
     * Проверяет, имеет ли враг иммунитет к урону
     * @returns {boolean}
     */
    hasDamageImmunity() {
        return this.isImmuneToDamage;
    }
    
    /**
     * Переопределяем die() для обработки дропа предметов и эффектов
     */
    die() {
        // Останавливаем AICoordinator перед смертью
        if (this._aiCoordinator) {
            this._aiCoordinator.isActive = false;
        }
        
        // Применяем эффект взрыва при смерти
        if (Enemy.effectSystem) {
            Enemy.effectSystem.applyEffect('explosion', this, {
                color: 0xff4444,
                size: this.width,
                particleCount: 6
            });
        }
        
        // Обрабатываем дроп предметов перед смертью
        this.handleItemDrop();
        
        // Отправляем событие смерти
        if (Enemy.eventSystem) {
            Enemy.eventSystem.emit(EVENT_TYPES.ENEMY_DEATH, {
                enemy: this,
                position: { x: this.x, y: this.y }
            });
        }
        
        // Вызываем родительский метод
        super.die();
    }
    
    
    
    /**
     * Обработка дропа предметов при смерти
     */
    handleItemDrop() {
        if (Enemy.itemDropSystem) {
            // Получаем текущую минуту игры из сцены
            const gameMinute = this.scene.waveSystem ? this.scene.waveSystem.getCurrentMinute() : 1;
            
            // Используем новую систему дропа с учетом удачи, времени и модификаторов
            Enemy.itemDropSystem.dropRandomItem(this.x, this.y, this.enemyType, gameMinute);
        }
    }

    // ========== СИСТЕМА ПОВЕДЕНИЙ ==========
    
    /**
     * Настройка новой системы ИИ
     * @param {string} enemyType - Тип врага
     */
    setupNewAI(enemyType) {
        try {
            // Создаем конфигурацию для AI координатора
            const config = new SystemConfig([
                this._enemyData,
                this._enemyData.behaviorParams || {},
                {
                    attackType: this.getAttackType(),
                    movement: this.getMovementConfig(),
                    attack: this.getAttackConfig(),
                    recovery: this.getRecoveryConfig(),
                    collision: this.getCollisionConfig(),
                    pathfinding: this.getPathfindingConfig(),
                    damageSpawn: this.getDamageSpawnConfig()
                }
            ]);

            // Создаем AI координатор
            this._aiCoordinator = new AICoordinator(this, config);

            // Гарантируем корректные стратегии для специфичных типов (защита от регрессий конфигурации)
            const movementSystem = this._aiCoordinator.getSystem('movement');
            const attackSystem = this._aiCoordinator.getSystem('attack');
            if (movementSystem && this._enemyType === 'wasp') {
                movementSystem.setStrategy('orbital');
            }
            if (attackSystem && this._enemyType === 'wasp') {
                attackSystem.setStrategy('spawn');
            }
            
            // Инициализируем стратегию спавна при уроне (для улья)
            this.setupDamageSpawnStrategy();
        } catch (error) {

            this._useNewAI = false;
        }
    }
    
    /**
     * Получение типа атаки
     * @returns {string}
     */
    getAttackType() {
        // Проверяем тип атаки из конфигурации
        if (this._enemyData.attack && this._enemyData.attack.strategy) {
            const strategy = this._enemyData.attack.strategy;
            // Поддерживаем все типы стратегий
            if (['simple', 'singleUse', 'area', 'spawn'].includes(strategy)) {
                return strategy;
            }
            // Fallback для неизвестных стратегий
            return 'simple';
        }
        return 'simple'; // По умолчанию простая атака
    }

    /**
     * Получение конфигурации движения
     * @returns {Object}
     */
    getMovementConfig() {
        const config = {
            speed: this._speed,
            strategy: this._enemyData.movement?.strategy || 'linear',
            ...this._enemyData.movement
        };
        
        
        return config;
    }

    /**
     * Получение конфигурации атаки
     * @returns {Object}
     */
    getAttackConfig() {
        const config = {
            damage: this._damage,
            cooldown: this._cooldown,
            strategy: this.getAttackType()
        };

        // Добавляем параметры атаки из enemyData
        if (this._enemyData.attack) {
            Object.assign(config, this._enemyData.attack);
        }

        // Устанавливаем attackRange из range (единообразие)
        config.attackRange = this._attackRange;
        config.range = this._attackRange; // Дублируем для совместимости


        return config;
    }

    /**
     * Получение конфигурации восстановления
     * @returns {Object}
     */
    getRecoveryConfig() {
        return this._enemyData.recovery || {};
    }

    /**
     * Получение конфигурации коллизий
     * @returns {Object}
     */
    getCollisionConfig() {
        return {
            collisionEnabled: true,
            collisionLayers: ['ENEMIES', 'OBSTACLES'],
            worldBoundsCollision: true
        };
    }

    /**
     * Получение конфигурации поиска пути
     * @returns {Object}
     */
    getPathfindingConfig() {
        return {
            algorithm: 'astar',
            allowDiagonal: true,
            dontCrossCorners: true,
            ignoreGroundObstacles: this.canFly || false
        };
    }

    /**
     * Получение конфигурации спавна при уроне
     * @returns {Object|null}
     */
    getDamageSpawnConfig() {
        return this._enemyData.damageSpawn || null;
    }

    /**
     * Настройка стратегии спавна при уроне
     */
    setupDamageSpawnStrategy() {
        const damageSpawnConfig = this.getDamageSpawnConfig();
        if (damageSpawnConfig && damageSpawnConfig.strategy === 'damageSpawn') {
            try {
                // Динамически импортируем стратегию
                import('../systems/strategies/damage/DamageSpawnStrategy.js').then(module => {
                    this.damageSpawnStrategy = new module.DamageSpawnStrategy(this, {
                        get: (key, defaultValue) => damageSpawnConfig[key] || defaultValue
                    });

                }).catch(error => {

                });
            } catch (error) {

            }
        }
    }
    
    /**
     * Установка цели для ИИ
     * @param {Object} target - Цель
     */
    setTarget(target) {
        this._target = target;
        
        if (this._aiCoordinator) {
            this._aiCoordinator.setTarget(target);
        }
    }
    
    /**
     * Получение цели
     * @returns {Object|null}
     */
    getTarget() {
        return this._target;
    }
    
    /**
     * Получение состояния ИИ
     * @returns {Object}
     */
    getAIState() {
        if (this._aiCoordinator) {
            return this._aiCoordinator.getAIState();
        }
        
        return {
            isActive: false,
            state: 'legacy',
            currentTarget: this._target,
            systems: {}
        };
    }
    
    /**
     * Включение/выключение новой системы ИИ
     * @param {boolean} enabled - Включена ли новая ИИ
     */
    setNewAIEnabled(enabled) {
        this._useNewAI = enabled;
        
        if (enabled && !this._aiCoordinator) {
            this.setupNewAI(this._enemyType);
        }
    }
    
    /**
     * Получение информации о системах
     * @returns {Object}
     */
    getSystemsInfo() {
        return {
            useNewAI: this._useNewAI,
            aiCoordinator: this._aiCoordinator ? 'active' : 'inactive',
            behaviorAdapter: this._behaviorAdapter ? 'active' : 'inactive',
            enemyType: this._enemyType,
            movementStrategy: this._enemyData.movement?.strategy || 'linear'
        };
    }
    
    // Уничтожение
    destroy() {
        // Уничтожаем AI координатор
        if (this._aiCoordinator) {
            this._aiCoordinator.destroy();
            this._aiCoordinator = null;
        }
        
        // Уничтожаем адаптер поведения
        if (this._behaviorAdapter) {
            this._behaviorAdapter.destroy();
            this._behaviorAdapter = null;
        }
        
        // Удаляем все эффекты врага
        if (Enemy.effectSystem && this.id) {
            Enemy.effectSystem.removeEnemyEffects(this.id);
        }
        
        super.destroy();
    }
    /**
     * Статический метод для инициализации систем дропа
     */
    static initDropSystems(scene, egg, probabilitySystem, abilitySystem = null) {
        Enemy.itemDropSystem = new ItemDropSystem(scene, egg, probabilitySystem, abilitySystem);
        Enemy.probabilitySystem = probabilitySystem;
    }
    
    /**
     * Статический метод для инициализации системы событий
     */
    static initEventSystem(eventSystem) {
        Enemy.eventSystem = eventSystem;
    }
    
    /**
     * Статический метод для инициализации системы эффектов
     */
    static initEffectSystem(effectSystem) {
        Enemy.effectSystem = effectSystem;
    }
    
    /**
     * Статический метод для создания врага с полной настройкой
     * Создает врага, настраивает графику, применяет усиление и создает HealthBar
     */
    static CreateEnemy(scene, enemyType, x, y, enhancementMultiplier = 1) {
        const enemyData = enemyTypes[enemyType];
        
        // Применяем усиление к характеристикам
        const enhancedHealth = enemyData.health * enhancementMultiplier;
        const enhancedDamage = (enemyData.damage || enemyData.attack?.damage) * enhancementMultiplier;
        const enhancedSize = enemyData.size * enhancementMultiplier;
        
        // Создаем врага с усиленными характеристиками
        const enemy = new Enemy(scene, {
            x, y, enemyType,
            ...enemyData, // Сначала все базовые данные из enemyTypes
            health: enhancedHealth, // Переопределяем усиленными значениями
            damage: enhancedDamage,
            size: enhancedSize,
            behaviorParams: enemyData.behaviorParams // Явно передаем параметры поведения
        });
        
        // Настраиваем размер на основе усиленного размера
        const enemySize = PHYSICS_CONSTANTS.BASE_ENEMY_SIZE * enhancedSize;
        enemy.setScale(enemySize / PHYSICS_CONSTANTS.DEFAULT_TEXTURE_SIZE);
        
        // Устанавливаем глубину отрисовки (поверх защиты)
        enemy.setDepth(DEPTH_CONSTANTS.ENEMY);
        
        // Создаем полосу здоровья
        enemy.createHealthBar({
            showWhenFull: false,
            showWhenEmpty: true,
            offsetY: -(enemySize / 2 + PHYSICS_CONSTANTS.HEALTH_BAR_OFFSET),
            colors: {
                background: COLORS.BLACK,
                health: COLORS.HEALTH_GREEN,
                border: COLORS.WHITE
            }
        });
        
        // Эффекты появления теперь обрабатываются через EventSystem в конструкторе
        
        return enemy;
    }
    
    // getGameProgress удален - теперь прогресс передается как параметр
}
