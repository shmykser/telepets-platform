import Phaser from 'phaser';
import { HealthBar } from '../components/HealthBar.js';
import { PropertyUtils } from '../utils/PropertyUtils.js';
import { PHYSICS_CONSTANTS } from '../settings/GameSettings.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

export class GameObject extends Phaser.GameObjects.Sprite {
    constructor(scene, config) {
        // Определяем текстуру для использования (спрайт или эмодзи)
        const textureKey = GameObject.selectTexture(scene, config);
        
        super(scene, config.x || 0, config.y || 0, textureKey);
        // Только базовые свойства для всех объектов
        PropertyUtils.defineProperty(this, "_health", undefined);
        PropertyUtils.defineProperty(this, "_maxHealth", undefined);
        PropertyUtils.defineProperty(this, "_isAlive", true);
        PropertyUtils.defineProperty(this, "_body", undefined);
        PropertyUtils.defineProperty(this, "_healthBar", undefined);
        PropertyUtils.defineProperty(this, "_size", undefined);
        
        // Свойства кулдауна
        PropertyUtils.defineProperty(this, "_cooldown", config.cooldown || 0);
        PropertyUtils.defineProperty(this, "_lastActionTime", 0);
        
        // Инициализация базовых свойств
        this._health = config.health;
        this._maxHealth = config.maxHealth !== undefined ? config.maxHealth : config.health;
        this._size = config.size || 1; // Сохраняем размер объекта
        
        // Добавляем в сцену и физику
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this._body = this.body;
        this._body.setCollideWorldBounds(true);
        this._body.setBounce(PHYSICS_CONSTANTS.DEFAULT_BOUNCE);
        this._body.setDrag(PHYSICS_CONSTANTS.DEFAULT_DRAG, PHYSICS_CONSTANTS.DEFAULT_DRAG);
        
        // Настраиваем события физики
        this._body.onOverlap = true;
    }
    
    // Геттеры - только базовые для всех объектов
    get health() { return this._health; }
    get maxHealth() { return this._maxHealth; }
    get isAlive() { return this._isAlive; }
    get physicsBody() { return this._body; }
    get cooldown() { return this._cooldown; }
    get size() { return this._size; }
    
    // Сеттеры - только базовые для всех объектов
    set health(value) {
        this._health = Math.max(0, Math.min(value, this.maxHealth));
        this.updateHealthBar();
        if (this._health <= 0) {
            this.die();
        }
    }
    
    // Базовые методы
    setVelocity(x, y) {
        this._body.setVelocity(x, y);
    }
    
    stopMovement() {
        this._body.setVelocity(0, 0);
    }
    
    takeDamage(damage) {
        if (!this._isAlive || !this.scene) return;
        
        this.health -= damage;
        this.emit('damage', damage, this._health);
    }
    
    die() {
        this._isAlive = false;
        this.stopMovement();
        this.destroyHealthBar();
        
        this.emit('death', this);
        if (this.enemyType) {
            this.emit('enemyKilled', this);
        }
        this.destroy();
    }
    
    update(_time, _delta) {
        if (!this._isAlive) return;
    }
    
    destroy() {
        this.destroyHealthBar();
        this.emit('destroy', this);
        super.destroy();
    }
    
    // setTarget удален - нужен только врагам
    
    // Методы для работы с HealthBar
    createHealthBar(options) {
        if (this._healthBar) {
            this._healthBar.destroy();
        }
        this._healthBar = new HealthBar(this.scene, this, options);
        
        // Добавляем healthBar в сцену
        this.scene.add.existing(this._healthBar);
    }
    
    updateHealthBar() {
        if (this._healthBar) {
            this._healthBar.updateHealth();
        }
    }
    
    destroyHealthBar() {
        if (this._healthBar) {
            this._healthBar.destroy();
            this._healthBar = undefined;
        }
    }
    

//#### TEXTURE #########################################################
    // Статические методы для работы с текстурами (спрайты и эмодзи)
    static selectTexture(scene, config) {
        // Если есть spriteKey, пытаемся использовать спрайт
        if (config.spriteKey && config.size !== undefined) {
            const spriteKey = GameObject.selectSpriteKey(config);
            if (scene.textures.exists(spriteKey)) {
                return spriteKey;
            }
        }
        
        // Если спрайт не найден, используем эмодзи как fallback
        if (config.texture && GameObject.isEmoji(config.texture)) {
            GameObject.createEmojiTexture(scene, config.texture);
            return config.texture;
        }
        
        // Возвращаем переданную текстуру или пустую строку
        return config.texture || '';
    }
    
    static selectSpriteKey(config) {
        if (!config.spriteKey) return '';
        
        // Выбираем размер спрайта на основе размера объекта
        const size = GameObject.calculateSpriteSize(config.size);
        return `${config.spriteKey}_${size}`;
    }
    
    static calculateSpriteSize(size) {
        // Маппинг размера объекта на размер спрайта
        if (size <= 1) return '32x32';
        if (size <= 2) return '64x64';
        if (size <= 3) return '128x128';
        //return '500x500';
    }
    
    static isEmoji(text) {
        // Проверка на эмодзи - расширенный диапазон Unicode
        return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1FAB0}-\u{1FABF}]|[\u{1FAC0}-\u{1FAFF}]|[\u{1FAD0}-\u{1FAFF}]|[\u{1FAE0}-\u{1FAFF}]|[\u{1FAF0}-\u{1FAFF}]/u.test(text);
    }
    
    static createEmojiTexture(scene, emoji) {
        // Проверяем, существует ли уже текстура
        if (scene.textures.exists(emoji)) {
            return; // Текстура уже существует
        }
        
        // Создаем RenderTexture для рендеринга эмодзи
        const renderTexture = scene.add.renderTexture(0, 0, 64, 64);
        
        // Создаем текстовый объект с эмодзи
        const text = scene.add.text(32, 32, emoji, {
            fontSize: '48px',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Рендерим текст в текстуру
        renderTexture.draw(text);
        
        // Сохраняем как текстуру
        renderTexture.saveTexture(emoji);
        
        // Очищаем
        text.destroy();
        renderTexture.destroy();
    }
    
    // ========== МЕТОДЫ АТАКИ В РАДИУСЕ ==========
    
    /**
     * Универсальный метод нанесения урона в радиусе
     * @param {number} damage - Урон для нанесения
     * @param {number} radius - Радиус атаки в пикселях
     * @param {Array} targets - Массив целей для атаки
     * @param {Function} targetFilter - Функция фильтрации целей (опционально)
     * @param {string} attackType - Тип атаки для логирования (опционально)
     * @returns {number} Количество пораженных целей
     */
    damageInRadius(damage, radius, targets, targetFilter = null, attackType = 'attack') {
        if (!this.isAlive || !this.scene || !targets || targets.length === 0) {
            return 0;
        }
        
        // Определяем фильтр по умолчанию - только живые объекты
        const defaultFilter = (target) => target && target.isAlive;
        const filter = targetFilter || defaultFilter;
        
        // Находим цели в радиусе
        const targetsInRadius = GeometryUtils.findObjectsInRadius(
            targets,
            this.x,
            this.y,
            radius,
            filter
        );
        
        if (targetsInRadius.length === 0) {
            return 0;
        }
        
        // Наносим урон каждой цели
        let hitCount = 0;
        targetsInRadius.forEach((target, index) => {
            if (target.takeDamage && typeof target.takeDamage === 'function') {
                target.takeDamage(damage);
                hitCount++;
                
                // Эмитим событие атаки
                this.emit(`${attackType}:hit`, {
                    attacker: this,
                    target: target,
                    damage: damage,
                    index: index
                });
            }
        });
        
        // Эмитим общее событие атаки в радиусе
        this.emit(`${attackType}:radius`, {
            attacker: this,
            damage: damage,
            radius: radius,
            hitCount: hitCount,
            totalTargets: targetsInRadius.length,
            position: { x: this.x, y: this.y }
        });
        
        return hitCount;
    }
    
    
    // ========== МЕТОДЫ КУЛДАУНА ==========
    
    /**
     * Проверяет, готов ли объект к действию (прошел ли кулдаун)
     * @param {number} currentTime - Текущее время (обычно scene.time.now)
     * @returns {boolean} true если кулдаун прошел
     */
    isActionReady(currentTime) {
        if (this._cooldown <= 0) return true;
        return (currentTime - this._lastActionTime) >= this._cooldown;
    }
    
    /**
     * Устанавливает время последнего действия (сбрасывает кулдаун)
     * @param {number} currentTime - Текущее время (обычно scene.time.now)
     */
    setLastActionTime(currentTime) {
        this._lastActionTime = currentTime;
    }
    
    /**
     * Получает оставшееся время кулдауна в миллисекундах
     * @param {number} currentTime - Текущее время (обычно scene.time.now)
     * @returns {number} Оставшееся время или 0 если кулдаун прошел
     */
    getCooldownRemaining(currentTime) {
        if (this._cooldown <= 0) return 0;
        return Math.max(0, this._cooldown - (currentTime - this._lastActionTime));
    }
    
    /**
     * Устанавливает новый кулдаун
     * @param {number} newCooldown - Новое значение кулдауна в миллисекундах
     */
    setCooldown(newCooldown) {
        this._cooldown = Math.max(0, newCooldown);
    }
    
    /**
     * Получает размер объекта в пикселях
     * @returns {number} Размер объекта в пикселях (size 1 = 32px, 2 = 64px, 3 = 128px)
     */
    getSizeInPixels() {
        const size = 32 * Math.pow(2, this._size - 1); // size 1 = 32px, 2 = 64px, 3 = 128px
        
        // Логируем размеры для отладки
        if (this.defenseType === 'sugar' || this.texture === '🥚') {
            console.log(`📏 [GameObject] Размер объекта:`);
            console.log(`📏 [GameObject] - Тип: ${this.defenseType || 'egg'}`);
            console.log(`📏 [GameObject] - this._size: ${this._size}`);
            console.log(`📏 [GameObject] - Размер в пикселях: ${size}px`);
        }
        
        return size;
    }
}
