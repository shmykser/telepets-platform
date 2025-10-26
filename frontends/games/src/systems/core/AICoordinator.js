import { MovementSystem } from './MovementSystem.js';
import { AttackSystem } from './AttackSystem.js';
import { CollisionSystem } from './CollisionSystem.js';
import { PathfindingSystem } from './PathfindingSystem.js';
import { SystemConfig } from '../config/SystemConfig.js';
import { StealthStrategy } from '../strategies/stealth/StealthStrategy.js';
import { BurrowStealthStrategy } from '../strategies/stealth/BurrowStealthStrategy.js';
import { TargetPointSystem } from './TargetPointSystem.js';
import { settings } from '../../../config/settings.js';

/**
 * Координатор систем ИИ
 * Управляет всеми системами игрового объекта и координирует их работу
 */
export class AICoordinator {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.systems = new Map();
        this.isActive = true;
        this.updateInterval = 16; // ~60 FPS
        this.lastUpdateTime = 0;
        
        // Цель для всех систем
        this.currentTarget = null;
        
        // Стратегии
        this.stealthStrategy = null;
        this.targetPointSystem = null;
        
        // Состояние ИИ
        this.state = 'idle'; // idle, moving, attacking, pathfinding
        this.lastStateChange = 0;
        
        this.initialize();
    }

    initialize() {
        this.setupSystems();
        this.setupStrategies();
        this.setupEventListeners();
    }

    setupSystems() {
        // Создаем конфигурации для каждой системы
        // ВАЖНО: Порядок источников - от низкого к высокому приоритету
        // Последний источник имеет наивысший приоритет при разрешении конфликтов
        const movementConfig = new SystemConfig([
            this.config,
            this.config.get('behaviorParams', {}),
            this.config.get('movement', {})
        ]);

        const attackConfig = new SystemConfig([
            this.config,
            this.config.get('behaviorParams', {}),
            this.config.get('attack', {})
        ]);

        const collisionConfig = new SystemConfig([
            this.config,
            this.config.get('behaviorParams', {}),
            this.config.get('collision', {})
        ]);

        const pathfindingConfig = new SystemConfig([
            this.config,
            this.config.get('behaviorParams', {}),
            this.config.get('pathfinding', {})
        ]);

        // Создаем системы только если gameObject существует
        if (this.gameObject) {
            this.systems.set('movement', new MovementSystem(this.gameObject, movementConfig));
            this.systems.set('attack', new AttackSystem(this.gameObject, attackConfig));
            this.systems.set('collision', new CollisionSystem(this.gameObject, collisionConfig));
            this.systems.set('pathfinding', new PathfindingSystem(this.gameObject, pathfindingConfig));
        }
    }

    setupStrategies() {
        // Инициализируем систему целевых точек
        if (this.gameObject && this.gameObject.scene) {
            this.targetPointSystem = new TargetPointSystem(this.gameObject.scene);
        }

        // Настраиваем стратегию движения
        const movementSystem = this.systems.get('movement');
        if (movementSystem) {
            const movementData = this.config.get('movement', {});
            const movementStrategy = (movementData && movementData.strategy) || 'linear';
            movementSystem.setStrategy(movementStrategy);
        }

        // Настраиваем стратегию атаки
        const attackSystem = this.systems.get('attack');
        if (attackSystem) {
            // Получаем конфигурацию атаки
            const attackConfig = this.config.get('attack', {});
            const attackStrategy = attackConfig.strategy || this.config.get('strategy', 'simple');
            
            
            attackSystem.setStrategy(attackStrategy);
            
            // Настраиваем условный спавн для крота
            if (attackStrategy === 'spawn' && attackConfig.conditionalSpawn) {
                const spawnAttack = attackSystem.strategy;
                if (spawnAttack && spawnAttack.setConditionCallback) {
                    // Устанавливаем условие: спавнить только когда на поверхности
                    spawnAttack.setConditionCallback(() => {
                        const isOnSurface = this.stealthStrategy && this.stealthStrategy.isOnSurfaceNow();
                        return isOnSurface;
                    });
                }
            }
        }

        // Настраиваем стратегию стелса
        const stealthConfig = this.config.get('stealth', {});
        if (stealthConfig && stealthConfig.strategy) {
            const stealthSystemConfig = new SystemConfig([this.config, stealthConfig]);
            
            if (stealthConfig.strategy === 'stealth') {
                this.stealthStrategy = new StealthStrategy(this.gameObject, stealthSystemConfig);
            } else if (stealthConfig.strategy === 'burrow') {
                this.stealthStrategy = new BurrowStealthStrategy(this.gameObject, stealthSystemConfig);
        }
            
            if (this.stealthStrategy) {
                this.stealthStrategy.activate();
            }
        }
    }

    setupEventListeners() {
        // Слушаем события от систем
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.on('movement:targetReached', this.onTargetReached.bind(this));
            this.gameObject.scene.events.on('movement:pathCompleted', this.onPathCompleted.bind(this));
            this.gameObject.scene.events.on('attack:attackPerformed', this.onAttackPerformed.bind(this));
            this.gameObject.scene.events.on('collision:collision', this.onCollision.bind(this));
            this.gameObject.scene.events.on('pathfinding:pathCompleted', this.onPathfindingCompleted.bind(this));
        }
    }

    /**
     * Обновление координатора
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isActive || !this.gameObject || !this.gameObject.isAlive) {
            return;
        }

        if (time - this.lastUpdateTime < this.updateInterval) {
            return;
        }

        this.lastUpdateTime = time;

        // Обновляем все системы
        this.systems.forEach((system, name) => {
            if (system.isActive) {
                // Только для улья логируем обновление системы атаки
                if (this.gameObject?.enemyType === 'hive' && name === 'attack') {
                    console.log(`🏠 [HIVE] AICoordinator вызывает AttackSystem.update()`);
                }
                system.update(time, delta);
            }
        });

        // Обновляем стратегию стелса
        if (this.stealthStrategy) {
            this.stealthStrategy.update(time, delta);
        }

        // Координируем работу систем
        this.coordinateSystems(time, delta);
    }

    /**
     * Координация работы систем
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    coordinateSystems(time, delta) {
        const movementSystem = this.systems.get('movement');
        const attackSystem = this.systems.get('attack');
        const pathfindingSystem = this.systems.get('pathfinding');

        // Обновляем стратегию стелса
        if (this.stealthStrategy && this.stealthStrategy.update) {
            this.stealthStrategy.update(time, delta);
        }

        if (!this.currentTarget) {
            this.setState('idle');
            return;
        }

        // Получаем стратегии движения и атаки для дальнейших проверок
        const movementData = this.config.get('movement', {});
        const movementStrategy = (movementData && movementData.strategy) || 'linear';
        const attackConfig = this.config.get('attack', {});
        const attackStrategy = attackConfig.strategy || 'simple';
        
        // Для стратегии 'spawn' НЕ вызываем attack() - стратегия работает через свой update()
        // который уже вызван на строке 185 в AICoordinator.update()
        if (attackStrategy === 'spawn') {
            // Спавнеры работают автономно через SpawnAttackStrategy.update()
            // Не нужно вызывать attackSystem.attack() - это перезапишет логику таймера
            return;
        }
        
        // Для остальных стратегий проверяем, можем ли атаковать
        if (attackSystem && attackStrategy !== 'none') {
            // Проверяем радиус атаки
            const inRange = attackSystem.isInRange && attackSystem.isInRange();
            
            if (inRange) {
                // Пытаемся атаковать
                const attackSuccessful = attackSystem.attack(this.currentTarget);
                
                // Если атака успешна (cooldown прошел) - останавливаемся для атаки
                if (attackSuccessful) {
                    this.setState('attacking');
                    return;
                }
                // Если атака неудачна (cooldown не прошел) - продолжаем движение ниже
                // Это исправляет баг с рывками у жука и паука
            }
        }

        // Если не можем атаковать, ищем путь (кроме стационарных спавнеров и статичных объектов)
        // movementStrategy уже получена выше
        if (movementStrategy === 'spawner' || movementStrategy === 'static') {
            // Для спавнеров и статичных объектов (улей) не используем pathfinding и не двигаем их
        } else if (pathfindingSystem && this.shouldUsePathfinding()) {
            // Если уже есть активный путь, не пересчитываем каждый кадр
            const existingPathActive = movementSystem.currentPath && movementSystem.pathIndex < movementSystem.currentPath.length;
            
            const path = existingPathActive ? movementSystem.currentPath : pathfindingSystem.findPath(this.currentTarget);
            
            if (path && path.length > 0) {
                this.setState('pathfinding');
                if (!existingPathActive) {
                    pathfindingSystem.setPath(path);
                    movementSystem.moveAlongPath(path);
                }
                return;
            } else {
                // НЕ пытаемся двигаться напрямую - это приведет к движению через препятствия
                this.setState('idle');
                movementSystem.stopMovement();
                return;
            }
        } else {
        }

        // Проверяем тип стратегии движения
        // movementStrategy уже получена выше
        
        if (movementStrategy === 'randomPoint' || movementStrategy === 'spawner' || movementStrategy === 'static') {
            // Для этих стратегий не передаем внешнюю цель
            // randomPoint и spawner работают со своими внутренними целями
            // static объекты (улей) вообще не двигаются
            // Не устанавливаем состояние moving для этих стратегий
            return;
        }
        
        // Движение для обычных стратегий (только если pathfinding не используется)
        
        // Логи для жука и паука
        if ((this.gameObject?.enemyType === 'beetle' || this.gameObject?.enemyType === 'spider')) {
            const enemyIcon = this.gameObject.enemyType === 'beetle' ? '🐞' : '🕷️';
            console.log(`${enemyIcon} [${this.gameObject.enemyType}] 🏃 Прямое движение к цели (без pathfinding)`);
        }
        
        this.setState('moving');
        movementSystem.moveTo(this.currentTarget);
    }

    /**
     * Проверка, нужно ли использовать поиск пути
     * @returns {boolean}
     */
    shouldUsePathfinding() {
        // Глобальный флаг для временного отключения pathfinding
        if (settings && settings.ai && settings.ai.pathfindingEnabled === false) {
            return false;
        }
        const pathfindingSystem = this.systems.get('pathfinding');
        if (!pathfindingSystem) {
            return false;
        }

        // Для летающих объектов не используем pathfinding, если они игнорируют наземные препятствия
        if (this.gameObject.canFly && pathfindingSystem.ignoreGroundObstacles) {
            return false;
        }

        // Используем ObstacleInteractionSystem для проверки препятствий
        const obstacleSystem = this.gameObject.scene.obstacleInteractionSystem;
        if (obstacleSystem && obstacleSystem.obstacles && obstacleSystem.obstacles.length > 0) {
            return true;
        }

        // Fallback: проверяем сцену напрямую
        const hasObstacles = this.gameObject && this.gameObject.scene && 
            this.gameObject.scene.children.list.some(obj => 
                obj.isObstacle || (obj.defenseData && obj.defenseData.isObstacle)
            );
        return hasObstacles;
    }

    /**
     * Установка цели для всех систем
     * @param {Object} target - Цель
     */
    setTarget(target) {
        this.currentTarget = target;
        
        // Уведомляем системы о новой цели
        const movementSystem = this.systems.get('movement');
        const attackSystem = this.systems.get('attack');
        const pathfindingSystem = this.systems.get('pathfinding');
        
        // При смене цели (например, на сахар) сбрасываем активный путь,
        // чтобы немедленно перестроить маршрут к новой цели
        if (pathfindingSystem && pathfindingSystem.clearPath) {
            pathfindingSystem.clearPath();
        }
        if (movementSystem) {
            movementSystem.currentPath = null;
            movementSystem.pathIndex = 0;
        }
        
        // Проверяем тип стратегии движения
        const movementConfig = this.config.get('movement', {});
        const movementStrategy = (movementConfig && movementConfig.strategy) || 'linear';
        
        
        if (movementSystem && movementStrategy !== 'randomPoint' && movementStrategy !== 'spawner') {
            movementSystem.moveTo(target);
            
            // Для inertia стратегии передаем cooldown атаки
            if (movementStrategy === 'inertia' && movementSystem.strategy && movementSystem.strategy.updateAttackCooldown) {
                const attackConfig = this.config.get('attack', {});
                const cooldown = attackConfig.cooldown || 5000; // Используем значение из конфигурации рино
                movementSystem.strategy.updateAttackCooldown(cooldown);
            }
        }
        
        if (attackSystem) {
            attackSystem.setTarget(target);
        }

        if (this.gameObject) {
            this.emit('targetChanged', {
                oldTarget: this.currentTarget,
                newTarget: target,
                gameObject: this.gameObject
            });
        }
    }

    /**
     * Получение текущей цели
     * @returns {Object|null}
     */
    getTarget() {
        return this.currentTarget;
    }

    /**
     * Установка состояния ИИ
     * @param {string} state - Состояние
     */
    setState(state) {
        if (this.state === state) {
            return;
        }

        const oldState = this.state;
        this.state = state;
        this.lastStateChange = (this.gameObject && this.gameObject.scene && this.gameObject.scene.time) ? 
            this.gameObject.scene.time.now : Date.now();

        // Проверяем, что gameObject существует перед эмитом события
        if (this.gameObject) {
            this.emit('stateChanged', {
                oldState,
                newState: state,
                gameObject: this.gameObject
            });
        }
    }

    /**
     * Получение состояния ИИ
     * @returns {string}
     */
    getState() {
        return this.state;
    }

    /**
     * Активация координатора
     */
    activate() {
        this.isActive = true;
        this.systems.forEach(system => system.activate());
        if (this.gameObject) {
            this.emit('activated', { gameObject: this.gameObject });
        }
    }

    /**
     * Деактивация координатора
     */
    deactivate() {
        this.isActive = false;
        this.systems.forEach(system => system.deactivate());
        if (this.gameObject) {
            this.emit('deactivated', { gameObject: this.gameObject });
        }
    }

    /**
     * Получение системы по имени
     * @param {string} systemName - Имя системы
     * @returns {Object|null}
     */
    getSystem(systemName) {
        return this.systems.get(systemName) || null;
    }

    /**
     * Включение/выключение системы
     * @param {string} systemName - Имя системы
     * @param {boolean} enabled - Включена ли система
     */
    setSystemEnabled(systemName, enabled) {
        const system = this.systems.get(systemName);
        if (system) {
            system.setEnabled(enabled);
        }
    }

    /**
     * Обработчик достижения цели
     * @param {Object} event - Событие
     */
    onTargetReached(event) {
        this.setState('idle');
        if (this.gameObject) {
            this.emit('targetReached', event);
        }
    }

    /**
     * Обработчик завершения пути
     * @param {Object} event - Событие
     */
    onPathCompleted(event) {
        this.setState('idle');
        if (this.gameObject) {
            this.emit('pathCompleted', event);
        }
    }

    /**
     * Обработчик выполненной атаки
     * @param {Object} event - Событие
     */
    onAttackPerformed(event) {
        if (this.gameObject) {
            this.emit('attackPerformed', event);
        }
    }

    /**
     * Обработчик коллизии
     * @param {Object} event - Событие
     */
    onCollision(event) {
        if (this.gameObject) {
            this.emit('collision', event);
        }
    }

    /**
     * Обработчик завершения поиска пути
     * @param {Object} event - Событие
     */
    onPathfindingCompleted(event) {
        this.setState('moving');
        if (this.gameObject) {
            this.emit('pathfindingCompleted', event);
        }
    }

    /**
     * Получение состояния всех систем
     * @returns {Object}
     */
    getSystemsState() {
        const state = {};
        this.systems.forEach((system, name) => {
            state[name] = system.getState ? system.getState() : {
                isActive: system.isActive,
                enabled: system.enabled
            };
        });
        return state;
    }

    /**
     * Получение общего состояния ИИ
     * @returns {Object}
     */
    getAIState() {
        return {
            isActive: this.isActive,
            state: this.state,
            currentTarget: this.currentTarget,
            lastStateChange: this.lastStateChange,
            systems: this.getSystemsState()
        };
    }

    /**
     * Эмит события
     * @param {string} event - Событие
     * @param {Object} data - Данные
     */
    emit(event, data) {
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit(`ai:${event}`, data);
        } else {
            console.warn(`AICoordinator: Cannot emit event '${event}' - scene not available`);
        }
    }

    /**
     * Обработка достижения цели
     * @param {number} time - Текущее время
     */
    onTargetReached(time) {
        
        // Проверяем, можем ли атаковать
        const attackSystem = this.systems.get('attack');
        
        if (!attackSystem) {
            return;
        }
        
        // Получаем конфигурацию атаки безопасно
        const attackConfig = this.config ? this.config.get('attack', {}) : {};
        const attackStrategy = attackConfig.strategy || 'simple';
        
        
        // Устанавливаем цель для системы атаки перед проверкой isInRange
        if (this.currentTarget) {
            attackSystem.setTarget(this.currentTarget);
        }
        
        if (attackStrategy !== 'none' && attackSystem.isInRange && attackSystem.isInRange()) {
            this.setState('attacking');
            attackSystem.attack(this.currentTarget);
            return;
        } else {
        }
        
        // Если у нас есть стратегия стелса burrow, выводим крота на поверхность
        if (this.stealthStrategy && this.stealthStrategy.goSurface) {
            this.stealthStrategy.goSurface(time);
        }
    }

    /**
     * Уничтожение координатора
     */
    destroy() {
        this.deactivate();
        
        // Уничтожаем все системы
        this.systems.forEach(system => {
            if (system.destroy) {
                system.destroy();
            }
        });
        this.systems.clear();

        // Очищаем слушатели событий
        if (this.gameObject && this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.off('movement:targetReached', this.onTargetReached);
            this.gameObject.scene.events.off('movement:pathCompleted', this.onPathCompleted);
            this.gameObject.scene.events.off('attack:attackPerformed', this.onAttackPerformed);
            this.gameObject.scene.events.off('collision:collision', this.onCollision);
            this.gameObject.scene.events.off('pathfinding:pathCompleted', this.onPathfindingCompleted);
        }

        // Уничтожаем стратегию стелса
        if (this.stealthStrategy) {
            this.stealthStrategy.destroy();
            this.stealthStrategy = null;
        }

        // Уничтожаем систему целевых точек
        if (this.targetPointSystem) {
            this.targetPointSystem.destroy();
            this.targetPointSystem = null;
        }

        this.gameObject = null;
        this.config = null;
        this.currentTarget = null;
    }

    /**
     * Обработка урона
     * @param {number} damage - Урон
     * @param {number} time - Текущее время
     */
    takeDamage(damage, time) {
        // Передаем урон в стратегию стелса
        if (this.stealthStrategy) {
            this.stealthStrategy.takeDamage(damage, time);
        }
    }
}
