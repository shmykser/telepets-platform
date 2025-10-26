import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия атаки через спавн врагов
 * Используется самкой паука и другими спавнерами
 */
export class SpawnAttackStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        this.lastSpawnTime = 0;
        this.spawnedCount = 0;
        this.maxSpawned = this.config?.get('maxSpawned', 10);
        
        // Только для улья выводим инициализацию
        if (this.gameObject?.enemyType === 'hive') {
            const interval = this.getResolvedInterval();
            const spawnType = this.config.get('spawnType', 'unknown');
            console.log(`🏠 [HIVE] SpawnAttackStrategy инициализирован: interval=${interval}ms, spawnType=${spawnType}, maxSpawned=${this.maxSpawned}`);
        }
    }

    /**
     * Выбор интервала спавна: приоритет attack.cooldown, затем spawnInterval, затем дефолт 5000
     */
    getResolvedInterval() {
        const cooldown = this.config.get('cooldown', undefined);
        if (cooldown != null) return cooldown;
        const spawnInterval = this.config.get('spawnInterval', undefined);
        if (spawnInterval != null) return spawnInterval;
        return 5000;
    }

    /**
     * Безопасное получение текущего времени сцены
     */
    getNow() {
        return (this.gameObject && this.gameObject.scene && this.gameObject.scene.time &&
            typeof this.gameObject.scene.time.now === 'number')
            ? this.gameObject.scene.time.now
            : Date.now();
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        const now = (typeof time === 'number') ? time : this.getNow();
        
        // Проверяем, можем ли спавнить
        if (this.canSpawn(now)) {
            this.performSpawn(now);
        }
    }

    /**
     * Проверка, можем ли спавнить
     * @param {number} time - Текущее время
     * @returns {boolean}
     */
    canSpawn(time) {
        const now = (typeof time === 'number') ? time : this.getNow();
        const spawnInterval = this.getResolvedInterval();
        const timeSinceLastSpawn = now - this.lastSpawnTime;
        const basicCondition = timeSinceLastSpawn > spawnInterval && this.spawnedCount < this.maxSpawned;
        
        // Проверяем дополнительные условия (для крота)
        let conditionalCheck = true;
        if (this.conditionCallback) {
            conditionalCheck = this.conditionCallback();
        }
        
        const canSpawnNow = basicCondition && conditionalCheck;
        
        // Только для улья логируем попытки спавна
        if (this.gameObject?.enemyType === 'hive' && timeSinceLastSpawn > 7000) {
            console.log(`🏠 [HIVE] canSpawn: timeSince=${Math.round(timeSinceLastSpawn)}ms >= interval=${spawnInterval}ms, spawned=${this.spawnedCount}/${this.maxSpawned} -> ${canSpawnNow}`);
        }
        
        return canSpawnNow;
    }

    /**
     * Выполнение спавна
     * @param {number} time - Текущее время
     */
    performSpawn(time) {
        const minSpawnCount = this.config.get('minSpawnCount', 1);
        const maxSpawnCount = this.config.get('maxSpawnCount', 5);
        const spawnCount = Math.floor(Math.random() * (maxSpawnCount - minSpawnCount + 1)) + minSpawnCount;
        const spawnRange = this.config.get('spawnRange', 100);
        const spawnType = this.config.get('spawnType', 'spider');
        const spawnDirection = this.config.get('spawnDirection', 'circle');
        
        // Только для улья логируем спавн
        if (this.gameObject?.enemyType === 'hive') {
            console.log(`🏠 [HIVE] performSpawn: spawning ${spawnCount}x ${spawnType} at range=${spawnRange}`);
        }

        for (let i = 0; i < spawnCount; i++) {
            let spawnX, spawnY;
            
            if (spawnDirection === 'target' && this.gameObject.aiCoordinator && this.gameObject.aiCoordinator.currentTarget) {
                // Спавн в направлении цели
                const target = this.gameObject.aiCoordinator.currentTarget;
                const angleToTarget = Math.atan2(target.y - this.gameObject.y, target.x - this.gameObject.x);
                
                spawnX = this.gameObject.x + Math.cos(angleToTarget) * spawnRange;
                spawnY = this.gameObject.y + Math.sin(angleToTarget) * spawnRange;
                
                
            } else {
                // Круговой спавн (по умолчанию)
                const angle = (Math.PI * 2 * i) / spawnCount;
                const distance = Math.random() * spawnRange;
                
                spawnX = this.gameObject.x + Math.cos(angle) * distance;
                spawnY = this.gameObject.y + Math.sin(angle) * distance;
            }
            
            // Защита от некорректных координат
            if (!Number.isFinite(spawnX) || !Number.isFinite(spawnY)) {
                if (this.gameObject.enemyType === 'spiderQueen') {
                    console.warn(`🕷️👑 [SpawnAttackStrategy] QUEEN: пропуск спавна из-за неверных координат`, { spawnX, spawnY });
                }
                continue;
            }

            // Эмитим событие спавна
            if (this.gameObject.scene && this.gameObject.scene.events) {
                this.gameObject.scene.events.emit('enemy:spawn', {
                    enemyType: spawnType,
                    x: spawnX,
                    y: spawnY,
                    parent: this.gameObject,
                    target: this.gameObject.aiCoordinator?.currentTarget // Передаем цель для снарядов
                });
            }
        }

        this.lastSpawnTime = time;
        this.spawnedCount += spawnCount;
        
        // Только для улья логируем результат
        if (this.gameObject?.enemyType === 'hive') {
            console.log(`🏠 [HIVE] Spawned: ${spawnCount} enemies, total=${this.spawnedCount}/${this.maxSpawned}`);
        }
        
        // Для крота: отмечаем, что спавн на поверхности выполнен
        if (this.gameObject.enemyType === 'mole') {
            this.hasSpawnedOnSurface = true;
        }
    }

    /**
     * Проверка, в радиусе ли цель
     * @param {Object} target - Цель
     * @returns {boolean}
     */
    isInRange(target) {
        if (!target) return false;
        
        // Радиус атаки берем ТОЛЬКО из attack.range
        const attackCfg = this.config.get('attack', {});
        const attackRange = attackCfg.range || 0;
        const distance = GeometryUtils.distance(
            this.gameObject.x, this.gameObject.y,
            target.x, target.y
        );
        
        return distance <= attackRange;
    }

    /**
     * Атака (спавн врагов)
     * @param {Object} target - Цель
     */
    attack(target) {
        // Спавн не требует цели, но может использовать её позицию
        const now = this.getNow();
        // Если стратегия вызывается через систему атаки, используем тот же механизм, что и в update
        if (this.canSpawn(now)) {
            this.performSpawn(now);
            return true;
        }
        return false;
    }

    /**
     * Прямой вызов атаки системой (используется AttackSystem.performAttack)
     * Возвращает true, если спавн выполнен
     */
    performAttack(/* target */) {
        const now = this.getNow();
        if (this.canSpawn(now)) {
            this.performSpawn(now);
            return true;
        }
        return false;
    }

    /**
     * Установка функции проверки условий для условного спавна
     * @param {Function} callback - Функция, возвращающая true если можно спавнить
     */
    setConditionCallback(callback) {
        this.conditionCallback = callback;
        
    }


    /**
     * Сброс стратегии
     */
    reset() {
        this.lastSpawnTime = 0;
        this.spawnedCount = 0;
        this.hasSpawnedOnSurface = false;
        this.surfaceStartTime = 0;
    }
}
