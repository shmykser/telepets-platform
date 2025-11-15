import { IGameObject } from '../interfaces/IGameObject.js';
import { AICoordinator } from '../core/AICoordinator.js';
import { SystemConfig } from '../config/SystemConfig.js';

/**
 * Адаптер для Enemy объектов
 * Обеспечивает совместимость с новой системой ИИ
 */
export class EnemyAdapter extends IGameObject {
    constructor(enemy) {
        super();
        this.enemy = enemy;
        this.aiCoordinator = null;
        this.isInitialized = false;
        
        // Делегируем свойства к Enemy
        this._id = enemy.id;
        this._isAlive = true;
        this._canFly = enemy.canFly || false;
        this._objectType = 'enemy';
        this._config = enemy.enemyData || {};
        
        this.initialize();
    }

    initialize() {
        // Создаем конфигурацию на основе данных врага
        const config = this.createConfigFromEnemyData();
        
        // Создаем AI координатор
        this.aiCoordinator = new AICoordinator(this.enemy, config);
        
        this.isInitialized = true;
    }

    createConfigFromEnemyData() {
        const enemyData = this.enemy.enemyData || {};
        const behaviorParams = enemyData.behaviorParams || {};
        
        return new SystemConfig([
            enemyData,
            behaviorParams,
            {
                attackType: this.getAttackType(enemyData),
                movement: this.getMovementConfig(enemyData),
                attack: this.getAttackConfig(enemyData),
                collision: this.getCollisionConfig(enemyData),
                pathfinding: this.getPathfindingConfig(enemyData),
                damageSpawn: this.getDamageSpawnConfig(enemyData)
            }
        ]);
    }

    getAttackType(enemyData) {
        // Проверяем тип атаки из конфигурации
        if (enemyData.attack && enemyData.attack.strategy) {
            return enemyData.attack.strategy === 'singleUse' ? 'singleUse' : 'singleUse';
        }
        return 'singleUse'; // По умолчанию одноразовая атака
    }

    getMovementConfig(enemyData) {
        return {
            speed: enemyData.speed || 100,
            strategy: enemyData.movement?.strategy || 'linear',
            ...enemyData.movement
        };
    }

    getAttackConfig(enemyData) {
        return {
            damage: enemyData.damage || 10,
            // Радиус атаки берем из attack.range
            range: enemyData.attack?.range || 0,
            cooldown: enemyData.cooldown || enemyData.attack?.cooldown || 1000,
            strategy: this.getAttackType(enemyData)
        };
    }

    getCollisionConfig(enemyData) {
        return {
            collisionEnabled: true,
            collisionLayers: ['ENEMIES', 'OBSTACLES'],
            worldBoundsCollision: true
        };
    }

    getPathfindingConfig(enemyData) {
        return {
            algorithm: 'astar',
            allowDiagonal: true,
            dontCrossCorners: true,
            ignoreGroundObstacles: this._canFly
        };
    }

    // Делегируем свойства к Enemy
    get x() { return this.enemy.x; }
    set x(value) { this.enemy.x = value; }
    
    get y() { return this.enemy.y; }
    set y(value) { this.enemy.y = value; }
    
    get width() { return this.enemy.width; }
    get height() { return this.enemy.height; }
    
    get body() { return this.enemy.body; }
    get scene() { return this.enemy.scene; }
    
    get rotation() { return this.enemy.rotation; }
    set rotation(value) { this.enemy.rotation = value; }

    /**
     * Обновление адаптера
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isInitialized || !this.aiCoordinator) {
            return;
        }

        // Обновляем AI координатор
        this.aiCoordinator.update(time, delta);
    }

    /**
     * Установка цели
     * @param {Object} target - Цель
     */
    setTarget(target) {
        if (this.aiCoordinator) {
            this.aiCoordinator.setTarget(target);
        }
    }

    /**
     * Получение цели
     * @returns {Object|null}
     */
    getTarget() {
        return this.aiCoordinator ? this.aiCoordinator.getTarget() : null;
    }

    /**
     * Активация адаптера
     */
    activate() {
        if (this.aiCoordinator) {
            this.aiCoordinator.activate();
        }
    }

    /**
     * Деактивация адаптера
     */
    deactivate() {
        if (this.aiCoordinator) {
            this.aiCoordinator.deactivate();
        }
    }

    /**
     * Получение состояния адаптера
     * @returns {Object}
     */
    getState() {
        const aiState = this.aiCoordinator ? this.aiCoordinator.getAIState() : {};
        
        return {
            ...aiState,
            isInitialized: this.isInitialized,
            enemyType: this.enemy.enemyType,
            health: this.enemy.health,
            isAlive: this._isAlive
        };
    }

    /**
     * Получение информации о враге
     * @returns {Object}
     */
    getEnemyInfo() {
        return {
            type: 'EnemyAdapter',
            enemyType: this.enemy.enemyType,
            aiCoordinator: this.aiCoordinator ? 'active' : 'inactive',
            isInitialized: this.isInitialized,
            config: this._config
        };
    }

    /**
     * Получение конфигурации спавна при уроне
     */
    getDamageSpawnConfig(enemyData) {
        return enemyData.damageSpawn || null;
    }

    /**
     * Уничтожение адаптера
     */
    destroy() {
        if (this.aiCoordinator) {
            this.aiCoordinator.destroy();
            this.aiCoordinator = null;
        }
        
        this._isAlive = false;
        this.enemy = null;
        this.isInitialized = false;
    }
}
