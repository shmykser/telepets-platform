import Phaser from 'phaser';
import { Egg } from '../objects/Egg.js';
import { Enemy } from '../objects/Enemy.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { GestureSystem } from '../systems/GestureSystem.js';
import { GestureActionSystem } from '../systems/GestureActionSystem.js';
import { ProbabilitySystem } from '../systems/ProbabilitySystem.js';
import { EffectSystem } from '../systems/EffectSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { EffectHandler } from '../handlers/EffectHandler.js';
import { EnemyEffectSystem } from '../systems/EnemyEffectSystem.js';
import { StoneManager } from '../systems/StoneManager.js';
import { DragDropSystem } from '../systems/DragDropSystem.js';
import { ObstacleInteractionSystem } from '../systems/ObstacleInteractionSystem.js';
import { EVENT_TYPES } from '../types/EventTypes.js';
import { BACKGROUND_SETTINGS, DEPTH_CONSTANTS } from '../settings/GameSettings.js';
import { ABILITIES } from '../types/abilityTypes.js';
import { BackgroundUtils } from '../utils/BackgroundUtils.js';
import { SafeAreaUtils } from '../utils/SafeAreaUtils.js';
import { TelegramTimer } from '../components/TelegramTimer.js';
import { HTMLResultsTable } from '../components/HTMLResultsTable.js';
import { AbilitiesDisplay } from '../components/AbilitiesDisplay.js';

/**
 * Основная игровая сцена EggDefense
 * Конструктор из готовых классов и компонентов
 */
export class EggDefense extends Phaser.Scene {
    constructor() {
        super({ key: 'EggDefense' });
        this.isGameEnded = false;
        this.isGameStarted = false;
        this.isPaused = false;
        this.focusChangeTimeout = null;
        this.resultsTable = null;
        this.resultsTableRestartHandler = null;
        this.resultsTableMenuHandler = null;
        this.gameStartTime = null;
        
    }

    create() {
        
        // Сбрасываем флаги для корректного рестарта
        this.isGameEnded = false;
        this.isPaused = false;
        this.gameStartTime = null;
        this.isGameStarted = false; // Важно! Сбрасываем флаг начала игры
        
        
        // Создание игровых объектов
        this.createGameObjects();
        
        // Инициализация игровых систем
        this.initGameSystems();
        
        // Настройка UI (без таймера)
        this.setupUI();
        
        // Настройка обработчиков клавиш
        this.setupKeyboardHandlers();
        
        // Настройка обработчика изменения размера экрана
        this.setupResizeHandler();
        
        // Настройка обработчиков фокуса для паузы
        this.setupFocusHandlers();
        
        // HTML отображение способностей удалено
        
        // НЕ запускаем игру автоматически - только когда пользователь нажмет "ИГРАТЬ"
        
        // Инициализируем системы с задержкой, чтобы input был готов
        this.time.delayedCall(2000, () => {
            if (this.dragDropSystem) {
                this.dragDropSystem.initialize();
            }
            if (this.obstacleInteractionSystem) {
                this.obstacleInteractionSystem.initialize();
            }
        });
    }

    /**
     * Инициализация игровых систем
     */
    initGameSystems() {
        // Система событий (центральная)
        this.eventSystem = new EventSystem();
        
        // Система способностей
        this.abilitySystem = new AbilitySystem(this);
        
        // Система вероятности (централизованная)
        this.probabilitySystem = new ProbabilitySystem(this);
        this.probabilitySystem.init();
        
        // Система эффектов (для совместимости)
        this.effectSystem = new EffectSystem(this);
        
        // Массив защитных объектов (ям)
        this.defenses = [];
        
        // Обработчик эффектов (Event-Driven Architecture)
        this.effectHandler = new EffectHandler(this, this.eventSystem);
        
        // Инициализируем системы в классе Enemy
        Enemy.initDropSystems(this, this.egg, this.probabilitySystem, this.abilitySystem);
        Enemy.initEventSystem(this.eventSystem);
        
        // Инициализируем систему эффектов для врагов
        this.enemyEffectSystem = new EnemyEffectSystem(this);
        Enemy.initEffectSystem(this.enemyEffectSystem);
        
        // Система волн для спавна врагов
        this.waveSystem = new WaveSystem(this, this.probabilitySystem);
        
        // Система жестов
        this.gestureSystem = new GestureSystem(this, {
            onTap: (gesture) => this.handleGesture(gesture),
            onLongTap: (gesture) => this.handleGesture(gesture),
            onLine: (gesture) => this.handleGesture(gesture),
            onCircle: (gesture) => this.handleGesture(gesture),
            onTriangle: (gesture) => this.handleGesture(gesture)
        });
        
        // Система обработки жестов
        this.gestureActionSystem = new GestureActionSystem(
            this, 
            this.waveSystem.enemies, 
            this.defenses, // Передаем реальный массив защитных объектов
            this.egg,
            Enemy.itemDropSystem, // Передаем ItemDropSystem для обработки предметов
            this.abilitySystem // Передаем AbilitySystem для получения актуальных значений
        );

        // Система управления камнями
        this.stoneManager = new StoneManager(this);
        
        // Система drag & drop
        this.dragDropSystem = new DragDropSystem(this);
        
        // Система взаимодействия с препятствиями будет инициализирована в startGame()
        
        // Передаем систему способностей яйцу
        if (this.egg && this.abilitySystem) {
            this.egg.abilitySystem = this.abilitySystem;
            this.egg.scene.events.on('ability:upgraded', this.egg.onAbilityUpgraded, this.egg);
            
            // Инициализируем способности если они разблокированы
            this.egg.updateAura();
            this.egg.updateEggExplosion();
            
            // Удалена автопрокачка взрыва яйца при нулевом уровне
        }
        
        // Устанавливаем яйцо как цель для волновой системы
        this.waveSystem.setTarget(this.egg);
        
        // Настройка обработчиков событий
        this.setupEventHandlers();
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventHandlers() {
        // Обработчик обновления путей при изменении препятствий
        this.events.on(EVENT_TYPES.PATHFINDING_UPDATED, () => {
            // Обновляем пути всех врагов с активным pathfinding
            if (this.waveSystem && this.waveSystem.enemies) {
                this.waveSystem.enemies.forEach(enemy => {
                    if (enemy.pathfindingSystem && enemy.pathfindingSystem.updatePathForObstacles) {
                        enemy.pathfindingSystem.updatePathForObstacles();
                    }
                });
            }
        });
        
        // Обработчик спавна врагов от осы и других спавнеров
        this.events.on('enemy:spawn', (spawnData) => {
            if (this.gameObject?.enemyType === 'wasp') {
            }
            
            if (spawnData.enemyType && spawnData.x !== undefined && spawnData.y !== undefined) {
                
                // Создаем врага напрямую, как в тестовой сцене
                const enemy = this.createEnemy(spawnData.enemyType, spawnData.x, spawnData.y);
                
                
                // Применяем эффект вылета если есть launchEffect
                if (spawnData.launchEffect && spawnData.launchEffect.enabled && enemy && this.effectSystem) {
                    
                    // Применяем визуальный эффект вылета
                    this.effectSystem.applyEffect('launchEffect', enemy, 1.0, {
                        duration: spawnData.launchEffect.duration || 1000
                    });
                    
                }
                
                // Устанавливаем цель для спавнимого врага: приоритет целям из spawnData, иначе яйцо
                if (enemy && enemy.aiCoordinator && typeof enemy.aiCoordinator.setTarget === 'function') {
                    const target = spawnData.target || this.egg;
                    if (target) {
                        enemy.aiCoordinator.setTarget(target);
                    }
                }
            } else {
                if (spawnData.parent?.enemyType === 'spiderQueen') {
                    console.warn(`🕷️👑 [EggDefense] QUEEN: enemy:spawn dropped due to invalid coords`, spawnData);
                }
            }
        });
        
        // Обработчик эффекта мёда - замедление всех врагов
        
        // Обновляем UI способностей сразу при изменении способностей (например, при поднятии лопаты)
        this.events.on('ability:upgraded', () => {
            if (this.abilitiesDisplay) {
                this.abilitiesDisplay.updateValues();
            }
        });
        this.events.on('abilities:reset', () => {
            if (this.abilitiesDisplay) {
                this.abilitiesDisplay.updateValues();
            }
        });
        
    }

    /**
     * Создание игровых объектов
     */
    createGameObjects() {
        // Создание травяного фона
        this.grassBackground = BackgroundUtils.createAnimatedGrassBackground(this, BACKGROUND_SETTINGS);
        
        // Устанавливаем фон на самый нижний слой
        this.grassBackground.setDepth(DEPTH_CONSTANTS.BACKGROUND);
        
        // Создание яйца в центре экрана (abilitySystem будет передан позже)
        this.egg = Egg.CreateEgg(
            this, 
            this.scale.width / 2, 
            this.scale.height / 2,
            {
                health: ABILITIES.EGG_HEALTH.baseValue,
                texture: '🥚',
                spriteKey: 'egg',
                size: 2
            }
        );
        
    }

    /**
     * Настройка обработчиков клавиш
     */
    setupKeyboardHandlers() {
        // Обработчик Space для вывода таблицы способностей
        this.input.keyboard?.on('keydown-SPACE', () => {
            this.toggleAbilitiesTable();
        });
    }

    /**
     * Переключение отображения таблицы способностей
     */
    toggleAbilitiesTable() {
        if (!this.abilitySystem) return;
        
        if (this.abilitiesDisplay) {
            // Переключаем видимость
            this.abilitiesDisplay.setVisible(!this.abilitiesDisplay.visible);
        } else {
            // Создаем таблицу способностей если её нет
            this.createAbilitiesDisplay();
        }
    }

    /**
     * Создание дисплея способностей
     */
    createAbilitiesDisplay() {
        if (!this.abilitySystem) return;
        
        // Вычисляем безопасную позицию с учетом safe-area
        const abilitiesX = SafeAreaUtils.getSafeRightPosition(this.scale.width, this.scale.width - 100, 200);
        const abilitiesY = SafeAreaUtils.getSafeTopPosition(100, 100);
        
        // Создаем дисплей способностей
        this.abilitiesDisplay = new AbilitiesDisplay(
            this,
            abilitiesX,
            abilitiesY,
            this.abilitySystem,
            {
                width: 180,
                height: 250,
                backgroundColor: 0x000000,
                backgroundAlpha: 0.9,
                borderColor: 0x00ff00,
                borderWidth: 2,
                textColor: '#ffffff',
                fontSize: '10px',
                padding: 8,
                lineHeight: 12
            }
        );
        
        // Устанавливаем глубину отображения
        this.abilitiesDisplay.setDepth(1000);
    }
    
    /**
     * Настройка обработчика изменения размера экрана
     */
    setupResizeHandler() {
        // Обработчик изменения размера экрана для обновления позиции UI элементов
        this.scale.on('resize', () => {
            this.updateUIPositions();
        });
    }

    /**
     * Настройка UI
     */
    setupUI() {
        // Создаем дисплей способностей в правом верхнем углу с учетом safe-area
        const safeAreaRight = SafeAreaUtils.getSafeAreaRight();
        const safeAreaTop = SafeAreaUtils.getSafeAreaTop();
        const abilitiesX = SafeAreaUtils.getSafeRightPosition(this.scale.width, this.scale.width - 100, 200);
        const abilitiesY = SafeAreaUtils.getSafeTopPosition(100, 100);
        
        // HTML отображение способностей будет создано в конце create()
    }
    
    /**
     * Создание таймера игры
     */
    createTimer() {
        // Вычисляем безопасную позицию с учетом safe-area
        const safeAreaTop = SafeAreaUtils.getSafeAreaTop();
        const timerY = SafeAreaUtils.getSafeTopPosition(30, 40);
        
        // Создаем Telegram WebApp-стилизованный таймер с точными параметрами
        this.telegramTimer = new TelegramTimer(
            this,
            this.scale.width / 2,
            timerY,
            70,  // Ширина (точная как у кнопок WebApp)
            36   // Высота (точная как у кнопок WebApp)
        );
    }
    
    /**
     * Обновление таймера
     */
    updateTimer() {
        if (!this.telegramTimer || !this.waveSystem || !this.isGameStarted) {
            return;
        }
        
        // Показываем таймер только если игра активна
        if (this.waveSystem.isGameActive) {
            this.telegramTimer.setVisible(true);
            
            const remainingTime = this.waveSystem.getRemainingTime();
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            
            // Форматируем время с ведущими нулями
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.telegramTimer.setText(timeString);
            
            // Меняем цвет в зависимости от оставшегося времени
            if (remainingTime <= 60000) { // Последняя минута - красный
                this.telegramTimer.setColor('#ff3b30'); // iOS red
            } else if (remainingTime <= 180000) { // Последние 3 минуты - желтый
                this.telegramTimer.setColor('#ffcc00'); // iOS yellow
            } else { // Обычное время - белый
                this.telegramTimer.setColor('#ffffff'); // Белый
            }
            
            // Обновляем позицию относительно canvas (только если нужно)
            if (this.game && this.game.canvas) {
                this.telegramTimer.updatePosition();
            }
        } else {
            // Скрываем таймер если игра не активна
            this.telegramTimer.setVisible(false);
        }
    }
    
    /**
     * Обновление позиции таймера при изменении размера экрана
     */
    updateTimerPosition() {
        if (!this.telegramTimer || !this.isGameStarted) return;
        
        // Вычисляем новую безопасную позицию
        const timerY = SafeAreaUtils.getSafeTopPosition(30, 40);
        
        // Обновляем позицию таймера
        this.telegramTimer.setPosition(this.scale.width / 2, timerY);
        this.telegramTimer.updatePosition();
    }
    
    /**
     * Обновление позиции UI элементов при изменении размера экрана
     */
    updateUIPositions() {
        // Обновляем позицию таймера только если игра началась
        if (this.isGameStarted) {
            this.updateTimerPosition();
        }
    }

    /**
     * Запуск игры из меню
     */
    startGameFromMenu() {
        
        this.isGameStarted = true;
        
        // Безопасно получаем время начала игры
        if (this.scene?.time?.now !== undefined) {
            this.gameStartTime = this.scene.time.now;
        } else {
            this.gameStartTime = Date.now();
        }
        
        this.startGame();
    }

    /**
     * Запуск игры
     */
    startGame() {
        
        // Создаем таймер только при старте игры
        this.createTimer();
        
        // Инициализируем камни на поле
        this.stoneManager.initializeStones();
        
        // Инициализируем систему взаимодействия с препятствиями
        this.obstacleInteractionSystem = new ObstacleInteractionSystem(this);
        
        // Отправляем событие начала игры
        this.eventSystem.emit(EVENT_TYPES.GAME_START, {
            scene: this
        });
        
        // Запускаем волновую систему
        this.waveSystem.startGame();
    }

    /**
     * Обработка жестов
     */
    handleGesture(gesture) {
        // Обновляем списки объектов в системе действий
        this.gestureActionSystem.updateObjects(
            this.waveSystem.enemies, 
            this.defenses // Передаем реальный массив защитных объектов
        );
        
        
        // Обрабатываем жест
        const success = this.gestureActionSystem.handleGesture(gesture);
        
        if (success) {
            // Можно добавить визуальную обратную связь через EffectSystem
        }
        
        return success;
    }

    /**
     * Проверка окончания игры
     */
    checkGameEnd() {
        if (this.isGameEnded || !this.isGameStarted) return;
        
        const timeUp = this.waveSystem.getRemainingTime() <= 0;
        const eggDestroyed = !this.egg || this.egg.health <= 0;
        
        if (timeUp || eggDestroyed) {
            this.gameOver(timeUp && !eggDestroyed);
        }
    }
    
    /**
     * Окончание игры с результатом
     */
    gameOver(won = false) {
        this.isGameEnded = true;
        
        
        // Отправляем событие окончания игры
        this.eventSystem.emit(EVENT_TYPES.GAME_END, {
            scene: this,
            won: won,
            stats: this.getGameStats()
        });
        
        // Останавливаем все системы
        this.waveSystem.stopGame();
        
        // Очищаем все предметы с экрана
        if (Enemy.itemDropSystem) {
            Enemy.itemDropSystem.clearAllItems();
        }
        
        // Показываем результат
        this.showGameResult(won);
        
        // Возвращаемся в меню через заданное время
        // this.time.delayedCall(GAME_SETTINGS.endGameDelay, () => {
        //     this.scene.start('MenuScene');
        // });
    }
    
    /**
     * Отображение результата игры
     */
    showGameResult(won) {
        // Скрываем HUD на экране результата
        if (this.abilitiesDisplay) {
            this.abilitiesDisplay.setVisible(false);
        }
        
        // Удаляем старый компонент результатов если он есть
        if (this.resultsTable) {
            this.resultsTable.destroy();
            this.resultsTable = null;
        }
        
        const stats = this.getGameStats();
        const resultText = won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!';
        
        // Создаем новый HTML компонент результатов
        this.resultsTable = new HTMLResultsTable(
            this,
            this.scale.width / 2, 
            this.scale.height / 2, 
            {
                title: resultText,
                data: {
                    enemiesKilled: stats.enemiesKilled,
                    time: stats.gameTimeText
                }
            }
        );
        
        // Удаляем старые обработчики если они есть
        if (this.resultsTableRestartHandler) {
            document.removeEventListener('resultsTable:restart', this.resultsTableRestartHandler);
        }
        if (this.resultsTableMenuHandler) {
            document.removeEventListener('resultsTable:menu', this.resultsTableMenuHandler);
        }
        
        // Создаем новые обработчики событий
        this.resultsTableRestartHandler = () => {
            console.log('🎮 [EggDefense] Рестарт игры из результатов');
            console.log('🎮 [EggDefense] Состояние перед рестартом:');
            console.log('🎮 [EggDefense] - isGameStarted:', this.isGameStarted);
            console.log('🎮 [EggDefense] - isGameEnded:', this.isGameEnded);
            console.log('🎮 [EggDefense] - waveSystem существует:', !!this.waveSystem);
            console.log('🎮 [EggDefense] - waveSystem.gameStartTime:', this.waveSystem?.gameStartTime);
            
            // Удаляем компонент результатов перед рестартом
            if (this.resultsTable) {
                this.resultsTable.destroy();
                this.resultsTable = null;
            }
            // Небольшая задержка для корректного удаления компонента
            setTimeout(() => {
                console.log('🎮 [EggDefense] Выполняем scene.restart()...');
                this.scene.restart();
            }, 50);
        };
        
        this.resultsTableMenuHandler = () => {
            console.log('🎮 [EggDefense] Переход в меню из результатов');
            // Удаляем компонент результатов перед переходом в меню
            if (this.resultsTable) {
                this.resultsTable.destroy();
                this.resultsTable = null;
            }
            // Небольшая задержка для корректного удаления компонента
            setTimeout(() => {
            this.scene.start('MenuScene');
            }, 50);
        };
        
        // Добавляем обработчики
        document.addEventListener('resultsTable:restart', this.resultsTableRestartHandler);
        document.addEventListener('resultsTable:menu', this.resultsTableMenuHandler);
    }
    
    /**
     * Получение статистики игры
     */
    getGameStats() {
        // Отладочная информация
        console.log('🎮 [GameStats] scene.time.now:', this.scene?.time?.now);
        console.log('🎮 [GameStats] waveSystem exists:', !!this.waveSystem);
        console.log('🎮 [GameStats] waveSystem.gameStartTime:', this.waveSystem?.gameStartTime);
        console.log('🎮 [GameStats] waveSystem.duration:', this.waveSystem?.waveSettings?.duration);
        console.log('🎮 [GameStats] waveSystem.remainingTime:', this.waveSystem?.getRemainingTime?.());
        
        let gameTime = 0;
        
        // Используем расчет времени из WaveSystem (как в старом компоненте)
        if (this.waveSystem && this.waveSystem.gameStartTime > 0) {
            // Вычисляем прошедшее время: общая длительность - оставшееся время
            const totalDuration = this.waveSystem.waveSettings.duration; // Общая длительность игры в мс
            const remainingTime = this.waveSystem.getRemainingTime(); // Оставшееся время в мс
            gameTime = Math.max(0, totalDuration - remainingTime); // Прошедшее время
            
            console.log('🎮 [GameStats] totalDuration:', totalDuration);
            console.log('🎮 [GameStats] remainingTime:', remainingTime);
            console.log('🎮 [GameStats] calculated gameTime:', gameTime);
        } else {
            // Fallback на старый метод если WaveSystem недоступен
            console.warn('🎮 [GameStats] WaveSystem недоступен, используем fallback');
            gameTime = this.scene?.time?.now || 0;
        }
        
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        
        console.log('🎮 [GameStats] Final gameTime:', gameTime, 'Formatted:', `${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        return {
            enemiesKilled: this.waveSystem?.totalEnemiesKilled || 0,
            gameTime: gameTime,
            gameTimeText: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            survived: this.egg && this.egg.health > 0
        };
    }
    
    /**
     * Пауза игры
     */
    pauseGame() {
        if (this.isPaused || this.isGameEnded) return;
        
        this.isPaused = true;
        this.scene.pause();
        
        console.log('🎮 [Game] Игра поставлена на паузу');
    }
    
    /**
     * Перезапуск игры
     */
    restartGame() {
        // Очищаем текущую сцену
        this.scene.restart();
    }
    
    /**
     * Окончание игры (устаревший метод для совместимости)
     */
    endGame() {
        this.gameOver(false);
    }

    /**
     * Обновление сцены
     */
    update(time, delta) {
        // Обновляем систему вероятности
        if (this.probabilitySystem) {
            this.probabilitySystem.update(time, delta);
        }
        
        // Обновляем волновую систему
        if (this.waveSystem) {
            this.waveSystem.update(time, delta);
        }
        
        // Обновляем всех врагов через WaveSystem
        if (this.waveSystem) {
            this.waveSystem.updateEnemies(time, delta);
        }
        
        // Дисплей способностей удален
        
        // Обновляем таймер только если игра началась - ВРЕМЕННО ОТКЛЮЧЕНО
        if (this.isGameStarted) {
            this.updateTimer();
        }
        
        // Проверяем условия окончания игры
        this.checkGameEnd();
    }

    /**
     * Очищает все защитные объекты (ямы)
     */
    clearDefenses() {
        if (this.defenses && this.defenses.length > 0) {
            console.log(`🧹 Очищаем ${this.defenses.length} защитных объектов`);
            this.defenses.forEach(defense => {
                if (defense && defense.destroy) {
                    defense.destroy();
                }
            });
            this.defenses = [];
        }
    }

    /**
     * Создание врага определенного типа
     */
    createEnemy(enemyType, x, y) {
        // Создаем врага
        const enemy = Enemy.CreateEnemy(this, enemyType, x, y);
        
        if (enemy) {
            // Если есть цель (яйцо), устанавливаем её
            if (this.egg) {
                enemy.setTarget(this.egg);
            }
            
            // Добавляем в список врагов WaveSystem для правильной интеграции
            if (this.waveSystem && this.waveSystem.enemies) {
                this.waveSystem.enemies.push(enemy);
            }
            
            
        }
        
        return enemy;
    }

    /**
     * Очистка при уничтожении сцены
     */
    destroy() {
        // Очищаем timeout для фокуса
        if (this.focusChangeTimeout) {
            clearTimeout(this.focusChangeTimeout);
            this.focusChangeTimeout = null;
        }
        
        // Очищаем EventSystem
        if (this.eventSystem) {
            this.eventSystem.clear();
        }
        
        // Очищаем EffectHandler
        if (this.effectHandler) {
            this.effectHandler.destroy();
        }
        
        // Уничтожаем все системы
        if (this.abilitySystem) {
            this.abilitySystem.destroy();
        }
        
        if (this.waveSystem) {
            this.waveSystem.destroy();
        }
        
        if (this.gestureSystem) {
            this.gestureSystem.destroy();
        }
        
        if (this.itemDropSystem) {
            this.itemDropSystem.destroy();
        }
        
        // Очищаем защитные объекты (ямы)
        this.clearDefenses();
        
        if (this.effectSystem) {
            this.effectSystem.clearAllEffects();
        }
        
        // HTML отображение способностей удалено
        
        if (this.enemyEffectSystem) {
            this.enemyEffectSystem.destroy();
        }
        
        // Очищаем таймер
        if (this.telegramTimer) {
            this.telegramTimer.destroy();
        }
        
        // Уничтожаем результаты таблицу
        if (this.resultsTable) {
            this.resultsTable.destroy();
        }
        
        // Удаляем обработчики событий результатов таблицы
        if (this.resultsTableRestartHandler) {
            document.removeEventListener('resultsTable:restart', this.resultsTableRestartHandler);
            this.resultsTableRestartHandler = null;
        }
        
        if (this.resultsTableMenuHandler) {
            document.removeEventListener('resultsTable:menu', this.resultsTableMenuHandler);
            this.resultsTableMenuHandler = null;
        }
    }
    
    /**
     * Настройка обработчиков фокуса для паузы игры
     */
    setupFocusHandlers() {
        // Используем только window events для более надежной работы
        if (typeof window !== 'undefined') {
            window.addEventListener('blur', () => {
                console.log('🎮 [Focus] Window blur event triggered');
                
                // Очищаем предыдущий timeout
                if (this.focusChangeTimeout) {
                    clearTimeout(this.focusChangeTimeout);
                }
                
                // Добавляем небольшую задержку для избежания множественных срабатываний
                this.focusChangeTimeout = setTimeout(() => {
                    if (this.isGameStarted && !this.isGameEnded && !this.isPaused) {
                        console.log('🎮 [Focus] Pausing game due to window blur');
                        this.pauseGame();
                    }
                }, 100);
            });
            
            window.addEventListener('focus', () => {
                console.log('🎮 [Focus] Window focus event triggered');
                console.log('🎮 [Focus] Debug - isGameStarted:', this.isGameStarted);
                console.log('🎮 [Focus] Debug - isGameEnded:', this.isGameEnded);
                console.log('🎮 [Focus] Debug - isPaused:', this.isPaused);
                
                // Очищаем предыдущий timeout
                if (this.focusChangeTimeout) {
                    clearTimeout(this.focusChangeTimeout);
                }
                
                // Добавляем небольшую задержку для избежания множественных срабатываний
                this.focusChangeTimeout = setTimeout(() => {
                    if (this.isGameStarted && !this.isGameEnded && this.isPaused) {
                        console.log('🎮 [Focus] Resuming game due to window focus');
                        this.resumeGame();
                    } else {
                        console.log('🎮 [Focus] Cannot resume - conditions not met');
                    }
                }, 100);
            });
        }
    }
    
    
    
    /**
     * Возобновление игры
     */
    resumeGame() {
        if (!this.isPaused || this.isGameEnded) return;
        
        this.isPaused = false;
        
        // Возобновляем Phaser сцену
        this.scene.resume();
        
        // Возобновляем волновую систему
        if (this.waveSystem) {
            this.waveSystem.resumeGame();
        }
        
        console.log('🎮 [Game] Игра возобновлена');
    }
    
}
