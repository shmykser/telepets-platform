/**
 * Утилиты для создания фоновых тайловых текстур
 */
export class BackgroundUtils {
    
    /**
     * Создает тайловый фон из текстуры
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {string} textureKey - Ключ текстуры для тайлинга
     * @param {number} width - Ширина фона
     * @param {number} height - Высота фона
     * @param {number} tileSize - Размер одного тайла (по умолчанию размер текстуры)
     * @returns {Phaser.GameObjects.TileSprite} Тайловый спрайт
     */
    static createTiledBackground(scene, textureKey, width, height, tileSize = null) {
        // Проверяем, существует ли текстура
        if (!scene.textures.exists(textureKey)) {
            console.warn(`Texture ${textureKey} not found, using fallback`);
            // Создаем простой цветной фон как fallback
            return scene.add.rectangle(width / 2, height / 2, width, height, 0x4a7c59);
        }
        
        // Получаем размер текстуры, если не указан
        const texture = scene.textures.get(textureKey);
        const textureWidth = texture.source[0].width;
        const actualTileSize = tileSize || textureWidth;
        
        // Создаем тайловый спрайт
        const tileSprite = scene.add.tileSprite(
            width / 2,   // x позиция (центр)
            height / 2,  // y позиция (центр)
            width,       // ширина
            height,      // высота
            textureKey   // ключ текстуры
        );
        
        // В Phaser 3 размер тайла устанавливается через tileScale
        if (actualTileSize !== textureWidth) {
            const scale = actualTileSize / textureWidth;
            tileSprite.setTileScale(scale, scale);
        }
        
        return tileSprite;
    }
    
    /**
     * Создает травяной фон для игровых сцен
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {Object} options - Опции для создания фона
     * @returns {Phaser.GameObjects.TileSprite} Травяной фон
     */
    static createGrassBackground(scene, options = {}) {
        const { width, height } = scene.scale;
        
        const config = {
            textureKey: 'grass_texture',
            width: width,
            height: height,
            tileSize: options.tileSize || 64, // Размер тайла травы
            ...options
        };
        
        return this.createTiledBackground(
            scene,
            config.textureKey,
            config.width,
            config.height,
            config.tileSize
        );
    }
    
    /**
     * Создает многослойный фон (например, трава + камни)
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {Array} layers - Массив слоев фона
     * @returns {Array} Массив созданных фоновых слоев
     */
    static createLayeredBackground(scene, layers) {
        const backgrounds = [];
        
        layers.forEach((layer, index) => {
            const { width, height } = scene.scale;
            
            const background = this.createTiledBackground(
                scene,
                layer.textureKey,
                width,
                height,
                layer.tileSize
            );
            
            // Устанавливаем глубину слоя
            if (layer.depth !== undefined) {
                background.setDepth(layer.depth);
            } else {
                background.setDepth(index);
            }
            
            // Настраиваем прозрачность
            if (layer.alpha !== undefined) {
                background.setAlpha(layer.alpha);
            }
            
            backgrounds.push(background);
        });
        
        return backgrounds;
    }
    
    /**
     * Анимирует тайловый фон (движение текстуры)
     * @param {Phaser.GameObjects.TileSprite} tileSprite - Тайловый спрайт
     * @param {Object} options - Опции анимации
     */
    static animateTileBackground(tileSprite, options = {}) {
        const config = {
            speedX: 0,
            speedY: 0,
            duration: 10000, // 10 секунд
            ...options
        };
        
        // Создаем анимацию движения тайла
        tileSprite.scene.tweens.add({
            targets: tileSprite,
            tilePositionX: { from: 0, to: config.speedX },
            tilePositionY: { from: 0, to: config.speedY },
            duration: config.duration,
            repeat: -1, // Бесконечное повторение
            ease: 'Linear'
        });
    }
    
    /**
     * Создает травяной фон с анимацией
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {Object} options - Опции для создания и анимации
     * @returns {Phaser.GameObjects.TileSprite} Анимированный травяной фон
     */
    static createAnimatedGrassBackground(scene, options = {}) {
        const background = this.createGrassBackground(scene, options);
        
        // Добавляем легкую анимацию ветра
        if (options.animate !== false) {
            this.animateTileBackground(background, {
                speedX: 16, // Небольшое горизонтальное движение
                speedY: 8,  // Небольшое вертикальное движение
                duration: 15000, // 15 секунд на цикл
                ...options.animation
            });
        }
        
        return background;
    }
}
