/**
 * Генератор лабиринтов с использованием алгоритма Recursive Backtracker
 * Создаёт "идеальный" лабиринт с единственным путём между любыми двумя точками
 */

export class MazeGenerator {
    /**
     * Генерирует лабиринт заданного размера
     * @param {number} width - ширина лабиринта (количество ячеек)
     * @param {number} height - высота лабиринта (количество ячеек)
     * @returns {Array<Array<Object>>} - двумерный массив ячеек с информацией о стенах
     */
    static generate(width, height) {
        // Инициализация сетки
        const grid = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push({
                    x: x,
                    y: y,
                    visited: false,
                    walls: {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true
                    }
                });
            }
            grid.push(row);
        }
        
        // Запускаем рекурсивный алгоритм с начальной позиции
        const startCell = grid[0][0];
        this.recursiveBacktracker(grid, startCell, width, height);
        
        return grid;
    }
    
    /**
     * Рекурсивный алгоритм Backtracker
     * @private
     */
    static recursiveBacktracker(grid, currentCell, width, height) {
        currentCell.visited = true;
        
        // Получаем всех непосещённых соседей
        const neighbors = this.getUnvisitedNeighbors(grid, currentCell, width, height);
        
        // Перемешиваем соседей для случайности
        this.shuffle(neighbors);
        
        for (const neighbor of neighbors) {
            if (!neighbor.visited) {
                // Удаляем стену между текущей ячейкой и соседом
                this.removeWall(currentCell, neighbor);
                
                // Рекурсивно обрабатываем соседа
                this.recursiveBacktracker(grid, neighbor, width, height);
            }
        }
    }
    
    /**
     * Получить непосещённых соседей
     * @private
     */
    static getUnvisitedNeighbors(grid, cell, width, height) {
        const neighbors = [];
        const { x, y } = cell;
        
        // Верхний сосед
        if (y > 0) {
            neighbors.push(grid[y - 1][x]);
        }
        
        // Правый сосед
        if (x < width - 1) {
            neighbors.push(grid[y][x + 1]);
        }
        
        // Нижний сосед
        if (y < height - 1) {
            neighbors.push(grid[y + 1][x]);
        }
        
        // Левый сосед
        if (x > 0) {
            neighbors.push(grid[y][x - 1]);
        }
        
        // Возвращаем только непосещённых
        return neighbors.filter(n => !n.visited);
    }
    
    /**
     * Удалить стену между двумя ячейками
     * @private
     */
    static removeWall(cellA, cellB) {
        const dx = cellA.x - cellB.x;
        const dy = cellA.y - cellB.y;
        
        if (dx === 1) {
            // cellB справа от cellA
            cellA.walls.left = false;
            cellB.walls.right = false;
        } else if (dx === -1) {
            // cellB слева от cellA
            cellA.walls.right = false;
            cellB.walls.left = false;
        }
        
        if (dy === 1) {
            // cellB снизу от cellA
            cellA.walls.top = false;
            cellB.walls.bottom = false;
        } else if (dy === -1) {
            // cellB сверху от cellA
            cellA.walls.bottom = false;
            cellB.walls.top = false;
        }
    }
    
    /**
     * Перемешать массив (Fisher-Yates shuffle)
     * @private
     */
    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Создать визуализацию лабиринта для отладки (ASCII)
     * @param {Array<Array<Object>>} grid - сетка лабиринта
     * @returns {string} - ASCII представление
     */
    static visualize(grid) {
        if (!grid || grid.length === 0) return '';
        
        const height = grid.length;
        const width = grid[0].length;
        let result = '';
        
        for (let y = 0; y < height; y++) {
            // Верхние стены
            let topLine = '';
            for (let x = 0; x < width; x++) {
                const cell = grid[y][x];
                topLine += '+';
                topLine += cell.walls.top ? '---' : '   ';
            }
            topLine += '+\n';
            result += topLine;
            
            // Боковые стены
            let middleLine = '';
            for (let x = 0; x < width; x++) {
                const cell = grid[y][x];
                middleLine += cell.walls.left ? '|' : ' ';
                middleLine += '   ';
            }
            middleLine += '|\n';
            result += middleLine;
        }
        
        // Нижняя граница
        let bottomLine = '';
        for (let x = 0; x < width; x++) {
            bottomLine += '+---';
        }
        bottomLine += '+\n';
        result += bottomLine;
        
        return result;
    }
}

