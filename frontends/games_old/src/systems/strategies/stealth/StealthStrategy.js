/**
 * Стратегия скрытности (невидимость)
 * Управляет прозрачностью и видимостью объекта
 */
export class StealthStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        
        // Параметры скрытности
        this.stealthAlpha = config.get('stealthAlpha', 0.05); // 95% прозрачность
        this.visibleAlpha = config.get('visibleAlpha', 1.0); // Полная видимость
        this.visibilityDuration = config.get('visibilityDuration', 2000); // Время видимости (мс)
        this.slimeTrail = config.get('slimeTrail', true); // След слизи
        
        // Состояние
        this.isVisible = false;
        this.lastDamageTime = 0;
        this.trailPoints = [];
        this.isActive = true;
        
        // Сразу скрываем объект при создании
        this.hide();
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isActive) return;

        // Проверяем, нужно ли скрыться
        if (this.isVisible && time - this.lastDamageTime > this.visibilityDuration) {
            this.hide();
        }
        
        // Обновляем след слизи
        if (this.slimeTrail) {
            this.updateSlimeTrail(time);
        }
    }

    /**
     * Показать объект (при получении урона)
     * @param {number} time - Текущее время
     */
    show(time) {
        if (!this.isActive) return;

        this.isVisible = true;
        this.lastDamageTime = time;
        this.gameObject.setAlpha(this.visibleAlpha);
        
        console.log(`👻 [StealthStrategy] ${this.gameObject.enemyType || 'объект'} становится видимым`);
        
        // Эффект появления
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:stealthReveal', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Скрыть объект
     */
    hide() {
        if (!this.isActive) return;

        this.isVisible = false;
        this.gameObject.setAlpha(this.stealthAlpha);
        
        console.log(`👻 [StealthStrategy] ${this.gameObject.enemyType || 'объект'} становится невидимым`);
        
        // Эффект скрытия
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:stealthHide', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Обновление следа слизи
     * @param {number} time - Текущее время
     */
    updateSlimeTrail(time) {
        // Добавляем точку следа
        this.trailPoints.push({
            x: this.gameObject.x,
            y: this.gameObject.y,
            time: time
        });
        
        // Удаляем старые точки
        this.trailPoints = this.trailPoints.filter(point => 
            time - point.time < 5000 // 5 секунд
        );
        
        // Эмитим событие следа
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:slimeTrail', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Получение урона (показывает объект)
     * @param {number} damage - Урон
     * @param {number} time - Текущее время
     */
    takeDamage(damage, time) {
        this.show(time);
    }

    /**
     * Проверка, видим ли объект
     * @returns {boolean}
     */
    isVisibleNow() {
        return this.isVisible;
    }

    /**
     * Получение текущей прозрачности
     * @returns {number}
     */
    getCurrentAlpha() {
        return this.isVisible ? this.visibleAlpha : this.stealthAlpha;
    }

    /**
     * Активация стратегии
     */
    activate() {
        this.isActive = true;
        // При активации объект скрыт
        this.hide();
    }

    /**
     * Деактивация стратегии
     */
    deactivate() {
        this.isActive = false;
        // При деактивации объект становится видимым
        this.gameObject.setAlpha(this.visibleAlpha);
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.isActive = false;
        this.gameObject = null;
        this.config = null;
        this.trailPoints = [];
    }
}
