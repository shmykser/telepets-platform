import { AICoordinator } from '../core/AICoordinator.js';
import { SystemConfig } from '../config/SystemConfig.js';

/**
 * Адаптер для совместимости со старыми поведениями
 * Позволяет использовать новую систему ИИ с существующим кодом
 */
export class BehaviorAdapter {
    constructor(gameObject, legacyBehavior) {
        this.gameObject = gameObject;
        this.legacyBehavior = legacyBehavior;
        this.aiCoordinator = null;
        this.isInitialized = false;
        
        this.initialize();
    }

    initialize() {
        // Создаем конфигурацию на основе старого поведения
        const config = this.createConfigFromLegacyBehavior();
        
        // Создаем AI координатор
        this.aiCoordinator = new AICoordinator(this.gameObject, config);
        
        this.isInitialized = true;
    }

    createConfigFromLegacyBehavior() {
        const behaviorParams = this.legacyBehavior.getBehaviorParams ? 
            this.legacyBehavior.getBehaviorParams() : {};
        
        const enemyData = this.gameObject.enemyData || {};
        
        return new SystemConfig([
            enemyData,
            behaviorParams,
            {
                behavior: this.getBehaviorType(),
                attackType: this.getAttackType(),
                movement: this.getMovementConfig(),
                attack: this.getAttackConfig(),
                collision: this.getCollisionConfig(),
                pathfinding: this.getPathfindingConfig()
            }
        ]);
    }

    getBehaviorType() {
        const behaviorName = this.legacyBehavior.constructor.name;
        
        const behaviorMap = {
            'LinearBehavior': 'linear',
            'FlyingBehavior': 'flying',
            'RangedBehavior': 'ranged',
            'StealthBehavior': 'stealth',
            'ShellBehavior': 'shell',
            'SpawnerBehavior': 'spawner',
            'BurrowBehavior': 'burrow'
        };
        
        return behaviorMap[behaviorName] || 'linear';
    }

    getAttackType() {
        const behaviorName = this.legacyBehavior.constructor.name;
        
        if (behaviorName === 'RangedBehavior') {
            return 'ranged';
        }
        
        return 'singleUse';
    }

    getMovementConfig() {
        const behaviorParams = this.legacyBehavior.getBehaviorParams ? 
            this.legacyBehavior.getBehaviorParams() : {};
        
        return {
            speed: this.gameObject.speed || 100,
            strategy: this.getBehaviorType(),
            ...behaviorParams
        };
    }

    getAttackConfig() {
        return {
            damage: this.gameObject.damage || 10,
            attackRange: this.gameObject.attackRange || 30,
            cooldown: this.gameObject.cooldown || 1000,
            strategy: this.getAttackType()
        };
    }

    getCollisionConfig() {
        return {
            collisionEnabled: true,
            collisionLayers: ['ENEMIES', 'OBSTACLES'],
            worldBoundsCollision: true
        };
    }

    getPathfindingConfig() {
        return {
            algorithm: 'astar',
            allowDiagonal: true,
            dontCrossCorners: true,
            ignoreGroundObstacles: this.gameObject.canFly || false
        };
    }

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
        
        // Синхронизируем с legacy поведением
        this.syncWithLegacyBehavior();
    }

    syncWithLegacyBehavior() {
        // Синхронизируем цель
        if (this.legacyBehavior.target && this.legacyBehavior.target !== this.aiCoordinator.getTarget()) {
            this.aiCoordinator.setTarget(this.legacyBehavior.target);
        }
        
        // Синхронизируем состояние
        const aiState = this.aiCoordinator.getState();
        if (this.legacyBehavior.setState) {
            this.legacyBehavior.setState(aiState);
        }
    }

    /**
     * Установка цели
     * @param {Object} target - Цель
     */
    setTarget(target) {
        if (this.aiCoordinator) {
            this.aiCoordinator.setTarget(target);
        }
        
        if (this.legacyBehavior.setTarget) {
            this.legacyBehavior.setTarget(target);
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
        
        if (this.legacyBehavior.onActivate) {
            this.legacyBehavior.onActivate();
        }
    }

    /**
     * Деактивация адаптера
     */
    deactivate() {
        if (this.aiCoordinator) {
            this.aiCoordinator.deactivate();
        }
        
        if (this.legacyBehavior.onDeactivate) {
            this.legacyBehavior.onDeactivate();
        }
    }

    /**
     * Получение состояния адаптера
     * @returns {Object}
     */
    getState() {
        const aiState = this.aiCoordinator ? this.aiCoordinator.getAIState() : {};
        const legacyState = this.legacyBehavior.getState ? this.legacyBehavior.getState() : {};
        
        return {
            ...aiState,
            legacy: legacyState,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Получение информации о поведении
     * @returns {Object}
     */
    getBehaviorInfo() {
        const legacyInfo = this.legacyBehavior.getBehaviorInfo ? 
            this.legacyBehavior.getBehaviorInfo() : {};
        
        return {
            type: 'BehaviorAdapter',
            legacyBehavior: this.legacyBehavior.constructor.name,
            aiCoordinator: this.aiCoordinator ? 'active' : 'inactive',
            ...legacyInfo
        };
    }

    /**
     * Уничтожение адаптера
     */
    destroy() {
        if (this.aiCoordinator) {
            this.aiCoordinator.destroy();
            this.aiCoordinator = null;
        }
        
        if (this.legacyBehavior.destroy) {
            this.legacyBehavior.destroy();
        }
        
        this.gameObject = null;
        this.legacyBehavior = null;
        this.isInitialized = false;
    }
}
