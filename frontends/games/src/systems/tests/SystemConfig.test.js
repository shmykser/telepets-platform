/**
 * Тесты для SystemConfig
 */
export class SystemConfigTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    run() {
        console.log('🧪 Запуск тестов SystemConfig...');
        
        this.testBasicFunctionality();
        this.testPriorityOrder();
        this.testOverrides();
        this.testValidation();
        this.testCache();
        
        this.printResults();
    }

    testBasicFunctionality() {
        const testName = 'Базовая функциональность';
        try {
            const config = new SystemConfig([
                { speed: 100, health: 50 },
                { damage: 20 }
            ]);

            assert(config.get('speed') === 100, 'Скорость должна быть 100');
            assert(config.get('health') === 50, 'Здоровье должно быть 50');
            assert(config.get('damage') === 20, 'Урон должен быть 20');
            assert(config.get('unknown') === null, 'Неизвестный параметр должен быть null');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testPriorityOrder() {
        const testName = 'Порядок приоритетов';
        try {
            const config = new SystemConfig([
                { speed: 100 }, // Низший приоритет
                { speed: 200 }, // Высший приоритет
                { health: 50 }
            ]);

            assert(config.get('speed') === 200, 'Последний источник должен иметь приоритет');
            assert(config.get('health') === 50, 'Здоровье должно быть 50');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testOverrides() {
        const testName = 'Переопределения';
        try {
            const config = new SystemConfig([
                { speed: 100, health: 50 }
            ], { speed: 300 });

            assert(config.get('speed') === 300, 'Переопределение должно иметь приоритет');
            assert(config.get('health') === 50, 'Здоровье должно остаться 50');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testValidation() {
        const testName = 'Валидация';
        try {
            const config = new SystemConfig([
                { speed: 100, health: 50, damage: 20 }
            ]);

            const schema = {
                speed: { type: 'number', min: 0, max: 1000 },
                health: { type: 'number', min: 1, required: true },
                damage: { type: 'number', min: 0 }
            };

            const result = config.validate(schema);
            assert(result.valid === true, 'Конфигурация должна быть валидной');
            assert(result.errors.length === 0, 'Не должно быть ошибок');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    testCache() {
        const testName = 'Кэширование';
        try {
            const config = new SystemConfig([
                { speed: 100 }
            ]);

            // Первый вызов
            const value1 = config.get('speed');
            // Второй вызов (должен использовать кэш)
            const value2 = config.get('speed');

            assert(value1 === value2, 'Кэшированные значения должны совпадать');
            assert(value1 === 100, 'Значение должно быть 100');

            this.passed++;
            console.log(`✅ ${testName}`);
        } catch (error) {
            this.failed++;
            console.log(`❌ ${testName}: ${error.message}`);
        }
    }

    printResults() {
        const total = this.passed + this.failed;
        console.log(`\n📊 Результаты тестов SystemConfig:`);
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
    const test = new SystemConfigTest();
    test.run();
}
