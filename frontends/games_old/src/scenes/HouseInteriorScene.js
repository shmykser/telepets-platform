/**
 * Сцена интерьера дома
 * Показывается когда игрок входит в жилище
 */

import { Chest } from '../objects/Chest.js';
import { HTMLButton } from '../components/HTMLButton.js';

export class HouseInteriorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HouseInteriorScene' });
        
        // Данные дома
        this.houseData = null;
        this.returnData = null; // Данные для возврата в мир
    }
    
    /**
     * Инициализация с данными дома
     */
    init(data) {
        console.log('🏠 [HouseInterior] Инициализация с данными:', data);
        
        this.houseData = data.house || {};
        this.pet = data.pet || null; // Ссылка на питомца
        this.returnData = {
            petPosition: data.petPosition || { x: 1500, y: 1500 },
            worldData: data.worldData || null,
            collectedItems: data.collectedItems || { coins: 0, jewels: 0, keys: 0 }
        };
    }
    
    /**
     * Создание сцены
     */
    create() {
        console.log('🏠 [HouseInterior] Создание интерьера дома');
        
        const { width, height } = this.scale;
        
        // Фон комнаты
        this.createBackground();
        
        // Информация о доме
        this.createHouseInfo();
        
        // Создаём сундуки
        this.createChests();
        
        // UI
        this.createUI();
        
        // Обработчики событий
        this.setupEventHandlers();
        
        console.log('🏠 [HouseInterior] Интерьер создан');
    }
    
    /**
     * Создание фона комнаты
     */
    createBackground() {
        const { width, height } = this.scale;
        
        // Пол (коричневый прямоугольник)
        const floor = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x8B4513 // Коричневый
        ).setDepth(0);
        
        // Узор на полу
        for (let i = 0; i < 10; i++) {
            const line = this.add.rectangle(
                width / 10 * i,
                0,
                2,
                height,
                0x654321
            ).setDepth(1);
        }
        
        // Стены (темнее)
        const wallTop = this.add.rectangle(
            width / 2,
            30,
            width,
            60,
            0x654321
        ).setDepth(2);
        
        const wallBottom = this.add.rectangle(
            width / 2,
            height - 30,
            width,
            60,
            0x654321
        ).setDepth(2);
        
        console.log('🏠 [HouseInterior] Фон создан');
    }
    
    /**
     * Информация о доме
     */
    createHouseInfo() {
        const { width } = this.scale;
        
        // Определяем чей это дом
        const isPlayerHouse = this.houseData.isPlayerHouse || false;
        const ownerName = this.houseData.ownerName || 'Неизвестный';
        
        let titleText = isPlayerHouse ? '🏡 МОЙ ДОМ' : `🏠 Дом ${ownerName}`;
        
        const title = this.add.text(
            width / 2,
            80,
            titleText,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(100);
        
        // Подсказка
        if (!isPlayerHouse) {
            const hint = this.add.text(
                width / 2,
                120,
                'Собери сокровища и уходи!',
                {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5).setDepth(100);
        }
    }
    
    /**
     * Создание сундуков
     */
    createChests() {
        const { width, height } = this.scale;
        
        this.chests = [];
        
        // Проверяем наличие данных о сундуках
        const chestsData = this.houseData.chests || [];
        
        if (chestsData.length === 0) {
            console.warn('💰 [HouseInterior] Нет данных о сундуках для дома');
            return;
        }
        
        console.log(`💰 [HouseInterior] Создание ${chestsData.length} сундуков из данных мира`);
        
        // Позиции для сундуков (максимум 3)
        const positions = [
            { x: width * 0.3, y: height * 0.5 },
            { x: width * 0.5, y: height * 0.5 },
            { x: width * 0.7, y: height * 0.5 }
        ];
        
        // Создаем сундуки на основе готовых данных
        chestsData.forEach((chestData, i) => {
            const pos = positions[i % positions.length];
            
            // Пропускаем уже опустошенные сундуки
            if (chestData.isEmpty) {
                console.log(`💰 [HouseInterior] Сундук ${i} уже опустошен, пропускаем`);
                return;
            }
            
            const chest = new Chest(this, pos.x, pos.y, {
                id: chestData.id,
                coins: chestData.coins,
                jewels: chestData.jewels,
                keys: chestData.keys,
                isLocked: chestData.isLocked,
                lockLevel: chestData.lockLevel,
                ownerId: this.houseData.id
            });
            
            // Если сундук уже был открыт - открываем его сразу
            if (chestData.isOpened) {
                chest.isOpened = true;
                chest.setText('📦');
                chest.setAlpha(0.7);
                chest.disableInteractive();
            }
            
            // Обработчик открытия
            chest.on('chest:opened', (data) => {
                this.onChestOpened(data, chestData);
            });
            
            // Обработчик замка
            chest.on('chest:locked', (data) => {
                this.onChestLocked(data);
            });
            
            // Обработчик клика по сундуку
            chest.on('pointerdown', () => {
                console.log('💰 [HouseInterior] Клик по сундуку');
                chest.tryOpen();
            });
            
            this.chests.push(chest);
        });
    }
    
    
    /**
     * Создание UI
     */
    createUI() {
        const { width, height } = this.scale;
        
        // Счетчик собранного
        this.collectedText = this.add.text(
            width / 2,
            height - 100,
            this.getCollectedText(),
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(100);
        
        // Кнопка выхода
        this.exitButton = new HTMLButton(this, width / 2, height - 50, {
            text: '🚪 Выйти из дома',
            width: 150,
            height: 35,
            fontSize: 16,
            fontWeight: 'bold'
        });
        
        this.exitButton.setOnClick(() => {
            this.exitHouse();
        });
    }
    
    /**
     * Получить текст собранного
     */
    getCollectedText() {
        const { coins, jewels, keys } = this.returnData.collectedItems;
        
        let parts = [];
        if (coins > 0) parts.push(`💰 ${coins}`);
        if (jewels > 0) parts.push(`💎 ${jewels}`);
        if (keys > 0) parts.push(`🔑 ${keys}`);
        
        return parts.length > 0 ? `Собрано: ${parts.join(' ')}` : 'Пока ничего не собрано';
    }
    
    /**
     * Обработчики событий
     */
    setupEventHandlers() {
        // При нажатии ESC - выход
        this.input.keyboard.on('keydown-ESC', () => {
            this.exitHouse();
        });
    }
    
    /**
     * Обработчик открытия сундука
     */
    onChestOpened(data, chestData) {
        console.log('💰 [HouseInterior] Сундук открыт:', data);
        
        // Автоматически собираем содержимое
        const contents = data.chest.collectContents();
        
        if (contents) {
            // Добавляем к собранному
            this.returnData.collectedItems.coins += contents.coins;
            this.returnData.collectedItems.jewels += contents.jewels;
            this.returnData.collectedItems.keys += contents.keys;
            
            // Обновляем UI
            this.collectedText.setText(this.getCollectedText());
            
            // Эффект сбора
            this.showCollectionEffect(data.chest, contents);
            
            // Обновляем состояние сундука в данных мира
            if (chestData) {
                chestData.isOpened = true;
                chestData.isEmpty = true;
                chestData.coins = 0;
                chestData.jewels = 0;
                chestData.keys = 0;
            }
            
            console.log('💰 [HouseInterior] Добавлено к инвентарю:', contents);
            console.log('💾 [HouseInterior] Состояние сундука обновлено в данных мира');
        }
    }
    
    /**
     * Обработчик заперто сундука
     */
    onChestLocked(data) {
        console.log('🔒 [HouseInterior] Сундук заперт:', data);
        
        // Показываем сообщение
        const { width, height } = this.scale;
        
        const message = this.add.text(
            width / 2,
            height / 2,
            `🔒 Замок ${data.lockLevel} уровня!\nНужна отмычка или навык взлома`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);
        
        // Удаляем через 2 секунды
        this.time.delayedCall(2000, () => {
            message.destroy();
        });
        
        // TODO: В будущем добавим мини-игру взлома
    }
    
    /**
     * Обновление UI инвентаря (для совместимости с ChestLockpickingScene)
     */
    updateInventoryUI() {
        // Этот метод нужен для совместимости с ChestLockpickingScene
        // В будущем здесь можно добавить отображение инвентаря в интерьере
        console.log('🏠 [HouseInterior] Обновление UI инвентаря');
    }
    
    /**
     * Эффект сбора сокровищ
     */
    showCollectionEffect(chest, contents) {
        // Летящий текст
        const text = this.add.text(
            chest.x,
            chest.y,
            this.formatContents(contents),
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(150);
        
        // Анимация вверх и исчезновение
        this.tweens.add({
            targets: text,
            y: chest.y - 80,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                text.destroy();
            }
        });
    }
    
    /**
     * Форматировать содержимое для отображения
     */
    formatContents(contents) {
        let parts = [];
        if (contents.coins > 0) parts.push(`+${contents.coins} 💰`);
        if (contents.jewels > 0) parts.push(`+${contents.jewels} 💎`);
        if (contents.keys > 0) parts.push(`+${contents.keys} 🔑`);
        return parts.join('\n');
    }
    
    /**
     * Выход из дома
     */
    exitHouse() {
        console.log('🚪 [HouseInterior] Выход из дома, собрано:', this.returnData.collectedItems);
        
        // Очищаем сундуки
        if (this.chests) {
            this.chests.forEach(chest => chest.destroy());
        }
        
        // Очищаем кнопку
        if (this.exitButton) {
            this.exitButton.destroy();
        }
        
        // Возвращаемся в основную сцену с собранными предметами
        this.scene.stop('HouseInteriorScene');
        this.scene.resume('PetThiefScene');
        
        // Передаем собранное обратно
        this.scene.get('PetThiefScene').onReturnFromHouse(this.returnData);
    }
}

