import { GeometryUtils } from '../../utils/GeometryUtils.js';

/**
 * Система управления целевыми точками
 * Создает и управляет невидимыми целевыми объектами для движения
 */
export class TargetPointSystem {
    constructor(scene) {
        this.scene = scene;
        this.targetPoints = new Map(); // ID -> TargetPoint
        this.nextId = 1;
    }

    /**
     * Создание новой целевой точки
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {Object} options - Дополнительные параметры
     * @returns {string} ID целевой точки
     */
    createTargetPoint(x, y, options = {}) {
        const id = `target_${this.nextId++}`;
        
        const targetPoint = {
            id: id,
            x: x,
            y: y,
            created: this.scene.time.now,
            lifetime: options.lifetime || 10000, // 10 секунд по умолчанию
            owner: options.owner || null,
            isActive: true
        };
        
        this.targetPoints.set(id, targetPoint);
        
        console.log(`🎯 [TargetPointSystem] Создана целевая точка ${id} в (${x.toFixed(1)}, ${y.toFixed(1)})`);
        
        return id;
    }

    /**
     * Получение целевой точки по ID
     * @param {string} id - ID целевой точки
     * @returns {Object|null}
     */
    getTargetPoint(id) {
        return this.targetPoints.get(id) || null;
    }

    /**
     * Удаление целевой точки
     * @param {string} id - ID целевой точки
     */
    removeTargetPoint(id) {
        if (this.targetPoints.has(id)) {
            this.targetPoints.delete(id);
            console.log(`🎯 [TargetPointSystem] Удалена целевая точка ${id}`);
        }
    }

    /**
     * Удаление всех целевых точек владельца
     * @param {Object} owner - Владелец
     */
    removeTargetPointsByOwner(owner) {
        for (const [id, point] of this.targetPoints) {
            if (point.owner === owner) {
                this.removeTargetPoint(id);
            }
        }
    }

    /**
     * Проверка валидности координат для целевой точки
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {Object} options - Параметры проверки
     * @returns {boolean}
     */
    isValidPoint(x, y, options = {}) {
        if (!this.scene) return false;

        const camera = this.scene.cameras.main;
        const sceneWidth = camera.width;
        const sceneHeight = camera.height;
        const margin = options.margin || 50;
        
        // Проверяем границы экрана
        if (x < margin || x > sceneWidth - margin || 
            y < margin || y > sceneHeight - margin) {
            return false;
        }
        
        // Проверяем препятствия
        if (options.checkObstacles !== false) {
            return this.checkObstacles(x, y, options.obstacleRadius || 30);
        }
        
        return true;
    }

    /**
     * Проверка препятствий в точке
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {number} radius - Радиус проверки
     * @returns {boolean}
     */
    checkObstacles(x, y, radius = 30) {
        if (!this.scene) return true;

        const obstacles = this.scene.children.list.filter(obj => 
            obj.isObstacle || obj.isProtection || obj.body || obj.physicsBody
        );
        
        for (const obstacle of obstacles) {
            const distance = GeometryUtils.distance(x, y, obstacle.x, obstacle.y);
            const obstacleRadius = obstacle.width ? obstacle.width / 2 : 30;
            
            if (distance < obstacleRadius + radius) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Поиск случайной валидной точки
     * @param {Object} center - Центр поиска {x, y}
     * @param {Object} options - Параметры поиска
     * @returns {Object|null} Координаты точки или null
     */
    findRandomValidPoint(center, options = {}) {
        const searchRadius = options.searchRadius || 200;
        const minDistance = options.minDistance || 50;
        const maxAttempts = options.maxAttempts || 10;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Выбираем случайный угол и расстояние
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (searchRadius - minDistance);
            
            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;
            
            if (this.isValidPoint(x, y, options)) {
                return { x, y };
            }
        }
        
        return null;
    }

    /**
     * Обновление системы (удаление устаревших точек)
     * @param {number} time - Текущее время
     */
    update(time) {
        for (const [id, point] of this.targetPoints) {
            if (time - point.created > point.lifetime) {
                this.removeTargetPoint(id);
            }
        }
    }

    /**
     * Получение всех активных целевых точек
     * @returns {Array}
     */
    getAllActiveTargetPoints() {
        return Array.from(this.targetPoints.values()).filter(point => point.isActive);
    }

    /**
     * Получение целевых точек владельца
     * @param {Object} owner - Владелец
     * @returns {Array}
     */
    getTargetPointsByOwner(owner) {
        return Array.from(this.targetPoints.values())
            .filter(point => point.owner === owner && point.isActive);
    }

    /**
     * Очистка всех целевых точек
     */
    clear() {
        this.targetPoints.clear();
    }

    /**
     * Уничтожение системы
     */
    destroy() {
        this.clear();
        this.scene = null;
    }
}

