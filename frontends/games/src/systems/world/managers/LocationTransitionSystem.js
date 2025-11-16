/**
 * LocationTransitionSystem - система переходов между локациями
 * Управляет перемещением игрока между локациями, генерацией и рендерингом
 */

import { LocationGenerator } from '../generators/LocationGenerator.js';

export class LocationTransitionSystem {
    constructor(scene, worldGraph, locationStateManager) {
        this.scene = scene;
        this.worldGraph = worldGraph;
        this.stateManager = locationStateManager;
        
        // Генератор локаций
        this.locationGenerator = new LocationGenerator(
            worldGraph.seed,
            worldGraph.config
        );
        
        // Визуальные индикаторы выходов
        this.exitMarkers = [];
        this.transitionPrompt = null;
        
        // Текущий выход рядом с игроком
        this.nearbyExit = null;
        
        // Флаг перехода
        this.isTransitioning = false;
        
        console.log('🚪 [LocationTransitionSystem] Инициализирована');
    }
    
    /**
     * Обновление системы (вызывается каждый кадр)
     * @param {Phaser.GameObjects.Sprite} player
     */
    update(player) {
        if (this.isTransitioning) return;
        
        const currentLocation = this.worldGraph.getCurrentLocation();
        if (!currentLocation) return;
        
        // Проверяем все выходы из текущей локации
        const connections = this.worldGraph.getExitConnections(currentLocation.id);
        
        let foundExit = null;
        let minDistance = Infinity;
        
        for (const connection of connections) {
            const exitPoint = connection.exitPoint;
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                exitPoint.x, exitPoint.y
            );
            
            // Радиус активации выхода
            const triggerRadius = 50;
            
            if (distance < triggerRadius && distance < minDistance) {
                minDistance = distance;
                foundExit = connection;
            }
        }
        
        // Обновляем ближайший выход
        if (foundExit !== this.nearbyExit) {
            this.nearbyExit = foundExit;
            
            if (foundExit) {
                this.showTransitionPrompt(foundExit);
            } else {
                this.hideTransitionPrompt();
            }
        }
        
        // Проверяем нажатие клавиши для перехода
        if (this.nearbyExit && this.checkPlayerWantsToTransition()) {
            this.performTransition(this.nearbyExit, player);
        }
    }
    
    /**
     * Показывает подсказку о переходе
     * @param {LocationConnection} connection
     */
    showTransitionPrompt(connection) {
        const targetLocation = this.worldGraph.getLocation(connection.toLocationId);
        
        if (!this.transitionPrompt) {
            // Создаём текст подсказки
            this.transitionPrompt = this.scene.add.text(
                this.scene.scale.width / 2,
                this.scene.scale.height - 100,
                '',
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 }
                }
            );
            this.transitionPrompt.setOrigin(0.5);
            this.transitionPrompt.setScrollFactor(0);
            this.transitionPrompt.setDepth(1000);
        }
        
        let message = '';
        if (connection.type === 'corridor') {
            message = `Нажми [E] или тапните по желтому кругу чтобы пройти в ${targetLocation.biome}`;
        } else if (connection.type === 'door') {
            message = `Нажми [E] или тапните по желтому кругу чтобы перейти в ${targetLocation.biome}`;
        }
        
        this.transitionPrompt.setText(message);
        this.transitionPrompt.setVisible(true);
    }
    
    /**
     * Скрывает подсказку о переходе
     */
    hideTransitionPrompt() {
        if (this.transitionPrompt) {
            this.transitionPrompt.setVisible(false);
        }
    }
    
    /**
     * Проверяет, хочет ли игрок перейти (нажал клавишу или тап)
     * @returns {boolean}
     */
    checkPlayerWantsToTransition() {
        // Проверяем клавишу E или пробел (для десктопа)
        const keyboard = this.scene.input.keyboard;
        const keyboardPressed = keyboard && (
            keyboard.checkDown(keyboard.addKey('E'), 100) || 
            keyboard.checkDown(keyboard.addKey('SPACE'), 100)
        );
        
        // Проверяем тап по маркеру выхода (для мобильных)
        const touchPressed = this.checkTouchOnExitMarker();
        
        return keyboardPressed || touchPressed;
    }
    
    /**
     * Проверяет тап по маркеру выхода
     * @returns {boolean}
     */
    checkTouchOnExitMarker() {
        if (!this.scene.input.activePointer || !this.scene.input.activePointer.isDown) {
            return false;
        }
        
        const pointer = this.scene.input.activePointer;
        const worldX = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
        const worldY = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
        
        // Проверяем, попал ли тап по любому из маркеров выходов
        for (const marker of this.exitMarkers) {
            const distance = Phaser.Math.Distance.Between(
                worldX, worldY,
                marker.x, marker.y
            );
            
            if (distance <= marker.radius) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Выполняет переход в другую локацию
     * @param {LocationConnection} connection
     * @param {Phaser.GameObjects.Sprite} player
     */
    async performTransition(connection, player) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.hideTransitionPrompt();
        
        console.log('🚪 ========================================');
        console.log(`🚪 [LocationTransitionSystem] ПЕРЕХОД`);
        console.log(`   Из: ${connection.fromLocationId}`);
        console.log(`   В:  ${connection.toLocationId}`);
        console.log('🚪 ========================================');
        
        try {
            const startTime = performance.now();
            
            // 1. Сохраняем состояние текущей локации
            console.log('   💾 Сохранение состояния текущей локации...');
            this.stateManager.saveLocationState(connection.fromLocationId);
            
            // 2. Получаем целевую локацию
            const targetLocation = this.worldGraph.getLocation(connection.toLocationId);
            if (!targetLocation) {
                throw new Error(`Локация не найдена: ${connection.toLocationId}`);
            }
            
            // 3. Генерируем локацию если нужно (LAZY!)
            if (!targetLocation.generated) {
                console.log('   🎨 Генерация целевой локации...');
                await this.locationGenerator.generateLocationDetails(targetLocation);
            } else {
                console.log('   ✓ Локация уже сгенерирована');
            }
            
            // 4. Pre-generation соседних локаций
            console.log('   🔄 Pre-generation соседних локаций...');
            await this.generateAdjacentLocations(targetLocation);
            
            // 5. Меняем текущую локацию в графе
            this.worldGraph.setCurrentLocation(targetLocation.id);
            
            // 6. Очищаем старую сцену
            console.log('   🗑️ Очистка старой локации...');
            this.clearCurrentScene();
            
            // 7. Рендерим новую локацию
            console.log('   🎨 Рендеринг новой локации...');
            this.renderLocation(targetLocation);
            
            // 8. Позиционируем игрока
            player.setPosition(connection.entryPoint.x, connection.entryPoint.y);
            console.log(`   🐾 Игрок перемещён в (${connection.entryPoint.x}, ${connection.entryPoint.y})`);
            
            // 9. Обновляем камеру
            this.updateCamera(targetLocation);
            
            // 10. Применяем сохранённое состояние
            console.log('   💾 Применение сохранённого состояния...');
            this.stateManager.applyLocationState(targetLocation);
            
            // 11. Создаём маркеры выходов
            this.createExitMarkers(targetLocation);
            
            // 12. Обновляем мини-карту
            if (this.scene.miniMap) {
                this.scene.miniMap.update(targetLocation);
            }
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log('🚪 ========================================');
            console.log(`🚪 [LocationTransitionSystem] ПЕРЕХОД ЗАВЕРШЁН`);
            console.log(`   Время: ${duration}ms`);
            console.log('🚪 ========================================\n');
            
        } catch (error) {
            console.error('❌ [LocationTransitionSystem] Ошибка перехода:', error);
        } finally {
            this.isTransitioning = false;
        }
    }
    
    /**
     * Генерирует соседние локации (pre-generation)
     * @param {Location} location
     */
    async generateAdjacentLocations(location) {
        const adjacent = this.worldGraph.getAdjacentLocations(location.id);
        let generated = 0;
        
        for (const adjLocation of adjacent) {
            if (!adjLocation.generated) {
                await this.locationGenerator.generateLocationDetails(adjLocation);
                generated++;
            }
        }
        
        console.log(`      ✓ Сгенерировано соседних локаций: ${generated}/${adjacent.length}`);
    }
    
    /**
     * Очищает текущую сцену
     */
    clearCurrentScene() {
        // Удаляем маркеры выходов
        this.exitMarkers.forEach(marker => marker.destroy());
        this.exitMarkers = [];
        
        // Очищаем рендерер мира (если есть)
        if (this.scene.worldRenderer) {
            this.scene.worldRenderer.clear();
        }
    }
    
    /**
     * Рендерит локацию
     * @param {Location} location
     */
    renderLocation(location) {
        // Используем существующий WorldRenderer
        if (this.scene.worldRenderer) {
            // Создаём временный world объект для рендерера
            const tempWorld = {
                size: location.size,
                biome: location.biome,
                zones: [{
                    biomeType: location.biome,
                    bounds: {
                        x: 0,
                        y: 0,
                        width: location.size.width,
                        height: location.size.height
                    }
                }],
                objects: location.objects,
                // Для обратной совместимости
                obstacles: location.objects.obstacles,
                coins: location.objects.coins,
                lockpicks: location.objects.lockpicks,
                houses: location.objects.houses,
                playerHouse: location.objects.playerHouse
            };
            
            this.scene.world = tempWorld;
            this.scene.worldRenderer.setWorld(tempWorld);
            this.scene.worldRenderer.render();
        }
    }
    
    /**
     * Обновляет границы камеры
     * @param {Location} location
     */
    updateCamera(location) {
        const camera = this.scene.cameras.main;
        camera.setBounds(0, 0, location.size.width, location.size.height);
        console.log(`   📷 Камера обновлена: ${location.size.width}x${location.size.height}`);
    }
    
    /**
     * Создаёт визуальные маркеры выходов
     * @param {Location} location
     */
    createExitMarkers(location) {
        const connections = this.worldGraph.getExitConnections(location.id);
        
        connections.forEach(connection => {
            const exitPoint = connection.exitPoint;
            const targetLocation = this.worldGraph.getLocation(connection.toLocationId);
            
            // Создаём визуальный маркер (светящийся круг)
            const marker = this.scene.add.circle(
                exitPoint.x,
                exitPoint.y,
                40, // Увеличиваем радиус для лучшего тапа
                0xffff00,
                0.4
            );
            marker.setStrokeStyle(3, 0xffff00, 0.9);
            marker.setDepth(999);
            
            // Делаем маркер интерактивным
            marker.setInteractive();
            marker.radius = 40; // Сохраняем радиус для проверки тапа
            
            // Добавляем hover эффект
            marker.on('pointerover', () => {
                marker.setScale(1.1);
                marker.setAlpha(0.7);
            });
            
            marker.on('pointerout', () => {
                marker.setScale(1);
                marker.setAlpha(0.4);
            });
            
            // Анимация пульсации
            this.scene.tweens.add({
                targets: marker,
                scaleX: 1.15,
                scaleY: 1.15,
                alpha: 0.2,
                duration: 1200,
                yoyo: true,
                repeat: -1
            });
            
            // Добавляем текст с названием локации
            const locationName = targetLocation ? targetLocation.biome : 'Неизвестно';
            const text = this.scene.add.text(
                exitPoint.x,
                exitPoint.y - 60,
                locationName,
                {
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 }
                }
            );
            text.setOrigin(0.5);
            text.setDepth(1000);
            text.setScrollFactor(0); // Не двигается с камерой
            
            // Анимация текста
            this.scene.tweens.add({
                targets: text,
                alpha: 0.8,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            this.exitMarkers.push(marker);
        });
        
        console.log(`   ✓ Создано маркеров выходов: ${this.exitMarkers.length}`);
    }
    
    /**
     * Уничтожает систему
     */
    destroy() {
        this.clearCurrentScene();
        this.hideTransitionPrompt();
        
        if (this.transitionPrompt) {
            this.transitionPrompt.destroy();
            this.transitionPrompt = null;
        }
        
        console.log('🗑️ [LocationTransitionSystem] Уничтожена');
    }
}


