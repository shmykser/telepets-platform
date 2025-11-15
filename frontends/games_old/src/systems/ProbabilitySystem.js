/**
 * Централизованная система вероятности
 * Управляет всеми случайными событиями в игре
 */

// Удален импорт enemyDropLists.js - теперь используется новая система дропа
export class ProbabilitySystem {
    constructor(scene) {
        this.scene = scene;
        
        // Базовые настройки вероятности
        this.probabilities = {
            // Вероятность усиления врага (в процентах)
            enemyEnhancement: {
                base: 10,        // Базовый шанс 10%
                max: 50,         // Максимальный шанс 50%
                increment: 2     // Увеличение на 2% за минуту игры
            },
            
            // Вероятность дропа предметов (в процентах)
            itemDrop: {
                base: 15,        // Базовый шанс 15%
                max: 35,         // Максимальный шанс 35%
                increment: 1.5   // Увеличение на 1.5% за минуту игры
            },
            
            // Вероятность критического урона (в процентах)
            criticalHit: {
                base: 5,         // Базовый шанс 5%
                max: 20,         // Максимальный шанс 20%
                increment: 1     // Увеличение на 1% за минуту игры
            },
            
            // Вероятность особых эффектов (в процентах)
            specialEffects: {
                base: 8,         // Базовый шанс 8%
                max: 25,         // Максимальный шанс 25%
                increment: 1.2   // Увеличение на 1.2% за минуту игры
            }
        };
        
        // Текущее время игры для расчета прогрессии
        this.gameStartTime = 0;
        this.currentMinute = 1;
    }
    
    /**
     * Инициализация системы
     */
    init() {
        this.gameStartTime = this.scene.time.now;
        this.currentMinute = 1;
    }
    
    /**
     * Обновление системы (вызывается каждый кадр)
     */
    update(time, delta) {
        // Обновляем текущую минуту игры
        const gameTime = time - this.gameStartTime;
        const newMinute = Math.floor(gameTime / 60000) + 1; // 60000ms = 1 минута
        
        if (newMinute !== this.currentMinute) {
            this.currentMinute = newMinute;
            this.onMinuteChanged();
        }
    }
    
    /**
     * Обработчик смены минуты
     */
    onMinuteChanged() {
    }
    
    /**
     * Получение текущих вероятностей с учетом прогрессии игры
     */
    getCurrentProbabilities() {
        const probabilities = {};
        
        for (const [key, config] of Object.entries(this.probabilities)) {
            const current = Math.min(
                config.base + (config.increment * (this.currentMinute - 1)),
                config.max
            );
            
            probabilities[key] = {
                current: Math.round(current * 100) / 100,
                max: config.max,
                progress: Math.round((current / config.max) * 100)
            };
        }
        
        return probabilities;
    }
    
    /**
     * Проверка вероятности события
     * @param {string} eventType - Тип события ('enemyEnhancement', 'itemDrop', 'criticalHit', 'specialEffects')
     * @param {number} customChance - Кастомный шанс (опционально)
     * @returns {boolean} true если событие произошло
     */
    rollEvent(eventType, customChance = null) {
        const config = this.probabilities[eventType];
        if (!config) {
            console.warn(`[ProbabilitySystem] Неизвестный тип события: ${eventType}`);
            return false;
        }
        
        // Используем кастомный шанс или рассчитываем текущий
        const chance = customChance !== null ? customChance : this.getCurrentChance(eventType);
        
        const roll = Math.random() * 100;
        const success = roll < chance;
        
        
        return success;
    }
    
    /**
     * Получение текущего шанса для типа события
     * @param {string} eventType - Тип события
     * @returns {number} Текущий шанс в процентах
     */
    getCurrentChance(eventType) {
        const config = this.probabilities[eventType];
        if (!config) return 0;
        
        return Math.min(
            config.base + (config.increment * (this.currentMinute - 1)),
            config.max
        );
    }
    
    /**
     * Проверка вероятности усиления врага
     * @returns {number} Множитель усиления (1.0 = без усиления, 2.0 = двойное усиление)
     */
    rollEnemyEnhancement() {
        return 1.0; // Без усиления

        if (this.rollEvent('enemyEnhancement')) {
            // Возвращаем случайный множитель усиления от 1.2 до 2.5
            const multipliers = [1.2, 1.5, 1.8, 2.0, 2.2, 2.5];
            const weights = [30, 25, 20, 15, 7, 3]; // Веса для каждого множителя
            
            return this.weightedRandom(multipliers, weights);
        }
        
    }
    
    /**
     * Проверка вероятности дропа предмета
     * @deprecated Используйте ItemDropSystem.dropRandomItem() вместо этого метода
     * @param {string} enemyType - Тип врага (для модификации шанса)
     * @returns {boolean} true если предмет должен дропнуться
     */
    rollItemDrop(enemyType = 'default') {
        console.warn('[ProbabilitySystem] rollItemDrop() устарел, используйте ItemDropSystem.dropRandomItem()');
        return false; // Всегда возвращаем false, так как логика перенесена
    }
    
    /**
     * Проверка вероятности критического урона
     * @returns {boolean} true если урон критический
     */
    rollCriticalHit() {
        return this.rollEvent('criticalHit');
    }
    
    /**
     * Проверка вероятности особого эффекта
     * @returns {boolean} true если эффект должен сработать
     */
    rollSpecialEffect() {
        return this.rollEvent('specialEffects');
    }
    
    /**
     * Случайный выбор с весами
     * @param {Array} items - Массив элементов
     * @param {Array} weights - Массив весов
     * @returns {*} Выбранный элемент
     */
    weightedRandom(items, weights) {
        if (items.length !== weights.length) {
            console.warn('[ProbabilitySystem] Длина массивов не совпадает');
            return items[0];
        }
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }
    
    /**
     * Получение статистики системы
     */
    getStats() {
        return {
            currentMinute: this.currentMinute,
            gameTime: this.scene.time.now - this.gameStartTime,
            probabilities: this.getCurrentProbabilities()
        };
    }
    
    /**
     * Сброс системы
     */
    reset() {
        this.gameStartTime = this.scene.time.now;
        this.currentMinute = 1;
    }
    
    /**
     * Уничтожение системы
     */
    destroy() {
        // Очистка ресурсов при необходимости
    }
}
