/**
 * Обработчик эффектов для Event-Driven Architecture
 * 
 * Слушает события игровых объектов и применяет соответствующие визуальные эффекты
 * через EffectSystem. Декомпозирует логику эффектов от игровой логики.
 */

import { EVENT_TYPES } from '../types/EventTypes.js';
import { EffectSystem } from '../systems/EffectSystem.js';

export class EffectHandler {
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.effectSystem = new EffectSystem(scene);
        
        // Настройка слушателей событий
        this.setupEventListeners();
        
        console.log('EffectHandler инициализирован');
    }

    /**
     * Настройка слушателей всех событий эффектов
     */
    setupEventListeners() {
        // События врагов
        this.eventSystem.on(EVENT_TYPES.ENEMY_SPAWN, this.handleEnemySpawn.bind(this));
        this.eventSystem.on(EVENT_TYPES.ENEMY_DAMAGE, this.handleEnemyDamage.bind(this));
        this.eventSystem.on(EVENT_TYPES.ENEMY_DEATH, this.handleEnemyDeath.bind(this));
        this.eventSystem.on(EVENT_TYPES.ENEMY_ATTACK, this.handleEnemyAttack.bind(this));
        this.eventSystem.on(EVENT_TYPES.ENEMY_TARGET_CHANGED, this.handleEnemyTargetChanged.bind(this));

        // События яйца
        this.eventSystem.on(EVENT_TYPES.EGG_CREATE, this.handleEggCreate.bind(this));
        this.eventSystem.on(EVENT_TYPES.EGG_DAMAGE, this.handleEggDamage.bind(this));
        this.eventSystem.on(EVENT_TYPES.EGG_HEAL, this.handleEggHeal.bind(this));
        this.eventSystem.on(EVENT_TYPES.EGG_DESTROYED, this.handleEggDestroyed.bind(this));

        // События предметов
        this.eventSystem.on(EVENT_TYPES.ITEM_SPAWN, this.handleItemSpawn.bind(this));
        this.eventSystem.on(EVENT_TYPES.ITEM_COLLECT, this.handleItemCollect.bind(this));

        // События защиты
        this.eventSystem.on(EVENT_TYPES.DEFENSE_CREATE, this.handleDefenseCreate.bind(this));
        this.eventSystem.on(EVENT_TYPES.DEFENSE_ACTIVATE, this.handleDefenseActivate.bind(this));
        this.eventSystem.on(EVENT_TYPES.DEFENSE_DESTROY, this.handleDefenseDestroy.bind(this));

        // События игрового процесса
        this.eventSystem.on(EVENT_TYPES.GAME_START, this.handleGameStart.bind(this));
        this.eventSystem.on(EVENT_TYPES.GAME_END, this.handleGameEnd.bind(this));
    }

    /**
     * Обработка появления врага
     * @param {Object} data - { enemy, intensity }
     */
    handleEnemySpawn(data) {
        const { enemy, intensity = 0.8 } = data;
        
        // Эффект появления
        this.effectSystem.applyEffect('fadeIn', enemy, intensity, {
            duration: 800
        });
        
        // Эффект масштабирования
        this.effectSystem.applyEffect('scale', enemy, intensity, {
            from: 0.5,
            to: 1,
            duration: 300
        });
    }

    /**
     * Обработка получения урона врагом
     * @param {Object} data - { enemy, damage, intensity }
     */
    handleEnemyDamage(data) {
        const { enemy, damage, intensity = 1.0 } = data;
        
        // Индикатор урона
        this.effectSystem.applyEffect('damage', enemy, intensity, {
            duration: 300
        });
        
        // Эффект свечения
        this.effectSystem.applyEffect('glow', enemy, intensity, {
            intensity: 1,
            duration: 100
        });
    }

    /**
     * Обработка смерти врага
     * @param {Object} data - { enemy, position }
     */
    handleEnemyDeath(data) {
        const { enemy, position } = data;
        
        // Эффект взрыва (круговая волна)
        this.effectSystem.applyEffect('blast', enemy, 1.0, {
            radius: 120,
            duration: 600,
            color: 0xff6600
        });
        
        // Эффект взрыва
        this.effectSystem.applyEffect('explosion', enemy, 1.0, {
            intensity: 1.2,
            duration: 400
        });
        
        // Убираем fadeOut эффект, так как объект уже уничтожен
        // this.effectSystem.applyEffect('fadeOut', enemy, 1.0, {
        //     duration: 600
        // });
    }

    /**
     * Обработка атаки врага
     * @param {Object} data - { enemy, target, damage }
     */
    handleEnemyAttack(data) {
        const { enemy, target, damage } = data;
        
        // Эффект встряски при атаке
        this.effectSystem.applyEffect('shake', enemy, 1.0, {
            duration: 100,
            repeat: 1,
            intensity: 10,
            direction: 'horizontal'
        });
        
    }

    /**
     * Обработка смены цели врага
     * @param {Object} data - { enemy, oldTarget, newTarget }
     */
    handleEnemyTargetChanged(data) {
        const { enemy, oldTarget, newTarget } = data;
        

    }

    /**
     * Обработка создания яйца
     * @param {Object} data - { egg }
     */
    handleEggCreate(data) {
        const { egg } = data;
        
        // Эффект появления яйца
        this.effectSystem.applyEffect('fadeIn', egg, 1.0, {
            duration: 1000,
            ease: 'Power2.easeOut'
        });
        
        // Постоянное свечение
        this.effectSystem.applyEffect('glow', egg, 1.0, {
            color: 0xffaa00,
            duration: 2000,
            repeat: -1,
            intensity: 0.2
        });
    }

    /**
     * Обработка урона яйца
     * @param {Object} data - { egg, damage, intensity }
     */
    handleEggDamage(data) {
        const { egg, damage, intensity = 1.0 } = data;
        
        // Эффект встряски
        this.effectSystem.applyEffect('shake', egg, intensity, {
            duration: 300,
            intensity: 8,
            direction: 'vertical'
        });
        
        // Эффект мерцания
        this.effectSystem.applyEffect('flicker', egg, intensity, {
            duration: 400,
            repeat: 3
        });
        
        // Индикатор урона
        this.effectSystem.applyEffect('damage', egg, intensity, {
            amount: damage,
            duration: 1000,
            color: 0xff0000
        });
    }

    /**
     * Обработка лечения яйца
     * @param {Object} data - { egg, healAmount }
     */
    handleEggHeal(data) {
        const { egg, healAmount } = data;
        
        // Эффект лечения
        this.effectSystem.applyEffect('heal', egg, 1.0, {
            amount: healAmount,
            duration: 800,
            color: 0x00ff00
        });
        
        // Эффект пульсации
        this.effectSystem.applyEffect('pulse', egg, 1.0, {
            scale: 0.3,
            duration: 600
        });
    }

    /**
     * Обработка уничтожения яйца
     * @param {Object} data - { egg, position }
     */
    handleEggDestroyed(data) {
        const { egg, position } = data;
        
        // Эффект взрыва
        this.effectSystem.applyEffect('explosion', egg, 1.0, {
            scale: 2.0,
            duration: 800,
            color: 0xff0000
        });
        
        // Эффект исчезновения
        this.effectSystem.applyEffect('fadeOut', egg, 1.0, {
            duration: 500
        });
    }

    /**
     * Обработка появления предмета
     * @param {Object} data - { item }
     */
    handleItemSpawn(data) {
        const { item } = data;
        
        // Эффект появления
        this.effectSystem.applyEffect('fadeIn', item, 1.0, {
            duration: 500
        });
        
        // Эффект пульсации
        this.effectSystem.applyEffect('pulse', item, 1.0, {
            scale: 0.2,
            duration: 1000,
            repeat: -1
        });
    }

    /**
     * Обработка сбора предмета
     * @param {Object} data - { item, collector }
     */
    handleItemCollect(data) {
        const { item, collector } = data;
        
        // Эффект сбора
        this.effectSystem.applyEffect('collect', item, 1.0, {
            target: collector,
            duration: 400
        });
        
        // Эффект исчезновения
        this.effectSystem.applyEffect('fadeOut', item, 1.0, {
            duration: 300
        });
    }

    /**
     * Обработка создания защиты
     * @param {Object} data - { defense }
     */
    handleDefenseCreate(data) {
        const { defense } = data;
        
        // Эффект появления
        this.effectSystem.applyEffect('fadeIn', defense, 1.0, {
            duration: 600
        });
        
        // Эффект масштабирования
        this.effectSystem.applyEffect('scale', defense, 1.0, {
            from: 0.3,
            to: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    /**
     * Обработка активации защиты
     * @param {Object} data - { defense, target }
     */
    handleDefenseActivate(data) {
        const { defense, target } = data;
        
        // Эффект активации
        this.effectSystem.applyEffect('glow', defense, 1.0, {
            color: 0x00ffff,
            duration: 300,
            intensity: 0.5
        });
        
        // Эффект атаки
        this.effectSystem.applyEffect('attack', defense, 1.0, {
            target: target,
            duration: 200
        });
    }

    /**
     * Обработка уничтожения защиты
     * @param {Object} data - { defense }
     */
    handleDefenseDestroy(data) {
        const { defense } = data;
        
        // Эффект взрыва
        this.effectSystem.applyEffect('explosion', defense, 1.0, {
            scale: 1.2,
            duration: 400
        });
        
        // Эффект исчезновения
        this.effectSystem.applyEffect('fadeOut', defense, 1.0, {
            duration: 300
        });
    }

    /**
     * Обработка начала игры
     * @param {Object} data - { scene }
     */
    handleGameStart(data) {
        const { scene } = data;
        
        // Эффект начала игры
        this.effectSystem.applyEffect('screenFlash', scene, 1.0, {
            color: 0xffffff,
            duration: 500,
            alpha: 0.3
        });
    }

    /**
     * Обработка окончания игры
     * @param {Object} data - { scene, won }
     */
    handleGameEnd(data) {
        const { scene, won } = data;
        
        // Эффект окончания игры
        const color = won ? 0x00ff00 : 0xff0000;
        this.effectSystem.applyEffect('screenFlash', scene, 1.0, {
            color: color,
            duration: 800,
            alpha: 0.5
        });
    }

    /**
     * Получение статистики обработчика
     * @returns {Object}
     */
    getStats() {
        return {
            eventSystemStats: this.eventSystem.getStats(),
            effectSystemStats: this.effectSystem.getStats ? this.effectSystem.getStats() : null
        };
    }

    /**
     * Очистка обработчика
     */
    destroy() {
        // Отписка от всех событий
        this.eventSystem.off(EVENT_TYPES.ENEMY_SPAWN, this.handleEnemySpawn.bind(this));
        this.eventSystem.off(EVENT_TYPES.ENEMY_DAMAGE, this.handleEnemyDamage.bind(this));
        this.eventSystem.off(EVENT_TYPES.ENEMY_DEATH, this.handleEnemyDeath.bind(this));
        this.eventSystem.off(EVENT_TYPES.ENEMY_ATTACK, this.handleEnemyAttack.bind(this));
        this.eventSystem.off(EVENT_TYPES.ENEMY_TARGET_CHANGED, this.handleEnemyTargetChanged.bind(this));
        this.eventSystem.off(EVENT_TYPES.EGG_CREATE, this.handleEggCreate.bind(this));
        this.eventSystem.off(EVENT_TYPES.EGG_DAMAGE, this.handleEggDamage.bind(this));
        this.eventSystem.off(EVENT_TYPES.EGG_HEAL, this.handleEggHeal.bind(this));
        this.eventSystem.off(EVENT_TYPES.EGG_DESTROYED, this.handleEggDestroyed.bind(this));
        this.eventSystem.off(EVENT_TYPES.ITEM_SPAWN, this.handleItemSpawn.bind(this));
        this.eventSystem.off(EVENT_TYPES.ITEM_COLLECT, this.handleItemCollect.bind(this));
        this.eventSystem.off(EVENT_TYPES.DEFENSE_CREATE, this.handleDefenseCreate.bind(this));
        this.eventSystem.off(EVENT_TYPES.DEFENSE_ACTIVATE, this.handleDefenseActivate.bind(this));
        this.eventSystem.off(EVENT_TYPES.DEFENSE_DESTROY, this.handleDefenseDestroy.bind(this));
        this.eventSystem.off(EVENT_TYPES.GAME_START, this.handleGameStart.bind(this));
        this.eventSystem.off(EVENT_TYPES.GAME_END, this.handleGameEnd.bind(this));
        
        console.log('EffectHandler очищен');
    }
}
