import { Enemy } from '../objects/Enemy.js';
import { EnemyEffectSystem } from '../systems/EnemyEffectSystem.js';
import { Egg } from '../objects/Egg.js';
import { enemyTypes } from '../types/enemyTypes.js';

/**
 * Тестовая сцена для проверки системы поведений врагов
 */
export class TestBehaviors extends Phaser.Scene {
    constructor() {
        super({ key: 'TestBehaviors' });
        
        this.enemies = [];
        this.target = null;
        this.effectSystem = null;
        this.enemyButtons = [];
        this.tooltip = null; // Всплывающая подсказка
        this.tooltipTimer = null; // Таймер для задержки показа подсказки
    }
    
    create() {
        console.log('🎮 [TestBehaviors] Сцена создана');
        
        // Светлый фон
        this.cameras.main.setBackgroundColor('#f8f9fa');
        
        // Создаем группы для врагов и снарядов
        this.enemies = [];
        this.projectiles = [];
        this.target = null;
        
        // Инициализируем систему эффектов
        this.initEffectSystem();
        
        // Создаем кнопки для врагов
        this.createEnemyButtons();
        
        // Настраиваем клики мыши для создания цели
        this.setupMouseControls();
        
        // Настраиваем коллизии
        this.setupCollisions();
        
        // Настраиваем обработчики событий
        this.setupEventHandlers();
        
        // Добавляем инструкцию
        this.addInstruction();
    }
    
    /**
     * Инициализация системы эффектов
     */
    initEffectSystem() {
        this.effectSystem = new EnemyEffectSystem(this);
        Enemy.initEffectSystem(this.effectSystem);
        console.log('✨ [TestBehaviors] Система эффектов инициализирована');
    }
    
    /**
     * Создание кнопок для каждого типа врага
     */
    createEnemyButtons() {
        // Создаем массив всех типов врагов с их символами
        const enemyButtonsData = Object.keys(enemyTypes).map(type => ({
            type: type,
            emoji: enemyTypes[type].texture || '❓',
            color: this.getEnemyColor(type)
        }));
        
        // Создаем маленькие кнопки в сетке
        const buttonSize = 40; // Маленький размер кнопки
        const buttonSpacing = 5;
        const buttonsPerRow = 12; // Кнопок в ряду
        const startX = 20;
        const startY = 80;
        
        enemyButtonsData.forEach((enemyData, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;
            
            const x = startX + col * (buttonSize + buttonSpacing);
            const y = startY + row * (buttonSize + buttonSpacing);
            
            // Создаем маленькую круглую кнопку
            const button = this.add.circle(x, y, buttonSize / 2, enemyData.color);
            button.setStrokeStyle(2, 0x000000);
            button.setDepth(10);
            
            // Добавляем только эмодзи на кнопку
            const emojiText = this.add.text(x, y, enemyData.emoji, {
                fontSize: '16px'
            }).setOrigin(0.5).setDepth(11);
            
            // Делаем кнопку интерактивной
            button.setInteractive();
            
            // Эффекты наведения
            button.on('pointerover', () => {
                button.setAlpha(0.8);
                button.setScale(1.1);
                emojiText.setScale(1.1);
                
                // Показываем подсказку с небольшой задержкой
                this.tooltipTimer = this.time.delayedCall(300, () => {
                    this.showTooltip(enemyData.type, x, y);
                });
            });
            
            button.on('pointerout', () => {
                button.setAlpha(1.0);
                button.setScale(1.0);
                emojiText.setScale(1.0);
                
                // Отменяем таймер и скрываем подсказку
                if (this.tooltipTimer) {
                    this.tooltipTimer.remove();
                    this.tooltipTimer = null;
                }
                this.hideTooltip();
            });
            
            // Обработчик клика - создаем врага
            button.on('pointerdown', () => {
                this.createEnemy(enemyData.type);
            });
            
            // Сохраняем кнопку
            this.enemyButtons.push({
                button: button,
                emoji: emojiText,
                type: enemyData.type
            });
        });
        
        // Добавляем специальную кнопку для крота в игровом стиле
        this.createMoleGameStyleButton();
        
        console.log(`🎮 [TestBehaviors] Создано ${enemyButtonsData.length} кнопок для врагов`);
    }
    
    /**
     * Создание специальной кнопки для крота в игровом стиле
     */
    createMoleGameStyleButton() {
        const { width } = this.scale;
        const buttonSize = 50;
        const x = width - 80; // Правая сторона экрана
        const y = 120;
        
        // Создаем большую кнопку с рамкой
        const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0xFF6B35);
        button.setStrokeStyle(3, 0x000000);
        button.setDepth(10);
        
        // Добавляем текст "GAME"
        const gameText = this.add.text(x, y - 15, 'GAME', {
            fontSize: '10px',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        
        // Добавляем эмодзи крота
        const moleEmoji = this.add.text(x, y + 5, '🐀', {
            fontSize: '20px'
        }).setOrigin(0.5).setDepth(11);
        
        // Делаем кнопку интерактивной
        button.setInteractive();
        
        // Эффекты наведения
        button.on('pointerover', () => {
            button.setAlpha(0.8);
            button.setScale(1.1);
            gameText.setScale(1.1);
            moleEmoji.setScale(1.1);
            
            // Показываем подсказку
            this.showMoleGameStyleTooltip(x, y);
        });
        
        button.on('pointerout', () => {
            button.setAlpha(1.0);
            button.setScale(1.0);
            gameText.setScale(1.0);
            moleEmoji.setScale(1.0);
            
            this.hideTooltip();
        });
        
        // Обработчик клика - создаем крота в игровом стиле с delayedCall
        button.on('pointerdown', () => {
            this.createMoleGameStyleWithDelay();
        });
        
        // Сохраняем кнопку
        this.enemyButtons.push({
            button: button,
            emoji: moleEmoji,
            type: 'mole_game_style'
        });
        
        console.log(`🎮 [TestBehaviors] Создана специальная кнопка для крота в игровом стиле`);
    }

    /**
     * Показать подсказку для крота в игровом стиле
     */
    showMoleGameStyleTooltip(x, y) {
        this.hideTooltip();
        
        // Создаем фон подсказки
        const tooltipBg = this.add.rectangle(x, y - 80, 250, 100, 0x000000, 0.8);
        tooltipBg.setStrokeStyle(2, 0xffffff);
        tooltipBg.setDepth(20);
        tooltipBg.setAlpha(0);
        
        // Создаем текст с информацией
        const tooltipText = this.add.text(x, y - 80, 
            'КРОТ С DELAYEDCALL\n' +
            'Спавн за экраном + delayedCall\n' +
            'С enhancementMultiplier = 1.0\n' +
            'Имитирует WaveSystem.scheduleNextSpawn()\n' +
            'Тест конфликта таймеров', 
            {
                fontSize: '12px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 230 }
            }
        ).setOrigin(0.5).setDepth(21);
        tooltipText.setAlpha(0);
        
        // Анимация появления
        this.tweens.add({
            targets: [tooltipBg, tooltipText],
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
        
        // Сохраняем ссылки на элементы подсказки
        this.tooltip = {
            bg: tooltipBg,
            text: tooltipText
        };
    }

    /**
     * Получение цвета для типа врага
     */
    getEnemyColor(enemyType) {
        const colorMap = {
            'unknown': 0x808080,
            'ant': 0x8B4513,
            'beetle': 0x228B22,
            'rhinoceros': 0x654321,
            'mosquito': 0x696969,
            'spider': 0x8B4513,
            'fly': 0x696969,
            'bee': 0xFFD700,
            'butterfly': 0xFF69B4,
            'dragonfly': 0x00CED1,
            'wasp': 0xFFA500,
            'slug': 0x90EE90,
            'snail': 0x98FB98,
            'spiderQueen': 0x8B4513,
            'mole': 0x2F4F4F,
            'antChain': 0x654321,
            'beeSwarm': 0xFFD700,
            'flySwarm': 0x696969
        };
        
        return colorMap[enemyType] || 0x808080;
    }
    
    /**
     * Показать всплывающую подсказку
     */
    showTooltip(enemyType, x, y) {
        // Скрываем предыдущую подсказку
        this.hideTooltip();
        
        const enemyData = enemyTypes[enemyType];
        if (!enemyData) return;
        
        // Создаем фон подсказки
        const tooltipBg = this.add.rectangle(x, y - 60, 200, 80, 0x000000, 0.8);
        tooltipBg.setStrokeStyle(2, 0xffffff);
        tooltipBg.setDepth(20);
        tooltipBg.setAlpha(0); // Начинаем с прозрачности
        
        // Создаем текст с информацией о враге
        const tooltipText = this.add.text(x, y - 60, 
            `${enemyData.name}\n` +
            `❤️ ${enemyData.health} | ⚔️ ${enemyData.damage}\n` +
            `🏃 ${enemyData.speed} | 📏 ${enemyData.attackRange}`, 
            {
                fontSize: '12px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 180 }
            }
        ).setOrigin(0.5).setDepth(21);
        tooltipText.setAlpha(0); // Начинаем с прозрачности
        
        // Анимация появления
        this.tweens.add({
            targets: [tooltipBg, tooltipText],
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
        
        // Сохраняем ссылки на элементы подсказки
        this.tooltip = {
            bg: tooltipBg,
            text: tooltipText
        };
    }
    
    /**
     * Скрыть всплывающую подсказку
     */
    hideTooltip() {
        if (this.tooltip) {
            // Анимация исчезновения
            this.tweens.add({
                targets: [this.tooltip.bg, this.tooltip.text],
                alpha: 0,
                duration: 150,
                ease: 'Power2',
                onComplete: () => {
                    if (this.tooltip) {
                        if (this.tooltip.bg) {
                            this.tooltip.bg.destroy();
                        }
                        if (this.tooltip.text) {
                            this.tooltip.text.destroy();
                        }
                        this.tooltip = null;
                    }
                }
            });
        }
    }
    
    /**
     * Создание крота в игровом стиле (как в WaveSystem)
     */
    createMoleGameStyle() {
        // Удаляем всех существующих врагов
        this.clearAllEnemies();
        
        // Имитируем WaveSystem.getSpawnPosition()
        const { width, height } = this.scale;
        const margin = 50; // SPAWN_MARGIN
        
        // Спавним по краям экрана (как в игровой сцене)
        const side = Math.floor(Math.random() * 4); // 0-верх, 1-право, 2-низ, 3-лево
        
        let x, y;
        switch (side) {
            case 0: // Верх
                x = Phaser.Math.Between(margin, width - margin);
                y = -margin;
                break;
            case 1: // Право
                x = width + margin;
                y = Phaser.Math.Between(margin, height - margin);
                break;
            case 2: // Низ
                x = Phaser.Math.Between(margin, width - margin);
                y = height + margin;
                break;
            case 3: // Лево
                x = -margin;
                y = Phaser.Math.Between(margin, height - margin);
                break;
        }
        
        // Имитируем WaveSystem.spawnEnemy()
        const enemyType = 'mole';
        const enhancementMultiplier = 1.0; // Как в игровой сцене
        
        console.log(`🎮 [TestBehaviors] Создаем крота в игровом стиле в позиции (${x}, ${y})`);
        
        // Создаем врага точно как в WaveSystem
        const enemy = Enemy.CreateEnemy(this, enemyType, x, y, enhancementMultiplier);
        if (!enemy) {
            return;
        }
        
        // Добавляем в список
        this.enemies.push(enemy);
        
        // Устанавливаем цель если есть
        if (this.target) {
            enemy.setTarget(this.target);
        }
        
        console.log(`🎮 [TestBehaviors] Крот создан в игровом стиле: ${enemyType} в позиции (${x}, ${y})`);
    }

    /**
     * Создание крота в игровом стиле с delayedCall (как в WaveSystem)
     */
    createMoleGameStyleWithDelay() {
        // Удаляем всех существующих врагов
        this.clearAllEnemies();
        
        console.log(`🎮 [TestBehaviors] Запускаем delayedCall для создания крота...`);
        
        // Имитируем WaveSystem.scheduleNextSpawn() с delayedCall
        const delay = 1000; // 1 секунда задержки для тестирования
        
        this.time.delayedCall(delay, () => {
            console.log(`🎮 [TestBehaviors] delayedCall выполнен, создаем крота...`);
            this.createMoleGameStyle();
        });
        
        console.log(`🎮 [TestBehaviors] delayedCall запланирован на ${delay}мс`);
    }

    /**
     * Создание врага определенного типа
     */
    createEnemy(enemyType, x = null, y = null) {
        // Если координаты не указаны, создаем в случайном месте
        if (x === null || y === null) {
            // Удаляем всех существующих врагов только если создаем нового врага
            this.clearAllEnemies();
            
            const { width, height } = this.scale;
            x = x || Phaser.Math.Between(100, width - 100);
            y = y || Phaser.Math.Between(100, height - 100);
        }
        
        // Создаем врага
        const enemy = Enemy.CreateEnemy(this, enemyType, x, y);
        
        if (enemy) {
            // Если есть цель, устанавливаем её
            if (this.target) {
                enemy.setTarget(this.target);
            }
            
            // Добавляем в список
            this.enemies.push(enemy);
            
            console.log(`🎮 [TestBehaviors] Создан враг: ${enemyType} в позиции (${x}, ${y})`);
            console.log(`🎮 [TestBehaviors] Враг имеет цель:`, enemy.target ? 'Да' : 'Нет');
            console.log(`🎮 [TestBehaviors] Враг видимый:`, enemy.visible ? 'Да' : 'Нет');
            console.log(`🎮 [TestBehaviors] Враг альфа:`, enemy.alpha);
            console.log(`🎮 [TestBehaviors] Враг масштаб:`, enemy.scaleX, enemy.scaleY);
            console.log(`🎮 [TestBehaviors] Враг глубина:`, enemy.depth);
            
            // Проверяем новую систему ИИ
            if (enemy._aiCoordinator) {
                console.log(`🎮 [TestBehaviors] AI Координатор:`, enemy._aiCoordinator.constructor.name);
                console.log(`🎮 [TestBehaviors] AI Активен:`, enemy._aiCoordinator.isActive ? 'Да' : 'Нет');
                console.log(`🎮 [TestBehaviors] AI Состояние:`, enemy._aiCoordinator.getState());
                
                // Проверяем стратегию движения
                const movementSystem = enemy._aiCoordinator.getSystem('movement');
                if (movementSystem && movementSystem.strategy) {
                    console.log(`🎮 [TestBehaviors] Стратегия движения:`, movementSystem.strategy.constructor.name);
                    if (enemyType === 'butterfly' && movementSystem.strategy.getState) {
                        console.log(`🦋 [TestBehaviors] Состояние бабочки:`, movementSystem.strategy.getState());
                    }
                } else {
                    console.log(`⚠️ [TestBehaviors] Система движения не найдена или стратегия отсутствует`);
                }
            } else if (enemy._activeBehavior) {
                console.log(`🎮 [TestBehaviors] Активное поведение:`, enemy._activeBehavior.constructor.name);
            } else {
                console.log(`❌ [TestBehaviors] AI Координатор не создан для ${enemyType}`);
                console.log(`🎮 [TestBehaviors] Использует новую ИИ:`, enemy._useNewAI ? 'Да' : 'Нет');
            }
        }
    }
    
    
    /**
     * Настройка управления мышью
     */
    setupMouseControls() {
        // Клик мыши создает/перемещает цель
        this.input.on('pointerdown', (pointer) => {
            // Проверяем, что клик не по кнопке
            const clickedButton = this.enemyButtons.find(btn => 
                btn.button.getBounds().contains(pointer.x, pointer.y)
            );
            
            if (!clickedButton) {
                this.createTarget(pointer.x, pointer.y);
            }
        });
        
        // ESC для возврата в меню
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }
    
    /**
     * Настройка коллизий между снарядами и целью
     */
    setupCollisions() {
        // Слушаем события создания снарядов
        this.events.on('projectile_created', (projectile) => {
            this.projectiles.push(projectile);
            console.log(`🎯 [TestBehaviors] Снаряд добавлен в группу. Всего снарядов: ${this.projectiles.length}`);
        });
        
        // Слушаем события уничтожения снарядов
        this.events.on('projectile_destroyed', (projectile) => {
            const index = this.projectiles.indexOf(projectile);
            if (index > -1) {
                this.projectiles.splice(index, 1);
                console.log(`🎯 [TestBehaviors] Снаряд удален из группы. Осталось снарядов: ${this.projectiles.length}`);
            }
        });
        
        // Слушаем события попадания снарядов
        this.events.on('projectile_hit', (data) => {
            console.log(`💥 [TestBehaviors] Снаряд попал в цель! Урон: ${data.damage}`);
        });
    }
    
    /**
     * Создание цели по клику мыши
     */
    createTarget(x, y) {
        // Удаляем старую цель
        if (this.target) {
            this.target.destroy();
        }
        
        // Создаем яйцо как цель
        this.target = Egg.CreateEgg(this, x, y, {
            health: 100,
            damage: 0, // Яйцо не атакует
            attackRange: 0,
            cooldown: 0
        });
        
        // Устанавливаем цель для всех врагов
        this.enemies.forEach(enemy => {
            if (enemy && enemy.isAlive) {
                enemy.setTarget(this.target);
            }
        });
        
        console.log(`🥚 [TestBehaviors] Яйцо создано в (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
    
    /**
     * Удаление всех врагов
     */
    clearAllEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy && enemy.isAlive) {
                enemy.destroy();
            }
        });
        this.enemies = [];
    }
    
    /**
     * Добавление инструкции
     */
    addInstruction() {
        const { width } = this.scale;
        
        // Заголовок
        this.add.text(width / 2, 20, 'Тест поведений врагов', {
            fontSize: '24px',
            fill: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(15);
        
        // Инструкция
        this.add.text(width / 2, 50, 'Клик по кнопке = создать врага | Клик по экрану = создать цель', {
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5).setDepth(15);
        
        // Дополнительная инструкция для кнопки крота
        this.add.text(width / 2, 70, 'Оранжевая кнопка справа = крот с delayedCall (тест конфликта таймеров)', {
            fontSize: '12px',
            fill: '#FF6B35',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(15);
    }
    
    /**
     * Обновление сцены
     */
    update(time, delta) {
        // Обновляем врагов
        this.enemies.forEach(enemy => {
            if (enemy && enemy.isAlive) {
                // Явно вызываем update для врага
                enemy.update(time, delta);
            }
        });
        
        // Проверяем коллизии между снарядами и целью
        this.checkProjectileCollisions();
    }
    
    /**
     * Проверка коллизий между снарядами и целью
     */
    checkProjectileCollisions() {
        if (!this.target || !this.target.isAlive) return;
        
        this.projectiles.forEach(projectile => {
            if (projectile && projectile.active) {
                // Проверяем расстояние между снарядом и целью
                const distance = Phaser.Math.Distance.Between(
                    projectile.x, projectile.y,
                    this.target.x, this.target.y
                );
                
                // Если снаряд близко к цели (радиус попадания 20 пикселей)
                if (distance < 20) {
                    console.log(`💥 [TestBehaviors] Снаряд попал в цель! Расстояние: ${distance.toFixed(1)}px`);
                    
                    // Наносим урон цели
                    if (this.target.takeDamage) {
                        this.target.takeDamage(projectile.damage, projectile.source);
                    }
                    
                    // Уничтожаем снаряд
                    projectile.destroy();
                }
            }
        });
    }
    
    /**
     * Очистка при уничтожении сцены
     */
    destroy() {
        // Очищаем врагов
        this.clearAllEnemies();
        
        // Очищаем цель
        if (this.target) {
            this.target.destroy();
        }
        
        // Очищаем систему эффектов
        if (this.effectSystem) {
            this.effectSystem.destroy();
        }
        
        // Очищаем кнопки
        this.enemyButtons.forEach(btn => {
            if (btn.button) btn.button.destroy();
            if (btn.emoji) btn.emoji.destroy();
        });
        this.enemyButtons = [];
        
        // Очищаем подсказку и таймер
        if (this.tooltipTimer) {
            this.tooltipTimer.remove();
            this.tooltipTimer = null;
        }
        this.hideTooltip();
        
        super.destroy();
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventHandlers() {
        // Обработчик спавна врагов от самки паука
        this.events.on('enemy:spawn', (spawnData) => {
            console.log('🕷️ [TestBehaviors] Получено событие спавна:', spawnData);
            
            if (spawnData.enemyType && spawnData.x && spawnData.y) {
                const enemy = this.createEnemy(spawnData.enemyType, spawnData.x, spawnData.y);
                
                // Если спавнимый враг - снаряд, и есть цель, устанавливаем её
                if (spawnData.enemyType === 'projectile' && spawnData.target && enemy && enemy.aiCoordinator) {
                    console.log('🎯 [TestBehaviors] Устанавливаем цель для спавненного снаряда');
                    enemy.aiCoordinator.setTarget(spawnData.target);
                }
            }
        });
        
        console.log('🎮 [TestBehaviors] Обработчики событий настроены');
    }
}