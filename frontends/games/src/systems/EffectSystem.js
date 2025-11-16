import { GeometryUtils } from '../utils/GeometryUtils.js';

/**
 * Централизованная система эффектов и анимаций
 * Предоставляет унифицированный интерфейс для создания и применения эффектов
 * Использует шаблон для унифицированного применения эффектов
 */
export class EffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = new Map(); // Отслеживание активных эффектов
    }

    /**
     * Основная функция применения эффектов по шаблону
     * @param {string} effectType - Тип эффекта
     * @param {Phaser.GameObjects.GameObject} target - Целевой объект
     * @param {number} intensity - Сила эффекта (0-1)
     * @param {Object} customParams - Дополнительные параметры
     * @returns {Phaser.Tweens.Tween|Array} Созданная анимация или массив анимаций
     */
    applyEffect(effectType, target, intensity = 1, customParams = {}) {
        // Нормализуем интенсивность
        const normalizedIntensity = Math.max(0, Math.min(1, intensity));
        
        // Получаем конфигурацию эффекта
        const effectConfig = this.getEffectConfig(effectType, normalizedIntensity, customParams);
        
        if (!effectConfig) {
            console.warn(`Effect "${effectType}" not found`);
            return null;
        }

        // Применяем эффект
        const result = this.executeEffect(effectType, target, effectConfig);
        
        // Сохраняем активный эффект для отслеживания
        if (result) {
            this.trackEffect(target, effectType, result);
        }

        return result;
    }

    /**
     * Получает конфигурацию эффекта с учетом интенсивности
     */
    getEffectConfig(effectType, intensity, customParams) {
        // Сначала получаем базовую конфигурацию без применения intensity
        const baseConfigs = {
            // БАЗОВЫЕ АНИМАЦИИ
            shake: {
                baseIntensity: 5,
                duration: 200,
                repeat: 3,
                yoyo: true,
                ease: 'Power2.easeInOut'
            },
            flash: {
                baseScale: 0.2,
                duration: 400,
                yoyo: true,
                ease: 'Power2.easeOut'
            },
            pulse: {
                baseScale: 0.2,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            },
            rotation: {
                angle: 360,
                duration: 4000,
                repeat: -1,
                ease: 'Linear'
            },
            fadeIn: {
                alpha: { to: 1 },
                duration: 1000,
                ease: 'Power2.easeOut'
            },
            fadeOut: {
                alpha: { to: 0 },
                duration: 1000,
                ease: 'Power2.easeIn'
            },
            scale: {
                baseScale: 0.5,
                duration: 600,
                yoyo: true,
                ease: 'Back.easeOut'
            },
            move: {
                baseOffset: 50,
                duration: 2000,
                ease: 'Power2.easeInOut'
            },

            // БОЕВЫЕ ЭФФЕКТЫ
            damage: {
                tint: 0xff0000,
                duration: 400,
                yoyo: true,
                ease: 'Power2.easeInOut'
            },
            explosion: {
                baseScale: 0.5,
                alpha: { to: 0 },
                duration: 600,
                ease: 'Power2.easeOut'
            },
            flicker: {
                alpha: { to: 0.3 },
                duration: 200,
                yoyo: true,
                repeat: 3,
                ease: 'Power2.easeInOut'
            },
            glow: {
                baseScale: 0.1,
                duration: 400,
                yoyo: true,
                ease: 'Power2.easeInOut'
            },
            wave: {
                baseOffset: 100,
                duration: 2000,
                ease: 'Power2.easeInOut'
            },

            // ЭФФЕКТЫ ДВИЖЕНИЯ
            burstMovement: {
                baseIntensity: 2.5,
                duration: 300
            },
            chaosMovement: {
                baseIntensity: 2.0,
                duration: 2000
            },
            launchEffect: {
                baseScale: 0.3,
                duration: 1000,
                ease: 'Power2.easeOut',
                alpha: { from: 0, to: 1 }
            },

            // ЧАСТИЦЫ И УСИЛЕНИЯ
            particles: {
                baseScale: 0.2,
                baseSpeed: 35,
                lifespan: 2000,
                baseQuantity: 2,
                frequency: 500,
                alpha: { start: 1, end: 0 },
                emitZone: { radius: 30, baseQuantity: 3 },
                tint: 0xffffff
            },

            // ВЗРЫВЫ
            blast: {
                baseRadius: 100,
                duration: 800,
                color: 0xff6600,
                thickness: 3,
                alpha: 0.8
            },

            // АУРА
            auraGlow: {
                baseRadius: 60,
                color: 0x00ff00,
                thickness: 2,
                alpha: 0.3,
                duration: 1000,
                yoyo: true,
                repeat: -1
            },

            // ЭКРАННЫЕ ЭФФЕКТЫ
            screenFlash: {
                color: 0xffffff,
                duration: 500,
                alpha: 0.3,
                baseScale: 1.0
            }
        };

        // Объединяем базовую конфигурацию с пользовательскими параметрами
        const baseConfig = baseConfigs[effectType];
        if (!baseConfig) return null;

        // Создаем финальную конфигурацию
        const finalConfig = { ...baseConfig, ...customParams };
        
        // Применяем intensity к соответствующим параметрам
        this.applyIntensity(finalConfig, intensity);
        
        return finalConfig;
    }

    /**
     * Применяет интенсивность к параметрам эффекта
     */
    applyIntensity(config, intensity) {
        // Применяем intensity к различным типам параметров
        if (config.baseIntensity !== undefined) {
            config.intensity = config.baseIntensity * intensity;
        }
        
        if (config.baseScale !== undefined) {
            config.scale = { to: 1 + (config.baseScale * intensity) };
        }
        
        if (config.baseOffset !== undefined) {
            config.offsetX = config.baseOffset * intensity;
            config.offsetY = config.baseOffset * intensity;
        }
        
        if (config.baseSpeed !== undefined) {
            config.speed = {
                min: config.baseSpeed * intensity * 0.5,
                max: config.baseSpeed * intensity * 1.5
            };
        }
        
        if (config.baseQuantity !== undefined) {
            config.quantity = Math.floor(config.baseQuantity * intensity);
        }
        
        // Применяем intensity к duration (обратная зависимость)
        if (config.duration && !config.customDuration) {
            config.duration = config.duration * (2 - intensity);
        }
        
        // Применяем intensity к repeat
        if (config.repeat && config.repeat > 0 && !config.customRepeat) {
            config.repeat = Math.max(1, Math.floor(config.repeat * intensity));
        }
        
        // Очищаем базовые параметры
        delete config.baseIntensity;
        delete config.baseScale;
        delete config.baseOffset;
        delete config.baseSpeed;
        delete config.baseQuantity;
    }

    /**
     * Выполняет конкретный эффект
     */
    executeEffect(effectType, target, config) {
        switch (effectType) {
            // Базовые анимации
            case 'shake':
                return this.createShakeEffect(target, config);
            case 'flash':
                return this.createFlashEffect(target, config);
            case 'pulse':
                return this.createPulseEffect(target, config);
            case 'rotation':
                return this.createRotationEffect(target, config);
            case 'fadeIn':
                return this.createFadeInEffect(target, config);
            case 'fadeOut':
                return this.createFadeOutEffect(target, config);
            case 'scale':
                return this.createScaleEffect(target, config);
            case 'move':
                return this.createMoveEffect(target, config);

            // Боевые эффекты
            case 'damage':
                return this.createDamageEffect(target, config);
            case 'explosion':
                return this.createExplosionEffect(target, config);
            case 'flicker':
                return this.createFlickerEffect(target, config);
            case 'glow':
                return this.createGlowEffect(target, config);
            case 'wave':
                return this.createWaveEffect(target, config);

            // Эффекты движения
            case 'burstMovement':
            case 'chaosMovement':
                return this.createMovementEffect(target, effectType, config);


            // Частицы
            case 'particles':
                return this.createParticles(target, config);

            // Взрыв
            case 'blast':
                return this.createBlastEffect(target, config);

            // Аура
            case 'auraGlow':
                return this.createAuraGlowEffect(target, config);

            // Эффект вылета
            case 'launchEffect':
                return this.createLaunchEffect(target, config);

            // Экранные эффекты
            case 'screenFlash':
                return this.createScreenFlashEffect(target, config);

            default:
                console.warn(`Unknown effect type: ${effectType}`);
                return null;
        }
    }

    // ==================== РЕАЛИЗАЦИИ ЭФФЕКТОВ ====================

    createShakeEffect(target, config) {
        const intensity = config.intensity || 5;
        const duration = config.duration || 200;
        const repeat = config.repeat || 3;
        const yoyo = config.yoyo !== undefined ? config.yoyo : true;
        const ease = config.ease || 'Power2.easeInOut';
        
        // Определяем направление тряски
        const direction = config.direction || 'horizontal'; // 'horizontal', 'vertical', 'both'
        
        // Сохраняем исходные координаты
        const originalX = target.x;
        const originalY = target.y;
        
        // Создаем временный объект для анимации смещений
        const shakeData = { 
            offsetX: 0, 
            offsetY: 0
        };
        
        let tweenConfig = {
            targets: shakeData,
            duration: duration,
            repeat: repeat,
            yoyo: yoyo,
            ease: ease
        };
        
        // Добавляем анимацию в зависимости от направления
        switch (direction) {
            case 'horizontal':
                tweenConfig.offsetX = intensity;
                break;
            case 'vertical':
                tweenConfig.offsetY = intensity;
                break;
            case 'both':
                // Для диагонального движения используем два твина
                const tween1 = this.scene.tweens.add({
                    targets: shakeData,
                    offsetX: intensity,
                    duration: duration,
                    repeat: repeat,
                    yoyo: yoyo,
                    ease: ease
                });
                
                const tween2 = this.scene.tweens.add({
                    targets: shakeData,
                    offsetY: intensity,
                    duration: duration,
                    repeat: repeat,
                    yoyo: yoyo,
                    ease: ease
                });
                
                // Обновляем позицию объекта в реальном времени с учетом поворота
                const updateTween = this.scene.tweens.add({
                    targets: shakeData,
                    duration: 0,
                    onUpdate: () => {
                        // Применяем смещение с учетом текущего поворота объекта
                        const angleRad = Phaser.Math.DegToRad(target.angle);
                        const cos = Math.cos(angleRad);
                        const sin = Math.sin(angleRad);
                        
                        // Преобразуем локальные смещения в глобальные с учетом поворота
                        const globalOffsetX = shakeData.offsetX * cos - shakeData.offsetY * sin;
                        const globalOffsetY = shakeData.offsetX * sin + shakeData.offsetY * cos;
                        
                        // Устанавливаем позицию относительно исходной позиции + повернутое смещение
                        target.x = originalX + globalOffsetX;
                        target.y = originalY + globalOffsetY;
                    }
                });
                
                return [tween1, tween2, updateTween]; // Возвращаем массив твинов
            default:
                tweenConfig.offsetX = intensity;
        }
        
        // Обновляем позицию объекта в реальном времени с учетом поворота
        tweenConfig.onUpdate = () => {
            // Применяем смещение с учетом текущего поворота объекта
            const angleRad = Phaser.Math.DegToRad(target.angle);
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            
            // Преобразуем локальные смещения в глобальные с учетом поворота
            const globalOffsetX = shakeData.offsetX * cos - shakeData.offsetY * sin;
            const globalOffsetY = shakeData.offsetX * sin + shakeData.offsetY * cos;
            
            // Устанавливаем позицию относительно исходной позиции + повернутое смещение
            target.x = originalX + globalOffsetX;
            target.y = originalY + globalOffsetY;
        };
        
        return this.scene.tweens.add(tweenConfig);
    }

    createFlashEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            scaleX: config.scale?.to || 1.2,
            scaleY: config.scale?.to || 1.2,
            duration: config.duration || 400,
            yoyo: config.yoyo !== undefined ? config.yoyo : true,
            ease: config.ease || 'Power2.easeOut'
        });
    }

    createPulseEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            scaleX: config.scale?.to || 1.2,
            scaleY: config.scale?.to || 1.2,
            duration: config.duration || 1000,
            yoyo: config.yoyo !== undefined ? config.yoyo : true,
            repeat: config.repeat !== undefined ? config.repeat : -1,
            ease: config.ease || 'Sine.easeInOut'
        });
    }

    createRotationEffect(target, config) {
        // Сохраняем исходный угол
        const originalAngle = target.angle;
        
        return this.scene.tweens.add({
            targets: target,
            angle: originalAngle + (config.angle || 360),
            duration: config.duration || 1000,
            repeat: config.repeat !== undefined ? config.repeat : 0,
            ease: config.ease || 'Power2.easeInOut'
        });
    }

    createFadeInEffect(target, config) {
        // Автоматически устанавливаем начальное состояние для fadeIn
        target.setAlpha(0);
        
        return this.scene.tweens.add({
            targets: target,
            alpha: config.alpha?.to || 1,
            duration: config.duration || 1000,
            ease: config.ease || 'Power2.easeOut'
        });
    }

    createFadeOutEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            alpha: config.alpha?.to || 0,
            duration: config.duration || 1000,
            ease: config.ease || 'Power2.easeIn'
        });
    }

    createScaleEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            scaleX: config.scale?.to || 1.5,
            scaleY: config.scale?.to || 1.5,
            duration: config.duration || 600,
            yoyo: config.yoyo !== undefined ? config.yoyo : true,
            ease: config.ease || 'Back.easeOut'
        });
    }

    createMoveEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            x: target.x + (config.offsetX || 50),
            y: target.y + (config.offsetY || 50),
            duration: config.duration || 2000,
            ease: config.ease || 'Power2.easeInOut'
        });
    }


    createDamageEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            tint: config.tint || 0xff0000,
            duration: config.duration || 400,
            yoyo: config.yoyo !== undefined ? config.yoyo : true,
            ease: config.ease || 'Power2.easeInOut'
        });
    }

    createExplosionEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            scaleX: config.scale?.to || 1.5,
            scaleY: config.scale?.to || 1.5,
            alpha: config.alpha?.to || 0,
            duration: config.duration || 600,
            ease: config.ease || 'Power2.easeOut'
        });
    }

    createFlickerEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            alpha: config.alpha?.to || 0.3,
            duration: config.duration || 200,
            yoyo: config.yoyo !== undefined ? config.yoyo : true,
            repeat: config.repeat !== undefined ? config.repeat : 3,
            ease: config.ease || 'Power2.easeInOut'
        });
    }

    createGlowEffect(target, config) {
        return this.scene.tweens.add({
            targets: target,
            scaleX: config.scale?.to || 1.1,
            scaleY: config.scale?.to || 1.1,
            duration: config.duration || 400,
            yoyo: config.yoyo !== undefined ? config.yoyo : true,
            ease: config.ease || 'Power2.easeInOut'
        });
    }

    createWaveEffect(target, config) {
        const offsetX = config.offsetX || 100;
        const offsetY = config.offsetY || 100;
        const duration = config.duration || 2000;
        const ease = config.ease || 'Power2.easeInOut';
        
        const startX = target.x;
        const startY = target.y;
        
        return this.scene.tweens.add({
            targets: target,
            x: startX + offsetX,
            duration: duration,
            ease: 'Linear',
            onUpdate: (tween) => {
                const progress = tween.progress;
                // Создаем волнообразное движение по Y
                const waveOffset = Math.sin(progress * Math.PI * 4) * (offsetY * 0.5);
                target.y = startY + waveOffset;
            }
        });
    }

    createMovementEffect(target, effectType, config) {
        // Создает эффект движения на основе типа
        switch (effectType) {
            case 'burstMovement':
                return this.createBurstMovementEffect(target, config);
            case 'chaosMovement':
                return this.createChaosMovementEffect(target, config);
            default:
                console.warn(`Unknown movement effect type: ${effectType}`);
                return null;
        }
    }



    createBurstMovementEffect(target, config) {
        const intensity = config.intensity || 2.5;
        const duration = config.duration || 300;
        
        const randomAngle = Math.random() * Math.PI * 2;
        const distance = intensity * 50;
        const endX = target.x + Math.cos(randomAngle) * distance;
        const endY = target.y + Math.sin(randomAngle) * distance;
        
        return this.scene.tweens.add({
            targets: target,
            x: endX,
            y: endY,
            duration: duration,
            ease: 'Power2.easeOut'
        });
    }



    createChaosMovementEffect(target, config) {
        const intensity = config.intensity || 2.0;
        const duration = config.duration || 2000;
        
        const startX = target.x;
        const startY = target.y;
        
        return this.scene.tweens.add({
            targets: target,
            x: startX, // Добавляем целевое свойство для анимации
            y: startY, // Добавляем целевое свойство для анимации
            duration: duration,
            ease: 'Power2.easeInOut',
            onUpdate: (tween) => {
                const progress = tween.progress;
                const chaosX = Math.sin(progress * Math.PI * 6) * intensity * 20;
                const chaosY = Math.cos(progress * Math.PI * 4) * intensity * 15;
                target.x = startX + chaosX;
                target.y = startY + chaosY;
            }
        });
    }


    createParticles(target, config) {
        const quantity = config.quantity || 3;
        const radius = config.emitZone?.radius || 30;
        const lifespan = config.lifespan || 2000;
        
        const animations = [];
        
        // Создаем несколько частиц
        for (let i = 0; i < quantity; i++) {
            // Случайная позиция вокруг объекта
            const angle = (Math.PI * 2 * i) / quantity + Math.random() * 0.5;
            const distance = radius * (0.5 + Math.random() * 0.5);
            const particleX = target.x + Math.cos(angle) * distance;
            const particleY = target.y + Math.sin(angle) * distance;
            
            // Создаем частицу как простой круг
            const particle = this.scene.add.circle(particleX, particleY, 3, 0xffffff);
            particle.setAlpha(0.8);
            
            // Анимация движения и исчезновения
            const endX = particleX + (Math.random() - 0.5) * 50;
            const endY = particleY + (Math.random() - 0.5) * 50;
            
            animations.push(this.scene.tweens.add({
                targets: particle,
                x: endX,
                y: endY,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: lifespan,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            }));
        }
        
        return animations;
    }

    /**
     * Создает эффект взрыва (круговая волна)
     */
    createBlastEffect(target, config) {
        // Уважаем radius=0 (не подменяем на дефолт), если radius не задан, используем baseRadius/100
        const hasRadius = Object.prototype.hasOwnProperty.call(config, 'radius');
        const hasBaseRadius = Object.prototype.hasOwnProperty.call(config, 'baseRadius');
        let radius = 100;
        if (hasRadius) {
            radius = config.radius;
        } else if (hasBaseRadius) {
            radius = config.baseRadius;
        }
        // Если радиус не положительный — не рисуем эффект вообще
        if (radius <= 0) {
            return null;
        }
        const duration = config.duration || 800;
        const color = config.color || 0xff6600;
        const thickness = config.thickness || 3;
        const alpha = config.alpha || 0.8;
        
        // Создаем круг для волны взрыва
        const blast = this.scene.add.circle(target.x, target.y, 5, color);
        blast.setAlpha(alpha);
        blast.setStrokeStyle(thickness, color);
        blast.setFillStyle(0x000000, 0); // Прозрачная заливка
        
        // Анимация расширения круга
        const tween = this.scene.tweens.add({
            targets: blast,
            radius: radius,
            alpha: 0,
            duration: duration,
            ease: 'Power2.easeOut',
            onComplete: () => blast.destroy()
        });
        
        return tween;
    }

    /**
     * Создает эффект ауры (постоянное радиальное свечение)
     */
    createAuraGlowEffect(target, config) {
        const radius = config.baseRadius || config.radius || 60;
        const color = config.color || 0x00ff00;
        const thickness = config.thickness || 2;
        const alpha = config.alpha || 0.3;
        const duration = config.duration || 1000;
        
        // Создаем круг для ауры
        const aura = this.scene.add.circle(target.x, target.y, radius, color);
        aura.setAlpha(alpha);
        aura.setStrokeStyle(thickness, color);
        aura.setFillStyle(0x000000, 0); // Прозрачная заливка
        
        // Сохраняем ссылку на ауру в объекте для отслеживания
        target.auraGlow = aura;
        
        // Анимация пульсации
        const tween = this.scene.tweens.add({
            targets: aura,
            alpha: alpha * 2,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        return tween;
    }

    createLaunchEffect(target, config) {
        const baseScale = config.baseScale || 0.3;
        const duration = config.duration || 1000;
        const ease = config.ease || 'Power2.easeOut';
        
        // Применяем масштабирование и прозрачность для эффекта вылета
        const tween = this.scene.tweens.add({
            targets: target,
            scaleX: { from: 0.5, to: 1.0 + baseScale },
            scaleY: { from: 0.5, to: 1.0 + baseScale },
            alpha: { from: 0, to: 1 },
            duration: duration,
            ease: ease,
            onComplete: () => {
                // Возвращаем нормальный размер
                this.scene.tweens.add({
                    targets: target,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 300,
                    ease: 'Power2.easeOut'
                });
            }
        });
        
        return tween;
    }

    /**
     * Создает эффект вспышки экрана
     */
    createScreenFlashEffect(target, config) {
        const color = config.color || 0xffffff;
        const duration = config.duration || 500;
        const alpha = config.alpha || 0.3;
        const scale = config.scale?.to || 1.0;
        
        // Создаем прямоугольник на весь экран
        const { width, height } = this.scene.scale;
        const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, color);
        flash.setAlpha(0);
        flash.setDepth(1000); // Поверх всех объектов
        flash.setScale(scale);
        
        // Анимация вспышки
        const tween = this.scene.tweens.add({
            targets: flash,
            alpha: alpha,
            duration: duration / 2,
            yoyo: true,
            ease: 'Power2.easeOut',
            onComplete: () => flash.destroy()
        });
        
        return tween;
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    /**
     * Отслеживает активный эффект
     */
    trackEffect(target, effectType, animation) {
        const targetId = target.id || target.name || 'unknown';
        if (!this.activeEffects.has(targetId)) {
            this.activeEffects.set(targetId, new Map());
        }
        this.activeEffects.get(targetId).set(effectType, animation);
    }

    /**
     * Останавливает все эффекты объекта
     */
    stopAllEffects(target) {
        this.scene.tweens.killTweensOf(target);
        const targetId = target.id || target.name || 'unknown';
        if (this.activeEffects.has(targetId)) {
            this.activeEffects.delete(targetId);
        }
    }

    /**
     * Останавливает конкретный эффект объекта
     */
    stopEffect(target, effectType) {
        const targetId = target.id || target.name || 'unknown';
        if (this.activeEffects.has(targetId)) {
            const effects = this.activeEffects.get(targetId);
            if (effects.has(effectType)) {
                const animation = effects.get(effectType);
                
                // Обрабатываем как одиночный твин, так и массив твинов
                if (Array.isArray(animation)) {
                    // Если это массив твинов (например, для shake с direction: 'both')
                    animation.forEach(tween => {
                        if (tween && tween.stop) {
                            tween.stop();
                        }
                    });
                } else if (animation && animation.stop) {
                    // Если это одиночный твин
                    animation.stop();
                }
                
                effects.delete(effectType);
            }
        }
    }

    /**
     * Получает список доступных эффектов
     */
    getAvailableEffects() {
        return [
            'shake', 'flash', 'pulse', 'rotation', 'fadeIn', 'fadeOut',
            'scale', 'move', 'damage', 'explosion', 'flicker', 'glow',
            'wave', 'burstMovement', 'chaosMovement', 'particles', 'blast',
            'auraGlow', 'launchEffect', 'screenFlash'
        ];
    }

    /**
     * Очищает все активные эффекты
     */
    clearAllEffects() {
        this.activeEffects.clear();
        this.scene.tweens.killAll();
    }


    /**
     * Получает статистику активных эффектов
     */
    getStats() {
        let totalEffects = 0;
        this.activeEffects.forEach(effects => {
            totalEffects += effects.size;
        });
        
        return {
            activeTargets: this.activeEffects.size,
            totalEffects: totalEffects
        };
    }
}