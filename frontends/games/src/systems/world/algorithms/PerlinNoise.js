/**
 * Обёртка для работы с Perlin/Simplex шумом
 * Использует библиотеку simplex-noise для генерации качественного шума
 */
import { createNoise2D } from 'simplex-noise';
import { SeededRandom } from '../utils/SeededRandom.js';

export class PerlinNoise {
    constructor(seed) {
        this.seed = seed;
        
        // Создаём функцию генерации случайных чисел для simplex-noise
        const random = new SeededRandom(seed);
        const randomFunc = () => random.nextFloat();
        
        // Инициализируем генератор 2D шума
        this.noise2D = createNoise2D(randomFunc);
    }
    
    /**
     * Получить значение шума в точке с настройками octaves
     * @param {number} x - координата X
     * @param {number} y - координата Y
     * @param {number} scale - масштаб шума (больше = более крупные детали)
     * @param {number} octaves - количество слоёв шума (больше = больше деталей)
     * @param {number} persistence - влияние каждого слоя (0-1, обычно 0.5)
     * @param {number} lacunarity - частота каждого слоя (обычно 2.0)
     * @returns {number} значение шума в диапазоне [-1, 1]
     */
    getValue(x, y, scale = 100, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        // Суммируем octaves (слои шума)
        for (let i = 0; i < octaves; i++) {
            const sampleX = x * frequency / scale;
            const sampleY = y * frequency / scale;
            
            const noiseValue = this.noise2D(sampleX, sampleY);
            
            value += noiseValue * amplitude;
            maxValue += amplitude;
            
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        // Нормализуем к диапазону [-1, 1]
        return value / maxValue;
    }
    
    /**
     * Получить нормализованное значение шума в диапазоне [0, 1]
     * @param {number} x 
     * @param {number} y 
     * @param {number} scale 
     * @param {number} octaves 
     * @param {number} persistence 
     * @param {number} lacunarity 
     * @returns {number} значение в диапазоне [0, 1]
     */
    getNormalized(x, y, scale = 100, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
        const value = this.getValue(x, y, scale, octaves, persistence, lacunarity);
        return (value + 1) / 2; // Преобразуем [-1, 1] в [0, 1]
    }
    
    /**
     * Получить дискретное значение (для биомов, зон)
     * @param {number} x 
     * @param {number} y 
     * @param {number} scale 
     * @param {number} steps - количество уровней (например, 3 для низкий/средний/высокий)
     * @returns {number} значение от 0 до steps-1
     */
    getDiscrete(x, y, scale, steps = 3) {
        const value = this.getNormalized(x, y, scale, 3, 0.5);
        return Math.floor(value * steps);
    }
    
    /**
     * Генерирует 2D карту шума
     * @param {number} width - ширина карты
     * @param {number} height - высота карты
     * @param {number} resolution - шаг сэмплирования (для оптимизации)
     * @param {Object} options - параметры генерации (scale, octaves, persistence)
     * @returns {Array<Array<number>>} 2D массив значений [0, 1]
     */
    generateMap(width, height, resolution = 10, options = {}) {
        const {
            scale = 100,
            octaves = 4,
            persistence = 0.5,
            lacunarity = 2.0
        } = options;
        
        const map = [];
        
        for (let y = 0; y < height; y += resolution) {
            const row = [];
            for (let x = 0; x < width; x += resolution) {
                const value = this.getNormalized(
                    x, y, scale, octaves, persistence, lacunarity
                );
                row.push(value);
            }
            map.push(row);
        }
        
        return map;
    }
    
    /**
     * Получает значение из карты по координатам с интерполяцией
     * @param {Array<Array<number>>} map - карта шума
     * @param {number} x - координата X
     * @param {number} y - координата Y
     * @param {number} resolution - разрешение карты
     * @returns {number}
     */
    static getValueFromMap(map, x, y, resolution = 10) {
        const mapX = x / resolution;
        const mapY = y / resolution;
        
        const x0 = Math.floor(mapX);
        const x1 = Math.ceil(mapX);
        const y0 = Math.floor(mapY);
        const y1 = Math.ceil(mapY);
        
        // Проверка границ
        if (y0 < 0 || y1 >= map.length || x0 < 0 || x1 >= map[0].length) {
            return 0.5; // Возвращаем среднее значение за границами
        }
        
        // Билинейная интерполяция
        const fx = mapX - x0;
        const fy = mapY - y0;
        
        const v00 = map[y0][x0];
        const v10 = map[y0][x1] || v00;
        const v01 = map[y1] ? map[y1][x0] : v00;
        const v11 = (map[y1] && map[y1][x1]) ? map[y1][x1] : v00;
        
        const v0 = v00 * (1 - fx) + v10 * fx;
        const v1 = v01 * (1 - fx) + v11 * fx;
        
        return v0 * (1 - fy) + v1 * fy;
    }
    
    /**
     * Применяет функцию к карте (например, для создания островов)
     * @param {Array<Array<number>>} map 
     * @param {Function} func - функция преобразования (value, x, y) => newValue
     * @returns {Array<Array<number>>}
     */
    static applyFunction(map, func) {
        return map.map((row, y) => 
            row.map((value, x) => func(value, x, y))
        );
    }
}


