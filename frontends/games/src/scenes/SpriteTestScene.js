/**
 * Сцена для тестирования и демонстрации всех спрайтов врагов
 * Показывает все размеры каждого типа врага
 */
export class SpriteTestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpriteTestScene' });
    }

    create() {
        const { width, height } = this.scale;
        
        // Создаем фон
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
        
        // Заголовок
        this.add.text(width / 2, 50, 'ТЕСТ СПРАЙТОВ ВРАГОВ', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        // Информация о системе
        this.add.text(width / 2, 90, 'Проверка интеграции спрайтов вместо эмодзи', {
            fontSize: '18px',
            fill: '#bdc3c7',
            align: 'center'
        }).setOrigin(0.5);
        
        // Список типов врагов
        const enemyTypes = [
            'ant', 'bee', 'butterfly', 'dragonfly', 'fly', 
            'ladybug', 'mosquito', 'rhinoceros', 'spider'
        ];
        
        // Размеры спрайтов
        const sizes = ['32x32', '64x64', '128x128', '500x500'];
        const sizeLabels = ['Мелкий', 'Средний', 'Крупный', 'Очень крупный'];
        
        // Параметры отображения
        const startX = 100;
        const startY = 150;
        const spacingX = 120;
        const spacingY = 150;
        const rowsPerEnemy = 2;
        
        // Отображаем все спрайты
        enemyTypes.forEach((enemyType, enemyIndex) => {
            const row = Math.floor(enemyIndex / 2);
            const col = enemyIndex % 2;
            
            const baseX = startX + col * (spacingX * 4 + 100);
            const baseY = startY + row * spacingY;
            
            // Название типа врага
            this.add.text(baseX, baseY - 30, enemyType.toUpperCase(), {
                fontSize: '16px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Отображаем все размеры
            sizes.forEach((size, sizeIndex) => {
                const spriteKey = `${enemyType}_${size}`;
                const x = baseX + sizeIndex * spacingX;
                const y = baseY;
                
                // Проверяем, существует ли спрайт
                if (this.textures.exists(spriteKey)) {
                    // Отображаем спрайт
                    const sprite = this.add.sprite(x, y, spriteKey);
                    sprite.setScale(0.5); // Уменьшаем для лучшего отображения
                    
                    // Подпись с размером
                    this.add.text(x, y + 60, sizeLabels[sizeIndex], {
                        fontSize: '12px',
                        fill: '#00ff00', // Зеленый = спрайт найден
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    // Размер файла (если доступен)
                    this.add.text(x, y + 75, size, {
                        fontSize: '10px',
                        fill: '#bdc3c7',
                        align: 'center'
                    }).setOrigin(0.5);
                } else {
                    // Fallback - эмодзи
                    const fallbackEmoji = this.getFallbackEmoji(enemyType);
                    this.add.text(x, y, fallbackEmoji, {
                        fontSize: '48px',
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    // Подпись - fallback
                    this.add.text(x, y + 60, 'ЭМОДЗИ', {
                        fontSize: '12px',
                        fill: '#ff6b6b', // Красный = fallback
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    this.add.text(x, y + 75, 'fallback', {
                        fontSize: '10px',
                        fill: '#bdc3c7',
                        align: 'center'
                    }).setOrigin(0.5);
                }
            });
        });
        
        // Легенда
        this.add.text(width / 2, height - 100, 'ЛЕГЕНДА:', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height - 70, '🟢 Зеленый = Спрайт загружен  |  🔴 Красный = Эмодзи fallback', {
            fontSize: '14px',
            fill: '#bdc3c7',
            align: 'center'
        }).setOrigin(0.5);
        
        // Кнопка возврата в меню
        const backButton = this.add.rectangle(width / 2, height - 30, 200, 40, 0x34495e)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('MenuScene');
            });
        
        this.add.text(width / 2, height - 30, 'ВЕРНУТЬСЯ В МЕНЮ', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        // Эффекты кнопки
        backButton.on('pointerover', () => {
            backButton.setScale(1.05);
        });
        
        backButton.on('pointerout', () => {
            backButton.setScale(1);
        });
    }
    
    getFallbackEmoji(enemyType) {
        const emojiMap = {
            'ant': '🐜',
            'bee': '🐝',
            'butterfly': '🦋',
            'dragonfly': '🦇',
            'fly': '🦗',
            'ladybug': '🐞',
            'mosquito': '🦟',
            'rhinoceros': '🐛',
            'spider': '🕷️'
        };
        return emojiMap[enemyType] || '❓';
    }
}
