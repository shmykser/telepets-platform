import { GeometryUtils } from '../utils/GeometryUtils.js';
import { DEPTH_CONSTANTS } from '../settings/GameSettings.js';

/**
 * Система эффектов для врагов
 * Управляет визуальными эффектами, следами, частицами и другими визуальными элементами
 */
export class EnemyEffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = new Map(); // Карта активных эффектов по ID врага
        this.effectGroups = new Map(); // Группы эффектов для оптимизации
        this.maxEffectsPerEnemy = 10; // Максимум эффектов на врага
        this.cleanupInterval = 5000; // Интервал очистки в мс
        this.lastCleanupTime = 0;
        
        // Настройка групп эффектов
        this.setupEffectGroups();
        
        // Запуск периодической очистки
        this.startCleanupTimer();
    }
    
    /**
     * Настройка групп эффектов для оптимизации
     */
    setupEffectGroups() {
        if (!this.scene || !this.scene.add) {
            console.error('❌ [EnemyEffectSystem] Сцена не инициализирована для создания групп эффектов');
            return;
        }

        try {
            // Группа для следов слизи
            this.slimeTrailGroup = this.scene.add.group();
            this.effectGroups.set('slimeTrail', this.slimeTrailGroup);
            
            // Группа для частиц взрыва
            this.explosionGroup = this.scene.add.group();
            this.effectGroups.set('explosion', this.explosionGroup);
            
            // Группа для эффектов телепортации
            this.teleportGroup = this.scene.add.group();
            this.effectGroups.set('teleport', this.teleportGroup);
            
            // Группа для эффектов прозрачности
            this.stealthGroup = this.scene.add.group();
            this.effectGroups.set('stealth', this.stealthGroup);
            
            console.log('✅ [EnemyEffectSystem] Группы эффектов инициализированы');
        } catch (error) {
            console.error('❌ [EnemyEffectSystem] Ошибка инициализации групп эффектов:', error);
        }
    }
    
    /**
     * Обеспечение существования группы взрывов
     */
    ensureExplosionGroup() {
        if (!this.explosionGroup && this.scene && this.scene.add) {
            this.explosionGroup = this.scene.add.group();
            this.effectGroups.set('explosion', this.explosionGroup);
            console.log('✅ [EnemyEffectSystem] Группа explosionGroup создана заново');
        }
    }

    /**
     * Запуск таймера очистки
     */
    startCleanupTimer() {
        if (!this.scene || !this.scene.time) {
            console.warn('⚠️ [EnemyEffectSystem] Сцена не готова для запуска таймера очистки');
            return;
        }

        this.cleanupTimer = this.scene.time.addEvent({
            delay: this.cleanupInterval,
            callback: this.cleanupOldEffects.bind(this),
            loop: true
        });
    }
    
    /**
     * Применение эффекта к врагу
     * @param {string} effectType - Тип эффекта
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры эффекта
     */
    applyEffect(effectType, enemy, params = {}) {
        if (!enemy || !enemy.id) return;
        
        const enemyId = enemy.id;
        
        // Проверяем лимит эффектов на врага
        if (this.activeEffects.has(enemyId)) {
            const effects = this.activeEffects.get(enemyId);
            if (effects.length >= this.maxEffectsPerEnemy) {
                this.removeOldestEffect(enemyId);
            }
        } else {
            this.activeEffects.set(enemyId, []);
        }
        
        // Применяем эффект в зависимости от типа
        let effect = null;
        
        switch (effectType) {
            case 'slimeTrail':
                effect = this.createSlimeTrail(enemy, params);
                break;
            case 'teleport':
                effect = this.createTeleportEffect(enemy, params);
                break;
            case 'stealth':
                effect = this.createStealthEffect(enemy, params);
                break;
            case 'explosion':
                effect = this.createExplosionEffect(enemy, params);
                break;
            case 'damage':
                effect = this.createDamageEffect(enemy, params);
                break;
            case 'heal':
                effect = this.createHealEffect(enemy, params);
                break;
            case 'spawn_aura':
                effect = this.createSpawnAuraEffect(enemy, params);
                break;
            case 'spawn_burst':
                effect = this.createSpawnBurstEffect(enemy, params);
                break;
            case 'digging':
                effect = this.createDiggingEffect(enemy, params);
                break;
            case 'underground':
                effect = this.createUndergroundEffect(enemy, params);
                break;
            case 'emergence':
                effect = this.createEmergenceEffect(enemy, params);
                break;
            case 'emergence_burst':
                effect = this.createEmergenceBurstEffect(enemy, params);
                break;
            default:
                console.warn(`[EnemyEffectSystem] Неизвестный тип эффекта: ${effectType}`);
                return null;
        }
        
        if (effect) {
            // Добавляем эффект в список активных
            this.activeEffects.get(enemyId).push({
                effect: effect,
                type: effectType,
                startTime: this.scene.time.now,
                params: params
            });
            
            // Эмитим событие создания эффекта
            this.scene.events.emit('enemy:effect:created', {
                enemy: enemy,
                effectType: effectType,
                effect: effect,
                params: params
            });
        }
        
        return effect;
    }
    
    /**
     * Создание следа слизи
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры
     */
    createSlimeTrail(enemy, params = {}) {
        const {
            color = 0x00ff88,
            size = 3,
            alpha = 0.6,
            lifetime = 5000
        } = params;
        
        const drop = this.scene.add.circle(
            enemy.x,
            enemy.y,
            size,
            color,
            alpha
        );
        
        // Добавляем физику
        this.scene.physics.add.existing(drop);
        drop.body.setImmovable(true);
        drop.body.setSize(size * 2, size * 2);
        
        // Настройки
        drop.setDepth(DEPTH_CONSTANTS.PROJECTILE);
        drop.creationTime = this.scene.time.now;
        drop.lifetime = lifetime;
        
        // Добавляем в группу
        this.slimeTrailGroup.add(drop);
        
        // Автоудаление
        this.scene.time.delayedCall(lifetime, () => {
            if (drop && drop.destroy) {
                drop.destroy();
            }
        });
        
        return drop;
    }
    
    /**
     * Создание эффекта телепортации
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры
     */
    createTeleportEffect(enemy, params = {}) {
        const {
            color = 0x8888ff,
            size = 20,
            duration = 500
        } = params;
        
        // Создаем кольцо телепортации
        const ring = this.scene.add.circle(
            enemy.x,
            enemy.y,
            size,
            color,
            0.8
        );
        
        // Добавляем анимацию
        this.scene.tweens.add({
            targets: ring,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                if (ring && ring.destroy) {
                    ring.destroy();
                }
            }
        });
        
        ring.setDepth(DEPTH_CONSTANTS.UI_ELEMENTS);
        this.teleportGroup.add(ring);
        
        return ring;
    }
    
    /**
     * Создание эффекта скрытности
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры
     */
    createStealthEffect(enemy, params = {}) {
        const {
            alpha = 0.05,
            duration = 2000
        } = params;
        
        // Создаем ореол скрытности
        const aura = this.scene.add.circle(
            enemy.x,
            enemy.y,
            enemy.width * 0.8,
            0x00ffff,
            alpha * 0.5
        );
        
        // Добавляем пульсирующую анимацию
        this.scene.tweens.add({
            targets: aura,
            alpha: alpha * 0.8,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        aura.setDepth(enemy.depth - 1);
        this.stealthGroup.add(aura);
        
        // Автоудаление
        this.scene.time.delayedCall(duration, () => {
            if (aura && aura.destroy) {
                aura.destroy();
            }
        });
        
        return aura;
    }
    
    /**
     * Создание эффекта взрыва
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры
     */
    createExplosionEffect(enemy, params = {}) {
        const {
            color = 0xff4444,
            size = 30,
            duration = 800,
            particleCount = 8
        } = params;
        
        // Создаем частицы взрыва
        for (let i = 0; i < particleCount; i++) {
            const angle = (360 / particleCount) * i;
            const particle = this.scene.add.circle(
                enemy.x,
                enemy.y,
                size / 4,
                color,
                0.8
            );
            
            // Вычисляем направление частицы
            const distance = size * 2;
            const targetX = enemy.x + Math.cos(angle * Math.PI / 180) * distance;
            const targetY = enemy.y + Math.sin(angle * Math.PI / 180) * distance;
            
            // Анимация частицы
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.destroy) {
                        particle.destroy();
                    }
                }
            });
            
            particle.setDepth(DEPTH_CONSTANTS.UI_ELEMENTS);
            
            // Проверяем, что группа существует перед добавлением
            if (this.explosionGroup && this.explosionGroup.add) {
                this.explosionGroup.add(particle);
            } else {
                console.warn('⚠️ [EnemyEffectSystem] Группа explosionGroup не инициализирована, создаем заново');
                this.ensureExplosionGroup();
                if (this.explosionGroup && this.explosionGroup.add) {
                    this.explosionGroup.add(particle);
                }
            }
        }
        
        return true; // Возвращаем true для множественных частиц
    }
    
    /**
     * Создание эффекта урона
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры
     */
    createDamageEffect(enemy, params = {}) {
        const {
            damage = 0,
            color = 0xff0000,
            duration = 1000
        } = params;
        
        // Создаем текст урона
        const damageText = this.scene.add.text(
            enemy.x,
            enemy.y - enemy.height / 2,
            `-${damage}`,
            {
                fontSize: '16px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        // Анимация текста урона
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                if (damageText && damageText.destroy) {
                    damageText.destroy();
                }
            }
        });
        
        damageText.setDepth(DEPTH_CONSTANTS.UI_ELEMENTS);
        return damageText;
    }
    
    /**
     * Создание эффекта лечения
     * @param {Object} enemy - Враг
     * @param {Object} params - Параметры
     */
    createHealEffect(enemy, params = {}) {
        const {
            heal = 0,
            color = 0x00ff00,
            duration = 1000
        } = params;
        
        // Создаем текст лечения
        const healText = this.scene.add.text(
            enemy.x,
            enemy.y - enemy.height / 2,
            `+${heal}`,
            {
                fontSize: '16px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        // Анимация текста лечения
        this.scene.tweens.add({
            targets: healText,
            y: healText.y - 50,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                if (healText && healText.destroy) {
                    healText.destroy();
                }
            }
        });
        
        healText.setDepth(DEPTH_CONSTANTS.UI_ELEMENTS);
        return healText;
    }
    
    /**
     * Удаление самого старого эффекта для врага
     * @param {string} enemyId - ID врага
     */
    removeOldestEffect(enemyId) {
        if (!this.activeEffects.has(enemyId)) return;
        
        const effects = this.activeEffects.get(enemyId);
        if (effects.length === 0) return;
        
        const oldestEffect = effects.shift();
        if (oldestEffect && oldestEffect.effect && oldestEffect.effect.destroy) {
            oldestEffect.effect.destroy();
        }
    }
    
    /**
     * Удаление всех эффектов врага
     * @param {string} enemyId - ID врага
     */
    removeEnemyEffects(enemyId) {
        if (!this.activeEffects.has(enemyId)) return;
        
        const effects = this.activeEffects.get(enemyId);
        effects.forEach(effectData => {
            if (effectData.effect && effectData.effect.destroy) {
                effectData.effect.destroy();
            }
        });
        
        this.activeEffects.delete(enemyId);
    }
    
    /**
     * Очистка старых эффектов
     */
    cleanupOldEffects() {
        const currentTime = this.scene.time.now;
        
        this.activeEffects.forEach((effects, enemyId) => {
            // Удаляем старые эффекты
            const validEffects = effects.filter(effectData => {
                const age = currentTime - effectData.startTime;
                const maxAge = effectData.params.lifetime || 10000;
                
                if (age > maxAge) {
                    if (effectData.effect && effectData.effect.destroy) {
                        effectData.effect.destroy();
                    }
                    return false;
                }
                return true;
            });
            
            if (validEffects.length === 0) {
                this.activeEffects.delete(enemyId);
            } else {
                this.activeEffects.set(enemyId, validEffects);
            }
        });
        
        this.lastCleanupTime = currentTime;
    }
    
    /**
     * Получение статистики эффектов
     * @returns {Object} Статистика
     */
    getStats() {
        let totalEffects = 0;
        const effectsByType = {};
        
        this.activeEffects.forEach((effects, enemyId) => {
            totalEffects += effects.length;
            effects.forEach(effectData => {
                const type = effectData.type;
                effectsByType[type] = (effectsByType[type] || 0) + 1;
            });
        });
        
        return {
            totalEffects: totalEffects,
            activeEnemies: this.activeEffects.size,
            effectsByType: effectsByType,
            lastCleanupTime: this.lastCleanupTime
        };
    }
    
    /**
     * Уничтожение системы эффектов
     */
    destroy() {
        // Останавливаем таймер очистки
        if (this.cleanupTimer) {
            this.cleanupTimer.destroy();
        }
        
        // Очищаем все эффекты
        this.activeEffects.forEach((effects, enemyId) => {
            effects.forEach(effectData => {
                if (effectData.effect && effectData.effect.destroy) {
                    effectData.effect.destroy();
                }
            });
        });
        
        this.activeEffects.clear();
        
        // Очищаем группы
        this.effectGroups.forEach(group => {
            if (group && group.destroy) {
                group.destroy();
            }
        });
        
        this.effectGroups.clear();
    }

    /**
     * Создание эффекта ауры спавна
     */
    createSpawnAuraEffect(enemy, params) {
        const { color = 0x8B0000, size = 80, duration = 2000 } = params;
        
        // Создаем кольцо вокруг врага
        const aura = this.scene.add.circle(enemy.x, enemy.y, size, color, 0.3);
        aura.setStrokeStyle(3, color, 0.8);
        aura.setDepth(enemy.depth - 1);
        
        // Анимация пульсации
        this.scene.tweens.add({
            targets: aura,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.1,
            duration: duration / 2,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                if (aura && aura.destroy) {
                    aura.destroy();
                }
            }
        });
        
        return aura;
    }

    /**
     * Создание эффекта всплеска спавна
     */
    createSpawnBurstEffect(enemy, params) {
        const { color = 0xFF4500, particleCount = 8, speed = 200 } = params;
        
        // Создаем частицы вокруг точки спавна
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particle = this.scene.add.circle(
                enemy.x, enemy.y, 3, color, 0.8
            );
            particle.setDepth(enemy.depth + 1);
            
            // Анимация разлета частиц
            this.scene.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * speed,
                y: enemy.y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.destroy) {
                        particle.destroy();
                    }
                }
            });
        }
        
        return null; // Возвращаем null, так как частицы управляются самостоятельно
    }

    /**
     * Создание эффекта копания
     */
    createDiggingEffect(enemy, params) {
        const { color = 0x8B4513, particleCount = 6, duration = 1000 } = params;
        
        // Создаем частицы земли
        for (let i = 0; i < particleCount; i++) {
            const particle = this.scene.add.circle(
                enemy.x + Phaser.Math.Between(-10, 10),
                enemy.y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(2, 4),
                color,
                0.7
            );
            particle.setDepth(enemy.depth + 1);
            
            // Анимация падения частиц
            this.scene.tweens.add({
                targets: particle,
                y: enemy.y + Phaser.Math.Between(20, 40),
                alpha: 0,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.destroy) {
                        particle.destroy();
                    }
                }
            });
        }
        
        return null;
    }

    /**
     * Создание эффекта подземного нахождения
     */
    createUndergroundEffect(enemy, params) {
        const { alpha = 0.1, color = 0x654321 } = params;
        
        // Создаем затемнение врага
        const overlay = this.scene.add.circle(enemy.x, enemy.y, enemy.width / 2, color, alpha);
        overlay.setDepth(enemy.depth + 1);
        
        // Следуем за врагом
        const followTween = this.scene.tweens.add({
            targets: overlay,
            x: enemy.x,
            y: enemy.y,
            duration: 100,
            repeat: -1,
            ease: 'Linear'
        });
        
        return {
            destroy: () => {
                if (overlay && overlay.destroy) {
                    overlay.destroy();
                }
                if (followTween) {
                    followTween.destroy();
                }
            }
        };
    }

    /**
     * Создание эффекта появления из норы
     */
    createEmergenceEffect(enemy, params) {
        const { color = 0x654321, duration = 1200, intensity = 0.8 } = params;
        
        // Создаем эффект поднятия земли
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = Phaser.Math.Between(15, 25);
            
            const particle = this.scene.add.circle(
                enemy.x + Math.cos(angle) * distance,
                enemy.y + Math.sin(angle) * distance,
                Phaser.Math.Between(3, 6),
                color,
                0.6
            );
            particle.setDepth(enemy.depth + 1);
            
            // Анимация поднятия частиц
            this.scene.tweens.add({
                targets: particle,
                y: enemy.y - Phaser.Math.Between(10, 20),
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.destroy) {
                        particle.destroy();
                    }
                }
            });
        }
        
        return null;
    }

    /**
     * Создание эффекта взрыва при появлении
     */
    createEmergenceBurstEffect(enemy, params) {
        const { color = 0x654321, particleCount = 12, size = 25 } = params;
        
        // Создаем взрыв частиц при появлении
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * size;
            
            const particle = this.scene.add.circle(
                enemy.x + Math.cos(angle) * distance,
                enemy.y + Math.sin(angle) * distance,
                Phaser.Math.Between(2, 5),
                color,
                0.8
            );
            particle.setDepth(enemy.depth + 1);
            
            // Анимация разлета частиц
            this.scene.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * (distance + Phaser.Math.Between(20, 40)),
                y: enemy.y + Math.sin(angle) * (distance + Phaser.Math.Between(20, 40)),
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.destroy) {
                        particle.destroy();
                    }
                }
            });
        }
        
        return null;
    }
}
