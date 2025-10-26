import Phaser from 'phaser';
import { Enemy } from '../objects/Enemy.js';
import { EffectSystem } from '../systems/EffectSystem.js';
import { enemyTypes } from '../types/enemyTypes';

/**
 * Тестовая сцена для демонстрации всех эффектов
 * Эффекты активируются по клику на объекты
 */
export class TestEffects extends Phaser.Scene {
    constructor() {
        super({ 
            key: 'TestEffects',
            // Настраиваем сцену на весь экран
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        });
        this.effectSystem = null;
        this.enemies = [];
        this.effects = [];
    }

    create() {
        console.log('TestEffects: Создание сцены');
        
        // Получаем размеры экрана
        const { width, height } = this.scale;
        
        // Настраиваем камеру для прокрутки
        this.cameras.main.setBounds(0, 0, width, height * 3); // Увеличиваем высоту области прокрутки
        this.cameras.main.setScroll(0, 0);
        
        // Включаем интерактивность для прокрутки
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // Прокрутка колесиком мыши
            this.cameras.main.scrollY -= deltaY * 0.5;
            // Ограничиваем прокрутку
            this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, height * 2);
        });
        
        // Включаем тач-прокрутку для мобильных устройств
        this.input.on('pointerdown', (pointer) => {
            // Сохраняем только если клик не по интерактивному объекту
            if (!pointer.event.target.closest('.interactive')) {
                this.lastPointerY = pointer.y;
                this.isScrolling = true;
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.lastPointerY !== undefined && this.isScrolling) {
                const deltaY = pointer.y - this.lastPointerY;
                this.cameras.main.scrollY -= deltaY;
                this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, height * 2);
                this.lastPointerY = pointer.y;
            }
        });
        
        this.input.on('pointerup', () => {
            this.isScrolling = false;
            this.lastPointerY = undefined;
        });
        
        // Создаем систему эффектов
        this.effectSystem = new EffectSystem(this);
        
        // Получаем список всех доступных эффектов
        this.effects = this.effectSystem.getAvailableEffects();
        
        // Добавляем композитные эффекты по объектам
        this.compositeEffects = [
            // ENEMY - ВРАГИ
            {
                name: 'enemySpawn',
                description: 'Enemy.CreateEnemy() создание врага',
                components: [
                    { effect: 'fadeIn', params: { duration: 800 } },
                    { effect: 'scale', params: { from: 0.5, to: 1, duration: 600 } }
                ],
                category: 'Enemy'
            },
            {
                name: 'enemyDamage',
                description: 'Enemy.takeDamage() получение урона',
                components: [
                    { effect: 'damage', params: { duration: 300 } },
                    { effect: 'glow', params: { intensity: 1, duration: 100 } }

                    //{ effect: 'flicker', params: { duration: 200, repeat: 3 } }
                ],
                category: 'Enemy'
            },
            {
                name: 'enemyDeath',
                description: 'Enemy.die() смерть врага',
                components: [
                    { effect: 'blast', params: { radius: 120, duration: 600, color: 0xff6600 } },
                    { effect: 'explosion', params: { intensity: 1.2, duration: 400 } },
                    { effect: 'fadeOut', params: { duration: 600 } }
                ],
                category: 'Enemy'
            },
            {
                name: 'enemyAttack',
                description: 'Enemy.attack() атака врага',
                components: [
                    { effect: 'shake', params: { duration: 100, repeat: 1, intensity: 10, direction: 'horizontal' } },
                    { effect: 'glow', params: { intensity: 0.8, duration: 300 } }
                ],
                category: 'Enemy'
            },
            {
                name: 'enemyTargetChanged',
                description: 'Enemy.targetChanged смена цели',
                components: [
                    { effect: 'rotation', params: { angle: 360, duration: 2000 } },
                    { effect: 'shake', params: { direction: 'horizontal', intensity: 8, duration: 400, repeat: 2 } }
                ],
                category: 'Enemy'
            },
            
            // EGG - ЯЙЦО
            {
                name: 'eggCreate',
                description: 'Egg.CreateEgg() создание яйца',
                components: [
                    { effect: 'fadeIn', params: { duration: 1000 } },
                    { effect: 'scale', params: { from: 0.3, to: 1, duration: 800 } }
                ],
                category: 'Egg'
            },
            {
                name: 'eggDamage',
                description: 'Egg.takeDamage() урон яйцу',
                components: [
                    { effect: 'shake', params: { intensity: 6, duration: 200, repeat: 3, direction: 'vertical' } },
                    { effect: 'damage', params: { duration: 400 } },
                    { effect: 'flicker', params: { duration: 250, repeat: 4 } }
                ],
                category: 'Egg'
            },
            {
                name: 'eggHeal',
                description: 'Egg.heal() лечение яйца',
                components: [
                    { effect: 'heal', params: { duration: 800, color: 0x00ff00 } },
                    { effect: 'pulse', params: { scale: 0.3, duration: 600 } }
                ],
                category: 'Egg'
            },
            
            // ITEM - ПРЕДМЕТЫ
            {
                name: 'itemSpawn',
                description: 'Item конструктор появление предмета',
                components: [
                    { effect: 'fadeIn', params: { duration: 600 } },
                    { effect: 'scale', params: { from: 0.2, to: 1, duration: 500 } }
                ],
                category: 'Item'
            },
            {
                name: 'itemCollect',
                description: 'Item.collect() сбор предмета',
                components: [
                    { effect: 'collect', params: { duration: 400 } },
                    { effect: 'fadeOut', params: { duration: 300 } }
                ],
                category: 'Item'
            },
            {
                name: 'itemDestroy',
                description: 'Item.destroy() уничтожение предмета',
                components: [
                    { effect: 'explosion', params: { scale: 0.8, duration: 300 } },
                    { effect: 'fadeOut', params: { duration: 200 } }
                ],
                category: 'Item'
            },
            
            // DEFENSE - ЗАЩИТА
            {
                name: 'defenseCreate',
                description: 'Defense конструктор создание защиты',
                components: [
                    { effect: 'fadeIn', params: { duration: 700 } },
                    { effect: 'scale', params: { from: 0.8, to: 1, duration: 400 } }
                ],
                category: 'Defense'
            },
            {
                name: 'defenseActivate',
                description: 'Defense.startProtectionSystem() активация',
                components: [
                    { effect: 'glow', params: { color: 0x00ffff, duration: 300, intensity: 0.5 } },
                    { effect: 'attack', params: { duration: 200 } }
                ],
                category: 'Defense'
            },
            {
                name: 'defenseRepair',
                description: 'Defense.startAutoRepair() ремонт',
                components: [
                    { effect: 'glow', params: { intensity: 0.9, duration: 800 } },
                    { effect: 'flicker', params: { duration: 150, repeat: 5 } }
                ],
                category: 'Defense'
            },
            
            // UI - ИНТЕРФЕЙС
            {
                name: 'buttonClick',
                description: 'Button.onClick() клик по кнопке',
                components: [
                    { effect: 'shake', params: { intensity: 4, duration: 100, repeat: 1, direction: 'both' } },
                    { effect: 'flash', params: { duration: 150 } }
                ],
                category: 'UI'
            },
            {
                name: 'healthBarDamage',
                description: 'HealthBar обновление урона',
                components: [
                    { effect: 'flicker', params: { duration: 120, repeat: 2 } },
                    { effect: 'damage', params: { duration: 200 } }
                ],
                category: 'UI'
            },
            {
                name: 'timerUpdate',
                description: 'GameTimer обновление времени',
                components: [
                    { effect: 'pulse', params: { scale: 1.02, duration: 100, repeat: 1 } }
                ],
                category: 'UI'
            },
            
            // WAVE - ВОЛНЫ
            {
                name: 'waveStart',
                description: 'WaveSystem.startWave() начало волны',
                components: [
                    { effect: 'flash', params: { duration: 300 } },
                    { effect: 'shake', params: { intensity: 10, duration: 500, repeat: 2 } }
                ],
                category: 'Wave'
            },
            {
                name: 'waveEnd',
                description: 'WaveSystem.endWave() конец волны',
                components: [
                    { effect: 'glow', params: { intensity: 1.8, duration: 800 } },
                    { effect: 'pulse', params: { scale: 1.15, duration: 600, repeat: 4 } }
                ],
                category: 'Wave'
            },
            {
                name: 'minuteChanged',
                description: 'WaveSystem.minuteChanged смена минуты',
                components: [
                    { effect: 'flash', params: { duration: 200 } }
                ],
                category: 'Wave'
            },
            
            // GAME - ИГРА
            {
                name: 'gameStart',
                description: 'Game.startGame() начало игры',
                components: [
                    { effect: 'screenFlash', params: { color: 0xffffff, duration: 500, alpha: 0.3 } }
                ],
                category: 'Game'
            },
            {
                name: 'gameEnd',
                description: 'Game.endGame() конец игры',
                components: [
                    { effect: 'screenFlash', params: { color: 0x00ff00, duration: 800, alpha: 0.5 } }
                ],
                category: 'Game'
            }
        ];
        
        console.log(`TestEffects: Найдено ${this.effects.length} базовых эффектов и ${this.compositeEffects.length} композитных`);
        
        // Создаем сетку врагов для демонстрации эффектов
        this.createEffectGrid();
        
        // Создаем только заголовок
        this.createTitle();
    }

    /**
     * Создает сетку врагов для демонстрации эффектов
     */
    createEffectGrid() {
        const { width } = this.scale;
        const basicCols = 6; // 6 колонок для базовых эффектов
        const compositeCols = 3; // 3 колонки для композитных эффектов
        
        this.enemies = [];
        
        // Создаем базовые эффекты в верхней части
        this.createBasicEffectsSection(width, 120, 180, basicCols);
        
        // Создаем композитные эффекты ниже с прокруткой - увеличиваем отступ
        this.createCompositeEffectsSection(width, 380, compositeCols);
        
        console.log(`TestEffects: Создано ${this.enemies.length} интерактивных врагов для демонстрации эффектов`);
    }

    /**
     * Создает секцию базовых эффектов
     */
    createBasicEffectsSection(width, startY, sectionHeight, cols) {
        // Заголовок секции
        this.add.text(width / 2, startY + 20, 'БАЗОВЫЕ ЭФФЕКТЫ', {
            fontSize: '16px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        
        const cellWidth = width / cols;
        // Увеличиваем высоту ячейки для размещения текста под иконками
        const cellHeight = Math.max(80, (sectionHeight - 40) / Math.ceil(this.effects.length / cols));
        const gridStartY = startY + 40;
        
        for (let i = 0; i < this.effects.length; i++) {
            const effectName = this.effects[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = col * cellWidth + cellWidth / 2;
            const y = gridStartY + row * cellHeight + cellHeight / 2;
            
            this.createEffectEnemy(effectName, x, y, 'basic');
        }
    }

    /**
     * Создает секцию композитных эффектов
     */
    createCompositeEffectsSection(width, startY, cols) {
        // Заголовок секции
        this.add.text(width / 2, startY, 'КОМПОЗИТНЫЕ ЭФФЕКТЫ', {
            fontSize: '16px',
            color: '#ff6600',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        
        // Группируем эффекты по категориям
        const effectsByCategory = this.groupEffectsByCategory();
        const categories = Object.keys(effectsByCategory);
        
        const cellWidth = width / cols;
        let currentY = startY + 50;
        
        // Создаем каждую категорию
        categories.forEach(category => {
            const effects = effectsByCategory[category];
            
            // Заголовок категории
            this.add.text(width / 2, currentY, category, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 6, y: 2 }
            }).setOrigin(0.5);
            
            currentY += 35;
            
            // Сетка эффектов в категории
            const rows = Math.ceil(effects.length / cols);
            const cellHeight = 120; // Фиксированная высота ячейки
            
            for (let i = 0; i < effects.length; i++) {
                const compositeEffect = effects[i];
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                const x = col * cellWidth + cellWidth / 2;
                const y = currentY + row * cellHeight;
                
                this.createCompositeEffectEnemy(compositeEffect, x, y, cellHeight);
            }
            
            currentY += rows * cellHeight + 20; // Отступ между категориями
        });
    }

    /**
     * Группирует эффекты по категориям
     */
    groupEffectsByCategory() {
        const grouped = {};
        
        this.compositeEffects.forEach(effect => {
            const category = effect.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(effect);
        });
        
        return grouped;
    }

    /**
     * Создает врага для демонстрации базового эффекта
     */
    createEffectEnemy(effectName, x, y, type) {
        // Позиционируем врага в верхней части ячейки
        const enemyY = y - 25;
        
        // Создаем простой спрайт с эмодзи
        const enemy = this.add.text(x, enemyY, '🐜', {
            fontSize: '24px',
            color: '#ffffff'
        });
        enemy.setOrigin(0.5);
        enemy.setInteractive();
        
        enemy.on('pointerdown', (pointer) => {
            // Предотвращаем конфликт с прокруткой
            pointer.event.stopPropagation();
            this.onEnemyClick(enemy, effectName);
        });
        
        enemy.on('pointerover', () => {
            enemy.setTint(0xffff00);
        });
        
        enemy.on('pointerout', () => {
            enemy.clearTint();
        });
        
        // Подпись с названием эффекта - позиционируем под врагом с достаточным отступом
        const label = this.add.text(x, enemyY + 40, effectName, {
            fontSize: '9px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
        });
        label.setOrigin(0.5);
        
        enemy.effectName = effectName;
        enemy.label = label;
        enemy.effectType = type;
        
        this.enemies.push(enemy);
    }

    /**
     * Создает врага для демонстрации композитного эффекта
     */
    createCompositeEffectEnemy(compositeEffect, x, y, cellHeight) {
        // Позиционируем врага в верхней части ячейки
        const enemyY = y + 20;
        
        // Выбираем подходящий эмодзи в зависимости от категории
        let emoji = '🐜'; // по умолчанию
        switch (compositeEffect.category) {
            case 'Egg':
                emoji = '🥚';
                break;
            case 'Item':
                emoji = '💎';
                break;
            case 'Defense':
                emoji = '🛡️';
                break;
            case 'UI':
                emoji = '🎮';
                break;
            case 'Wave':
                emoji = '🌊';
                break;
            case 'Game':
                emoji = '🎯';
                break;
            default:
                emoji = '🐜';
        }
        
        // Создаем простой спрайт с эмодзи
        const enemy = this.add.text(x, enemyY, emoji, {
            fontSize: '24px',
            color: '#ffffff'
        });
        enemy.setOrigin(0.5);
        enemy.setInteractive();
        
        // Обработчики событий
        enemy.on('pointerdown', (pointer) => {
            // Предотвращаем конфликт с прокруткой
            pointer.event.stopPropagation();
            this.onCompositeEffectClick(enemy, compositeEffect);
        });
        
        enemy.on('pointerover', () => {
            enemy.setTint(0xff6600); // Оранжевый для композитных
        });
        
        enemy.on('pointerout', () => {
            enemy.clearTint();
        });
        
        // Убираем черный лейбл с названием - оставляем только описание
        
        // Формируем новый текст: событие + компоненты
        let descriptionText = '';
        
        // Определяем событие на основе категории и названия
        let eventName = '';
        switch (compositeEffect.category) {
            case 'Enemy':
                switch (compositeEffect.name) {
                    case 'enemySpawn':
                        eventName = 'Enemy.CreateEnemy()';
                        break;
                    case 'enemyDamage':
                        eventName = 'Enemy.takeDamage()';
                        break;
                    case 'enemyDeath':
                        eventName = 'Enemy.die()';
                        break;
                    case 'enemyAttack':
                        eventName = 'Enemy.attack()';
                        break;
                    default:
                        eventName = 'Enemy.' + compositeEffect.name + '()';
                }
                break;
            case 'Egg':
                switch (compositeEffect.name) {
                    case 'eggCreate':
                        eventName = 'Egg.CreateEgg()';
                        break;
                    case 'eggDamage':
                        eventName = 'Egg.takeDamage()';
                        break;
                    case 'eggHeal':
                        eventName = 'Egg.heal()';
                        break;
                    default:
                        eventName = 'Egg.' + compositeEffect.name + '()';
                }
                break;
            case 'Item':
                switch (compositeEffect.name) {
                    case 'itemSpawn':
                        eventName = 'Item конструктор';
                        break;
                    case 'itemCollect':
                        eventName = 'Item.collect()';
                        break;
                    case 'itemDestroy':
                        eventName = 'Item.destroy()';
                        break;
                    default:
                        eventName = 'Item.' + compositeEffect.name + '()';
                }
                break;
            case 'Defense':
                switch (compositeEffect.name) {
                    case 'defenseCreate':
                        eventName = 'Defense конструктор';
                        break;
                    case 'defenseActivate':
                        eventName = 'Defense.startProtectionSystem()';
                        break;
                    case 'defenseRepair':
                        eventName = 'Defense.startAutoRepair()';
                        break;
                    default:
                        eventName = 'Defense.' + compositeEffect.name + '()';
                }
                break;
            case 'UI':
                switch (compositeEffect.name) {
                    case 'buttonClick':
                        eventName = 'Button.onClick()';
                        break;
                    case 'healthBarDamage':
                        eventName = 'HealthBar обновление';
                        break;
                    case 'timerUpdate':
                        eventName = 'GameTimer обновление';
                        break;
                    default:
                        eventName = 'UI.' + compositeEffect.name + '()';
                }
                break;
            case 'Wave':
                switch (compositeEffect.name) {
                    case 'waveStart':
                        eventName = 'WaveSystem.startWave()';
                        break;
                    case 'waveEnd':
                        eventName = 'WaveSystem.endWave()';
                        break;
                    case 'minuteChanged':
                        eventName = 'WaveSystem.minuteChanged()';
                        break;
                    default:
                        eventName = 'WaveSystem.' + compositeEffect.name + '()';
                }
                break;
            case 'Game':
                switch (compositeEffect.name) {
                    case 'gameStart':
                        eventName = 'Game.startGame()';
                        break;
                    case 'gameEnd':
                        eventName = 'Game.endGame()';
                        break;
                    default:
                        eventName = 'Game.' + compositeEffect.name + '()';
                }
                break;
            default:
                eventName = compositeEffect.name + '()';
        }
        
        // Формируем строку с компонентами и их параметрами
        const components = compositeEffect.components.map(component => {
            if (typeof component === 'string') {
                return component;
            } else {
                // Форматируем параметры для отображения
                const paramsStr = Object.entries(component.params || {})
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                return `${component.effect} (${paramsStr})`;
            }
        }).join('\n');
        
        descriptionText = eventName + '\n' + components;
        
        // Описание - позиционируем сразу под врагом без черного лейбла
        const descriptionY = enemyY + 50;
        const description = this.add.text(x, descriptionY, descriptionText, {
            fontSize: '9px',
            color: '#cccccc',
            backgroundColor: '#333333',
            padding: { x: 3, y: 2 },
            align: 'center',
            wordWrap: { width: 120 } // Фиксированная ширина для 3 колонок
        });
        description.setOrigin(0.5);
        
        enemy.compositeEffect = compositeEffect;
        enemy.description = description;
        enemy.effectType = 'composite';
        
        this.enemies.push(enemy);
    }

    /**
     * Создает только заголовок
     */
    createTitle() {
        const { width } = this.scale;
        
        // Заголовок
        this.add.text(width / 2, 30, 'ТЕСТ ЭФФЕКТОВ', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Инструкция
        this.add.text(width / 2, 70, 'Кликните по врагу чтобы увидеть эффект', {
            fontSize: '14px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
    }


    /**
     * Обработчик клика по врагу
     */
    onEnemyClick(enemy, effectName) {
        console.log(`TestEffects: Клик по врагу с эффектом "${effectName}"`);
        
        // Сбрасываем врага в исходное состояние
        this.resetEnemy(enemy);
        
        // Применяем эффект
        this.applyEffectToEnemy(enemy, effectName);
    }

    /**
     * Обработчик клика по композитному эффекту
     */
    onCompositeEffectClick(enemy, compositeEffect) {
        console.log(`TestEffects: Клик по композитному эффекту "${compositeEffect.name}"`);
        
        // Сбрасываем врага в исходное состояние
        this.resetEnemy(enemy);
        
        // Применяем все компоненты композитного эффекта с их параметрами
        compositeEffect.components.forEach((component, index) => {
            this.time.delayedCall(index * 100, () => {
                // Поддерживаем как старый формат (строка), так и новый (объект)
                if (typeof component === 'string') {
                    this.applyEffectToEnemy(enemy, component);
                } else {
                    this.applyEffectToEnemy(enemy, component.effect, component.params);
                }
            });
        });
    }

    /**
     * Применяет эффект к врагу
     */
    applyEffectToEnemy(enemy, effectName, customParams = {}) {
        if (!this.effectSystem || !enemy) return;
        
        // Определяем интенсивность эффекта
        let intensity = 1;
        
        // Специальные настройки для некоторых эффектов (только если нет customParams)
        if (Object.keys(customParams).length === 0) {
        switch (effectName) {
            case 'fadeIn':
                intensity = 0.8;
                break;
            case 'fadeOut':
                intensity = 0.8;
                break;
            case 'rotation':
                intensity = 0.5; // Медленнее вращение
                break;
            case 'pulse':
                intensity = 0.7;
                break;
            default:
                intensity = 1;
            }
        }
        
        console.log(`TestEffects: Применяем "${effectName}" к врагу с интенсивностью ${intensity}`, customParams);
        
        // Применяем эффект с customParams
        this.effectSystem.applyEffect(effectName, enemy, intensity, customParams);
    }

    /**
     * Сбрасывает врага в исходное состояние
     */
    resetEnemy(enemy) {
        if (!enemy) return;
        
        // Сбрасываем все свойства для простых текстов
        enemy.setAlpha(1);
        enemy.setScale(1);
        enemy.clearTint();
        enemy.setRotation(0);
        
        // Останавливаем все твины
        this.tweens.killTweensOf(enemy);
    }


    /**
     * Очищает ресурсы при уничтожении сцены
     */
    destroy() {
        // Очищаем таймеры
        this.time.removeAllEvents();
        
        // Очищаем врагов
        this.enemies.forEach(enemy => {
            if (enemy && enemy.destroy) {
                enemy.destroy();
            }
        });
        
        this.enemies = [];
    }
}