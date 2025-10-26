/**
 * Poisson Disk Sampling - алгоритм Bridson
 * Создаёт равномерно распределённые точки с минимальным расстоянием между ними
 * Используется для естественного размещения объектов (деревья, дома, ресурсы)
 */
export class PoissonDisk {
    constructor(random) {
        this.random = random;
    }
    
    /**
     * Генерирует точки в прямоугольной области
     * @param {number} width - ширина области
     * @param {number} height - высота области
     * @param {number} minDistance - минимальное расстояние между точками
     * @param {number} maxAttempts - максимальное количество попыток на точку
     * @returns {Array<{x, y}>} массив точек
     */
    generate(width, height, minDistance, maxAttempts = 30) {
        console.log(`🎯 [PoissonDisk] Генерация точек: область ${width}x${height}, минимальное расстояние ${minDistance}`);
        
        // Размер ячейки сетки (диагональ должна быть <= minDistance)
        const cellSize = minDistance / Math.sqrt(2);
        const gridWidth = Math.ceil(width / cellSize);
        const gridHeight = Math.ceil(height / cellSize);
        
        // Сетка для быстрого поиска соседей
        const grid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));
        
        const points = [];
        const activeList = [];
        
        // Начальная точка
        const firstPoint = {
            x: this.random.nextFloat() * width,
            y: this.random.nextFloat() * height
        };
        points.push(firstPoint);
        activeList.push(firstPoint);
        this.addToGrid(grid, firstPoint, cellSize);
        
        // Основной цикл алгоритма
        while (activeList.length > 0) {
            // Выбираем случайную активную точку
            const index = this.random.nextInt(0, activeList.length - 1);
            const point = activeList[index];
            let found = false;
            
            // Пытаемся разместить новую точку вокруг текущей
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const newPoint = this.generatePointAround(point, minDistance);
                
                // Проверка границ
                if (newPoint.x < 0 || newPoint.x >= width || 
                    newPoint.y < 0 || newPoint.y >= height) {
                    continue;
                }
                
                // Проверка расстояния до соседей
                if (this.isValidPoint(grid, newPoint, minDistance, cellSize)) {
                    points.push(newPoint);
                    activeList.push(newPoint);
                    this.addToGrid(grid, newPoint, cellSize);
                    found = true;
                    break;
                }
            }
            
            // Если не нашли подходящую точку, удаляем из активного списка
            if (!found) {
                activeList.splice(index, 1);
            }
        }
        
        console.log(`  ✓ Сгенерировано ${points.length} точек`);
        
        return points;
    }
    
    /**
     * Генерирует точку вокруг заданной в кольце [minDistance, 2*minDistance]
     * @param {Object} point - {x, y}
     * @param {number} minDistance 
     * @returns {Object} новая точка {x, y}
     */
    generatePointAround(point, minDistance) {
        // Генерация в кольце между minDistance и 2*minDistance
        const angle = this.random.nextFloat() * Math.PI * 2;
        const radius = minDistance + this.random.nextFloat() * minDistance;
        
        return {
            x: point.x + Math.cos(angle) * radius,
            y: point.y + Math.sin(angle) * radius
        };
    }
    
    /**
     * Проверяет, можно ли разместить точку (достаточно ли далеко от соседей)
     * @param {Array<Array>} grid 
     * @param {Object} point 
     * @param {number} minDistance 
     * @param {number} cellSize 
     * @returns {boolean}
     */
    isValidPoint(grid, point, minDistance, cellSize) {
        const gridX = Math.floor(point.x / cellSize);
        const gridY = Math.floor(point.y / cellSize);
        
        // Проверяем соседние ячейки (5x5 область вокруг точки)
        const minDist2 = minDistance * minDistance;
        const range = 2;
        
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const nx = gridX + dx;
                const ny = gridY + dy;
                
                // Проверка границ сетки
                if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
                    const other = grid[ny][nx];
                    
                    if (other) {
                        // Вычисляем квадрат расстояния (быстрее без sqrt)
                        const dist2 = (point.x - other.x) ** 2 + (point.y - other.y) ** 2;
                        
                        if (dist2 < minDist2) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Добавляет точку в сетку
     * @param {Array<Array>} grid 
     * @param {Object} point 
     * @param {number} cellSize 
     */
    addToGrid(grid, point, cellSize) {
        const gridX = Math.floor(point.x / cellSize);
        const gridY = Math.floor(point.y / cellSize);
        
        if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
            grid[gridY][gridX] = point;
        }
    }
    
    /**
     * Генерирует точки в определённой области (с фильтром)
     * @param {number} width 
     * @param {number} height 
     * @param {number} minDistance 
     * @param {Function} filterFunc - (x, y) => boolean, возвращает true если точка валидна
     * @param {number} maxAttempts 
     * @returns {Array<{x, y}>}
     */
    generateWithFilter(width, height, minDistance, filterFunc, maxAttempts = 30) {
        const allPoints = this.generate(width, height, minDistance, maxAttempts);
        return allPoints.filter(point => filterFunc(point.x, point.y));
    }
}


