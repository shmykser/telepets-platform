import { ISystem } from '../interfaces/ISystem.js';

/**
 * Универсальная система коллизий для игровых объектов
 * Поддерживает гибкую настройку коллизий с возможностью полного отключения
 */
export class CollisionSystem extends ISystem {
    constructor(gameObject, config) {
        super(gameObject, config);
        this.collisionLayers = this.getConfigValue('collisionLayers', []);
        this.collisionGroups = this.getConfigValue('collisionGroups', []);
        this.collisionCallbacks = new Map();
        this.activeColliders = new Map();
        this.collisionEnabled = this.getConfigValue('collisionEnabled', true);
        
        // Настройки коллизий
        this.worldBoundsCollision = this.getConfigValue('worldBoundsCollision', true);
        this.overlapDetection = this.getConfigValue('overlapDetection', true);
        this.collisionResponse = this.getConfigValue('collisionResponse', true);
        
        this.initialize();
    }

    initialize() {
        this.setupPhysics();
        this.setupCollisionLayers();
    }

    setupPhysics() {
        const physicsBody = this.gameObject.physicsBody || this.gameObject.body;
        if (!physicsBody) {
            console.warn('CollisionSystem: GameObject has no physics body');
            return;
        }

        // Базовые настройки физики
        physicsBody.setCollideWorldBounds(this.worldBoundsCollision);
        physicsBody.setBounce(this.getConfigValue('bounce', 0.1));
        physicsBody.setDrag(
            this.getConfigValue('dragX', 50),
            this.getConfigValue('dragY', 50)
        );

        // Настройка коллизий
        if (this.collisionEnabled) {
            this.enableCollisions();
        } else {
            this.disableCollisions();
        }
    }

    setupCollisionLayers() {
        // Уровни коллизий (от высшего к низшему)
        this.COLLISION_LAYERS = {
            PROJECTILES: 1,
            ENEMIES: 2,
            OBSTACLES: 3,
            ITEMS: 4,
            DECORATIONS: 5,
            PLAYER: 6
        };

        // Группы коллизий
        this.COLLISION_GROUPS = {
            SOLID: 'solid',
            TRIGGER: 'trigger',
            OVERLAP: 'overlap'
        };
    }

    /**
     * Включение коллизий
     */
    enableCollisions() {
        this.collisionEnabled = true;
        const physicsBody = this.gameObject.physicsBody || this.gameObject.body;
        if (physicsBody) {
            physicsBody.setCollideWorldBounds(this.worldBoundsCollision);
            physicsBody.setImmovable(false);
        }
        
        this.emit('collisionsEnabled', {
            gameObject: this.gameObject
        });
    }

    /**
     * Отключение коллизий
     */
    disableCollisions() {
        this.collisionEnabled = false;
        const physicsBody = this.gameObject.physicsBody || this.gameObject.body;
        if (physicsBody) {
            physicsBody.setCollideWorldBounds(false);
            physicsBody.setImmovable(true);
        }
        
        // Удаляем все активные коллайдеры
        this.activeColliders.forEach(collider => {
            if (collider.destroy) {
                collider.destroy();
            }
        });
        this.activeColliders.clear();
        
        this.emit('collisionsDisabled', {
            gameObject: this.gameObject
        });
    }

    /**
     * Переключение коллизий
     * @param {boolean} enabled - Включены ли коллизии
     */
    setCollisionEnabled(enabled) {
        if (enabled) {
            this.enableCollisions();
        } else {
            this.disableCollisions();
        }
    }

    /**
     * Установка коллизии с определенным слоем
     * @param {string} layer - Слой коллизий
     * @param {boolean} enabled - Включена ли коллизия
     */
    setCollisionWithLayer(layer, enabled) {
        if (!this.COLLISION_LAYERS.hasOwnProperty(layer)) {
            console.warn(`CollisionSystem: Unknown collision layer: ${layer}`);
            return;
        }

        if (enabled) {
            this.collisionLayers.push(layer);
        } else {
            const index = this.collisionLayers.indexOf(layer);
            if (index > -1) {
                this.collisionLayers.splice(index, 1);
            }
        }

        this.updateCollisionSettings();
    }

    /**
     * Установка коллизии с группой объектов
     * @param {Array} targets - Массив целей для коллизии
     * @param {Function} callback - Обработчик коллизии
     * @param {string} type - Тип коллизии ('collision' или 'overlap')
     */
    setCollisionWith(targets, callback, type = 'collision') {
        if (!this.collisionEnabled) {
            return;
        }

        const colliderKey = `${targets.length}_${type}`;
        
        // Удаляем существующий коллайдер
        if (this.activeColliders.has(colliderKey)) {
            this.activeColliders.get(colliderKey).destroy();
        }

        // Создаем новый коллайдер
        let collider;
        if (type === 'collision') {
            collider = this.gameObject.scene.physics.add.collider(
                this.gameObject,
                targets,
                callback,
                null,
                this.gameObject.scene
            );
        } else if (type === 'overlap') {
            collider = this.gameObject.scene.physics.add.overlap(
                this.gameObject,
                targets,
                callback,
                null,
                this.gameObject.scene
            );
        }

        if (collider) {
            this.activeColliders.set(colliderKey, collider);
            this.collisionCallbacks.set(colliderKey, callback);
        }
    }

    /**
     * Удаление коллизии с группой объектов
     * @param {string} colliderKey - Ключ коллайдера
     */
    removeCollisionWith(colliderKey) {
        if (this.activeColliders.has(colliderKey)) {
            this.activeColliders.get(colliderKey).destroy();
            this.activeColliders.delete(colliderKey);
            this.collisionCallbacks.delete(colliderKey);
        }
    }

    /**
     * Обновление настроек коллизий
     */
    updateCollisionSettings() {
        if (!this.collisionEnabled) {
            return;
        }

        // Обновляем настройки физики на основе слоев
        this.gameObject.body.setCollideWorldBounds(this.worldBoundsCollision);
        
        // Здесь можно добавить логику для разных слоев коллизий
        this.emit('collisionSettingsUpdated', {
            layers: this.collisionLayers,
            groups: this.collisionGroups,
            gameObject: this.gameObject
        });
    }

    /**
     * Проверка коллизии с объектом
     * @param {Object} target - Целевой объект
     * @returns {boolean}
     */
    checkCollision(target) {
        if (!this.collisionEnabled || !this.gameObject.physicsBody || !target.physicsBody) {
            return false;
        }

        return this.gameObject.scene.physics.overlap(this.gameObject, target);
    }

    /**
     * Получение всех объектов, с которыми происходит коллизия
     * @returns {Array}
     */
    getCollidingObjects() {
        if (!this.collisionEnabled || !this.gameObject.physicsBody) {
            return [];
        }

        const collidingObjects = [];
        const world = this.gameObject.scene.physics.world;
        
        // Простая проверка коллизий (можно оптимизировать)
        world.bodies.forEach(body => {
            if (body !== this.gameObject.physicsBody && this.gameObject.scene.physics.overlap(this.gameObject, body.gameObject)) {
                collidingObjects.push(body.gameObject);
            }
        });

        return collidingObjects;
    }

    /**
     * Обработчик коллизии с миром
     * @param {Object} event - Событие коллизии
     */
    onWorldBoundsCollision(event) {
        this.emit('worldBoundsCollision', {
            event,
            gameObject: this.gameObject
        });
    }

    /**
     * Обработчик коллизии с объектом
     * @param {Object} gameObject - Объект коллизии
     * @param {Object} other - Другой объект
     */
    onCollision(gameObject, other) {
        this.emit('collision', {
            gameObject,
            other,
            collisionSystem: this
        });
    }

    /**
     * Обработчик наложения объектов
     * @param {Object} gameObject - Объект наложения
     * @param {Object} other - Другой объект
     */
    onOverlap(gameObject, other) {
        this.emit('overlap', {
            gameObject,
            other,
            collisionSystem: this
        });
    }

    /**
     * Установка размера коллизии
     * @param {number} width - Ширина
     * @param {number} height - Высота
     * @param {number} offsetX - Смещение по X
     * @param {number} offsetY - Смещение по Y
     */
    setCollisionSize(width, height, offsetX = 0, offsetY = 0) {
        const physicsBody = this.gameObject.physicsBody || this.gameObject.body;
        if (!physicsBody) {
            return;
        }

        physicsBody.setSize(width, height);
        physicsBody.setOffset(offsetX, offsetY);
    }

    /**
     * Установка формы коллизии
     * @param {string} shape - Форма ('rectangle', 'circle')
     * @param {Object} params - Параметры формы
     */
    setCollisionShape(shape, params = {}) {
        const physicsBody = this.gameObject.physicsBody || this.gameObject.body;
        if (!physicsBody) {
            return;
        }

        switch (shape) {
            case 'rectangle':
                physicsBody.setSize(params.width || this.gameObject.width, params.height || this.gameObject.height);
                break;
            case 'circle':
                const radius = params.radius || Math.min(this.gameObject.width, this.gameObject.height) / 2;
                physicsBody.setCircle(radius);
                break;
        }
    }

    /**
     * Получение состояния коллизий
     * @returns {Object}
     */
    getCollisionState() {
        return {
            enabled: this.collisionEnabled,
            layers: this.collisionLayers,
            groups: this.collisionGroups,
            worldBounds: this.worldBoundsCollision,
            overlapDetection: this.overlapDetection,
            collisionResponse: this.collisionResponse,
            activeColliders: this.activeColliders.size,
            collidingObjects: this.getCollidingObjects().length
        };
    }

    /**
     * Эмит события
     * @param {string} event - Событие
     * @param {Object} data - Данные
     */
    emit(event, data) {
        if (this.gameObject.scene && this.gameObject.scene.events) {
            this.gameObject.scene.events.emit(`collision:${event}`, data);
        }
    }

    destroy() {
        // Удаляем все коллайдеры
        this.activeColliders.forEach(collider => {
            if (collider.destroy) {
                collider.destroy();
            }
        });
        this.activeColliders.clear();
        this.collisionCallbacks.clear();
        
        super.destroy();
    }
}
