/**
 * Сцена предзагрузки всех ассетов игры
 * Загружает спрайты врагов, защиты и другие ресурсы
 */
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Создаем прогресс-бар загрузки
        this.createProgressBar();
        
        // Загружаем спрайты врагов
        this.loadEnemySprites();

        // Загружаем спрайты предметов
        this.loadItemSprites();
        
        // Загружаем другие ассеты (если есть)
        this.loadOtherAssets();
        
        // Обработчики событий загрузки
        this.load.on('progress', this.updateProgress, this);
        this.load.on('complete', this.onLoadComplete, this);
    }

    createProgressBar() {
        const { width, height } = this.scale;
        
        // Фон прогресс-бара
        const progressBg = this.add.rectangle(width / 2, height / 2, width * 0.8, 20, 0x333333);
        
        // Прогресс-бар
        const progressBar = this.add.rectangle(width / 2, height / 2, 0, 18, 0x00ff00);
        
        // Текст загрузки
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Загрузка...', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Сохраняем ссылки для обновления
        this.progressBar = progressBar;
        this.loadingText = loadingText;
    }

    loadEnemySprites() {
        // Список типов врагов из enemyTypes.js (только существующие файлы)
        const enemyTypes = [
            'ant', 'bee', 'butterfly', 'dragonfly', 'fly', 
            'ladybug', 'mosquito', 'rhinoceros', 'snail', 'spider'
        ];
        
        // Размеры спрайтов
        const sizes = ['32x32', '64x64', '128x128', '500x500'];
        
        // Загружаем все комбинации типов и размеров
        enemyTypes.forEach(enemyType => {
            sizes.forEach(size => {
                const textureKey = `${enemyType}_${size}`;
                const texturePath = `/games/assets/graphics/sprites/enemy/${enemyType}_${size}.png`;
                
                this.load.image(textureKey, texturePath);
            });
        });
    }

    loadItemSprites() {
        const itemTypes = ['heart', 'clover', 'patch', 'doublepatch', 'shovel']; // только существующие предметы
        const sizes = ['32x32', '64x64', '128x128'];
        
        itemTypes.forEach(itemType => {
            sizes.forEach(size => {
                const textureKey = `${itemType}_${size}`;
                const texturePath = `/games/assets/graphics/sprites/item/${itemType}_${size}.png`;
                
                try {
                    this.load.image(textureKey, texturePath);
                } catch (error) {
                    console.log(`Item sprite not found: ${texturePath}`);
                }
            });
        });
    }

    loadOtherAssets() {
        // Здесь можно добавить загрузку других ассетов
        // Например, спрайты защиты, UI элементы и т.д.
        
        // Загружаем спрайты защиты
        this.loadDefenseSprites();
        
        // Загружаем спрайты яйца
        this.loadEggSprites();
        
        // Загружаем текстуры фона
        this.loadBackgroundTextures();
    }

    loadDefenseSprites() {
        // Проверяем, есть ли спрайты защиты в папке
        const defenseTypes = ['donut', 'stone', 'shell', 'pit']; // Обновлен список согласно defenseTypes.js
        const sizes = ['32x32', '64x64', '128x128'];
        
        defenseTypes.forEach(defenseType => {
            sizes.forEach(size => {
                const textureKey = `${defenseType}_${size}`;
                const texturePath = `/games/assets/graphics/sprites/defense/${defenseType}_${size}.png`;
                
                // Пытаемся загрузить, но не критично если файла нет
                try {
                    this.load.image(textureKey, texturePath);
                } catch (error) {
                    console.log(`Defense sprite not found: ${texturePath}`);
                }
            });
        });
    }
    
    loadEggSprites() {
        // Загружаем спрайты яйца
        const sizes = ['32x32', '64x64', '128x128'];
        
        sizes.forEach(size => {
            const textureKey = `egg_${size}`;
            const texturePath = `/games/assets/graphics/sprites/egg/egg_${size}.png`;
            
            try {
                this.load.image(textureKey, texturePath);
            } catch (error) {
                console.log(`Egg sprite not found: ${texturePath}`);
            }
        });
    }
    
    loadBackgroundTextures() {
        // Загружаем текстуру травы для тайлинга
        this.load.image('grass_texture', '/games/assets/graphics/backgrounds/grass.png');
        
        // Можно добавить другие фоновые текстуры
        // this.load.image('dirt_texture', '/TelepetsMiniGames/assets/graphics/backgrounds/dirt.png');
        // this.load.image('stone_texture', '/TelepetsMiniGames/assets/graphics/backgrounds/stone.png');
    }

    updateProgress(progress) {
        if (this.progressBar) {
            const { width } = this.scale;
            this.progressBar.width = width * 0.8 * progress;
        }
        
        if (this.loadingText) {
            this.loadingText.setText(`Загрузка... ${Math.round(progress * 100)}%`);
        }
    }

    onLoadComplete() {
        // Проверяем URL параметры для определения стартовой сцены
        const urlParams = new URLSearchParams(window.location.search);
        const gameType = urlParams.get('game_type');
        
        console.log('🎮 [PreloadScene] Load complete, game_type:', gameType);
        
        // Если указан game_type=pet_thief, запускаем PetThiefScene напрямую
        if (gameType === 'pet_thief') {
            console.log('🚀 [PreloadScene] Starting PetThiefScene directly');
            this.scene.start('PetThiefScene');
        } else {
            // Иначе переходим к главному меню
            console.log('📋 [PreloadScene] Starting MenuScene');
            this.scene.start('MenuScene');
        }
    }
}
