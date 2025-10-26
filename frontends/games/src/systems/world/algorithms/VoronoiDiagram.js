/**
 * Диаграммы Вороного для разделения мира на зоны
 * Использует простой подход с вычислением расстояний
 */
export class VoronoiDiagram {
    constructor(random) {
        this.random = random;
        this.points = [];
    }
    
    /**
     * Генерирует точки (центры зон) с минимальным расстоянием
     * @param {number} width - ширина области
     * @param {number} height - высота области
     * @param {number} numPoints - количество точек
     * @param {number} minDistance - минимальное расстояние между центрами
     * @returns {Array<{x, y, id}>} массив точек
     */
    generatePoints(width, height, numPoints, minDistance = 300) {
        this.points = [];
        const margin = 200; // Отступ от краёв
        let attempts = 0;
        const maxAttempts = numPoints * 100;
        
        console.log(`🔷 [VoronoiDiagram] Генерация ${numPoints} точек с минимальным расстоянием ${minDistance}...`);
        
        while (this.points.length < numPoints && attempts < maxAttempts) {
            const point = {
                x: margin + this.random.nextFloat() * (width - margin * 2),
                y: margin + this.random.nextFloat() * (height - margin * 2),
                id: this.points.length
            };
            
            // Проверка минимального расстояния от существующих точек
            let valid = true;
            for (const existing of this.points) {
                const dist = this.distance(point, existing);
                if (dist < minDistance) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                this.points.push(point);
                console.log(`  ✓ Точка ${point.id}: (${Math.round(point.x)}, ${Math.round(point.y)})`);
            }
            attempts++;
        }
        
        if (this.points.length < numPoints) {
            console.warn(`⚠️ [VoronoiDiagram] Удалось создать только ${this.points.length} из ${numPoints} точек`);
        }
        
        return this.points;
    }
    
    /**
     * Находит ближайшую точку для заданных координат
     * @param {number} x 
     * @param {number} y 
     * @returns {Object|null} ближайшая точка {x, y, id}
     */
    findClosest(x, y) {
        if (this.points.length === 0) {
            return null;
        }
        
        let closest = this.points[0];
        let minDist = this.distance({ x, y }, closest);
        
        for (let i = 1; i < this.points.length; i++) {
            const point = this.points[i];
            const dist = this.distance({ x, y }, point);
            
            if (dist < minDist) {
                minDist = dist;
                closest = point;
            }
        }
        
        return closest;
    }
    
    /**
     * Находит N ближайших точек
     * @param {number} x 
     * @param {number} y 
     * @param {number} n - количество ближайших
     * @returns {Array<{point, distance}>}
     */
    findNClosest(x, y, n = 2) {
        const distances = this.points.map(point => ({
            point,
            distance: this.distance({ x, y }, point)
        }));
        
        distances.sort((a, b) => a.distance - b.distance);
        
        return distances.slice(0, n);
    }
    
    /**
     * Создаёт 2D карту зон (каждая клетка содержит id ближайшей точки)
     * @param {number} width 
     * @param {number} height 
     * @param {number} resolution - шаг сэмплирования (для оптимизации)
     * @returns {Array<Array<number>>} карта id зон
     */
    generateMap(width, height, resolution = 10) {
        console.log(`🗺️ [VoronoiDiagram] Генерация карты ${width}x${height} с разрешением ${resolution}...`);
        
        const map = [];
        const mapWidth = Math.ceil(width / resolution);
        const mapHeight = Math.ceil(height / resolution);
        
        for (let y = 0; y < height; y += resolution) {
            const row = [];
            for (let x = 0; x < width; x += resolution) {
                const closest = this.findClosest(x, y);
                row.push(closest ? closest.id : 0);
            }
            map.push(row);
        }
        
        console.log(`  ✓ Карта создана: ${mapWidth}x${mapHeight} клеток`);
        
        return map;
    }
    
    /**
     * Находит соседей для каждой точки (зоны, которые граничат)
     * @param {Array<Array<number>>} map - карта зон
     * @returns {Map<number, Set<number>>} соседи для каждой точки
     */
    findNeighbors(map) {
        const neighbors = new Map();
        
        // Инициализируем пустые множества для каждой точки
        this.points.forEach(point => {
            neighbors.set(point.id, new Set());
        });
        
        // Проходим по карте и ищем границы
        for (let y = 0; y < map.length - 1; y++) {
            for (let x = 0; x < map[0].length - 1; x++) {
                const current = map[y][x];
                
                // Проверяем соседей справа и снизу
                const right = map[y][x + 1];
                const bottom = map[y + 1][x];
                
                if (current !== right && neighbors.has(current) && neighbors.has(right)) {
                    neighbors.get(current).add(right);
                    neighbors.get(right).add(current);
                }
                
                if (current !== bottom && neighbors.has(current) && neighbors.has(bottom)) {
                    neighbors.get(current).add(bottom);
                    neighbors.get(bottom).add(current);
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * Вычисляет расстояние между двумя точками
     * @param {Object} p1 - {x, y}
     * @param {Object} p2 - {x, y}
     * @returns {number}
     */
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Вычисляет квадрат расстояния (быстрее, когда sqrt не нужен)
     * @param {Object} p1 
     * @param {Object} p2 
     * @returns {number}
     */
    distanceSquared(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    }
    
    /**
     * Получает id зоны по координатам из карты
     * @param {Array<Array<number>>} map 
     * @param {number} x 
     * @param {number} y 
     * @param {number} resolution 
     * @returns {number}
     */
    static getZoneIdAt(map, x, y, resolution = 10) {
        const mapX = Math.floor(x / resolution);
        const mapY = Math.floor(y / resolution);
        
        if (mapY >= 0 && mapY < map.length && mapX >= 0 && mapX < map[0].length) {
            return map[mapY][mapX];
        }
        
        return 0; // Fallback
    }
}


