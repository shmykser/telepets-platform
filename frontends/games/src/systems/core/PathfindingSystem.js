import { ISystem } from '../interfaces/ISystem.js';
import { GeometryUtils } from '../../utils/GeometryUtils.js';
import { EVENT_TYPES } from '../../types/EventTypes.js';
import PF from 'pathfinding';

/**
 * Универсальная система поиска пути для игровых объектов
 * Поддерживает различные алгоритмы поиска пути
 */
export class PathfindingSystem extends ISystem {
    constructor(gameObject, config) {
        super(gameObject, config);
        this.grid = null;
        this.finder = null;
        this.currentPath = null;
        this.pathIndex = 0;
        this.updateTimer = null;
        
        // Размеры мира берем из сцены (fallback на дефолты)
        const sceneScale = this.gameObject?.scene?.scale;
        const gameWidth = (sceneScale && sceneScale.width) ? sceneScale.width : 720;
        const gameHeight = (sceneScale && sceneScale.height) ? sceneScale.height : 1280;
        this.cellSize = this.getConfigValue('cellSize', 32);
        this.gridWidth = Math.ceil(gameWidth / this.cellSize);
        this.gridHeight = Math.ceil(gameHeight / this.cellSize);
        
        this.algorithm = this.getConfigValue('algorithm', 'astar');
        this.allowDiagonal = this.getConfigValue('allowDiagonal', true);
        this.dontCrossCorners = this.getConfigValue('dontCrossCorners', true); // Используем значение из конфигурации врага
        
        // Настройки для летающих объектов
        this.canFly = this.gameObject.canFly || false;
        this.ignoreGroundObstacles = this.getConfigValue('ignoreGroundObstacles', this.canFly);
        
        this.initialize();
    }

    initialize() {
        
        this.setupPathfinding();
        
        // Слушаем события обновления препятствий
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.on(EVENT_TYPES.PATHFINDING_UPDATED, this.onObstaclesUpdated, this);
        }
        
        // Первичное обновление препятствий сразу после инициализации
        this.updateObstacles();

        // Периодически обновляем препятствия
        if (this.gameObject.scene && this.gameObject.scene.time) {
            this.updateTimer = this.gameObject.scene.time.addEvent({
                delay: 2000, // Обновляем каждые 2 секунды
                callback: () => {
                    this.updateObstacles();
                },
                loop: true
            });
        }
        
    }

    setupPathfinding() {
        this.createGrid();
        this.setupFinder();
    }

    createGrid() {
        
        
        // Создаем сетку для поиска пути
        this.grid = this.createEmptyGrid(this.gridWidth, this.gridHeight);
        
        // НЕ вызываем updateObstacles() здесь - это вызовет рекурсию
        // Препятствия будут добавлены позже через updateObstacles()
        
        
    }

    createEmptyGrid(width, height) {
        return new PF.Grid(width, height);
    }

    setupFinder() {
        // Явная настройка диагонального движения
        const diagonalMovement = this.allowDiagonal
            ? (this.dontCrossCorners ? PF.DiagonalMovement.OnlyWhenNoObstacles : PF.DiagonalMovement.IfAtMostOneObstacle)
            : PF.DiagonalMovement.Never;

        switch (this.algorithm) {
            case 'astar':
                this.finder = new PF.AStarFinder({ diagonalMovement });
                break;
            case 'dijkstra':
                this.finder = new PF.DijkstraFinder({ diagonalMovement });
                break;
            case 'breadthfirst':
                this.finder = new PF.BreadthFirstFinder({ diagonalMovement });
                break;
            case 'bestfirst':
                this.finder = new PF.BestFirstFinder({ diagonalMovement });
                break;
            case 'jps':
                this.finder = new PF.JumpPointFinder({ diagonalMovement });
                break;
            default:
                this.finder = new PF.AStarFinder({ diagonalMovement });
        }
    }

    /**
     * Проверка валидности клетки
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {PF.Grid} grid - Сетка
     * @returns {boolean}
     */
    isValidCell(x, y, grid) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return false;
        }
        
        return grid.isWalkableAt(x, y);
    }

    /**
     * Поиск ближайшей свободной клетки
     * @param {number} startX - Начальная X координата
     * @param {number} startY - Начальная Y координата
     * @param {number} maxRadius - Максимальный радиус поиска
     * @returns {Object|null} - Ближайшая свободная клетка или null
     */
    findNearestWalkableCell(startX, startY, maxRadius = 5) {
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    // Проверяем только клетки на текущем радиусе
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                        continue;
                    }
                    
                    const x = startX + dx;
                    const y = startY + dy;
                    
                    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                        if (this.grid.isWalkableAt(x, y)) {
                            return { x, y };
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Поиск пути к цели
     * @param {Object} target - Цель {x, y}
     * @returns {Array|null} - Путь или null
     */
    findPath(target) {
        if (!target || !this.grid || !this.finder) {
            
            return null;
        }

        const startX = Math.floor(this.gameObject.x / this.cellSize);
        const startY = Math.floor(this.gameObject.y / this.cellSize);
        const endX = Math.floor(target.x / this.cellSize);
        const endY = Math.floor(target.y / this.cellSize);

        

        // Проверяем границы сетки
        if (startX < 0 || startX >= this.gridWidth || startY < 0 || startY >= this.gridHeight ||
            endX < 0 || endX >= this.gridWidth || endY < 0 || endY >= this.gridHeight) {
            
            return null;
        }

        // Проверяем, не заблокированы ли начальная и конечная точки
        const startWalkable = this.grid.isWalkableAt(startX, startY);
        const endWalkable = this.grid.isWalkableAt(endX, endY);
        

        // Если начальная точка заблокирована, пытаемся найти ближайшую свободную
        let actualStartX = startX;
        let actualStartY = startY;
        if (!startWalkable) {
            const nearestWalkable = this.findNearestWalkableCell(startX, startY);
            if (nearestWalkable) {
                actualStartX = nearestWalkable.x;
                actualStartY = nearestWalkable.y;
                
            } else {
                
                return null;
            }
        }

        // Если конечная точка заблокирована, пытаемся найти ближайшую свободную
        let actualEndX = endX;
        let actualEndY = endY;
        if (!endWalkable) {
            const nearestWalkable = this.findNearestWalkableCell(endX, endY);
            if (nearestWalkable) {
                actualEndX = nearestWalkable.x;
                actualEndY = nearestWalkable.y;
                
            } else {
                
                return null;
            }
        }

        // Используем PathFinding.js для поиска пути (работаем на клоне, т.к. алгоритм мутирует сетку)
        const gridClone = this.grid.clone();
        const path = this.finder.findPath(actualStartX, actualStartY, actualEndX, actualEndY, gridClone);
        
        // Короткий лог результата
        
        
        // Дополнительная диагностика если путь не найден
        if (!path || path.length === 0) {
            
            
            // Проверяем несколько клеток вокруг начальной точки
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const x = actualStartX + dx;
                    const y = actualStartY + dy;
                    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                        const walkable = this.grid.isWalkableAt(x, y);
                        
                    }
                }
            }
        }
        
        if (path && path.length > 0) {
            // Конвертируем координаты сетки в мировые координаты
            const worldPath = path.map(([x, y]) => ({
                x: x * this.cellSize + this.cellSize / 2,
                y: y * this.cellSize + this.cellSize / 2
            }));
            
            return worldPath;
        }

        
        return null;
    }

    /**
     * Установка текущего пути
     * @param {Array} path - Путь
     */
    setPath(path) {
        this.currentPath = path;
        this.pathIndex = 0;
        
        this.emit('pathSet', {
            path,
            gameObject: this.gameObject
        });
    }

    /**
     * Получение следующей точки пути
     * @returns {Object|null} - Следующая точка или null
     */
    getNextPathPoint() {
        if (!this.currentPath || this.pathIndex >= this.currentPath.length) {
            return null;
        }

        return this.currentPath[this.pathIndex];
    }

    /**
     * Переход к следующей точке пути
     * @returns {Object|null} - Следующая точка или null
     */
    advancePath() {
        if (!this.currentPath || this.pathIndex >= this.currentPath.length) {
            return null;
        }

        const point = this.currentPath[this.pathIndex];
        this.pathIndex++;
        
        if (this.pathIndex >= this.currentPath.length) {
            this.onPathCompleted();
        }
        
        return point;
    }

    /**
     * Проверка, завершен ли путь
     * @returns {boolean}
     */
    isPathCompleted() {
        return !this.currentPath || this.pathIndex >= this.currentPath.length;
    }

    /**
     * Очистка текущего пути
     */
    clearPath() {
        this.currentPath = null;
        this.pathIndex = 0;
        
        this.emit('pathCleared', {
            gameObject: this.gameObject
        });
    }

    /**
     * Обновление препятствий в сетке
     */
    updateObstacles() {
        if (!this.grid) {
        
            return;
        }

        

        // Очищаем сетку
        this.grid = new PF.Grid(this.gridWidth, this.gridHeight);

        // Добавляем препятствия из сцены
        this.addObstaclesToGrid();
        
        // НЕ вызываем debugGrid() здесь - это покажет пустую сетку
        // debugGrid() должен вызываться только после добавления препятствий
        
        
    }

    /**
     * Добавление препятствий в сетку
     */
    addObstaclesToGrid() {
        if (!this.gameObject.scene) {
            return;
        }

        // Получаем препятствия из ObstacleInteractionSystem
        const obstacleSystem = this.gameObject.scene.obstacleInteractionSystem;
        if (obstacleSystem && obstacleSystem.obstacles && obstacleSystem.obstacles.length > 0) {
            obstacleSystem.obstacles.forEach(obstacle => {
                this.addObstacleToGrid(obstacle);
            });
            return;
        } else {
            // Fallback: ищем препятствия напрямую в сцене
            const allObjects = this.gameObject.scene.children.list;
            const sceneObstacles = allObjects.filter(obj => obj.defenseData?.isObstacle && obj.isAlive);
            sceneObstacles.forEach(obstacle => {
                this.addObstacleToGrid(obstacle);
            });
        }
    }

    /**
     * Добавляет одно препятствие в сетку
     * @param {Object} obstacle - Препятствие
     */
    addObstacleToGrid(obstacle) {
        

        // Проверяем, влияет ли препятствие на данный тип объекта
        if (obstacle.defenseData) {
            if (this.canFly && !obstacle.defenseData.affectsFlying) {
                
                return;
            }
            if (!this.canFly && !obstacle.defenseData.affectsGround) {
                
                return;
            }
        }

        

        // Центрируем прямоугольник блокировки относительно центра препятствия
        const centerX = Math.floor(obstacle.x / this.cellSize);
        const centerY = Math.floor(obstacle.y / this.cellSize);
        let cellsW = Math.max(1, Math.ceil(obstacle.width / this.cellSize));
        let cellsH = Math.max(1, Math.ceil(obstacle.height / this.cellSize));

        let startX = centerX - Math.floor(cellsW / 2);
        let startY = centerY - Math.floor(cellsH / 2);

        if (startX < 0) { cellsW -= -startX; startX = 0; }
        if (startY < 0) { cellsH -= -startY; startY = 0; }
        if (startX + cellsW > this.gridWidth) { cellsW = Math.max(0, this.gridWidth - startX); }
        if (startY + cellsH > this.gridHeight) { cellsH = Math.max(0, this.gridHeight - startY); }

        

        let blockedCells = 0;
        for (let y = startY; y < startY + cellsH; y++) {
            for (let x = startX; x < startX + cellsW; x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    this.grid.setWalkableAt(x, y, false);
                    blockedCells++;
                }
            }
        }
        
    }

    /**
     * Обработчик завершения пути
     */
    onPathCompleted() {
        this.emit('pathCompleted', {
            gameObject: this.gameObject,
            path: this.currentPath
        });
    }

    /**
     * Установка размера сетки
     * @param {number} width - Ширина
     * @param {number} height - Высота
     */
    setGridSize(width, height) {
        this.gridWidth = width;
        this.gridHeight = height;
        this.createGrid();
    }

    /**
     * Установка размера клетки
     * @param {number} cellSize - Размер клетки
     */
    setCellSize(cellSize) {
        this.cellSize = cellSize;
        this.createGrid();
    }

    /**
     * Установка алгоритма поиска пути
     * @param {string} algorithm - Алгоритм
     */
    setAlgorithm(algorithm) {
        this.algorithm = algorithm;
        this.setupFinder();
    }

    /**
     * Получение состояния поиска пути
     * @returns {Object}
     */
    getPathfindingState() {
        return {
            hasPath: !!this.currentPath,
            pathLength: this.currentPath ? this.currentPath.length : 0,
            currentIndex: this.pathIndex,
            isCompleted: this.isPathCompleted(),
            algorithm: this.algorithm,
            canFly: this.canFly,
            ignoreGroundObstacles: this.ignoreGroundObstacles,
            gridSize: { width: this.gridWidth, height: this.gridHeight },
            cellSize: this.cellSize
        };
    }

    /**
     * Эмит события
     * @param {string} event - Событие
     * @param {Object} data - Данные
     */
    emit(event, data) {
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit(`pathfinding:${event}`, data);
        }
    }

    /**
     * Отладочная визуализация сетки
     */
    debugGrid() {
        if (!this.grid) {
            console.log(`🗺️ [PathfindingSystem] debugGrid: Сетка не создана`);
            return;
        }

        console.log(`🗺️ [PathfindingSystem] debugGrid: Размер сетки ${this.gridWidth}x${this.gridHeight}`);
        
        let walkableCount = 0;
        let blockedCount = 0;
        
        for (let y = 0; y < this.gridHeight; y++) {
            let row = '';
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid.isWalkableAt(x, y)) {
                    row += '.';
                    walkableCount++;
                } else {
                    row += '#';
                    blockedCount++;
                }
            }
            console.log(`🗺️ [PathfindingSystem] debugGrid: ${y.toString().padStart(2, '0')}: ${row}`);
        }
        
        console.log(`🗺️ [PathfindingSystem] debugGrid: Проходимых клеток: ${walkableCount}, заблокированных: ${blockedCount}`);
    }

    /**
     * Обработчик обновления препятствий
     */
    onObstaclesUpdated(data) {
        this.updateObstacles();
    }

    /**
     * Обновляет путь при изменении препятствий
     */
    updatePathForObstacles() {
        if (this.currentPath && this.pathIndex < this.currentPath.length) {
            // Пересчитываем путь от текущей позиции
            const currentPos = { x: this.gameObject.x, y: this.gameObject.y };
            const target = this.currentPath[this.currentPath.length - 1];
            
            const newPath = this.findPath(currentPos, target);
            if (newPath && newPath.length > 0) {
                this.currentPath = newPath;
                this.pathIndex = 0;
                
            }
        }
    }

    destroy() {
        // Очищаем таймер обновления
        if (this.updateTimer) {
            this.updateTimer.destroy();
            this.updateTimer = null;
        }
        
        // Удаляем слушатели событий
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.off(EVENT_TYPES.PATHFINDING_UPDATED, this.onObstaclesUpdated, this);
        }
        
        this.clearPath();
        this.grid = null;
        this.finder = null;
        super.destroy();
    }
}
