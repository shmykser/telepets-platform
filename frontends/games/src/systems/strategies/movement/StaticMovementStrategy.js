/**
 * Стратегия неподвижного движения
 * Используется ульем и другими статичными объектами
 */
export class StaticMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        
        console.log(`🏠 [StaticMovementStrategy] Инициализирован для ${gameObject.enemyType}`);
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Статичный объект не двигается
        // Просто убеждаемся, что скорость равна нулю
        if (this.gameObject.body) {
            this.gameObject.body.setVelocity(0, 0);
        } else if (this.gameObject.physicsBody) {
            this.gameObject.physicsBody.setVelocity(0, 0);
        }
    }

    /**
     * Получение скорости движения
     * @returns {number}
     */
    getSpeed() {
        return 0; // Не двигается
    }

    /**
     * Проверка достижения цели
     * @param {Object} target - Цель
     * @returns {boolean}
     */
    isTargetReached(target) {
        // Статичный объект не может достичь цели
        return false;
    }

    /**
     * Остановка движения
     */
    stopMovement() {
        if (this.gameObject.body) {
            this.gameObject.body.setVelocity(0, 0);
        } else if (this.gameObject.physicsBody) {
            this.gameObject.physicsBody.setVelocity(0, 0);
        }
    }
}
