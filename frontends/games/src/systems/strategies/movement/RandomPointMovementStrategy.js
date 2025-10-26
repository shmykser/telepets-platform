import { GeometryUtils } from '../../../utils/GeometryUtils.js';

/**
 * Стратегия движения к случайным точкам (крот)
 * Выбирает случайные точки на поле и движется к ним
 */
export class RandomPointMovementStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
        // Получаем конфигурацию движения
        const movementConfig = config.get('movement', {});
        
        this.speed = movementConfig.speed || config.get('speed', 80);
        this.rotationSpeed = movementConfig.rotationSpeed || config.get('rotationSpeed', 0.12);
        
        // Получаем базовый радиус ТОЛЬКО из attack.range
        const attackConfig = config.get('attack', {});
        this.attackRange = attackConfig.range || 0;
        
        // Параметры выбора точек
        this.searchRadius = config.get('searchRadius', 200); // Радиус поиска новых точек
        this.minDistance = config.get('minDistance', 50); // Минимальное расстояние до новой точки
        
        // Текущая цель
        this.currentTarget = null;
        this.targetPoint = null; // Невидимый объект-цель
        
        // Состояние
        this.isMoving = false;
        this.lastTargetTime = 0;
        this.targetCheckInterval = 10000; // Проверяем цель каждую секунду
        
        // Флаг инициализации для крота
        this.isInitialized = false;
        this.initializationDelay = 100; // Задержка в миллисекундах
        
        
        // Инициализируем первую цель с задержкой для крота
        this.scheduleInitialization();
    }

    /**
     * Планирование инициализации с задержкой
     */
    scheduleInitialization() {
        // Для крота добавляем небольшую задержку, чтобы система стелса успела инициализироваться
        if (this.gameObject.enemyType === 'mole') {
            setTimeout(() => {
                this.initializeFirstTarget();
                this.isInitialized = true;
            }, this.initializationDelay);
        } else {
            // Для других врагов инициализируем сразу
            this.initializeFirstTarget();
            this.isInitialized = true;
        }
    }

    /**
     * Инициализация первой цели
     */
    initializeFirstTarget() {
        // Выбираем первую случайную цель сразу при создании
        const currentTime = this.gameObject.scene ? this.gameObject.scene.time.now : Date.now();
        this.selectNewTarget(currentTime);
    }

    /**
     * Обновление стратегии
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Логи только для крота
        if (!this.isInitialized) {
            return;
        }
        
        if (this.isUnderground()) {
            if (!this.currentTarget || this.isTargetReached() || 
                time - this.lastTargetTime > this.targetCheckInterval) {
                this.selectNewTarget(time);
            }
            
            if (this.currentTarget) {
                this.moveToTarget();
                
                if (this.isTargetReached()) {
                    this.onTargetReached(time);
                }
            }
        } else {
            this.stopMovement();
        }
    }

    /**
     * Выбор новой случайной цели
     * @param {number} time - Текущее время
     */
    selectNewTarget(time) {
        if (!this.gameObject.scene) return;

        const newTarget = this.findValidRandomPoint();
        if (newTarget) {
            // Прямо устанавливаем цель, не вызывая setTarget снова
            this.currentTarget = newTarget;
            this.lastTargetTime = time;
            this.isMoving = true;
        }
    }

    /**
     * Поиск валидной случайной точки
     * @returns {Object|null} Координаты точки или null
     */
    findValidRandomPoint() {
        if (!this.gameObject.scene) return null;

        const scene = this.gameObject.scene;
        const camera = scene.cameras.main;
        const sceneWidth = camera.width;
        const sceneHeight = camera.height;
        const margin = 50; // Отступ от краев экрана
        
        const currentX = this.gameObject.x;
        const currentY = this.gameObject.y;
        
        // Пытаемся найти валидную точку (максимум 10 попыток)
        for (let attempt = 0; attempt < 10; attempt++) {
            // Выбираем случайный угол и расстояние
            const angle = Math.random() * Math.PI * 2;
            const distance = this.minDistance + Math.random() * (this.searchRadius - this.minDistance);
            
            const targetX = currentX + Math.cos(angle) * distance;
            const targetY = currentY + Math.sin(angle) * distance;
            
            // Проверяем границы экрана
            if (targetX < margin || targetX > sceneWidth - margin || 
                targetY < margin || targetY > sceneHeight - margin) {
                continue; // Пропускаем точки за границами
            }
            
            // Проверяем препятствия (если есть система коллизий)
            if (this.isPointValid(targetX, targetY)) {
                return { x: targetX, y: targetY };
            }
        }
        
        // Если не нашли валидную точку, возвращаем точку в центре сцены
        return { x: sceneWidth / 2, y: sceneHeight / 2 };
    }

    /**
     * Проверка валидности точки
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @returns {boolean}
     */
    isPointValid(x, y) {
        if (!this.gameObject.scene) return true;

        // Проверяем коллизии с препятствиями
        const obstacles = this.gameObject.scene.children.list.filter(obj => 
            obj.isObstacle || obj.isProtection || obj.body || obj.physicsBody
        );
        
        for (const obstacle of obstacles) {
            const distance = GeometryUtils.distance(x, y, obstacle.x, obstacle.y);
            const obstacleRadius = obstacle.width ? obstacle.width / 2 : 30;
            
            if (distance < obstacleRadius + 20) { // +20 для безопасности
                return false;
            }
        }
        
        return true;
    }

    /**
     * Установка новой цели
     * @param {Object} target - Цель {x, y}
     * @param {number} time - Текущее время
     */
    setTarget(target, time) {
        // RandomPointMovementStrategy игнорирует внешние цели
        // и работает только со своими случайными точками
        
        // Если у нас еще нет цели, выбираем случайную
        if (!this.currentTarget) {
            this.selectNewTarget(time || Date.now());
        }
    }

    /**
     * Движение к цели
     */
    moveToTarget() {
        if (!this.currentTarget) return;

        const dx = this.currentTarget.x - this.gameObject.x;
        const dy = this.currentTarget.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Если достигли цели
        if (distance < 10) {
            this.isMoving = false;
            return;
        }
        
        // Вычисляем направление и скорость
        const direction = GeometryUtils.normalize(dx, dy);
        const velocityX = direction.x * this.speed;
        const velocityY = direction.y * this.speed;
        
        // Устанавливаем скорость
        if (this.gameObject.body) {
            this.gameObject.body.setVelocity(velocityX, velocityY);
        } else if (this.gameObject.physicsBody) {
            this.gameObject.physicsBody.setVelocity(velocityX, velocityY);
        }
        
        // Поворачиваем объект
        this.rotateToDirection(direction);
    }

    /**
     * Поворот объекта в направлении движения
     * @param {Object} direction - Направление {x, y}
     */
    rotateToDirection(direction) {
        const targetAngle = Math.atan2(direction.y, direction.x);
        const currentAngle = this.gameObject.rotation;
        
        // Плавный поворот
        const angleDiff = targetAngle - currentAngle;
        const normalizedDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
        
        this.gameObject.rotation = currentAngle + normalizedDiff * this.rotationSpeed;
    }

    /**
     * Проверка, достигнута ли цель
     * @returns {boolean}
     */
    isTargetReached() {
        if (!this.currentTarget) return false;
        
        const distance = GeometryUtils.distance(
            this.gameObject.x, 
            this.gameObject.y, 
            this.currentTarget.x, 
            this.currentTarget.y
        );
        
        // Вычисляем эффективный радиус атаки с учетом размеров обоих объектов
        const effectiveAttackRange = GeometryUtils.effectiveAttackRange(this.gameObject, this.currentTarget, this.attackRange);
        
        return distance < effectiveAttackRange;
    }

    /**
     * Получение скорости движения
     * @returns {number}
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Установка скорости
     * @param {number} speed - Скорость
     */
    setSpeed(speed) {
        this.speed = speed;
    }

    /**
     * Проверка, под землей ли крот
     * @returns {boolean}
     */
    isUnderground() {
        if (this.gameObject && this.gameObject._aiCoordinator && this.gameObject._aiCoordinator.stealthStrategy) {
            return this.gameObject._aiCoordinator.stealthStrategy.isUndergroundNow();
        }
        return true; // По умолчанию считаем что под землей
    }

    /**
     * Остановка движения
     */
    stopMovement() {
        if (this.gameObject.body) {
            this.gameObject.body.setVelocity(0, 0);
        } else if (this.gameObject.physicsBody) {
            this.gameObject.physicsBody.setVelocity(0, 0);
        }
        this.isMoving = false;
    }

    /**
     * Обработка достижения цели
     * @param {number} time - Текущее время
     */
    onTargetReached(time) {
        
        // Уведомляем AICoordinator о достижении цели
        if (this.gameObject && this.gameObject._aiCoordinator) {
            // Сигнализируем что крот достиг точки и должен выйти на поверхность
            this.gameObject._aiCoordinator.onTargetReached(time);
        }
    }

    /**
     * Уничтожение стратегии
     */
    destroy() {
        this.currentTarget = null;
        this.targetPoint = null;
        this.gameObject = null;
        this.config = null;
    }
}
