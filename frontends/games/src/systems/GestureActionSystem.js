import { GESTURE_ACTIONS, TARGET_TYPES, TARGET_SETTINGS } from '../types/gestureTypes';
import { EVENT_TYPES } from '../types/EventTypes.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';
import { Defense } from '../objects/Defense.js';
import { Enemy } from '../objects/Enemy.js';

/**
 * Система обработки жестов и выполнения действий
 * Следует принципу Single Responsibility Principle
 */
export class GestureActionSystem {
    constructor(scene, enemies, defenses, egg = null, itemDropSystem = null, abilitySystem = null) {
        this.scene = scene;
        this.enemies = enemies;
        this.defenses = defenses || (scene && scene.defenses) || [];
        this.egg = egg;
        this.itemDropSystem = itemDropSystem;
        this.abilitySystem = abilitySystem;
        // Периодически обновляем эффект сахара, чтобы новые враги тоже притягивались
        if (this.scene && this.scene.time) {
            this._sugarRefreshTimer = this.scene.time.addEvent({
                delay: 300,
                loop: true,
                callback: () => { this.updateSugarEffects(); this.updatePitEffects(); },
                callbackScope: this
            });
        }
        // Также подписываемся на спавн врагов, чтобы мгновенно проверять их попадание в радиус
        if (this.scene && this.scene.events) {
            this.scene.events.on(EVENT_TYPES.ENEMY_SPAWN, (payload) => {
                const spawned = payload?.enemy;
                if (!spawned) return;
                // Добавляем врага в локальный список, если его там нет
                const arr = this.getEnemiesArray();
                if (!arr.includes(spawned)) {
                    // Если используем локальный массив, добавим туда
                    if (arr === this.enemies) {
                        this.enemies.push(spawned);
                    }
                }
                // Обрабатываем для всех активных сахаров
                const sugars = this.getSugarsArray();
                sugars.forEach(s => this.updateSingleSugarEffect(s));
            });
        }
    }

    /**
     * Возвращает актуальный массив врагов (из waveSystem, если доступен)
     */
    getEnemiesArray() {
        const wsEnemies = this.scene?.waveSystem?.enemies;
        return Array.isArray(wsEnemies) ? wsEnemies : this.enemies;
    }

    /**
     * Возвращает актуальный массив сахаров из сцены
     */
    getSugarsArray() {
        const list = this.scene?.defenses || this.defenses || [];
        return list.filter(d => d && d.defenseType === 'sugar' && d.isAlive);
    }
    
    /**
     * Обрабатывает жест и выполняет соответствующее действие
     * @param {Object} gesture - Объект жеста от GestureSystem
     * @returns {boolean} Успешность выполнения действия
     */
    handleGesture(gesture) {
        console.log(`🎯 [DEBUG] handleGesture: type=${gesture.type}, x=${gesture.x}, y=${gesture.y}`);
        
        // Определяем цель жеста
        const target = this.detectTarget(gesture.x, gesture.y);
        gesture.target = target;
        
        console.log(`🎯 [DEBUG] detectTarget result: type=${target.type}`);
        
        // Формируем ключ действия
        const actionKey = `${gesture.type}_${target.type}`;
        const action = GESTURE_ACTIONS[actionKey];
        
        console.log(`🎯 [DEBUG] actionKey=${actionKey}, action=${action?.name || 'null'}`);
        
        if (!action) {
            console.log(`🎯 [DEBUG] No action found for ${actionKey}`);
            return false;
        }
        
        
        // Выполняем действие
        return this.executeAction(action, gesture, target);
    }
    
    /**
     * Определяет цель жеста по координатам
     * @param {number} x - X координата жеста
     * @param {number} y - Y координата жеста
     * @returns {Object} Объект с типом цели и самим объектом
     */
    detectTarget(x, y) {
        // Проверяем предметы (приоритет 1 - самый высокий для точного клика)
        if (this.itemDropSystem && this.itemDropSystem.items) {
            const item = GeometryUtils.findFirstObjectInRadius(
                this.itemDropSystem.items, x, y,
                TARGET_SETTINGS.item.missTolerance,
                (item) => {
                    const itemHitRadius = GeometryUtils.calculateHitRadius(item, 'item', TARGET_SETTINGS);
                    const inRadius = GeometryUtils.isInRadius(x, y, item.x, item.y, itemHitRadius);
                    return inRadius && !item.isCollected;
                }
            );
            
            if (item) {
                console.log('🍯 [GestureAction] Найден предмет для сбора:', item.itemType);
                return {
                    type: TARGET_TYPES.ITEM,
                    object: item,
                    x: x,
                    y: y
                };
            }
        } else {
            // Попробуем получить ItemDropSystem из Enemy
            if (Enemy.itemDropSystem) {
                this.itemDropSystem = Enemy.itemDropSystem;
                
                if (this.itemDropSystem && this.itemDropSystem.items) {
                    const item = GeometryUtils.findFirstObjectInRadius(
                        this.itemDropSystem.items, x, y,
                        TARGET_SETTINGS.item.missTolerance,
                        (item) => {
                            const itemHitRadius = GeometryUtils.calculateHitRadius(item, 'item', TARGET_SETTINGS);
                            const inRadius = GeometryUtils.isInRadius(x, y, item.x, item.y, itemHitRadius);
                            return inRadius && !item.isCollected;
                        }
                    );
                    
                    if (item) {
                        return {
                            type: TARGET_TYPES.ITEM,
                            object: item,
                            x: x,
                            y: y
                        };
                    }
                }
            }
        }
        
        // Проверяем врагов (приоритет 2)
        let foundEnemy = null;
        for (const enemy of this.getEnemiesArray()) {
            if (!enemy.isAlive) {
                continue;
            }
            const hitRadius = GeometryUtils.calculateHitRadius(enemy, 'enemy', TARGET_SETTINGS);
            const isInRange = GeometryUtils.isInRadius(x, y, enemy.x, enemy.y, hitRadius);
            if (isInRange) {
                foundEnemy = enemy;
                break;
            }
        }
        
        if (foundEnemy) {
            return {
                type: TARGET_TYPES.ENEMY,
                object: foundEnemy,
                x: x,
                y: y
            };
        }
        
        // Проверяем яйцо (приоритет 3)
        if (this.egg && this.egg.isAlive) {
            const eggHitRadius = GeometryUtils.calculateHitRadius(this.egg, 'egg', TARGET_SETTINGS);
            const isEggInRange = GeometryUtils.isInRadius(x, y, this.egg.x, this.egg.y, eggHitRadius);
            if (isEggInRange) {
                return {
                    type: TARGET_TYPES.EGG,
                    object: this.egg,
                    x: x,
                    y: y
                };
            }
        }
        
        // Проверяем защиту (приоритет 4)
        const defense = GeometryUtils.findFirstObjectInRadius(
            this.defenses, x, y, 
            0,
            (defense) => {
                const defenseHitRadius = GeometryUtils.calculateHitRadius(defense, 'defense', TARGET_SETTINGS);
                return GeometryUtils.isInRadius(x, y, defense.x, defense.y, defenseHitRadius);
            }
        );
        if (defense) {
            return {
                type: TARGET_TYPES.DEFENSE,
                object: defense,
                x: x,
                y: y
            };
        }
        
        // Поле (приоритет 0)
        return {
            type: TARGET_TYPES.FIELD,
            object: null,
            x: x,
            y: y
        };
    }
    
    /**
     * Выполняет действие на основе типа
     * @param {Object} action - Конфигурация действия
     * @param {Object} gesture - Объект жеста
     * @param {Object} target - Целевой объект
     * @returns {boolean} Успешность выполнения
     */
    executeAction(action, gesture, target) {
        try {
            switch (action.name) {
                case 'damage_enemy':
                    // Если damage не указан в action, используем AbilitySystem
                    const damage = action.damage || this.abilitySystem?.getTapDamage() || 5;
                    return this.damageEnemy(target.object, damage);
                    
                case 'critical_damage':
                    return this.damageEnemy(target.object, this.abilitySystem?.getTapDamage() || 5);
                    
                case 'activate_egg_explosion':
                    return this.activateEggExplosion(target.object);
                    
                case 'collect_item':
                    return this.collectItem(target.object);
                    
                case 'place_defense':
                    return true;
                    
                case 'heal_egg':
                    return true;
                    
                case 'explosion':
                    return this.createSugar(gesture.x, gesture.y);
                    
                case 'freeze_enemy':
                    return true;
                    
                case 'shield_egg':
                    return true;
                    
                case 'create_pit':
                    return this.placePit(gesture.x, gesture.y);
                    
                case 'damage_wave':
                    return true;
                    
                default:
                    return false;
            }
        } catch (error) {
            console.error('Ошибка выполнения действия:', error);
            return false;
        }
    }
    
    /**
     * Наносит урон врагу
     * @param {Object} enemy - Объект врага
     * @param {number} damage - Количество урона
     * @returns {boolean} Успешность атаки
     */
    damageEnemy(enemy, damage = null) {
        // Если урон не указан, берем из AbilitySystem или используем базовое значение
        if (damage === null) {
            damage = this.abilitySystem?.getTapDamage() || 5;
        }
        if (!enemy || !enemy.isAlive) {
            return false;
        }
        
        enemy.takeDamage(damage);
        return true;
    }
    
    
    /**
     * Активирует взрыв яйца
     * @param {Object} egg - Объект яйца
     * @returns {boolean} Успешность активации
     */
    activateEggExplosion(egg) {
        if (!egg || !egg.activateEggExplosion) {
            return false;
        }
        // Явно проверяем уровень способности взрыва яйца, чтобы при 0 ничего не происходило
        const level = (this.abilitySystem && this.abilitySystem.getEggExplosion)
            ? this.abilitySystem.getEggExplosion()
            : (egg.eggExplosion || 0);
        if (level <= 0) {
            return false;
        }
        
        return egg.activateEggExplosion();
    }
    
    /**
     * Собирает предмет
     * @param {Object} item - Объект предмета
     * @returns {boolean} Успешность сбора
     */
    collectItem(item) {
        if (!item || item.isCollected) {
            return false;
        }
        
        console.log('🍯 [GestureAction] Собираем предмет:', item.itemType);
        if (item.itemType === 'shovel') {
            console.log(`🪓 [DEBUG] collectItem: лопат до сбора: ${this.abilitySystem.getShovelCount()}`);
        }
        
        // Активируем эффект предмета
        item.activate();
        
        if (item.itemType === 'shovel') {
            console.log(`🪓 [DEBUG] collectItem: лопат после сбора: ${this.abilitySystem.getShovelCount()}`);
        }
        
        // Собираем предмет
        const result = item.collect();
        return result;
    }
    
    /**
     * Обновляет списки объектов
     * @param {Array} enemies - Массив врагов
     * @param {Array} defenses - Массив защитных объектов
     */
    updateObjects(enemies, defenses) {
        this.enemies = enemies;
        this.defenses = defenses;
        
        // Обновляем ItemDropSystem из статического свойства Enemy
        if (this.itemDropSystem !== Enemy.itemDropSystem) {
            this.itemDropSystem = Enemy.itemDropSystem;
        }
        
        // Обновляем эффекты сахара для новых врагов
        this.updateSugarEffects();
    }
    
    /**
     * Обновляет эффекты сахара - отслеживает новых врагов в радиусе
     */
    updateSugarEffects() {
        // Находим все сахары на поле
        const sugars = this.getSugarsArray();
        
        sugars.forEach(sugar => {
            this.updateSingleSugarEffect(sugar);
        });
    }

    /**
     * Обновляет эффекты ям - мгновенное взаимодействие с врагами
     */
    updatePitEffects() {
        if (!this.scene || !this.scene.defenses) return;
        const pits = this.scene.defenses.filter(d => d && d.isAlive && d.defenseType === 'pit');
        pits.forEach(pit => this.updateSinglePitEffect(pit));
    }

    /**
     * Инициализирует базовые параметры визуала ямы для корректного масштабирования
     * @param {Object} pit
     */
    initPitVisual(pit) {
        if (!pit) return;
        if (pit._pitBaseInitialized) return;
        const baseHealth = pit._defenseData?.health ?? pit.health ?? 1;
        pit._pitBaseHealth = Math.max(1, baseHealth);
        pit._pitBaseScaleX = pit.scaleX || 1;
        pit._pitBaseScaleY = pit.scaleY || 1;
        pit._pitBaseInitialized = true;
        this.updatePitVisual(pit);
    }

    /**
     * Пересчитывает радиус и визуальный размер ямы в зависимости от текущего здоровья
     * @param {Object} pit
     */
    updatePitVisual(pit) {
        if (!pit) return;
        if (!pit._pitBaseInitialized) this.initPitVisual(pit);
        const health = Math.max(0, pit.health || 0);
        const baseHealth = pit._pitBaseHealth || 1;
        const scaleFactor = Math.max(0.1, health / baseHealth);
        
        // Абсолютный скейл относительно базового
        pit.setScale(pit._pitBaseScaleX * scaleFactor, pit._pitBaseScaleY * scaleFactor);
        
        // Радиус должен соответствовать размеру спрайта (половина от displayWidth)
        const newRadius = (pit.displayWidth || pit.width || 64) / 2;
        if (pit._defenseData) pit._defenseData.radius = newRadius;
        
        console.log(`🕳️ [DEBUG] updatePitVisual: health=${health}, scale=${scaleFactor.toFixed(2)}, displayWidth=${pit.displayWidth}, radius=${newRadius.toFixed(1)}`);
        
        // Обновим отладочную окружность, если есть
        if (pit._debugCircle) {
            const g = pit._debugCircle;
            g.clear();
            g.lineStyle(2, 0xaa5500, 0.8);
            g.strokeCircle(pit.x, pit.y, newRadius);
        }
    }

    /**
     * Обновляет один объект ямы: ищет врагов в радиусе, выполняет мгновенное "взаимное вычитание" здоровья
     * @param {Object} pit
     */
    updateSinglePitEffect(pit) {
        if (!pit || !pit.isAlive) return;
        this.initPitVisual(pit);

        const radius = Math.max(0, pit._defenseData?.radius || 0);
        if (radius <= 0) return;

        // Визуальный радиус (для диагностики)
        if (!pit._debugCircle && this.scene?.add) {
            pit._debugCircle = this.scene.add.graphics();
            pit._debugCircle.setDepth(5);
            pit._debugCircle.setAlpha(0.25);
        }
        if (pit._debugCircle) {
            const g = pit._debugCircle;
            g.clear();
            g.lineStyle(2, 0xaa5500, 0.8);
            g.strokeCircle(pit.x, pit.y, radius);
        }

           const allEnemiesInRadius = GeometryUtils.findObjectsInRadius(
               this.getEnemiesArray(),
               pit.x,
               pit.y,
               radius,
               (enemy) => enemy && enemy.isAlive && enemy.aiCoordinator
           );
           
           // Фильтруем только нелетающих врагов
           const enemies = allEnemiesInRadius.filter(enemy => !enemy.canFly);
           
           if (allEnemiesInRadius.length > 0) {
               console.log(`🕳️ [DEBUG] Врагов в радиусе ямы: ${allEnemiesInRadius.length} (летающих: ${allEnemiesInRadius.filter(e => e.canFly).length}, нелетающих: ${enemies.length})`);
           }

        if (enemies.length === 0) return;

        // Для каждой цели выполним мгновенное взаимодействие
        enemies.forEach(enemy => {
            if (!pit.isAlive || !enemy.isAlive) return;
            const enemyHealth = Math.max(0, enemy.health ?? 0);
            const pitHealth = Math.max(0, pit.health ?? 0);
            if (pitHealth <= 0) return;

            if (pitHealth > enemyHealth) {
                // Яма сильнее: враг уничтожается, яма теряет здоровье врага
                if (enemy.takeDamage) {
                    enemy.takeDamage(enemyHealth);
                } else {
                    enemy.isAlive = false;
                }
                pit.health = pitHealth - enemyHealth;
                this.updatePitVisual(pit);
            } else if (pitHealth < enemyHealth) {
                // Враг сильнее: враг теряет здоровье ямы, яма уничтожается
                if (enemy.takeDamage) {
                    enemy.takeDamage(pitHealth);
                }
                pit.health = 0;
                this.updatePitVisual(pit);
                // Уничтожаем яму
                if (pit.destroy) {
                    if (pit._debugCircle) { pit._debugCircle.destroy(); pit._debugCircle = null; }
                    pit.destroy();
                }
            } else {
                // Равные: оба уничтожаются
                if (enemy.takeDamage) {
                    enemy.takeDamage(enemyHealth);
                } else {
                    enemy.isAlive = false;
                }
                pit.health = 0;
                this.updatePitVisual(pit);
                if (pit.destroy) {
                    if (pit._debugCircle) { pit._debugCircle.destroy(); pit._debugCircle = null; }
                    pit.destroy();
                }
            }
        });
    }
    
    /**
     * Обновляет эффект одного сахара
     * @param {Object} sugar - Объект сахара
     */
    updateSingleSugarEffect(sugar) {
        const radius = this.getSugarRadiusPx(sugar);
        
        // Находим всех живых врагов в радиусе
        const enemiesInRange = GeometryUtils.findObjectsInRadius(
            this.getEnemiesArray(),
            sugar.x,
            sugar.y,
            radius,
            (enemy) => enemy && enemy.isAlive && enemy.aiCoordinator
        );
        
        // Логируем только если есть враги в радиусе (чтобы не спамить)
        if (enemiesInRange.length > 0) {
            console.log(`🍩 [Sugar] UPDATE: найдено ${enemiesInRange.length} врагов в радиусе ${radius}px`);
        }
        
        // Переключаем цели врагов, которые еще не атакуют этот сахар
        enemiesInRange.forEach(enemy => {
            // Проверяем, не атакует ли уже этот сахар
            if (enemy._target !== sugar && enemy.aiCoordinator && enemy.aiCoordinator.setTarget) {
                console.log(`🍩 [Sugar] UPDATE: Новый враг ${enemy.enemyType} в радиусе сахара, переключаем цель`);
                console.log(`🍩 [Sugar] UPDATE: - Текущая цель: ${enemy.target?.constructor?.name || 'null'}`);
                console.log(`🍩 [Sugar] UPDATE: - Цель сахар: ${enemy._target === sugar}`);
                
                // Сохраняем оригинальную цель если еще не сохранена
                if (!enemy._originalTarget) {
                    enemy._originalTarget = enemy.target;
                    console.log(`🍩 [Sugar] UPDATE: - Сохранили оригинальную цель: ${enemy._originalTarget?.constructor?.name || 'null'}`);
                }
                
                // Переключаем на сахар
                enemy.aiCoordinator.setTarget(sugar);
                enemy._target = sugar;
                
                console.log(`🍩 [Sugar] UPDATE: - Новая цель установлена: ${enemy._target?.constructor?.name || 'null'}`);
            }
        });

        // Обновляем визуальный радиус (только для диагностики)
        this.updateSugarDebugCircle(sugar, radius);
    }

    /**
     * Возвращает радиус действия сахара в пикселях
     */
    getSugarRadiusPx(sugar) {
        if (!sugar || !sugar._defenseData) return 0;
        // Радиус интерпретируем как пиксели, без дополнительных коэффициентов
        const r = sugar._defenseData.radius || 0;
        return Math.max(0, r);
    }
    
    /**
     * Размещает или расширяет яму по координатам
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {boolean} Успешность операции
     */
    placePit(x, y) {
        if (!this.abilitySystem) {
            return false;
        }
        
        const shovelCount = this.abilitySystem.getShovelCount();
        const pitCount = this.abilitySystem.getPitCount();
        const maxPits = this.abilitySystem.abilities.PIT?.maxValue || 4;
        
        console.log(`🪓 [DEBUG] placePit вызван: shovelCount=${shovelCount}, pitCount=${pitCount}, maxPits=${maxPits}`);
        console.log(`🪓 [DEBUG] abilitySystem.abilities.SHOVEL=${this.abilitySystem.abilities.SHOVEL}`);
        
        // Проверяем, есть ли лопаты
        if (shovelCount <= 0) {
            console.log(`🪓 [DEBUG] Нет лопат для копания!`);
            return false;
        }
        
        // Проверяем, есть ли уже яма в этом месте
        const existingPit = this.findPitAt(x, y);
        
        if (existingPit) {
            // Расширяем существующую яму (pitCount не изменяется)
            console.log(`🪓 [DEBUG] Найдена существующая яма, расширяем...`);
            return this.expandPit(existingPit);
        } else {
            // Проверяем, можно ли выкопать новую яму
            if (pitCount >= maxPits) {
                console.log(`🪓 [DEBUG] Достигнут максимум ям!`);
                return false;
            }
            
            // Создаем новую яму (pitCount увеличивается)
            console.log(`🪓 [DEBUG] Создаем новую яму...`);
            return this.digNewPit(x, y);
        }
    }
    
    /**
     * Находит яму по координатам
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {Object|null} Найденная яма или null
     */
    findPitAt(x, y) {
        // Ищем ближайшую яму, в радиус которой попадает точка (x, y)
        if (!this.defenses || this.defenses.length === 0) {
            return null;
        }

        let closestPit = null;
        let closestDist = Infinity;

        for (const defense of this.defenses) {
            if (!defense || !defense.isAlive || defense.defenseType !== 'pit') {
                continue;
            }

            const radius = Math.max(0, defense._defenseData?.radius || 0);
            if (radius <= 0) {
                continue;
            }

            const dist = GeometryUtils.distance(x, y, defense.x, defense.y);
            if (dist <= radius && dist < closestDist) {
                closestDist = dist;
                closestPit = defense;
            }
        }

        if (closestPit) {
            console.log(`🎯 Найдена яма в радиусе ${closestDist.toFixed(1)}px от (${x}, ${y}) (R=${closestPit._defenseData?.radius})`);
        } else {
            console.log(`🔍 Ям не найдено в зоне действия ям для точки (${x}, ${y})`);
        }

        return closestPit;
    }
    
    /**
     * Расширяет существующую яму
     * @param {Object} pit - Объект ямы
     * @returns {boolean} Успешность расширения
     */
    expandPit(pit) {
        try {
            console.log(`🪓 [DEBUG] expandPit вызван, лопат до: ${this.abilitySystem.getShovelCount()}`);
            
            const pitHealthIncrease = this.abilitySystem.getPitHealth?.() ?? (pit._defenseData?.increase ?? 50);
            
            // Увеличиваем здоровье ямы (Defense использует прямое изменение health)
            const oldHealth = pit.health;
            const maxHealth = pit.maxHealth ?? (pit._defenseData?.maxHealth ?? 1000);
            const newHealth = Math.min(pit.health + pitHealthIncrease, maxHealth);
            pit.health = newHealth;
            
            // Пересчитываем визуал и радиус в зависимости от здоровья
            this.updatePitVisual(pit);
            
            // Обновляем счетчики (только лопаты, pitCount не изменяется)
            this.abilitySystem.decrementAbility('SHOVEL', 1);
            
            console.log(`🕳️ Яма расширена в (${pit.x}, ${pit.y})`);
            console.log(`💚 Здоровье: ${oldHealth} → ${newHealth} (+${pitHealthIncrease})`);
            console.log(`🪓 Лопат осталось: ${this.abilitySystem.getShovelCount()}`);
            console.log(`🪓 [DEBUG] abilitySystem.abilities.SHOVEL после уменьшения: ${this.abilitySystem.abilities.SHOVEL}`);
            
            return true;
        } catch (error) {
            console.error('Ошибка расширения ямы:', error);
            return false;
        }
    }
    
    /**
     * Создает сахар по координатам
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {boolean} Успешность создания
     */
    createSugar(x, y) {
        try {
            console.log(`🍩 [GestureAction] СОЗДАНИЕ САХАРА в (${x}, ${y})`);
            
            // Создаем объект сахара через Defense.createDefense
            const sugar = Defense.createDefense(this.scene, 'sugar', x, y);
            
            console.log(`🍩 [GestureAction] - Объект сахара создан:`, {
                x: sugar.x,
                y: sugar.y,
                defenseType: sugar.defenseType,
                health: sugar.health,
                radius: sugar._defenseData?.radius
            });
            
            // Добавляем в массив защитных объектов сцены
            this.scene.defenses.push(sugar);
            console.log(`🍩 [GestureAction] - Добавлен в массив defenses, всего: ${this.scene.defenses.length}`);
            
            // Активируем систему переключения целей для врагов в радиусе
            this.activateSugarEffect(sugar);
            
            return true;
        } catch (error) {
            console.error('Ошибка создания сахара:', error);
            return false;
        }
    }
    
    /**
     * Активирует эффект сахара - переключает цели врагов в радиусе
     * @param {Object} sugar - Объект сахара
     */
    activateSugarEffect(sugar) {
        const radius = this.getSugarRadiusPx(sugar);
        
        console.log(`🍩 [Sugar] АКТИВАЦИЯ САХАРА:`);
        console.log(`🍩 [Sugar] - Позиция сахара: (${sugar.x}, ${sugar.y})`);
        console.log(`🍩 [Sugar] - Радиус: ${radius}px`);
        console.log(`🍩 [Sugar] - Всего врагов на поле: ${this.getEnemiesArray().length}`);
        
        // Находим всех врагов в радиусе действия сахара
        console.log(`🍩 [Sugar] - Проверяем фильтр для каждого врага:`);
        this.getEnemiesArray().forEach((enemy, index) => {
            if (enemy) {
                console.log(`🍩 [Sugar] - - Враг ${index}: alive=${enemy.isAlive}, aiCoordinator=${!!enemy.aiCoordinator}, setTarget=${!!(enemy.aiCoordinator && enemy.aiCoordinator.setTarget)}`);
            }
        });
        
        const enemiesInRange = GeometryUtils.findObjectsInRadius(
            this.getEnemiesArray(),
            sugar.x,
            sugar.y,
            radius,
            (enemy) => {
                const passes = enemy && enemy.isAlive && enemy.aiCoordinator;
                console.log(`🍩 [Sugar] - Фильтр для врага ${enemy?.enemyType || 'null'}: ${passes}`);
                return passes;
            }
        );
        
        console.log(`🍩 [Sugar] - Найдено врагов в радиусе: ${enemiesInRange.length}`);
        
        // Логируем позиции всех врагов для диагностики
        this.getEnemiesArray().forEach((enemy, index) => {
            if (enemy && enemy.isAlive) {
                const distance = GeometryUtils.distance(sugar.x, sugar.y, enemy.x, enemy.y);
                const inRange = distance <= radius;
                console.log(`🍩 [Sugar] - Враг ${index}: ${enemy.enemyType} в (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) - расстояние: ${distance.toFixed(1)}px - в радиусе: ${inRange}`);
            }
        });
        
        // Переключаем цели врагов на сахар
        enemiesInRange.forEach((enemy, index) => {
            console.log(`🍩 [Sugar] - Обрабатываем врага ${index}: ${enemy.enemyType}`);
            console.log(`🍩 [Sugar] - - aiCoordinator существует: ${!!enemy.aiCoordinator}`);
            console.log(`🍩 [Sugar] - - setTarget существует: ${!!(enemy.aiCoordinator && enemy.aiCoordinator.setTarget)}`);
            console.log(`🍩 [Sugar] - - Текущая цель: ${enemy.target?.constructor?.name || 'null'}`);
            
            if (enemy.aiCoordinator && enemy.aiCoordinator.setTarget) {
                console.log(`🍩 [Sugar] - - ВЫПОЛНЯЕМ ПЕРЕКЛЮЧЕНИЕ ЦЕЛИ на сахар`);
                enemy.aiCoordinator.setTarget(sugar);
                
                // Сохраняем оригинальную цель (яйцо) для восстановления
                if (!enemy._originalTarget) {
                    enemy._originalTarget = enemy.target;
                    console.log(`🍩 [Sugar] - - Сохранили оригинальную цель: ${enemy._originalTarget?.constructor?.name || 'null'}`);
                }
                enemy._target = sugar;
                
                console.log(`🍩 [Sugar] - - Новая цель установлена: ${enemy._target?.constructor?.name || 'null'}`);
            } else {
                console.log(`🍩 [Sugar] - - ОШИБКА: не можем переключить цель (нет aiCoordinator или setTarget)`);
            }
        });
        
        // Обновляем визуальный радиус (только для диагностики)
        this.updateSugarDebugCircle(sugar, radius);

        // Добавляем обработчик уничтожения сахара
        sugar.on('destroy', () => {
            this.onSugarDestroyed(sugar);
            // Удаляем отладочную окружность
            if (sugar._debugCircle) {
                sugar._debugCircle.destroy();
                sugar._debugCircle = null;
            }
        });
    }

    /**
     * Рисует/обновляет отладочную окружность радиуса сахара
     */
    updateSugarDebugCircle(sugar, radiusPx) {
        if (!this.scene || !this.scene.add) return;
        if (!sugar._debugCircle) {
            sugar._debugCircle = this.scene.add.graphics();
            sugar._debugCircle.setDepth(5);
            sugar._debugCircle.setAlpha(0.25);
        }
        const g = sugar._debugCircle;
        g.clear();
        g.lineStyle(2, 0x00aaff, 0.8);
        g.strokeCircle(sugar.x, sugar.y, radiusPx);
    }
    
    /**
     * Обрабатывает уничтожение сахара - возвращает врагов к яйцу
     * @param {Object} destroyedSugar - Уничтоженный сахар
     */
    onSugarDestroyed(destroyedSugar) {
        console.log(`🍩 [Sugar] Сахар уничтожен, возвращаем врагов к яйцу`);
        
        // Находим всех врагов, которые атаковали этот сахар
        // Используем актуальный массив врагов
        const allEnemies = this.getEnemiesArray();
        const affectedEnemies = allEnemies.filter(enemy => 
            enemy && enemy.isAlive && (
                enemy._target === destroyedSugar || 
                (enemy.aiCoordinator && enemy.aiCoordinator.target === destroyedSugar)
            )
        );
        
        console.log(`🍩 [Sugar] Найдено ${affectedEnemies.length} врагов, которые атаковали сахар`);
        console.log(`🍩 [Sugar] Всего врагов на поле: ${allEnemies.length}`);
        
        // Возвращаем врагов к их оригинальной цели (яйцу)
        affectedEnemies.forEach((enemy, index) => {
            if (enemy.aiCoordinator && enemy.aiCoordinator.setTarget) {
                const originalTarget = enemy._originalTarget || this.egg;
                console.log(`🍩 [Sugar] ${index+1}. Возвращаем врага ${enemy.enemyType} к цели:`, originalTarget?.constructor?.name || 'unknown');
                
                // Переключаем цель обратно
                enemy.aiCoordinator.setTarget(originalTarget);
                enemy._target = originalTarget;
                enemy._originalTarget = null; // Очищаем сохраненную цель
                
                console.log(`🍩 [Sugar] ${index+1}. Цель восстановлена: ${enemy._target?.constructor?.name || 'null'}`);
            } else {
                console.log(`🍩 [Sugar] ${index+1}. ОШИБКА: не можем восстановить цель для врага ${enemy.enemyType} (нет aiCoordinator или setTarget)`);
            }
        });
    }

    /**
     * Выкапывает новую яму
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {boolean} Успешность создания
     */
    digNewPit(x, y) {
        try {
            console.log(`🪓 [DEBUG] digNewPit вызван, лопат до: ${this.abilitySystem.getShovelCount()}`);
            
            // Создаем объект ямы через Defense.createDefense
            const pit = Defense.createDefense(this.scene, 'pit', x, y);
            
            // Добавляем в массив защитных объектов сцены
            this.scene.defenses.push(pit);
            
            // Обновляем счетчики
            this.abilitySystem.abilities.PIT += 1;
            this.abilitySystem.decrementAbility('SHOVEL', 1);
            
            console.log(`🕳️ Яма выкопана в (${x}, ${y}), здоровье: ${pit.health}`);
            console.log(`🕳️ Ям на поле: ${this.abilitySystem.getPitCount()}`);
            console.log(`🪓 Лопат осталось: ${this.abilitySystem.getShovelCount()}`);
            console.log(`🪓 [DEBUG] abilitySystem.abilities.SHOVEL после уменьшения: ${this.abilitySystem.abilities.SHOVEL}`);
            
            // Взаимодействие с врагом - заглушка
            console.log(`⚔️ Взаимодействие с врагами (заглушка)`);
            
            return true;
        } catch (error) {
            console.error('Ошибка создания ямы:', error);
            return false;
        }
    }
    
}
