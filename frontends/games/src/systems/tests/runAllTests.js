/**
 * Запуск всех тестов системы ИИ
 */
import { SystemConfigTest } from './SystemConfig.test.js';
import { MovementSystemTest } from './MovementSystem.test.js';
import { AICoordinatorTest } from './AICoordinator.test.js';

export class TestRunner {
    constructor() {
        this.totalPassed = 0;
        this.totalFailed = 0;
        this.testSuites = [];
    }

    async runAllTests() {
        console.log('🚀 Запуск всех тестов системы ИИ...\n');
        
        // Запускаем тесты по порядку
        await this.runTestSuite('SystemConfig', () => new SystemConfigTest());
        await this.runTestSuite('MovementSystem', () => new MovementSystemTest());
        await this.runTestSuite('AICoordinator', () => new AICoordinatorTest());
        
        this.printFinalResults();
    }

    async runTestSuite(name, testFactory) {
        console.log(`\n📋 Запуск тестов ${name}...`);
        console.log('='.repeat(50));
        
        try {
            const test = testFactory();
            test.run();
            
            this.totalPassed += test.passed;
            this.totalFailed += test.failed;
            
            this.testSuites.push({
                name,
                passed: test.passed,
                failed: test.failed,
                total: test.passed + test.failed
            });
            
        } catch (error) {
            console.error(`❌ Ошибка при запуске тестов ${name}:`, error);
            this.totalFailed++;
        }
    }

    printFinalResults() {
        const total = this.totalPassed + this.totalFailed;
        const successRate = ((this.totalPassed / total) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
        console.log('='.repeat(60));
        
        this.testSuites.forEach(suite => {
            const suiteRate = ((suite.passed / suite.total) * 100).toFixed(1);
            console.log(`📋 ${suite.name}: ${suite.passed}/${suite.total} (${suiteRate}%)`);
        });
        
        console.log('-'.repeat(60));
        console.log(`✅ Всего пройдено: ${this.totalPassed}`);
        console.log(`❌ Всего провалено: ${this.totalFailed}`);
        console.log(`📈 Общая успешность: ${successRate}%`);
        
        if (this.totalFailed === 0) {
            console.log('\n🎉 Все тесты пройдены успешно!');
        } else {
            console.log(`\n⚠️  ${this.totalFailed} тестов провалено`);
        }
        
        console.log('='.repeat(60));
    }
}

// Запуск тестов если файл выполняется напрямую
if (typeof window === 'undefined') {
    const runner = new TestRunner();
    runner.runAllTests().catch(console.error);
}
