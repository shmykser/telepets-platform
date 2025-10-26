/**
 * Тестовый класс для демонстрации работы Safe Area
 * Можно использовать для отладки и тестирования на разных устройствах
 */
export class SafeAreaTest {
    /**
     * Создает тестовые элементы для демонстрации safe-area
     * @param {Phaser.Scene} scene - Сцена Phaser
     */
    static createTestElements(scene) {
        const safeAreas = SafeAreaUtils.getAllSafeAreas();
        
        // Создаем тестовые прямоугольники для каждого safe-area
        const colors = {
            top: 0xff0000,    // Красный для top
            bottom: 0x00ff00, // Зеленый для bottom
            left: 0x0000ff,   // Синий для left
            right: 0xffff00   // Желтый для right
        };
        
        // Top safe area
        if (safeAreas.top > 0) {
            scene.add.rectangle(
                scene.scale.width / 2,
                safeAreas.top / 2,
                scene.scale.width,
                safeAreas.top,
                colors.top,
                0.5
            ).setDepth(9999);
            
            scene.add.text(
                scene.scale.width / 2,
                safeAreas.top / 2,
                `TOP: ${safeAreas.top}px`,
                { fontSize: '16px', fill: '#ffffff' }
            ).setOrigin(0.5).setDepth(10000);
        }
        
        // Bottom safe area
        if (safeAreas.bottom > 0) {
            scene.add.rectangle(
                scene.scale.width / 2,
                scene.scale.height - safeAreas.bottom / 2,
                scene.scale.width,
                safeAreas.bottom,
                colors.bottom,
                0.5
            ).setDepth(9999);
            
            scene.add.text(
                scene.scale.width / 2,
                scene.scale.height - safeAreas.bottom / 2,
                `BOTTOM: ${safeAreas.bottom}px`,
                { fontSize: '16px', fill: '#ffffff' }
            ).setOrigin(0.5).setDepth(10000);
        }
        
        // Left safe area
        if (safeAreas.left > 0) {
            scene.add.rectangle(
                safeAreas.left / 2,
                scene.scale.height / 2,
                safeAreas.left,
                scene.scale.height,
                colors.left,
                0.5
            ).setDepth(9999);
            
            scene.add.text(
                safeAreas.left / 2,
                scene.scale.height / 2,
                `LEFT: ${safeAreas.left}px`,
                { fontSize: '16px', fill: '#ffffff' }
            ).setOrigin(0.5).setDepth(10000);
        }
        
        // Right safe area
        if (safeAreas.right > 0) {
            scene.add.rectangle(
                scene.scale.width - safeAreas.right / 2,
                scene.scale.height / 2,
                safeAreas.right,
                scene.scale.height,
                colors.right,
                0.5
            ).setDepth(9999);
            
            scene.add.text(
                scene.scale.width - safeAreas.right / 2,
                scene.scale.height / 2,
                `RIGHT: ${safeAreas.right}px`,
                { fontSize: '16px', fill: '#ffffff' }
            ).setOrigin(0.5).setDepth(10000);
        }
        
        // Информация о поддержке safe-area
        const isSupported = SafeAreaUtils.isSafeAreaSupported();
        scene.add.text(
            10,
            10,
            `Safe Area Support: ${isSupported ? 'YES' : 'NO'}`,
            { fontSize: '20px', fill: '#ffffff' }
        ).setDepth(10000);
        
        console.log('📱 Safe Area Test:', {
            supported: isSupported,
            areas: safeAreas,
            viewport: {
                width: scene.scale.width,
                height: scene.scale.height
            }
        });
    }
}
