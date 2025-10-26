/**
 * Базовый контроллер для всех типов замков
 * Содержит общую логику и абстрактные методы
 */

export class LockController {
    constructor(scene, config, pet) {
        this.scene = scene;
        this.config = config;
        this.pet = pet;
        this.isGameActive = false;
        
        // Счетчики
        this.attempts = 0;
        this.maxAttempts = config.maxAttempts || 3;
        
        console.log(`🎮 [LockController] Контроллер создан`, { config, maxAttempts: this.maxAttempts });
    }
    
    /**
     * Создание игровых элементов (должен быть переопределен)
     */
    createGameElements() {
        throw new Error('createGameElements() must be implemented in child class');
    }
    
    /**
     * Обновление игровой логики (должен быть переопределен)
     */
    update(time, delta) {
        // Может быть переопределен в наследниках
    }
    
    /**
     * Обработка ввода (может быть переопределен)
     */
    handleInput() {
        // Может быть переопределен в наследниках
    }
    
    /**
     * Проверка условия победы (должен быть переопределен)
     */
    checkWinCondition() {
        return false;
    }
    
    /**
     * Очистка ресурсов (может быть переопределен)
     */
    cleanup() {
        this.isGameActive = false;
        console.log(`🧹 [LockController] Очистка контроллера`);
    }
    
    /**
     * Увеличение счетчика попыток
     */
    incrementAttempts() {
        this.attempts++;
        console.log(`📊 [LockController] Попытка ${this.attempts}/${this.maxAttempts}`);
        
        if (this.attempts >= this.maxAttempts) {
            this.onFailure();
            return true;
        }
        return false;
    }
    
    /**
     * Успешное прохождение
     */
    onSuccess() {
        console.log(`✅ [LockController] Успех!`);
        this.isGameActive = false;
        
        if (this.scene && this.scene.onSuccess) {
            this.scene.onSuccess();
        }
    }
    
    /**
     * Провал взлома
     */
    onFailure() {
        console.log(`❌ [LockController] Провал!`);
        this.isGameActive = false;
        
        if (this.scene && this.scene.onFailure) {
            this.scene.onFailure();
        }
    }
    
    /**
     * Старт игры
     */
    start() {
        this.isGameActive = true;
        this.attempts = 0;
        console.log(`🎮 [LockController] Игра началась`);
    }
}

