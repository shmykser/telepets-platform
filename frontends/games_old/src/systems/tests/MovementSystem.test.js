/**
 * Тесты для MovementSystem
 */
export class MovementSystemTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    run() {
        console.log('🧪 Запуск тестов MovementSystem...');
        
        this.testBasicMovement();
        this.testTargetMovement();
        this.testPathMovement();
        this.testStopMovement();
        
        this.printResults();
    }

    testBasicMovement() {
        const testName = 'Базовое движение';
        try {
            // Создаем мок объект
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const movementSystem = new MovementSystem(mockGameObject, config);
            
            // Тестируем движение к позиции
            movementSystem.moveToPosition(100, 200);
            
            assert(movementSystem.isMovingToTarget() === true, 'Система должна быть в состоянии движения');
            assert(movementSystem.currentTarget.x === 100, 'X координата цели должна быть 100');
            assert(movementSystem.currentTarget.y === 200, 'Y координата цели должна быть 200');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testTargetMovement() {
        const testName = 'Движение к цели';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const movementSystem = new MovementSystem(mockGameObject, config);
            
            const target = { x: 300, y: 400 };
            movementSystem.moveTo(target);
            
            assert(movementSystem.isMovingToTarget() === true, 'Система должна быть в состоянии движения');
            assert(movementSystem.currentTarget === target, 'Цель должна быть установлена');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testPathMovement() {
        const testName = 'Движение по пути';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const movementSystem = new MovementSystem(mockGameObject, config);
            
            const path = [
                { x: 100, y: 100 },
                { x: 200, y: 200 },
                { x: 300, y: 300 }
            ];
            
            movementSystem.moveAlongPath(path);
            
            assert(movementSystem.currentPath === path, 'Путь должен быть установлен');
            assert(movementSystem.pathIndex === 0, 'Индекс пути должен быть 0');
            assert(movementSystem.isMovingToTarget() === true, 'Система должна быть в состоянии движения');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testStopMovement() {
        const testName = 'Остановка движения';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const movementSystem = new MovementSystem(mockGameObject, config);
            
            // Начинаем движение
            movementSystem.moveToPosition(100, 200);
            assert(movementSystem.isMovingToTarget() === true, 'Система должна быть в состоянии движения');
            
            // Останавливаем движение
            movementSystem.stopMovement();
            assert(movementSystem.isMovingToTarget() === false, 'Система не должна быть в состоянии движения');
            assert(movementSystem.currentTarget === null, 'Цель должна быть сброшена');
            assert(movementSystem.currentPath === null, 'Путь должен быть сброшен');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    createMockGameObject() {
        return {
            x: 0,
            y: 0,
            width: 32,
            height: 32,
            isAlive: true,
            canFly: false,
            body: {
                setVelocity: (x, y) => {},
                setBounce: (value) => {},
                setDrag: (x, y) => {},
                setCollideWorldBounds: (value) => {}
            },
            setVelocity: (x, y) => {},
            stopMovement: () => {},
            setRotation: (angle) => {},
            distanceTo: (target) => {
                const dx = this.x - target.x;
                const dy = this.y - target.y;
                return Math.sqrt(dx * dx + dy * dy);
            },
            directionTo: (target) => {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                return { x: dx / length, y: dy / length };
            },
            isInRange: (target, range) => {
                return this.distanceTo(target) <= range;
            },
            scene: {
                events: {
                    emit: (event, data) => {}
                }
            }
        };
    }

    createMockConfig() {
        return {
            get: (key, defaultValue) => {
                const values = {
                    speed: 100,
                    attackRange: 30,
                    updateInterval: 16,
                    strategy: 'linear'
                };
                return values[key] || defaultValue;
            }
        };
    }

    printResults() {
        const total = this.passed + this.failed;
        console.log(`\n📊 Результаты тестов MovementSystem:`);
        console.log(`✅ Пройдено: ${this.passed}`);
        console.log(`❌ Провалено: ${this.failed}`);
        console.log(`📈 Успешность: ${((this.passed / total) * 100).toFixed(1)}%`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Запуск тестов если файл выполняется напрямую
if (typeof window === 'undefined') {
    const test = new MovementSystemTest();
    test.run();
}
