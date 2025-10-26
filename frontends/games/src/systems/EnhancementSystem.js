/**
 * Система усиления врагов
 * Следует принципу Single Responsibility Principle
 */
import { GeometryUtils } from '../utils/GeometryUtils.js';
import { ENHANCEMENT_CONSTANTS } from '../types/waveTypes.js';

export class EnhancementSystem {
    // ENHANCEMENT_LEVELS удален - используем константы напрямую

    /**
     * Усиливает врага с определенной вероятностью
     * @param {Enemy} enemy - Враг для усиления
     * @param {string} baseEnemyType - Базовый тип врага
     * @param {number} gameTime - Время игры в миллисекундах
     * @returns {Enemy} Усиленный или обычный враг
     */
    static enhanceEnemy(enemy, baseEnemyType, gameTime = 0) {
        const multiplier = this.rollEnhancement(gameTime);
        
        if (multiplier === ENHANCEMENT_CONSTANTS.MULTIPLIERS.NORMAL) {
            return enemy; // Возвращаем без изменений
        }
        
        return this.applyEnhancement(enemy, baseEnemyType, multiplier);
    }

    /**
     * Определяет множитель усиления на основе вероятности и времени игры
     * @param {number} gameTime - Время игры в миллисекундах
     * @returns {number} Множитель усиления (1, 2, или 3)
     */
    static rollEnhancement(gameTime) {
        const weights = this.getEnhancementWeights(gameTime);
        const random = Math.random() * ENHANCEMENT_CONSTANTS.RANDOM_MAX;
        
        // Простая проверка по весам
        if (random <= weights.normal) {
            return ENHANCEMENT_CONSTANTS.MULTIPLIERS.NORMAL; // 1
        }
        if (random <= weights.normal + weights.elite) {
            return ENHANCEMENT_CONSTANTS.MULTIPLIERS.ELITE; // 2
        }
        
        return ENHANCEMENT_CONSTANTS.MULTIPLIERS.CHAMPION; // 3
    }

    /**
     * Получает веса усиления в зависимости от времени игры
     * @param {number} gameTime - Время игры в миллисекундах
     * @returns {Object} Веса для каждого уровня
     */
    static getEnhancementWeights(gameTime) {
        const minutes = GeometryUtils.floor(gameTime / ENHANCEMENT_CONSTANTS.MINUTE_MS);
        
        if (minutes < 2) {
            return ENHANCEMENT_CONSTANTS.EARLY_GAME_WEIGHTS;
        } else if (minutes < 5) {
            return ENHANCEMENT_CONSTANTS.MID_GAME_WEIGHTS;
        } else {
            return ENHANCEMENT_CONSTANTS.LATE_GAME_WEIGHTS;
        }
    }

    /**
     * Применяет усиление к врагу
     * @param {Enemy} enemy - Враг для усиления
     * @param {string} baseEnemyType - Базовый тип врага
     * @param {number} multiplier - Множитель усиления (2 или 3)
     * @returns {Enemy} Усиленный враг
     */
    static applyEnhancement(enemy, baseEnemyType, multiplier) {
        // Множитель уже получен из rollEnhancement()
        
        // Сохраняем оригинальные характеристики
        enemy._originalHealth = enemy.health;
        enemy._originalMaxHealth = enemy._maxHealth;
        enemy._originalDamage = enemy.damage;
        enemy._originalSize = enemy.size;
        
        // Модифицируем характеристики (сначала maxHealth, потом health)
        enemy._maxHealth *= multiplier;
        enemy.health *= multiplier;
        enemy.damage *= multiplier;
        enemy.size *= multiplier;
        
        
        // Обновляем визуальные характеристики
        const newScale = enemy.scaleX * multiplier;
        enemy.setScale(newScale);
        
        // Обновляем размер HealthBar для усиленных врагов
        if (enemy.healthBar && enemy.healthBar.updateBarSize) {
            enemy.healthBar.updateBarSize();
        }
        
        
        return enemy;
    }

}
