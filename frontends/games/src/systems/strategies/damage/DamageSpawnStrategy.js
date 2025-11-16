import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия спавна врагов при получении урона
 * Используется ульем для вылета ос при атаке
 */
export class DamageSpawnStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        
        // Параметры спавна при уроне
        this.spawnType = config.get('spawnType', 'wasp');
        this.minSpawnCount = config.get('minSpawnCount', 0);
        this.maxSpawnCount = config.get('maxSpawnCount', 4);
        this.spawnRange = config.get('spawnRange', 50);
        this.launchForce = config.get('launchForce', 200); // Сила выталкивания
        this.launchAngleSpread = config.get('launchAngleSpread', Math.PI / 3); // Разброс углов (60 градусов)
        
        // Направление вылета (от источника урона)
        this.damageSource = null;
        
        console.log(`🏠 [DamageSpawnStrategy] Инициализирован для ${gameObject.enemyType}`);
    }

    /**
     * Обработка получения урона
     * @param {number} damage - Полученный урон
     * @param {Object} damageSource - Источник урона (опционально)
     */
    onDamageReceived(damage, damageSource = null) {
        console.log(`🏠 [DamageSpawnStrategy] ${this.gameObject.enemyType} получил урон ${damage}, спавним ос`);
        
        // Сохраняем источник урона для направления вылета
        this.damageSource = damageSource;
        
        // Определяем количество ос для спавна
        const spawnCount = this.calculateSpawnCount(damage);
        
        // Спавним ос
        this.spawnWasps(spawnCount);
    }

    /**
     * Вычисляет количество ос для спавна на основе урона
     * @param {number} damage - Полученный урон
     * @returns {number} Количество ос (включая minSpawnCount и maxSpawnCount)
     */
    calculateSpawnCount(damage) {
        // Случайное число от minSpawnCount до maxSpawnCount включительно
        const spawnCount = Math.floor(Math.random() * (this.maxSpawnCount - this.minSpawnCount + 1)) + this.minSpawnCount;
        
        console.log(`🏠 [DamageSpawnStrategy] Случайное количество ос: ${spawnCount} (диапазон: ${this.minSpawnCount}-${this.maxSpawnCount})`);
        
        return spawnCount;
    }

    /**
     * Спавн ос с эффектом выталкивания
     * @param {number} spawnCount - Количество ос для спавна (может быть 0 если minSpawnCount = 0)
     */
    spawnWasps(spawnCount) {
        if (spawnCount === 0) {
            console.log(`🏠 [DamageSpawnStrategy] Улей не спавнит ос в этот раз`);
            return;
        }
        
        console.log(`🏠 [DamageSpawnStrategy] Спавним ${spawnCount} ос из улья`);
        
        for (let i = 0; i < spawnCount; i++) {
            const spawnPosition = this.calculateSpawnPosition(i, spawnCount);
            const launchDirection = this.calculateLaunchDirection(spawnPosition);
            
            // Спавним осу с направлением вылета
            this.spawnWasp(spawnPosition, launchDirection);
        }
    }

    /**
     * Вычисляет позицию спавна осы
     * @param {number} index - Индекс осы
     * @param {number} totalCount - Общее количество ос
     * @returns {Object} Позиция {x, y}
     */
    calculateSpawnPosition(index, totalCount) {
        // Спавним ос вокруг улья
        const angle = (Math.PI * 2 * index) / totalCount;
        const distance = GeometryUtils.randomFloat(this.spawnRange * 0.5, this.spawnRange);
        
        return {
            x: this.gameObject.x + Math.cos(angle) * distance,
            y: this.gameObject.y + Math.sin(angle) * distance
        };
    }

    /**
     * Вычисляет направление вылета осы
     * @param {Object} spawnPosition - Позиция спавна
     * @returns {Object} Направление {angle, force}
     */
    calculateLaunchDirection(spawnPosition) {
        let targetAngle;
        
        if (this.damageSource) {
            // Вылетаем в направлении от источника урона
            const angleToSource = Math.atan2(
                this.damageSource.y - this.gameObject.y,
                this.damageSource.x - this.gameObject.x
            );
            
            // Добавляем случайность к направлению
            const randomSpread = GeometryUtils.randomFloat(
                -this.launchAngleSpread / 2,
                this.launchAngleSpread / 2
            );
            
            targetAngle = angleToSource + Math.PI + randomSpread; // + Math.PI для направления ОТ источника
        } else {
            // Случайное направление
            targetAngle = GeometryUtils.randomFloat(0, Math.PI * 2);
        }
        
        // Сила выталкивания с небольшой случайностью
        const force = GeometryUtils.randomFloat(
            this.launchForce * 0.8,
            this.launchForce * 1.2
        );
        
        return { angle: targetAngle, force };
    }

    /**
     * Спавн осы с эффектом выталкивания
     * @param {Object} position - Позиция спавна
     * @param {Object} launchDirection - Направление и сила вылета
     */
    spawnWasp(position, launchDirection) {
        // Эмитим событие спавна с дополнительными параметрами для эффекта вылета
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:spawn', {
                enemyType: this.spawnType,
                x: position.x,
                y: position.y,
                parent: this.gameObject,
                launchEffect: {
                    enabled: true,
                    angle: launchDirection.angle,
                    force: launchDirection.force,
                    duration: 1000 // Длительность эффекта выталкивания в мс
                }
            });
        }
        
        console.log(`🐝 [DamageSpawnStrategy] Оса вылетает из улья под углом ${(launchDirection.angle * 180 / Math.PI).toFixed(1)}° с силой ${launchDirection.force.toFixed(1)}`);
    }
}
