/**
 * Стратегия подземного стелса (крот)
 * Управляет переключением между подземным и поверхностным режимами
 */
export class BurrowStealthStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        
        // Параметры подземного режима
        this.undergroundAlpha = config.get('undergroundAlpha', 0.1); // Почти невидимый под землей
        this.surfaceAlpha = config.get('surfaceAlpha', 1.0); // Полная видимость на поверхности
        this.surfaceMinDuration = config.get('surfaceMinDuration', 2000); // Минимальное время на поверхности (мс)
        this.surfaceMaxDuration = config.get('surfaceMaxDuration', 8000); // Максимальное время на поверхности (мс)
        
        // Состояние
        this.isUnderground = true; // Начинаем под землей
        this.isOnSurface = false;
        this.surfaceStartTime = 0;
        this.surfaceDuration = 0;
        this.isActive = true;
        this.lastDamageTime = 0;
        
        // Параметры автоматического выхода на поверхность
        this.undergroundMinDuration = 3000; // Минимальное время под землей (мс)
        this.undergroundMaxDuration = 8000; // Максимальное время под землей (мс)
        this.undergroundStartTime = 0;
        this.undergroundDuration = 0;
        
        // Инициализация
        this.initialize();
    }

    initialize() {
        // Начинаем в подземном режиме
        this.goUnderground();
        
        // Дополнительная проверка через небольшую задержку
        setTimeout(() => {
            if (this.isActive) {
                if (this.gameObject.alpha > this.undergroundAlpha + 0.1) {
                    this.gameObject.setAlpha(this.undergroundAlpha);
                }
                // Убеждаемся, что иммунитет установлен
                this.gameObject.setDamageImmunity(true);
            }
        }, 50);
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        if (!this.isActive) return;

        // Если под землей, проверяем время для автоматического выхода
        if (this.isUnderground) {
            const timeUnderground = time - this.undergroundStartTime;
            if (timeUnderground >= this.undergroundDuration) {
                this.goSurface(time);
            }
        }
        
        // Если на поверхности, проверяем время
        if (this.isOnSurface) {
            const timeOnSurface = time - this.surfaceStartTime;
            if (timeOnSurface >= this.surfaceDuration) {
                this.goUnderground();
            }
        }
    }

    /**
     * Переход в подземный режим
     */
    goUnderground() {
        if (!this.isActive) return;

        this.isUnderground = true;
        this.isOnSurface = false;
        this.gameObject.setAlpha(this.undergroundAlpha);
        
        // Включаем иммунитет к урону под землей
        this.gameObject.setDamageImmunity(true);
        
        // Устанавливаем случайное время под землей
        const currentTime = this.gameObject.scene ? this.gameObject.scene.time.now : Date.now();
        this.undergroundStartTime = currentTime;
        this.undergroundDuration = this.getRandomUndergroundDuration();
        
        // Эффект зарывания
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:burrowUnderground', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Переход на поверхность
     * @param {number} time - Текущее время
     */
    goSurface(time) {
        if (!this.isActive) return;

        this.isUnderground = false;
        this.isOnSurface = true;
        this.surfaceStartTime = time;
        this.surfaceDuration = this.getRandomSurfaceDuration();
        this.gameObject.setAlpha(this.surfaceAlpha);
        
        // Отключаем иммунитет к урону на поверхности
        this.gameObject.setDamageImmunity(false);
        
        console.log(`🐀 [BurrowStealthStrategy] ${this.gameObject.enemyType || 'крот'} выходит на поверхность на ${this.surfaceDuration}мс`);
        
        // Эффект выхода на поверхность
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit('enemy:burrowSurface', {
                enemy: this.gameObject,
                x: this.gameObject.x,
                y: this.gameObject.y
            });
        }
    }

    /**
     * Получение урона (принудительно уходит под землю)
     * @param {number} damage - Урон
     * @param {number} time - Текущее время
     */
    takeDamage(damage, time) {
        if (!this.isActive) return;

        this.lastDamageTime = time;
        
        // Если на поверхности, сразу уходим под землю
        if (this.isOnSurface) {
            console.log(`🐀 [BurrowStealthStrategy] ${this.gameObject.enemyType || 'крот'} получил урон, уходит под землю`);
            this.goUnderground();
        }
    }

    /**
     * Получение случайного времени на поверхности
     * @returns {number}
     */
    getRandomSurfaceDuration() {
        return this.surfaceMinDuration + Math.random() * (this.surfaceMaxDuration - this.surfaceMinDuration);
    }

    /**
     * Получение случайного времени под землей
     * @returns {number}
     */
    getRandomUndergroundDuration() {
        return this.undergroundMinDuration + Math.random() * (this.undergroundMaxDuration - this.undergroundMinDuration);
    }

    /**
     * Проверка, под землей ли объект
     * @returns {boolean}
     */
    isUndergroundNow() {
        return this.isUnderground;
    }

    /**
     * Проверка, на поверхности ли объект
     * @returns {boolean}
     */
    isOnSurfaceNow() {
        return this.isOnSurface;
    }

    /**
     * Получение текущей прозрачности
     * @returns {number}
     */
    getCurrentAlpha() {
        return this.isUnderground ? this.undergroundAlpha : this.surfaceAlpha;
    }

    /**
     * Активация стратегии
     */
    activate() {
        this.isActive = true;
        this.goUnderground();
    }

    /**
     * Деактивация стратегии
     */
    deactivate() {
        this.isActive = false;
        // При деактивации объект становится видимым
        this.gameObject.setAlpha(this.surfaceAlpha);
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.isActive = false;
        this.gameObject = null;
        this.config = null;
    }
}
