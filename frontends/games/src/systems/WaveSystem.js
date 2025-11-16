import { Enemy } from '../objects/Enemy.js';
import { enemyTypes } from '../types/enemyTypes';
import { WAVE_ENEMY_TYPES, enemyWeights, SPAWN_CONSTANTS, SPAWN_SETTINGS, WAVE_SETTINGS } from '../types/waveTypes.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

/**
 * Система волн в стиле Vampire Survivors
 * Управляет временными волнами, сложностью и спавном врагов
 */
export class WaveSystem {
    constructor(scene, probabilitySystem = null) {
        this.scene = scene;
        this.waveSettings = WAVE_SETTINGS;
        this.spawnSettings = SPAWN_SETTINGS;
        this.probabilitySystem = probabilitySystem;
        
        // Состояние игры
        this.gameStartTime = 0;
        this.currentMinute = this.waveSettings.startWave || 1;
        this.isGameActive = false;
        this.isGameEnded = false;
        
        // Статистика
        this.totalEnemiesSpawned = 0;
        this.totalEnemiesKilled = 0;
        this.currentEnemiesOnScreen = 0;
        
        // Настройки спавна
        this.spawnTimer = null;
        
        // Список врагов на экране
        this.enemies = [];
        
        // Цель для врагов (яйцо)
        this.target = null;
        
        // Привязываем методы
        this.update = this.update.bind(this);
        this.spawnEnemy = this.spawnEnemy.bind(this);
        this.spawnEnemyBatch = this.spawnEnemyBatch.bind(this);
    }
    
    /**
     * Запускает игру
     */
    startGame() {
        // Безопасно получаем время начала игры
        if (this.scene?.time?.now !== undefined) {
            this.gameStartTime = this.scene.time.now;
            console.log('🎮 [WaveSystem] gameStartTime установлен из scene.time.now:', this.gameStartTime);
        } else {
            console.warn('🎮 [WaveSystem] scene.time.now недоступен, используем Date.now()');
            this.gameStartTime = Date.now();
        }
        
        this.isGameActive = true;
        this.isGameEnded = false;
        this.currentMinute = this.waveSettings.startWave || 1;
        this.totalEnemiesSpawned = 0;
        this.totalEnemiesKilled = 0;
        this.currentEnemiesOnScreen = 0;
        this.enemies = [];
        
        
        // Запускаем спавн врагов
        this.startSpawning();
        
        // Эмитим событие начала игры
        this.scene.events.emit('gameStarted', {
            duration: this.waveSettings.duration
        });
    }
    
    /**
     * Останавливает игру
     */
    stopGame() {
        this.isGameActive = false;
        this.isGameEnded = true;
        
        // Останавливаем спавн
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        
        // Уничтожаем всех врагов при окончании игры (без засчета в статистику)
        this.enemies.forEach(enemy => {
            if (enemy && enemy.destroy) {
                // Устанавливаем флаг, что враг уничтожается принудительно
                enemy._forceDestroyed = true;
                enemy.destroy();
            }
        });
        this.enemies = [];
        
        // Эмитим событие окончания игры
        this.scene.events.emit('gameEnded', {
            totalEnemiesSpawned: this.totalEnemiesSpawned,
            totalEnemiesKilled: this.totalEnemiesKilled,
            gameTime: this.scene.time.now - this.gameStartTime
        });
    }
    
    /**
     * Возобновляет игру после паузы
     */
    resumeGame() {
        if (!this.isGameActive || this.isGameEnded) return;
        
        // Возобновляем спавн врагов
        this.startSpawning();
        
        console.log('🌊 [WaveSystem] Игра возобновлена');
    }
    
    /**
     * Запускает спавн врагов
     */
    startSpawning() {
        this.scheduleNextSpawn();
    }
    
    /**
     * Планирует следующий спавн
     */
    scheduleNextSpawn() {
        if (!this.isGameActive) return;
        
        // Проверяем лимит врагов на экране
        if (this.currentEnemiesOnScreen >= this.spawnSettings.maxEnemiesOnScreen) {
            // Если достигли лимита, ждем немного и пробуем снова
            this.spawnTimer = setTimeout(() => {
                this.scheduleNextSpawn();
            }, SPAWN_CONSTANTS.RETRY_DELAY);
            return;
        }
        
        // Вычисляем задержку до следующего спавна
        const delay = this.calculateSpawnDelay();
        
        this.spawnTimer = setTimeout(() => {
            this.spawnEnemyBatch();
            this.scheduleNextSpawn();
        }, delay);
    }
    
    /**
     * Вычисляет задержку до следующего спавна
     */
    calculateSpawnDelay() {
        const gameProgress = this.getGameProgress(); // 0-1
        const minRate = this.spawnSettings.minRate;
        const baseRate = this.spawnSettings.baseRate;
        
        // Экспоненциальное ускорение спавна
        const currentRate = baseRate * Math.pow(this.spawnSettings.rateMultiplier, gameProgress * SPAWN_CONSTANTS.SPAWN_RATE_MULTIPLIER);
        const finalRate = Math.max(minRate, currentRate);
        
        // Добавляем небольшую случайность
        const randomFactor = GeometryUtils.randomFloat(
            this.spawnSettings.randomFactor.min,
            this.spawnSettings.randomFactor.max
        );
        
        return finalRate * randomFactor;
    }
    
    /**
     * Создает врага
     */
    spawnEnemy() {
        if (!this.isGameActive) {
            return;
        }
        
        // Выбираем тип врага
        const enemyType = this.selectEnemyType();
        if (!enemyType) {
            return;
        }
        
        // Выбираем позицию спавна
        const position = this.getSpawnPosition();
        
        // Определяем коэффициент усиления через ProbabilitySystem
        const enhancementMultiplier = this.probabilitySystem 
            ? this.probabilitySystem.rollEnemyEnhancement() 
            : 1.0;
        
        // Создаем врага с усилением
        const enemy = Enemy.CreateEnemy(this.scene, enemyType, position.x, position.y, enhancementMultiplier);
        if (!enemy) {
            return;
        }
        
        
        // Добавляем в список
        this.enemies.push(enemy);
        this.currentEnemiesOnScreen++;
        this.totalEnemiesSpawned++;
        
        // Настраиваем обработчик смерти
        enemy.on('enemyKilled', this.onEnemyKilled.bind(this));
        
        // Устанавливаем цель для врага (яйцо)
        if (this.target) {
            enemy.setTarget(this.target);
        }
        
        // Эмитим событие спавна
        this.scene.events.emit('enemySpawned', {
            enemyType: enemyType,
            position: position,
            totalSpawned: this.totalEnemiesSpawned
        });
    }
    
    /**
     * Создает группу врагов (batch spawn)
     */
    spawnEnemyBatch(count = null) {
        if (!this.isGameActive) {
            return;
        }
        
        // Определяем количество врагов для спавна
        const enemiesToSpawn = count !== null ? count : this.spawnSettings.enemiesPerSpawn;
        
        // Проверяем лимит врагов на экране для всей группы
        const availableSlots = this.spawnSettings.maxEnemiesOnScreen - this.currentEnemiesOnScreen;
        const actualSpawnCount = Math.min(enemiesToSpawn, availableSlots);
        
        if (actualSpawnCount <= 0) {
            return;
        }
        
        // Создаем указанное количество врагов
        for (let i = 0; i < actualSpawnCount; i++) {
            this.spawnEnemy();
        }
        
        // Эмитим событие группового спавна
        this.scene.events.emit('enemyBatchSpawned', {
            spawnedCount: actualSpawnCount,
            requestedCount: enemiesToSpawn,
            totalSpawned: this.totalEnemiesSpawned
        });
    }
    
    /**
     * Выбирает тип врага для спавна
     */
    selectEnemyType() {
        const availableTypes = this.getAvailableEnemyTypes();
        if (availableTypes.length === 0) {
            return null;
        }
        
        // Получаем веса для доступных типов
        const weights = availableTypes.map(type => enemyWeights[type] || 1);
        
        // Выбираем случайный тип с учетом весов (используем простой метод)
        const selectedType = this.selectRandomWithWeights(availableTypes, weights);
        
        return selectedType;
    }
    
    /**
     * Выбирает случайный элемент с учетом весов
     */
    selectRandomWithWeights(items, weights) {
        if (items.length === 0) return null;
        if (items.length === 1) return items[0];
        
        // Вычисляем общий вес
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // Генерируем случайное число
        const random = Phaser.Math.Between(0, totalWeight - 1);
        
        // Находим элемент по весу
        let currentWeight = 0;
        for (let i = 0; i < items.length; i++) {
            currentWeight += weights[i];
            if (random < currentWeight) {
                return items[i];
            }
        }
        
        // Fallback - возвращаем последний элемент
        return items[items.length - 1];
    }
    
    /**
     * Получает доступные типы врагов для текущей минуты
     */
    getAvailableEnemyTypes() {
        // Возвращаем типы врагов ТОЛЬКО для текущей волны
        const typesForWave = WAVE_ENEMY_TYPES[this.currentMinute] || [];
        return [...new Set(typesForWave)];
    }
    
    /**
     * Получает позицию для спавна врага
     */
    getSpawnPosition() {
        const { width, height } = this.scene.scale;
        const margin = SPAWN_CONSTANTS.SPAWN_MARGIN;
        
        // Спавним по краям экрана
        const side = GeometryUtils.randomBetween(0, SPAWN_CONSTANTS.SPAWN_SIDES); // 0-верх, 1-право, 2-низ, 3-лево
        
        let x, y;
        switch (side) {
            case 0: // Верх
                x = GeometryUtils.randomBetween(margin, width - margin);
                y = margin; // внутри мира
                break;
            case 1: // Право
                x = width - margin; // внутри мира
                y = GeometryUtils.randomBetween(margin, height - margin);
                break;
            case 2: // Низ
                x = GeometryUtils.randomBetween(margin, width - margin);
                y = height - margin; // внутри мира
                break;
            case 3: // Лево
                x = margin; // внутри мира
                y = GeometryUtils.randomBetween(margin, height - margin);
                break;
        }
        
        return { x, y };
    }
    
    
    /**
     * Обработчик смерти врага
     */
    onEnemyKilled(enemy) {
        // Не засчитываем принудительно уничтоженных врагов
        if (enemy._forceDestroyed) {
            return;
        }
        
        this.totalEnemiesKilled++;
        this.currentEnemiesOnScreen--;
        
        // Удаляем из списка
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        // Эмитим событие смерти
        this.scene.events.emit('enemyKilled', {
            enemy: enemy,
            enemyType: enemy.enemyType,
            totalKilled: this.totalEnemiesKilled
        });
    }
    
    /**
     * Обновляет состояние менеджера
     */
    update() {
        if (!this.isGameActive) return;
        
        // Безопасно получаем текущее время
        const currentTime = this.scene?.time?.now !== undefined ? this.scene.time.now : Date.now();
        const gameTime = currentTime - this.gameStartTime;
        
        // Проверяем окончание игры
        if (gameTime >= this.waveSettings.duration) {
            this.stopGame();
            return;
        }
        
        // Обновляем текущую минуту
        const baseWave = this.waveSettings.startWave || 1;
        const newMinute = baseWave + GeometryUtils.floor(gameTime / this.waveSettings.waveDuration);
        if (newMinute !== this.currentMinute) {
            this.currentMinute = newMinute;
            this.onMinuteChanged();
        }
        
        // Очищаем мертвых врагов
        this.enemies = this.enemies.filter(enemy => enemy && enemy.isAlive);
    }
    
    /**
     * Обработчик смены минуты
     */
    onMinuteChanged() {
        const availableTypes = this.getAvailableEnemyTypes();
        
        // Эмитим событие смены минуты
        this.scene.events.emit('minuteChanged', {
            minute: this.currentMinute,
            availableEnemyTypes: availableTypes,
            gameProgress: this.getGameProgress()
        });
    }
    
    /**
     * Получает прогресс игры (0-1)
     */
    getGameProgress() {
        if (!this.isGameActive) return 0;
        
        // Безопасно получаем текущее время
        const currentTime = this.scene?.time?.now !== undefined ? this.scene.time.now : Date.now();
        const gameTime = currentTime - this.gameStartTime;
        return Math.min(1, gameTime / this.waveSettings.duration);
    }
    
    /**
     * Получает оставшееся время в миллисекундах
     */
    getRemainingTime() {
        if (!this.isGameActive) return 0;
        
        // Безопасно получаем текущее время
        const currentTime = this.scene?.time?.now !== undefined ? this.scene.time.now : Date.now();
        const gameTime = currentTime - this.gameStartTime;
        return Math.max(0, this.waveSettings.duration - gameTime);
    }
    
    /**
     * Получает текущую минуту игры
     */
    getCurrentMinute() {
        return this.currentMinute;
    }
    
    /**
     * Устанавливает цель для всех врагов
     */
    setTarget(target) {
        this.target = target;
        
        // Устанавливаем цель для всех существующих врагов
        this.enemies.forEach(enemy => {
            if (enemy && enemy.setTarget) {
                enemy.setTarget(target);
            }
        });
        
    }

    /**
     * Обновляет всех врагов (вынесено из EggDefense)
     */
    updateEnemies(time, delta) {
        this.enemies.forEach(enemy => {
            if (enemy && enemy.isAlive && enemy.update) {
                enemy.update(time, delta);
            }
        });
    }
    
    
    /**
     * Уничтожает менеджер
     */
    destroy() {
        this.stopGame();
        
        // Уничтожаем всех врагов
        this.enemies.forEach(enemy => {
            if (enemy && enemy.destroy) {
                enemy.destroy();
            }
        });
        
        this.enemies = [];
    }
}
