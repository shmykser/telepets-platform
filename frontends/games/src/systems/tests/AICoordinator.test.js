/**
 * Тесты для AICoordinator
 */
export class AICoordinatorTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    run() {
        console.log('🧪 Запуск тестов AICoordinator...');
        
        this.testInitialization();
        this.testTargetSetting();
        this.testSystemCoordination();
        this.testStateManagement();
        
        this.printResults();
    }

    testInitialization() {
        const testName = 'Инициализация';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const coordinator = new AICoordinator(mockGameObject, config);
            
            assert(coordinator.gameObject === mockGameObject, 'Игровой объект должен быть установлен');
            assert(coordinator.config === config, 'Конфигурация должна быть установлена');
            assert(coordinator.isActive === true, 'Координатор должен быть активен');
            assert(coordinator.systems.size > 0, 'Системы должны быть созданы');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testTargetSetting() {
        const testName = 'Установка цели';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const coordinator = new AICoordinator(mockGameObject, config);
            
            const target = { x: 100, y: 200 };
            coordinator.setTarget(target);
            
            assert(coordinator.getTarget() === target, 'Цель должна быть установлена');
            assert(coordinator.currentTarget === target, 'Текущая цель должна быть установлена');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testSystemCoordination() {
        const testName = 'Координация систем';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const coordinator = new AICoordinator(mockGameObject, config);
            
            // Проверяем наличие основных систем
            assert(coordinator.getSystem('movement') !== null, 'Система движения должна быть создана');
            assert(coordinator.getSystem('attack') !== null, 'Система атаки должна быть создана');
            assert(coordinator.getSystem('collision') !== null, 'Система коллизий должна быть создана');
            assert(coordinator.getSystem('pathfinding') !== null, 'Система поиска пути должна быть создана');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testStateManagement() {
        const testName = 'Управление состоянием';
        try {
            const mockGameObject = this.createMockGameObject();
            const config = this.createMockConfig();
            
            const coordinator = new AICoordinator(mockGameObject, config);
            
            // Тестируем активацию/деактивацию
            coordinator.deactivate();
            assert(coordinator.isActive === false, 'Координатор должен быть деактивирован');
            
            coordinator.activate();
            assert(coordinator.isActive === true, 'Координатор должен быть активирован');
            
            // Тестируем состояние
            const state = coordinator.getAIState();
            assert(state.isActive === true, 'Состояние должно показывать активность');
            assert(state.state === 'idle', 'Начальное состояние должно быть idle');

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
                    emit: (event, data) => {},
                    on: (event, callback) => {},
                    off: (event, callback) => {}
                }
            }
        };
    }

    createMockConfig() {
        return {
            get: (key, defaultValue) => {
                const values = {
                    behavior: 'linear',
                    attackType: 'singleUse',
                    movement: { speed: 100, strategy: 'linear' },
                    attack: { damage: 10, range: 30, cooldown: 1000 },
                    collision: { enabled: true, layers: ['ENEMIES'] },
                    pathfinding: { algorithm: 'astar', allowDiagonal: true }
                };
                return values[key] || defaultValue;
            }
        };
    }

    printResults() {
        const total = this.passed + this.failed;
        console.log(`\n📊 Результаты тестов AICoordinator:`);
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
    const test = new AICoordinatorTest();
    test.run();
}
