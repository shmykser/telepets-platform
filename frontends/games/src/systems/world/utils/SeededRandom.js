/**
 * Генератор случайных чисел с seed для детерминированной генерации
 * Использует алгоритм Mulberry32 для высокого качества случайности
 */
export class SeededRandom {
    constructor(seed) {
        this.originalSeed = seed;
        this.seed = this.hashSeed(seed);
        this.state = this.seed;
    }
    
    /**
     * Хеширует seed (строку или число) в 32-битное целое число
     * @param {string|number} seed 
     * @returns {number}
     */
    hashSeed(seed) {
        if (typeof seed === 'number') {
            return seed >>> 0; // Преобразуем в unsigned 32-bit
        }
        
        // Хеширование строки (простой но эффективный алгоритм)
        let hash = 0;
        const str = String(seed);
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Преобразуем в 32-bit integer
        }
        
        return Math.abs(hash) >>> 0;
    }
    
    /**
     * Генерирует следующее случайное число (Mulberry32 алгоритм)
     * @returns {number} uint32
     */
    next() {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    
    /**
     * Возвращает случайное число с плавающей точкой [0, 1)
     * @returns {number}
     */
    nextFloat() {
        return this.next();
    }
    
    /**
     * Возвращает случайное целое число в диапазоне [min, max] (включительно)
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    nextInt(min, max) {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
    
    /**
     * Алиас для nextInt (для совместимости)
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    intBetween(min, max) {
        return this.nextInt(min, max);
    }
    
    /**
     * Алиас для choice (для совместимости)
     * @param {Array} array 
     * @returns {*}
     */
    pick(array) {
        return this.choice(array);
    }
    
    /**
     * Возвращает boolean с заданной вероятностью
     * @param {number} probability - вероятность true [0, 1]
     * @returns {boolean}
     */
    nextBool(probability = 0.5) {
        return this.nextFloat() < probability;
    }
    
    /**
     * Выбирает случайный элемент из массива
     * @param {Array} array 
     * @returns {*}
     */
    choice(array) {
        if (!array || array.length === 0) {
            return undefined;
        }
        return array[this.nextInt(0, array.length - 1)];
    }
    
    /**
     * Перемешивает массив (Fisher-Yates shuffle)
     * @param {Array} array 
     * @returns {Array} перемешанный массив
     */
    shuffle(array) {
        const result = [...array];
        
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        
        return result;
    }
    
    /**
     * Возвращает случайное число с нормальным распределением (Box-Muller)
     * @param {number} mean - среднее значение
     * @param {number} stdDev - стандартное отклонение
     * @returns {number}
     */
    nextGaussian(mean = 0, stdDev = 1) {
        const u1 = this.nextFloat();
        const u2 = this.nextFloat();
        
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        return z0 * stdDev + mean;
    }
    
    /**
     * Возвращает текущий seed
     * @returns {number}
     */
    getSeed() {
        return this.seed;
    }
    
    /**
     * Возвращает оригинальный seed (до хеширования)
     * @returns {string|number}
     */
    getOriginalSeed() {
        return this.originalSeed;
    }
    
    /**
     * Сбрасывает состояние генератора к начальному
     */
    reset() {
        this.state = this.seed;
    }
}


