/**
 * Клеточные автоматы для генерации органичных форм
 * Используется для создания пещер, озёр, лесных массивов
 */
export class CellularAutomata {
    constructor(random) {
        this.random = random;
    }
    
    /**
     * Генерирует карту через клеточный автомат
     * @param {number} width - ширина карты в клетках
     * @param {number} height - высота карты в клетках
     * @param {Object} config - параметры генерации
     * @returns {Array<Array<boolean>>} карта (true = заполнено, false = пусто)
     */
    generate(width, height, config = {}) {
        const {
            fillProbability = 0.45,
            iterations = 5,
            birthLimit = 4,
            deathLimit = 3
        } = config;
        
        console.log(`🧬 [CellularAutomata] Генерация карты ${width}x${height}:`);
        console.log(`  - Начальное заполнение: ${fillProbability * 100}%`);
        console.log(`  - Итераций: ${iterations}`);
        console.log(`  - Порог рождения: ${birthLimit}, порог смерти: ${deathLimit}`);
        
        // 1. Инициализация случайной карты
        let map = this.initializeMap(width, height, fillProbability);
        
        // 2. Применяем правила клеточного автомата N раз
        for (let i = 0; i < iterations; i++) {
            map = this.iterate(map, birthLimit, deathLimit);
        }
        
        console.log(`  ✓ Карта сгенерирована`);
        
        return map;
    }
    
    /**
     * Инициализирует карту случайными значениями
     * @param {number} width 
     * @param {number} height 
     * @param {number} fillProbability - вероятность заполненной клетки
     * @returns {Array<Array<boolean>>}
     */
    initializeMap(width, height, fillProbability) {
        const map = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                // Границы всегда стены (опционально)
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                    row.push(true);
                } else {
                    row.push(this.random.nextFloat() < fillProbability);
                }
            }
            map.push(row);
        }
        
        return map;
    }
    
    /**
     * Применяет одну итерацию правил клеточного автомата
     * @param {Array<Array<boolean>>} map 
     * @param {number} birthLimit - порог для "рождения" клетки
     * @param {number} deathLimit - порог для "смерти" клетки
     * @returns {Array<Array<boolean>>}
     */
    iterate(map, birthLimit, deathLimit) {
        const height = map.length;
        const width = map[0].length;
        const newMap = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const neighbors = this.countNeighbors(map, x, y);
                
                if (map[y][x]) {
                    // Клетка жива - проверяем, должна ли она умереть
                    row.push(neighbors >= deathLimit);
                } else {
                    // Клетка мертва - проверяем, должна ли она родиться
                    row.push(neighbors > birthLimit);
                }
            }
            newMap.push(row);
        }
        
        return newMap;
    }
    
    /**
     * Подсчитывает количество заполненных соседних клеток (включая диагонали)
     * @param {Array<Array<boolean>>} map 
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    countNeighbors(map, x, y) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                // Пропускаем саму клетку
                if (dx === 0 && dy === 0) continue;
                
                const ny = y + dy;
                const nx = x + dx;
                
                // Выход за границы считается стеной
                if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) {
                    count++;
                } else if (map[ny][nx]) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    /**
     * Подсчитывает соседей только по 4 сторонам (без диагоналей)
     * @param {Array<Array<boolean>>} map 
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    countNeighbors4Way(map, x, y) {
        let count = 0;
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) {
                count++;
            } else if (map[ny][nx]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * Находит все связные области на карте (flood fill)
     * @param {Array<Array<boolean>>} map 
     * @returns {Array<{cells: Array, size: number}>} массив областей
     */
    findRegions(map) {
        const height = map.length;
        const width = map[0].length;
        const visited = Array(height).fill(null).map(() => Array(width).fill(false));
        const regions = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!visited[y][x] && !map[y][x]) {
                    // Начинаем flood fill для новой области
                    const region = this.floodFill(map, visited, x, y);
                    regions.push({
                        cells: region,
                        size: region.length
                    });
                }
            }
        }
        
        return regions.sort((a, b) => b.size - a.size); // Сортируем по размеру
    }
    
    /**
     * Flood fill алгоритм для поиска связной области
     * @param {Array<Array<boolean>>} map 
     * @param {Array<Array<boolean>>} visited 
     * @param {number} startX 
     * @param {number} startY 
     * @returns {Array<{x, y}>}
     */
    floodFill(map, visited, startX, startY) {
        const region = [];
        const queue = [{x: startX, y: startY}];
        visited[startY][startX] = true;
        
        while (queue.length > 0) {
            const cell = queue.shift();
            region.push(cell);
            
            // Проверяем 4 соседей
            const neighbors = [
                {x: cell.x, y: cell.y - 1},
                {x: cell.x + 1, y: cell.y},
                {x: cell.x, y: cell.y + 1},
                {x: cell.x - 1, y: cell.y}
            ];
            
            for (const neighbor of neighbors) {
                const {x, y} = neighbor;
                
                if (y >= 0 && y < map.length && x >= 0 && x < map[0].length &&
                    !visited[y][x] && !map[y][x]) {
                    visited[y][x] = true;
                    queue.push(neighbor);
                }
            }
        }
        
        return region;
    }
    
    /**
     * Удаляет маленькие изолированные области
     * @param {Array<Array<boolean>>} map 
     * @param {number} minSize - минимальный размер области
     * @returns {Array<Array<boolean>>}
     */
    removeSmallRegions(map, minSize = 50) {
        const regions = this.findRegions(map);
        const newMap = map.map(row => [...row]);
        
        // Заполняем маленькие области
        for (const region of regions) {
            if (region.size < minSize) {
                for (const cell of region.cells) {
                    newMap[cell.y][cell.x] = true;
                }
            }
        }
        
        return newMap;
    }
}


