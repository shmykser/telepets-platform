/**
 * Основная игровая сцена Pet Thief v2.0
 * Локационная система с переходами между биомами
 */

import Phaser from 'phaser';
import { LocationGraphGenerator } from '../systems/world/generators/LocationGraphGenerator.js';
import { LocationGenerator } from '../systems/world/generators/LocationGenerator.js';
import { WorldRenderer } from '../systems/world/WorldRenderer.js';
import { LocationTransitionSystem } from '../systems/world/managers/LocationTransitionSystem.js';
import { LocationStateManager } from '../systems/world/managers/LocationStateManager.js';
import { MiniMap } from '../components/MiniMap.js';
import { Pet } from '../objects/Pet.js';
import { PetControlSystem } from '../systems/PetControlSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { ObstacleInteractionSystem } from '../systems/ObstacleInteractionSystem.js';
import { WORLD_SIZE, WORLD_CONSTANTS } from '../types/worldTypes.js';
import { SafeAreaUtils } from '../utils/SafeAreaUtils.js';
import { settings } from '../../config/settings.js';
import { getLockConfig } from '../types/lockTypes.js';

export class PetThiefScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PetThiefScene' });
        
        // Состояние игры
        this.isGameActive = false;
        this.pet = null;
        
        // Локационная система v2.0
        this.worldGraph = null;              // Граф мира
        this.currentLocation = null;         // Текущая локация
        this.locationGenerator = null;       // Генератор деталей локаций
        this.transitionSystem = null;        // Система переходов
        this.stateManager = null;            // Менеджер состояний
        this.miniMap = null;                 // Мини-карта
        
        // Системы
        this.worldRenderer = null;
        this.petControlSystem = null;
        this.eventSystem = null;
        this.obstacleInteractionSystem = null;
        
        // UI элементы
        this.inventoryUI = null;
        
        // Для обратной совместимости
        this.world = null;
        
        console.log('🎮 [PetThiefScene v2.0] Сцена создана');
        console.log('🎮 [PetThiefScene] Конструктор завершен');
    }
    
    /**
     * Получает данные питомца из URL параметров
     */
    getPetDataFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const petName = urlParams.get('pet_name');
        const userId = urlParams.get('user_id');
        const gameType = urlParams.get('game_type');
        
        return {
            petName: petName || 'Unknown Pet',
            userId: userId || 'unknown_user',
            gameType: gameType || 'pet_thief'
        };
    }
    
    /**
     * Создание сцены
     * @param {Object} data - Данные переданные из другой сцены
     */
    create(data) {
        console.log('🎮 [PetThiefScene] ===== CREATE METHOD CALLED =====');
        console.log('🎮 [PetThiefScene] Начало инициализации сцены...');
        console.log('🎮 [PetThiefScene] Данные сцены:', data);
        
        // Получаем параметры из URL
        this.petData = this.getPetDataFromURL();
        console.log('🐾 [PetThiefScene] Данные питомца:', this.petData);
        
        // Инициализируем мир асинхронно
        this.initializeWorldAsync(data);
        
        console.log('🎮 [PetThiefScene] Сцена инициализирована');
        console.log('🎮 [PetThiefScene] ===== CREATE METHOD FINISHED =====');
    }
    
    /**
     * Асинхронная инициализация мира
     */
    async initializeWorldAsync(data) {
        try {
            console.log('🌍 [PetThiefScene] ===== STARTING ASYNC INITIALIZATION =====');
            console.log('🌍 [PetThiefScene] Начало асинхронной инициализации мира...');
            
            // 1. Генерация или загрузка мира
            console.log('🌍 [PetThiefScene] Шаг 1: Инициализация мира...');
            await this.initializeWorld(data);
            console.log('🌍 [PetThiefScene] Шаг 1: Мир инициализирован');
            
            // 2. Рендеринг мира
            console.log('🌍 [PetThiefScene] Шаг 2: Рендеринг мира...');
            this.renderWorld();
            console.log('🌍 [PetThiefScene] Шаг 2: Мир отрендерен');
            
            // 3. Создание питомца
            console.log('🌍 [PetThiefScene] Шаг 3: Создание питомца...');
            this.createPet(data);
            console.log('🌍 [PetThiefScene] Шаг 3: Питомец создан');
            
            // 4. Настройка камеры
            console.log('🌍 [PetThiefScene] Шаг 4: Настройка камеры...');
            this.setupCamera();
            console.log('🌍 [PetThiefScene] Шаг 4: Камера настроена');
            
            // 5. Инициализация систем
            console.log('🌍 [PetThiefScene] Шаг 5: Инициализация систем...');
            this.initializeSystems();
            console.log('🌍 [PetThiefScene] Шаг 5: Системы инициализированы');
            
            // 6. Настройка UI
            console.log('🌍 [PetThiefScene] Шаг 6: Настройка UI...');
            this.setupUI();
            console.log('🌍 [PetThiefScene] Шаг 6: UI настроен');
            
            // 7. Настройка обработчиков событий
            console.log('🌍 [PetThiefScene] Шаг 7: Настройка обработчиков...');
            this.setupEventHandlers();
            console.log('🌍 [PetThiefScene] Шаг 7: Обработчики настроены');
            
            // 8. Запуск игры
            console.log('🌍 [PetThiefScene] Шаг 8: Запуск игры...');
            this.startGame();
            console.log('🌍 [PetThiefScene] Шаг 8: Игра запущена');
            
            // 9. Отправляем сообщение о готовности игры
            console.log('🌍 [PetThiefScene] Шаг 9: Отправка сообщения о готовности...');
            this.sendMessageToParent('GAME_READY', {
                message: 'Игра готова к запуску'
            });
            console.log('🌍 [PetThiefScene] Шаг 9: Сообщение отправлено');
            
            console.log('🌍 [PetThiefScene] Мир инициализирован успешно');
            console.log('🌍 [PetThiefScene] ===== ASYNC INITIALIZATION COMPLETED =====');
        } catch (error) {
            console.error('❌ [PetThiefScene] Ошибка инициализации мира:', error);
            console.error('❌ [PetThiefScene] Stack trace:', error.stack);
            this.showMessage('Ошибка загрузки игры. Попробуйте еще раз.');
        }
    }
    
    /**
     * Инициализация мира v2.0 - Локационная система
     * @param {Object} data 
     */
    async initializeWorld(data) {
        console.log('🗺️ =====================================================');
        console.log('🗺️ [PetThiefScene] ИНИЦИАЛИЗАЦИЯ МИРА v2.0');
        console.log('🗺️ =====================================================');
        
        // Определяем seed
        const seed = data && data.seed ? data.seed : this.generateDailySeed();
        console.log(`   Seed: ${seed}`);
        
        // Пытаемся загрузить сохранённый граф
        const savedGraph = await this.loadWorldGraph(seed);
        
        // Проверяем валидность загруженного графа
        if (savedGraph && this.validateWorldGraph(savedGraph)) {
            // Загружен сохранённый граф
            this.worldGraph = savedGraph;
            console.log('✅ Загружен сохранённый граф из LocalStorage');
        } else {
            // Если граф невалидный, очищаем старые данные
            if (savedGraph) {
                console.warn('⚠️ Загруженный граф невалиден, очищаем...');
                localStorage.removeItem(`world_graph_${seed}`);
                localStorage.removeItem(`location_states_${seed}`);
            }
            
            // Генерируем новый граф
            console.log('🔄 Генерация нового графа мира...');
            const graphGenerator = new LocationGraphGenerator(seed, settings.worldGeneration);
            this.worldGraph = graphGenerator.generate();
            
            // Сохраняем граф
            this.saveWorldGraph();
            console.log('✅ Новый граф сгенерирован и сохранён');
        }
        
        // Создаём менеджер состояний
        this.stateManager = new LocationStateManager(this.worldGraph);
        
        // Создаём генератор локаций
        this.locationGenerator = new LocationGenerator(seed, settings.worldGeneration);
        
        // Генерируем стартовую локацию и соседние
        await this.generateStartLocationAndAdjacent();
        
        // Получаем текущую локацию
        this.currentLocation = this.worldGraph.getCurrentLocation();
        
        // Создаём мини-карту
        if (settings.worldGeneration.miniMap.enabled) {
            this.miniMap = new MiniMap(this, this.worldGraph, settings.worldGeneration.miniMap);
        }
        
        // Для обратной совместимости создаём world объект
        this.createCompatibilityWorldObject();
        
        console.log('🗺️ =====================================================');
        console.log('🗺️ [PetThiefScene] ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        console.log(`   Локаций в графе: ${this.worldGraph.locations.size}`);
        console.log(`   Текущая локация: ${this.currentLocation.id}`);
        console.log('🗺️ =====================================================\n');
    }
    
    /**
     * Генерирует дневной seed (меняется каждый день)
     * @returns {string}
     */
    generateDailySeed() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }
    
    /**
     * Загружает граф мира из LocalStorage
     * @param {string} seed
     * @returns {WorldGraph|null}
     */
    async loadWorldGraph(seed) {
        try {
            const key = `world_graph_${seed}`;
            const json = localStorage.getItem(key);
            
            if (!json) {
                console.log('   ℹ️ Сохранённый граф не найден');
                return null;
            }
            
            const data = JSON.parse(json);
            const { WorldGraph } = await import('../systems/world/data/WorldGraph.js');
            const graph = WorldGraph.fromJSON(data);
            
            console.log(`   ✓ Граф загружен: ${graph.locations.size} локаций`);
            return graph;
        } catch (error) {
            console.error('❌ [PetThiefScene] Ошибка загрузки графа:', error);
            return null;
        }
    }
    
    /**
     * Проверяет валидность загруженного графа
     * @param {WorldGraph} graph
     * @returns {boolean}
     */
    validateWorldGraph(graph) {
        try {
            // Проверяем версию (автоматически очищаем старые версии)
            const REQUIRED_VERSION = '2.0';
            if (!graph.metadata || graph.metadata.version !== REQUIRED_VERSION) {
                console.warn(`⚠️ Граф имеет неподдерживаемую версию: ${graph.metadata?.version || 'unknown'}, требуется: ${REQUIRED_VERSION}`);
                return false;
            }
            
            // Проверяем наличие необходимых методов
            if (typeof graph.getStartLocation !== 'function') {
                console.error('❌ Граф не имеет метода getStartLocation');
                return false;
            }
            if (typeof graph.getCurrentLocation !== 'function') {
                console.error('❌ Граф не имеет метода getCurrentLocation');
                return false;
            }
            if (typeof graph.getAdjacentLocations !== 'function') {
                console.error('❌ Граф не имеет метода getAdjacentLocations');
                return false;
            }
            
            // Проверяем наличие локаций
            if (!graph.locations || graph.locations.size === 0) {
                console.error('❌ Граф не содержит локаций');
                return false;
            }
            
            // Проверяем наличие стартовой локации
            if (!graph.startLocationId) {
                console.error('❌ Граф не имеет стартовой локации');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка валидации графа:', error);
            return false;
        }
    }
    
    /**
     * Сохраняет граф мира в LocalStorage
     */
    saveWorldGraph() {
        if (!this.worldGraph) return;
        
        try {
            const key = `world_graph_${this.worldGraph.seed}`;
            const data = this.worldGraph.toJSON();
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`💾 Граф сохранён: ${key}`);
        } catch (error) {
            console.error('❌ [PetThiefScene] Ошибка сохранения графа:', error);
        }
    }
    
    /**
     * Генерирует стартовую локацию и соседние
     */
    async generateStartLocationAndAdjacent() {
        console.log('🎨 Генерация стартовой локации...');
        
        const startLocation = this.worldGraph.getStartLocation();
        
        if (!startLocation) {
            throw new Error('Стартовая локация не найдена!');
        }
        
        // Генерируем стартовую локацию
        await this.locationGenerator.generateLocationDetails(startLocation);
        
        // Генерируем соседние
        const adjacent = this.worldGraph.getAdjacentLocations(startLocation.id);
        for (const adjLocation of adjacent) {
            if (!adjLocation.generated) {
                await this.locationGenerator.generateLocationDetails(adjLocation);
            }
        }
        
        console.log(`✓ Стартовая локация и ${adjacent.length} соседних сгенерированы`);
    }
    
    /**
     * Создаёт объект world для обратной совместимости
     */
    createCompatibilityWorldObject() {
        const currentLoc = this.currentLocation;
        
        this.world = {
            // Текущая локация как "мир"
            size: currentLoc.size,
            biome: currentLoc.biome,
            zones: [{
                biomeType: currentLoc.biome,
                bounds: currentLoc.bounds
            }],
            objects: currentLoc.objects,
            
            // Для обратной совместимости
            obstacles: currentLoc.objects.obstacles,
            coins: currentLoc.objects.coins,
            lockpicks: currentLoc.objects.lockpicks,
            houses: currentLoc.objects.houses,
            playerHouse: currentLoc.objects.playerHouse,
            
            // Метаданные
            seed: this.worldGraph.seed,
            metadata: this.worldGraph.metadata
        };
    }
    
    /**
     * Рендеринг мира
     */
    renderWorld() {
        this.worldRenderer = new WorldRenderer(this, this.world);
        this.worldRenderer.render();
    }
    
    /**
     * Создание питомца
     * @param {Object} data 
     */
    createPet(data) {
        // Определяем стартовую позицию
        // Поддержка старой и новой структуры
        const playerHouse = this.world.playerHouse || this.world.objects?.playerHouse;
        const startPos = data && data.returnPosition 
            ? data.returnPosition 
            : playerHouse?.position || { x: this.world.size.width / 2, y: this.world.size.height / 2 };
        
        // Создаем питомца
        this.pet = Pet.CreatePet(this, startPos.x, startPos.y);
        
        console.log(`🐾 [PetThiefScene] Питомец создан в позиции (${startPos.x}, ${startPos.y})`);
    }
    
    /**
     * Настройка камеры
     */
    setupCamera() {
        const camera = this.cameras.main;
        
        // Устанавливаем границы камеры = границы мира
        const worldSize = this.world.size || WORLD_SIZE;
        camera.setBounds(0, 0, worldSize.width, worldSize.height);
        
        // Камера следует за питомцем с плавностью
        camera.startFollow(
            this.pet, 
            true, // roundPixels
            WORLD_CONSTANTS.CAMERA.FOLLOW_LERP, // lerpX
            WORLD_CONSTANTS.CAMERA.FOLLOW_LERP  // lerpY
        );
        
        // Устанавливаем зум
        camera.setZoom(WORLD_CONSTANTS.CAMERA.ZOOM);
        
        console.log('📷 [PetThiefScene] Камера настроена');
    }
    
    /**
     * Инициализация игровых систем
     */
    initializeSystems() {
        // Система событий
        this.eventSystem = new EventSystem();
        
        // Система управления питомцем
        this.petControlSystem = new PetControlSystem(this, this.pet);
        
        // ✨ НОВОЕ: Система переходов между локациями
        if (this.worldGraph && this.stateManager) {
            this.transitionSystem = new LocationTransitionSystem(
                this,
                this.worldGraph,
                this.stateManager
            );
            console.log('🚪 [PetThiefScene] Система переходов инициализирована');
            
            // Создаём маркеры выходов для стартовой локации
            this.transitionSystem.createExitMarkers(this.currentLocation);
        }
        
        // Система взаимодействия с препятствиями
        this.obstacleInteractionSystem = new ObstacleInteractionSystem(this);
        this.obstacleInteractionSystem.initialize();
        
        // Добавляем препятствия в систему
        const obstacles = this.worldRenderer.getObstacles();
        obstacles.forEach(obstacle => {
            if (obstacle.getData('obstacleData')) {
                this.obstacleInteractionSystem.addObstacle(obstacle);
            }
        });
        
        console.log('⚙️ [PetThiefScene] Системы инициализированы');
    }
    
    /**
     * Настройка UI
     */
    setupUI() {
        // Создаем UI инвентаря
        this.createInventoryUI();
        
        console.log('🖼️ [PetThiefScene] UI настроен');
    }
    
    /**
     * Создание UI инвентаря
     */
    createInventoryUI() {
        // Позиция с учетом safe area
        const x = SafeAreaUtils.getSafeLeftPosition(20, 20);
        const y = SafeAreaUtils.getSafeTopPosition(20, 20);
        
        // Инициализируем объект для отслеживания собранных предметов
        this.collectedItems = {
            coins: 0,
            jewels: 0,
            keys: 0
        };
        
        // Создаем контейнер для инвентаря
        this.inventoryUI = this.add.container(x, y);
        
        // Фон
        const background = this.add.rectangle(0, 0, 150, 120, 0x000000, 0.7);
        background.setOrigin(0);
        
        // Заголовок
        const title = this.add.text(10, 5, 'Инвентарь', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        });
        
        // Текст с монетами
        this.coinsText = this.add.text(10, 25, '💰 Монеты: 0', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00'
        });
        
        // Текст с драгоценностями (пока скрыт)
        this.jewelsText = this.add.text(10, 42, '💎 Драгоценности: 0', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#00ffff'
        });
        this.jewelsText.setVisible(false);
        
        // Текст с ключами (пока скрыт)
        this.keysText = this.add.text(10, 59, '🔑 Ключи: 0', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.keysText.setVisible(false);
        
        // Текст с отмычками (пока скрыт)
        this.lockpicksText = this.add.text(10, 76, '🔧 Отмычки: 0', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#00ffff'
        });
        this.lockpicksText.setVisible(false);
        
        
        // Кнопка завершения игры
        this.endGameButton = this.add.text(10, 95, '🏁 Завершить игру', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.endGameButton.setInteractive();
        this.endGameButton.on('pointerdown', () => {
            this.endGame(this.collectedItems.coins, this.collectedItems.jewels, this.collectedItems.keys);
        });
        this.endGameButton.on('pointerover', () => {
            this.endGameButton.setStyle({ backgroundColor: '#333333' });
        });
        this.endGameButton.on('pointerout', () => {
            this.endGameButton.setStyle({ backgroundColor: '#000000' });
        });
        
        // Добавляем элементы в контейнер
        this.inventoryUI.add([background, title, this.coinsText, this.jewelsText, this.keysText, this.lockpicksText, this.endGameButton]);
        
        // Устанавливаем глубину
        this.inventoryUI.setDepth(WORLD_CONSTANTS.DEPTH.UI);
        
        // Делаем неподвижным относительно камеры
        this.inventoryUI.setScrollFactor(0);
    }
    
    
    /**
     * Обновление UI инвентаря
     */
    updateInventoryUI() {
        if (!this.pet || !this.coinsText) return;
        
        const inventory = this.pet.inventory;
        
        // Обновляем текст монет
        this.coinsText.setText(`💰 Монеты: ${inventory.get('coins')}`);
        
        // Показываем драгоценности если они есть
        if (inventory.get('jewels') > 0 && this.jewelsText) {
            this.jewelsText.setVisible(true);
            this.jewelsText.setText(`💎 Драгоценности: ${inventory.get('jewels')}`);
        }
        
        // Показываем ключи если они есть
        if (inventory.get('keys') > 0 && this.keysText) {
            this.keysText.setVisible(true);
            this.keysText.setText(`🔑 Ключи: ${inventory.get('keys')}`);
        }
        
        // Показываем отмычки если они есть
        if (inventory.get('lockpicks') > 0 && this.lockpicksText) {
            this.lockpicksText.setVisible(true);
            this.lockpicksText.setText(`🔧 Отмычки: ${inventory.get('lockpicks')}`);
        } else if (this.lockpicksText) {
            // Скрываем если нет
            this.lockpicksText.setVisible(false);
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventHandlers() {
        // Обработка сбора монет
        this.events.on('pet:coinsCollected', (data) => {
            this.updateInventoryUI();
            console.log(`💰 [PetThiefScene] Собрано монет: +${data.amount} (всего: ${data.total})`);
        });
        
        // Обработка входа в дом
        this.events.on('pet:enterHouse', (data) => {
            console.log('🏠 [PetThiefScene] Вход в дом:', data);
            this.enterHouse(data.house);
        });
        
        // Обработка достижения цели
        this.events.on('pet:targetReached', (data) => {
            console.log('🎯 [PetThiefScene] Цель достигнута');
        });
        
        console.log('📡 [PetThiefScene] Обработчики событий настроены');
    }
    
    /**
     * Показать сообщение на экране
     * @param {string} message 
     */
    showMessage(message) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        const messageText = this.add.text(centerX, centerY, message, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10000);
        
        // Исчезает через 2 секунды
        this.tweens.add({
            targets: messageText,
            alpha: 0,
            duration: 1000,
            delay: 1000,
            onComplete: () => {
                messageText.destroy();
            }
        });
    }
    
    /**
     * Запуск игры
     */
    startGame() {
        this.isGameActive = true;
        console.log('🎮 [PetThiefScene] Игра запущена');
        
        // Показываем приветственное сообщение
        this.showMessage('Добро пожаловать в Pet Thief!');
    }
    
    /**
     * Обновление сцены (каждый кадр)
     * @param {number} time 
     * @param {number} delta 
     */
    update(time, delta) {
        if (!this.isGameActive) return;
        
        // Обновляем системы
        if (this.petControlSystem) {
            this.petControlSystem.update(time, delta);
        }
        
        // ✨ НОВОЕ: Обновляем систему переходов
        if (this.transitionSystem && this.pet) {
            this.transitionSystem.update(this.pet);
        }
        
        if (this.worldRenderer) {
            this.worldRenderer.update(time, delta);
        }
        
        // Обновляем питомца
        if (this.pet && this.pet.isAlive) {
            this.pet.update(time, delta);
        }
    }
    
    /**
     * Вход в дом
     * @param {Object} house - Данные дома
     */
    enterHouse(house) {
        console.log('🚪 [PetThiefScene] Попытка входа в дом:', house);
        
        // Сохраняем позицию питомца
        const petPosition = {
            x: this.pet.x,
            y: this.pet.y
        };
        
        // Проверяем замок
        const hasLock = house.security && house.security.level > 0;
        const isPlayerHouse = house.isPlayerHouse;
        
        // Свой дом всегда открыт
        if (isPlayerHouse) {
            console.log('🏡 [PetThiefScene] Это свой дом, входим без проверки');
            this.enterHouseInterior(house, petPosition);
            return;
        }
        
        // Проверяем, был ли дом уже взломан
        if (this.stateManager) {
            const locationState = this.stateManager.getLocationState(this.currentLocation.id);
            if (locationState && locationState.isHouseUnlocked(house.id)) {
                console.log('🔓 [PetThiefScene] Дом уже был взломан ранее');
                this.showMessage('🔓 Дом уже взломан');
                this.enterHouseInterior(house, petPosition);
                return;
            }
        }
        
        // Если есть замок - нужно взломать
        if (hasLock) {
            console.log('🔒 [PetThiefScene] Дом заперт! Уровень замка:', house.security.level);
            this.showMessage(`🔒 Дом заперт! Уровень замка: ${house.security.level}`);
            
        // Создаем замок для двери и запускаем взлом
        this.startDoorLockpicking(house, petPosition);
        } else {
            // Дом не заперт - входим свободно
            console.log('🚪 [PetThiefScene] Дом не заперт, входим свободно');
            this.showMessage('🚪 Дом не заперт, входим свободно');
            this.enterHouseInterior(house, petPosition);
        }
    }
    
    /**
     * Вход в интерьер дома (после успешного взлома или если не заперт)
     * @param {Object} house - Данные дома
     * @param {Object} petPosition - Позиция питомца
     */
    enterHouseInterior(house, petPosition) {
        console.log('✅ [PetThiefScene] Вход в интерьер дома');
        
        // Останавливаем сцену (но не уничтожаем)
        this.scene.pause('PetThiefScene');
        
        // Запускаем сцену интерьера с данными
        this.scene.launch('HouseInteriorScene', {
            house: house,
            petPosition: petPosition,
            worldData: this.world,
            collectedItems: this.collectedItems,
            pet: this.pet // Передаем ссылку на питомца
        });
    }
    
    /**
     * Получить ключ сцены для типа замка
     * @param {string} lockType - Тип замка
     * @returns {string} - Ключ сцены
     */
    getLockSceneKey(lockType) {
        switch (lockType) {
            case 'pin':
                return 'PinLockScene';
            case 'maze':
                return 'MazeLockScene';
            case 'pattern':
                return 'PatternLockScene';
            default:
                console.warn(`⚠️ [PetThiefScene] Неизвестный тип замка: ${lockType}, используем PinLockScene`);
                return 'PinLockScene';
        }
    }
    
    /**
     * Запуск взлома замка двери
     * @param {Object} house - Данные дома
     * @param {Object} petPosition - Позиция питомца
     */
    startDoorLockpicking(house, petPosition) {
        console.log('🔓 [PetThiefScene] Запуск взлома двери');
        
        // Проверяем наличие отмычек
        const lockpicks = this.pet.inventory.get('lockpicks');
        const cost = house.security.level; // Стоимость = уровень замка
        
        if (lockpicks < cost) {
            this.showMessage(`❌ Нужно ${cost} отмычек! У вас: ${lockpicks}`);
            return;
        }
        
        // Определяем тип замка и запускаем соответствующую сцену
        const lockType = house.security.lockType || 'pin';
        const lockLevel = house.security.level;
        
        console.log(`🔓 [PetThiefScene] Запуск взлома ${lockType} замка уровня ${lockLevel}`);
        
        // Останавливаем основную сцену (используем sleep вместо pause для полного скрытия)
        // Проверяем, что сцена активна перед попыткой sleep
        if (this.scene.isActive()) {
            this.scene.sleep('PetThiefScene');
        } else {
            console.warn('⚠️ [PetThiefScene] Сцена не активна, пропускаем sleep');
        }
        
        // Получаем конфигурацию замка из lockTypes.js
        const config = getLockConfig(lockType, lockLevel);
        
        // Запускаем соответствующую сцену взлома
        const sceneKey = this.getLockSceneKey(lockType);
        this.scene.launch(sceneKey, {
            pet: this.pet,
            lockType: lockType,
            lockLevel: lockLevel,
            cost: cost,
            config: config,
            onSuccess: () => {
                console.log('✅ [PetThiefScene] Дверь взломана!');
                
                // Сохраняем состояние дома как взломанного
                if (this.stateManager) {
                    this.stateManager.markHouseUnlocked(this.currentLocation.id, house.id);
                    console.log('💾 [PetThiefScene] Состояние дома сохранено');
                }
                
                this.enterHouseInterior(house, petPosition);
            },
            onFailure: () => {
                console.log('❌ [PetThiefScene] Провал взлома двери');
                // Обновляем отмычки
                this.pet.inventory.set('lockpicks', this.pet.inventory.get('lockpicks') - cost);
                this.updateInventoryUI();
            }
        });
    }
    
    
    /**
     * Возврат из дома
     * @param {Object} data - Данные возврата (собранные предметы)
     */
    onReturnFromHouse(data) {
        console.log('🚪 [PetThiefScene] Возврат из дома, собрано:', data.collectedItems);
        
        // Обновляем локальный счетчик
        this.collectedItems.coins += data.collectedItems.coins;
        this.collectedItems.jewels += data.collectedItems.jewels;
        this.collectedItems.keys += data.collectedItems.keys;
        
        // Добавляем в инвентарь питомца
        if (this.pet) {
            if (data.collectedItems.coins > 0) {
                this.pet.addCoins(data.collectedItems.coins);
            }
            if (data.collectedItems.jewels > 0) {
                this.pet.addJewels(data.collectedItems.jewels);
            }
            if (data.collectedItems.keys > 0) {
                this.pet.addKeys(data.collectedItems.keys);
            }
        }
        
        // Обновляем UI
        this.updateInventoryUI();
        
        // Показываем сообщение если что-то собрано
        if (data.collectedItems.coins > 0 || data.collectedItems.jewels > 0 || data.collectedItems.keys > 0) {
            const message = this.formatCollectedMessage(data.collectedItems);
            this.showMessage(message);
        }
    }
    
    /**
     * Форматирование сообщения о собранных предметах
     */
    formatCollectedMessage(items) {
        let parts = [];
        if (items.coins > 0) parts.push(`+${items.coins} 💰`);
        if (items.jewels > 0) parts.push(`+${items.jewels} 💎`);
        if (items.keys > 0) parts.push(`+${items.keys} 🔑`);
        return `Украдено: ${parts.join(', ')}`;
    }
    
    /**
     * Отправка сообщения родительскому окну (для интеграции с WebApp)
     */
    sendMessageToParent(type, payload = {}) {
        if (window.parent && window.parent !== window) {
            // Используем '*' для dev режима или document.referrer для prod
            // В dev режиме порты могут быть разные (3001 vs 5174)
            const targetOrigin = '*'; // Для dev режима
            window.parent.postMessage({
                type,
                payload
            }, targetOrigin);
            console.log(`📤 [PetThiefScene] Отправлено сообщение родителю: ${type}`, payload);
        }
    }

    /**
     * Завершение игры с результатами
     */
    endGame(coinsStolen = 0, jewelsStolen = 0, keysStolen = 0) {
        console.log('🎮 [PetThiefScene] Завершение игры...');
        
        // Отправляем результаты родительскому окну
        this.sendMessageToParent('GAME_END', {
            coinsStolen,
            jewelsStolen,
            keysStolen,
            totalStolen: coinsStolen + jewelsStolen + keysStolen
        });
        
        // Показываем результаты игроку
        this.showMessage(`Игра завершена! Украдено: ${coinsStolen} монет, ${jewelsStolen} драгоценностей, ${keysStolen} ключей`);
        
        // Через 3 секунды возвращаемся в меню
        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }
    
    /**
     * Очистка ресурсов при уничтожении сцены
     */
    shutdown() {
        console.log('🎮 [PetThiefScene] Завершение работы сцены...');
        
        // ✨ НОВОЕ: Сохраняем граф перед выходом
        if (this.worldGraph) {
            this.saveWorldGraph();
        }
        
        // ✨ НОВОЕ: Уничтожаем новые системы
        if (this.transitionSystem) {
            this.transitionSystem.destroy();
            this.transitionSystem = null;
        }
        
        if (this.stateManager) {
            this.stateManager.destroy();
            this.stateManager = null;
        }
        
        if (this.miniMap) {
            this.miniMap.destroy();
            this.miniMap = null;
        }
        
        // Очищаем системы
        if (this.petControlSystem) {
            this.petControlSystem.destroy();
        }
        
        if (this.worldRenderer) {
            this.worldRenderer.destroy();
        }
        
        if (this.obstacleInteractionSystem) {
            this.obstacleInteractionSystem.destroy();
        }
        
        if (this.eventSystem) {
            this.eventSystem.clear();
        }
        
        // Удаляем обработчики событий
        this.events.off('pet:coinsCollected');
        this.events.off('pet:enterHouse');
        this.events.off('pet:targetReached');
        
        this.isGameActive = false;
        
        console.log('🎮 [PetThiefScene] Сцена завершена');
    }
}

// ✨ ЯВНЫЙ ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ВИДИМОСТИ
// Это позволяет получить доступ к PetThiefScene из petthief.html
window.PetThiefScene = PetThiefScene;
console.log('🎮 [PetThiefScene] Экспортирован в window.PetThiefScene');

