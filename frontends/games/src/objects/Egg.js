import { GameObject } from './GameObject.js';
import { PHYSICS_CONSTANTS, COLORS, DEPTH_CONSTANTS } from '../settings/GameSettings.js';
export class Egg extends GameObject {
    // Яйцо - статичный объект без вылупления
    constructor(scene, config, abilitySystem = null) {
        // Настройки для яйца - статичный объект
        const eggConfig = {
            ...config,
            speed: 0, // Не может двигаться
            damage: config.damage || 10, // Базовый урон яйца
            cooldown: config.cooldown || 10000, // Базовый кулдаун (fallback)
            attackRange: config.attackRange || 60, // Базовый радиус
            size: config.size || 2 // Размер яйца по умолчанию
        };
        super(scene, eggConfig);
        
        // Сохраняем ссылку на систему способностей
        this.abilitySystem = abilitySystem;
        
        // Сохраняем размер яйца для системы попадания
        this._size = eggConfig.size;
        
        // Настраиваем физику для яйца
        this.setupEggPhysics();
        
        
        // Подписываемся на изменения способностей для обновления кулдауна
        if (this.abilitySystem) {
            this.scene.events.on('ability:upgraded', this.onAbilityUpgraded, this);
        }
        
        // Инициализация ауры
        this.auraEffect = null;
        this.auraTimer = null;
        this.auraGlow = null; // Ссылка на визуальный эффект ауры
        
        // Инициализация регенерации
        this.recoveryTimer = null;
    }
    setupEggPhysics() {
        // Яйцо статично - не может двигаться
        this.physicsBody.setImmovable(true);
        this.physicsBody.setVelocity(0, 0);
        this.physicsBody.setBounce(PHYSICS_CONSTANTS.EGG_BOUNCE);
        this.physicsBody.setDrag(PHYSICS_CONSTANTS.EGG_DRAG, PHYSICS_CONSTANTS.EGG_DRAG);
    }
    
    // Геттеры для характеристик из системы способностей
    get maxHealth() {
        return this.abilitySystem ? this.abilitySystem.getEggMaxHealth() : this._maxHealth;
    }
    
    get damage() {
        return this.abilitySystem ? this.abilitySystem.getEggDamage() : (this._damage || 10);
    }
    
    get cooldown() {
        return this.abilitySystem ? this.abilitySystem.getEggCooldown() : (this._cooldown || 10000);
    }
    
    get radius() {
        return this.abilitySystem ? this.abilitySystem.getEggRadius() : (this._attackRange || 60);
    }
    
    // Геттеры для ауры из системы способностей
    get auraLevel() {
        return this.abilitySystem ? this.abilitySystem.getAura() : 0;
    }
    
    get auraDamage() {
        return this.abilitySystem ? this.abilitySystem.getAuraDamage() : 0;
    }
    
    // Геттеры для взрыва яйца из системы способностей
    get eggExplosion() {
        return this.abilitySystem ? this.abilitySystem.getEggExplosion() : 0;
    }
    
    get eggExplosionDamage() {
        return this.abilitySystem ? this.abilitySystem.getEggExplosionDamage() : 0;
    }
    
    get eggExplosionRadius() {
        return this.abilitySystem ? this.abilitySystem.getEggExplosionRadius() : 60;
    }
    
    get eggExplosionCooldown() {
        return this.abilitySystem ? this.abilitySystem.getEggExplosionCooldown() : 50000;
    }
    
    // Геттер для регенерации из системы способностей
    get eggRecovery() {
        return this.abilitySystem ? this.abilitySystem.getEggRecovery() : 0;
    }
    
    
    
    
    /**
     * Обрабатывает изменения способностей
     */
    onAbilityUpgraded(eventData) {
        if (eventData.abilityType === 'EGG_COOLDOWN' && this.abilitySystem) {
            // Обновляем кулдаун в родительском классе
            this.setCooldown(this.abilitySystem.getEggCooldown());
        }
        
        // Обновляем ауру при изменении способностей
        if (eventData.abilityType === 'EGG_AURA') {
            this.updateAura();
        }
        
        // Обновляем взрыв яйца при изменении способностей
        if (eventData.abilityType === 'EGG_EXPLOSION') {
            this.updateEggExplosion();
        }
        
        // Обновляем регенерацию при изменении способностей
        if (eventData.abilityType === 'EGG_RECOVERY') {
            this.updateRecovery();
        }
    }
    
    /**
     * Обновляет состояние ауры
     */
    updateAura() {
        this.updateAbility('aura', this.auraLevel, 'auraGlow', 0x00ff00, this.auraDamage);
    }
    
    /**
     * Обновляет состояние взрыва яйца
     */
    updateEggExplosion() {
        // Если есть способность взрыва, запускаем ауру для визуализации готовности
        if (this.eggExplosion > 0) {
            this.updateAura();
        }
    }
    
    /**
     * Обновляет состояние регенерации
     */
    updateRecovery() {
        if (this.eggRecovery > 0) {
            this.startRecovery();
        } else {
            this.stopRecovery();
        }
    }
    
    /**
     * Запускает регенерацию яйца
     */
    startRecovery() {
        if (this.recoveryTimer) return; // Уже активна
        
        // Запускаем таймер регенерации каждую секунду
        this.recoveryTimer = this.scene.time.addEvent({
            delay: 1000, // Каждую секунду
            callback: () => this.processRecovery(),
            callbackScope: this,
            loop: true
        });
        
        console.log(`🌿 [Egg] Регенерация активирована: ${this.eggRecovery} HP/сек`);
    }
    
    /**
     * Останавливает регенерацию яйца
     */
    stopRecovery() {
        if (this.recoveryTimer) {
            this.recoveryTimer.destroy();
            this.recoveryTimer = null;
            console.log(`🌿 [Egg] Регенерация деактивирована`);
        }
    }
    
    /**
     * Обрабатывает восстановление здоровья яйца
     */
    processRecovery() {
        if (!this.isAlive || this.health >= this.maxHealth) {
            return; // Яйцо мертво или здоровье полное
        }
        
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + this.eggRecovery);
        const actualRecovery = this.health - oldHealth;
        
        if (actualRecovery > 0) {
            console.log(`🌿 [Egg] Регенерация: +${actualRecovery} HP (${oldHealth} → ${this.health})`);
            
            // Создаем визуальный эффект регенерации
            if (this.scene.effectSystem) {
                this.scene.effectSystem.applyEffect('heal', this, 1, {
                    color: 0x00ff00,
                    radius: 30
                });
            }
        }
    }
    
    /**
     * Универсальный метод для обновления способностей яйца
     * @param {string} abilityType - Тип способности ('aura')
     * @param {number} level - Уровень способности
     * @param {string} effectType - Тип визуального эффекта
     * @param {number} color - Цвет эффекта
     * @param {number} damage - Урон способности
     */
    updateAbility(abilityType, level, effectType, color, damage) {
        if (level > 0) {
            this.startAbility(abilityType, effectType, color, damage);
        } else {
            this.stopAbility(abilityType);
        }
    }
    
    /**
     * Запускает способность яйца
     * @param {string} abilityType - Тип способности
     * @param {string} effectType - Тип визуального эффекта
     * @param {number} color - Цвет эффекта
     * @param {number} damage - Урон способности
     */
    startAbility(abilityType, effectType, color, damage) {
        const effectKey = `${abilityType}Effect`;
        const timerKey = `${abilityType}Timer`;
        
        if (this[effectKey]) return; // Уже активна
        
        // Создаем визуальный эффект
        if (this.scene.effectSystem) {
            this[effectKey] = this.scene.effectSystem.applyEffect(effectType, this, 1, {
                radius: this.radius,
                color: color
            });
        }
        
        // Запускаем таймер урона (только для пассивных способностей)
        if (abilityType === 'aura') {
            this[timerKey] = this.scene.time.addEvent({
                delay: this.cooldown,
                callback: () => this.dealAbilityDamage(abilityType, damage),
                callbackScope: this,
                loop: true
            });
        }
    }
    
    /**
     * Останавливает способность яйца
     * @param {string} abilityType - Тип способности
     */
    stopAbility(abilityType) {
        const effectKey = `${abilityType}Effect`;
        const timerKey = `${abilityType}Timer`;
        
        if (this[effectKey]) {
            this.scene.effectSystem.stopEffect(this, `${abilityType}Glow`);
            this[effectKey] = null;
        }
        
        if (this[`${abilityType}Glow`]) {
            // Очищаем твины перед уничтожением
            if (this[`${abilityType}Glow`]._explosionReadyTween) {
                this[`${abilityType}Glow`]._explosionReadyTween.stop();
            }
            if (this[`${abilityType}Glow`]._standardTween) {
                this[`${abilityType}Glow`]._standardTween.stop();
            }
            
            this[`${abilityType}Glow`].destroy();
            this[`${abilityType}Glow`] = null;
        }
        
        if (this[timerKey]) {
            this[timerKey].destroy();
            this[timerKey] = null;
        }
    }
    
    /**
     * Наносит урон способности
     * @param {string} abilityType - Тип способности
     * @param {number} damage - Урон
     */
    dealAbilityDamage(abilityType, damage) {
        if (!this.scene.waveSystem || !this.scene.waveSystem.enemies) return;
        
        this.damageInRadius(
            damage,
            this.radius,
            this.scene.waveSystem.enemies,
            (enemy) => enemy && enemy.isAlive,
            abilityType
        );
    }
    
    /**
     * Активирует взрыв яйца (вызывается по тапу)
     * @returns {boolean} Успешность активации
     */
    activateEggExplosion() {
        if (this.eggExplosion <= 0) return false;
        
        const currentTime = this.scene.time.now;
        if (!this.isEggExplosionReady(currentTime)) {
            return false;
        }
        
        // Сбрасываем кулдаун (используем специальный кулдаун взрыва)
        this.setLastActionTime(currentTime);
        
        // Наносим урон взрыва с увеличенным радиусом
        this.damageInRadius(
            this.eggExplosionDamage,
            this.eggExplosionRadius,
            this.scene.waveSystem.enemies, 
            (enemy) => enemy && enemy.isAlive,
            'explosion'
        );
        
        // Создаем визуальный эффект взрыва с увеличенным радиусом
        if (this.scene.effectSystem) {
            this.scene.effectSystem.applyEffect('blast', this, 1, {
                radius: this.eggExplosionRadius,
                color: 0xff6600
            });
        }
        
        return true;
    }
    
    /**
     * Проверяет готовность взрыва яйца (использует специальный кулдаун)
     * @param {number} currentTime - Текущее время
     * @returns {boolean} true если взрыв готов
     */
    isEggExplosionReady(currentTime) {
        const explosionCooldown = this.eggExplosionCooldown;
        if (explosionCooldown <= 0) return true;
        return (currentTime - this._lastActionTime) >= explosionCooldown;
    }
    
    
    /**
     * Обновление яйца - синхронизация позиции ауры и обновление визуализации
     */
    update(time, delta) {
        super.update(time, delta);
        
        // Синхронизируем позицию ауры с яйцом
        if (this.auraGlow) {
            this.auraGlow.x = this.x;
            this.auraGlow.y = this.y;
        }
        
    }
    
    // Методы движения и атаки не нужны - яйцо статично

    /**
     * Статический метод для создания яйца с полной настройкой
     * Создает яйцо, настраивает графику и создает HealthBar
     */
    static CreateEgg(scene, x, y, options = {}, abilitySystem = null) {
        // Настройки по умолчанию для яйца
        const defaultOptions = {

            ...options
        };

        // Создаем яйцо
        const egg = new Egg(scene, {
            x: x,
            y: y,
            texture: defaultOptions.texture,
            spriteKey: defaultOptions.spriteKey, // Передаем spriteKey
            health: defaultOptions.health,
            damage: defaultOptions.damage || 10, // Базовый урон (fallback)
            speed: 0,
            cooldown: defaultOptions.cooldown || 10000, // Базовый кулдаун (fallback)
            attackRange: defaultOptions.attackRange || 60, // Базовый радиус (fallback)
            size: defaultOptions.size || 2
        }, abilitySystem);

        // Настраиваем размер яйца
        // Масштабируем по фактическому размеру спрайта яйца (используя исходный размер текстуры)
        if (egg.texture && egg.texture.getSourceImage && PHYSICS_CONSTANTS.DEFAULT_TEXTURE_SIZE) {
            // Если у спрайта уже задана ширина, сохраняем текущий scale, иначе приводим к 1:1 по текстуре
            egg.setScale(1);
        }
        
        // Устанавливаем глубину отрисовки
        egg.setDepth(DEPTH_CONSTANTS.EGG);
        
        // Отладочный вывод для проверки глубины (временно отключен)
        // console.log(`🥚 [Egg] Создано с глубиной: ${egg.depth}, DEPTH_CONSTANTS.EGG: ${DEPTH_CONSTANTS.EGG}`);

        // Создаем полосу здоровья (фиксированная позиция внизу экрана как у игрока)
        const healthBarWidth = scene.cameras.main.width * 0.55;
        console.log(`🥚 [Egg] Создание шкалы здоровья яйца: ширина=${healthBarWidth}, камера=${scene.cameras.main.width}x${scene.cameras.main.height}`);
        
        egg.createHealthBar({
            showDigits: true, 
            showWhenFull: true,
            showWhenEmpty: true,
            showBar: true,
            fixed: true, // Фиксированная позиция на экране
            fixedX: 0.5, // Центр экрана по горизонтали (50%)
            fixedY: 0.96, // 96% от высоты экрана (почти внизу, но с отступом)
            barWidth: healthBarWidth, // 55% от ширины экрана
            barHeight: 20, // Высокая полоса для лучшей видимости
            colors: {
                background: COLORS.BLACK,
                health: COLORS.HEALTH_GREEN,
                border: COLORS.WHITE
            }
        });


        return egg;
    }
    
    /**
     * Лечит яйцо на указанное количество HP
     */
    heal(amount) {
        if (!this.isAlive) {
            return false;
        }
        
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        const actualHeal = this.health - oldHealth;
        
        return actualHeal > 0;
    }
    
    /**
     * Увеличивает максимальное здоровье яйца (прокачка EGG_HEALTH)
     */
    increaseMaxHealth() {
        if (!this.abilitySystem) {
            return false;
        }
        
        const oldMaxHealth = this.maxHealth;
        const wasFullHealth = (this.health === oldMaxHealth);
        
        // Прокачиваем способность EGG_HEALTH
        const upgraded = this.abilitySystem.upgradeAbility('EGG_HEALTH');
        
        if (upgraded) {
            const newMaxHealth = this.maxHealth;
            console.log(`❤️ [Egg] Максимальное здоровье увеличено: ${oldMaxHealth} → ${newMaxHealth}`);
            
            // Сердце всегда полностью восстанавливает здоровье яйца
            const oldHealth = this.health;
            this.health = newMaxHealth;
            console.log(`💚 [Egg] Здоровье полностью восстановлено: ${oldHealth} → ${newMaxHealth}`);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Переопределяем уничтожение для очистки ресурсов
     */
    destroy() {
        // Отписываемся от событий способностей
        if (this.scene && this.scene.events) {
            this.scene.events.off('ability:upgraded', this.onAbilityUpgraded, this);
        }
        
        // Останавливаем все способности
        this.stopAbility('aura');
        this.stopRecovery();
        
        // Очищаем ссылку на систему способностей
        this.abilitySystem = null;
        
        super.destroy();
    }
}
