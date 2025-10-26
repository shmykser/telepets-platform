/**
 * Базовый интерфейс для всех игровых объектов
 * Обеспечивает универсальность систем
 */
export class IGameObject {
    /**
     * Получить позицию объекта
     * @returns {Object} {x, y}
     */
    get position() {
        return { x: this.x, y: this.y };
    }

    /**
     * Получить скорость объекта
     * @returns {Object} {x, y}
     */
    get velocity() {
        const physicsBody = this.physicsBody || this.body;
        return { 
            x: physicsBody?.velocity?.x || 0, 
            y: physicsBody?.velocity?.y || 0 
        };
    }

    /**
     * Получить размер объекта
     * @returns {Object} {width, height}
     */
    get size() {
        return { width: this.width, height: this.height };
    }

    /**
     * Проверить, жив ли объект
     * @returns {boolean}
     */
    get isAlive() {
        return this._isAlive !== false;
    }

    /**
     * Проверить, может ли объект летать
     * @returns {boolean}
     */
    get canFly() {
        return this._canFly === true;
    }

    /**
     * Получить тип объекта
     * @returns {string}
     */
    get objectType() {
        return this._objectType || 'unknown';
    }

    /**
     * Получить ID объекта
     * @returns {string}
     */
    get objectId() {
        return this._id || this.id || 'unknown';
    }

    /**
     * Установить скорость объекта
     * @param {number} x - Скорость по X
     * @param {number} y - Скорость по Y
     */
    setVelocity(x, y) {
        const physicsBody = this.physicsBody || this.body;
        if (physicsBody) {
            physicsBody.setVelocity(x, y);
        }
    }

    /**
     * Остановить движение объекта
     */
    stopMovement() {
        this.setVelocity(0, 0);
    }

    /**
     * Получить расстояние до другого объекта
     * @param {IGameObject} target - Целевой объект
     * @returns {number}
     */
    distanceTo(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Получить направление к другому объекту
     * @param {IGameObject} target - Целевой объект
     * @returns {Object} {x, y} - Нормализованный вектор направления
     */
    directionTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        
        return { x: dx / length, y: dy / length };
    }

    /**
     * Проверить, находится ли объект в радиусе от цели
     * @param {IGameObject} target - Целевой объект
     * @param {number} radius - Радиус
     * @returns {boolean}
     */
    isInRange(target, radius) {
        return this.distanceTo(target) <= radius;
    }

    /**
     * Получить конфигурацию объекта
     * @returns {Object}
     */
    getConfig() {
        return this._config || {};
    }

    /**
     * Уничтожить объект
     */
    destroy() {
        this._isAlive = false;
        if (this.body) {
            this.body.destroy();
        }
    }
}
