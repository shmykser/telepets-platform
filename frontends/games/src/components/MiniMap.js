/**
 * MiniMap - мини-карта мира
 * Отображает весь граф локаций для навигации
 */

export class MiniMap {
    constructor(scene, worldGraph, config = {}) {
        this.scene = scene;
        this.worldGraph = worldGraph;
        
        // Конфигурация
        this.config = {
            width: config.width || 160,
            height: config.height || 220,
            position: config.position || 'topRight',
            offsetX: config.offsetX || 20,
            offsetY: config.offsetY || 20,
            scale: config.scale || 0.15,
            backgroundColor: config.backgroundColor || 0x000000,
            backgroundAlpha: config.backgroundAlpha || 0.8
        };
        
        // Создаём контейнер
        this.container = null;
        this.graphics = null;
        
        this.create();
        this.render();
        
        console.log('🗺️ [MiniMap] Создана');
    }
    
    /**
     * Создаёт контейнер мини-карты
     */
    create() {
        // Вычисляем позицию
        let x, y;
        
        switch (this.config.position) {
            case 'topRight':
                x = this.scene.scale.width - this.config.offsetX - this.config.width;
                y = this.config.offsetY;
                break;
            case 'topLeft':
                x = this.config.offsetX;
                y = this.config.offsetY;
                break;
            case 'bottomRight':
                x = this.scene.scale.width - this.config.offsetX - this.config.width;
                y = this.scene.scale.height - this.config.offsetY - this.config.height;
                break;
            case 'bottomLeft':
                x = this.config.offsetX;
                y = this.scene.scale.height - this.config.offsetY - this.config.height;
                break;
            default:
                x = this.scene.scale.width - this.config.offsetX - this.config.width;
                y = this.config.offsetY;
        }
        
        // Создаём контейнер
        this.container = this.scene.add.container(x, y);
        this.container.setScrollFactor(0);
        this.container.setDepth(1001);
        
        // Создаём graphics объект
        this.graphics = this.scene.add.graphics();
        this.container.add(this.graphics);
    }
    
    /**
     * Рендерит мини-карту
     */
    render() {
        this.graphics.clear();
        
        // Фон
        this.graphics.fillStyle(this.config.backgroundColor, this.config.backgroundAlpha);
        this.graphics.fillRoundedRect(0, 0, this.config.width, this.config.height, 5);
        
        // Заголовок
        const title = this.scene.add.text(
            this.config.width / 2,
            10,
            'КАРТА МИРА',
            {
                fontSize: '12px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5, 0);
        this.container.add(title);
        
        // Рендерим граф
        this.renderGraph();
    }
    
    /**
     * Рендерит граф локаций
     */
    renderGraph() {
        const offsetX = this.config.width / 2;
        const offsetY = this.config.height / 2 + 10;
        const scale = this.config.scale;
        
        const locations = Array.from(this.worldGraph.locations.values());
        
        // Вычисляем границы графа для центрирования
        const bounds = this.calculateGraphBounds(locations);
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        // 1. Рисуем все связи (линии)
        this.worldGraph.connections.forEach(connection => {
            const from = this.worldGraph.getLocation(connection.fromLocationId);
            const to = this.worldGraph.getLocation(connection.toLocationId);
            
            if (from && to) {
                const x1 = (from.position.x - centerX) * scale + offsetX;
                const y1 = (from.position.y - centerY) * scale + offsetY;
                const x2 = (to.position.x - centerX) * scale + offsetX;
                const y2 = (to.position.y - centerY) * scale + offsetY;
                
                // Цвет линии зависит от типа перехода
                let lineColor = 0x666666;
                let lineWidth = 2;
                
                if (connection.type === 'door') {
                    lineColor = 0x4444ff;
                    lineWidth = 1;
                }
                
                this.graphics.lineStyle(lineWidth, lineColor, 0.6);
                this.graphics.lineBetween(x1, y1, x2, y2);
            }
        });
        
        // 2. Рисуем локации
        locations.forEach(location => {
            const x = (location.position.x - centerX) * scale + offsetX;
            const y = (location.position.y - centerY) * scale + offsetY;
            
            const isCurrent = location.id === this.worldGraph.currentLocationId;
            const isStart = location.id === this.worldGraph.startLocationId;
            
            if (location.type === 'biome') {
                // Биомы - квадраты
                const size = 12;
                const color = this.getBiomeColor(location.biome);
                
                this.graphics.fillStyle(color, 0.8);
                this.graphics.fillRect(x - size/2, y - size/2, size, size);
                
                // Обводка
                const borderColor = isCurrent ? 0xffff00 : (isStart ? 0x00ff00 : 0xffffff);
                const borderWidth = isCurrent ? 3 : 2;
                this.graphics.lineStyle(borderWidth, borderColor, 1);
                this.graphics.strokeRect(x - size/2, y - size/2, size, size);
                
                // Иконка биома
                const icon = this.getBiomeIcon(location.biome);
                const iconText = this.scene.add.text(x, y, icon, {
                    fontSize: '10px'
                });
                iconText.setOrigin(0.5);
                this.container.add(iconText);
                
                // Подсветка текущей локации
                if (isCurrent) {
                    this.graphics.fillStyle(0xffff00, 0.3);
                    this.graphics.fillCircle(x, y, size + 4);
                }
                
            } else if (location.type === 'corridor') {
                // Коридоры - маленькие кружки
                const size = 4;
                const color = 0x888888;
                
                this.graphics.fillStyle(color, 0.6);
                this.graphics.fillCircle(x, y, size);
                
                if (isCurrent) {
                    this.graphics.lineStyle(2, 0xffff00, 1);
                    this.graphics.strokeCircle(x, y, size + 2);
                }
            }
        });
    }
    
    /**
     * Вычисляет границы графа
     * @param {Location[]} locations
     * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
     */
    calculateGraphBounds(locations) {
        if (locations.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        locations.forEach(loc => {
            if (loc.position.x < minX) minX = loc.position.x;
            if (loc.position.x > maxX) maxX = loc.position.x;
            if (loc.position.y < minY) minY = loc.position.y;
            if (loc.position.y > maxY) maxY = loc.position.y;
        });
        
        return { minX, maxX, minY, maxY };
    }
    
    /**
     * Получает цвет биома
     * @param {string} biome
     * @returns {number}
     */
    getBiomeColor(biome) {
        const colors = {
            forest: 0x2d8659,
            desert: 0xf4a460,
            snow: 0xe0f2ff,
            plains: 0x90ee90,
            corridor: 0x888888
        };
        return colors[biome] || 0x888888;
    }
    
    /**
     * Получает иконку биома
     * @param {string} biome
     * @returns {string}
     */
    getBiomeIcon(biome) {
        const icons = {
            forest: '🌲',
            desert: '🏜️',
            snow: '❄️',
            plains: '🌾',
            corridor: '·'
        };
        return icons[biome] || '?';
    }
    
    /**
     * Обновляет мини-карту
     * @param {Location} currentLocation
     */
    update(currentLocation) {
        // Очищаем старые объекты кроме graphics
        this.container.getAll().forEach(child => {
            if (child !== this.graphics) {
                child.destroy();
            }
        });
        
        // Перерисовываем
        this.render();
    }
    
    /**
     * Показывает мини-карту
     */
    show() {
        this.container.setVisible(true);
    }
    
    /**
     * Скрывает мини-карту
     */
    hide() {
        this.container.setVisible(false);
    }
    
    /**
     * Переключает видимость
     */
    toggle() {
        this.container.setVisible(!this.container.visible);
    }
    
    /**
     * Уничтожает мини-карту
     */
    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        
        console.log('🗑️ [MiniMap] Уничтожена');
    }
}


