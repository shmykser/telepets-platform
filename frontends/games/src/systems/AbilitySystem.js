import { ABILITIES } from '../types/abilityTypes.js';
import { defenseTypes } from '../types/defenseTypes.js';

/**
 * Система способностей игрока
 * Управляет текущими значениями характеристик
 */
export class AbilitySystem {
    constructor(scene) {
        this.scene = scene;
        
        // Текущие значения характеристик
        this.abilities = {
            TAP_DAMAGE: ABILITIES.TAP_DAMAGE.baseValue,      // Урон по тапу
            TAP_EXPLOSION: ABILITIES.TAP_EXPLOSION.baseValue, // Взрыв по тапу
            EGG_HEALTH: ABILITIES.EGG_HEALTH.baseValue,     // Максимальное здоровье яйца
            EGG_DAMAGE: ABILITIES.EGG_DAMAGE.baseValue,     // Урон яйца
            EGG_COOLDOWN: ABILITIES.EGG_COOLDOWN.baseValue, // Кулдаун яйца
            EGG_RADIUS: ABILITIES.EGG_RADIUS.baseValue,     // Радиус поражения яйца
            LUCK: ABILITIES.LUCK.baseValue,                 // Удача
            EGG_AURA: ABILITIES.EGG_AURA.baseValue,         // Аура (множитель)
            EGG_EXPLOSION: ABILITIES.EGG_EXPLOSION.baseValue, // Взрыв яйца (множитель)
            EGG_RECOVERY: ABILITIES.EGG_RECOVERY.baseValue, // Регенерация яйца
            PIT: ABILITIES.PIT.baseValue,                   // Количество ям на поле
            SHOVEL: ABILITIES.SHOVEL.baseValue  // Количество доступных лопат
        };
    }
    
    /**
     * Получает текущий урон по тапу
     * @returns {number}
     */
    getTapDamage() {
        return this.abilities.TAP_DAMAGE;
    }
    
    /**
     * Получает текущий уровень взрыва по тапу
     * @returns {number}
     */
    getTapExplosion() {
        return this.abilities.TAP_EXPLOSION;
    }

    /**
    * Получает урон взрыва по тапу (урон по тапу * множитель взрыва)
    * @returns {number}
    */
    getTapExplosionDamage() {
        return this.abilities.TAP_DAMAGE * this.abilities.TAP_EXPLOSION;
    }
    
    /**
     * Получает максимальное здоровье яйца
     * @returns {number}
     */
    getEggMaxHealth() {
        return this.abilities.EGG_HEALTH;
    }
    
    /**
     * Получает текущий урон яйца
     * @returns {number}
     */
    getEggDamage() {
        return this.abilities.EGG_DAMAGE;
    }
    
    /**
     * Получает текущий кулдаун яйца
     * @returns {number} Кулдаун в миллисекундах
     */
    getEggCooldown() {
        return this.abilities.EGG_COOLDOWN;
    }
    
    /**
     * Получает текущий радиус поражения яйца
     * @returns {number} Радиус в пикселях
     */
    getEggRadius() {
        return this.abilities.EGG_RADIUS;
    }
    
    /**
     * Получает текущую удачу
     * @returns {number}
     */
    getLuck() {
        return this.abilities.LUCK;
    }
    
    /**
     * Получает текущий уровень ауры
     * @returns {number}
     */
    getAura() {
        return this.abilities.EGG_AURA;
    }

    /**
     * Получает урон ауры (урон яйца * множитель ауры)
     * @returns {number}
     */
    getAuraDamage() {
        return this.abilities.EGG_DAMAGE * this.abilities.EGG_AURA;
    }
    
    /**
     * Получает текущий уровень взрыва яйца
     * @returns {number}
     */
    getEggExplosion() {
        return this.abilities.EGG_EXPLOSION;
    }
    
    /**
     * Получает урон взрыва яйца (урон яйца * множитель взрыва)
     * @returns {number}
     */
    getEggExplosionDamage() {
        return this.abilities.EGG_DAMAGE * this.abilities.EGG_EXPLOSION;
    }

    /**
     * Получает урон взрыва яйца (урон яйца * множитель взрыва)
     * @returns {number}
     */
    getEggExplosionRadius() {
        return this.abilities.EGG_RADIUS * this.abilities.EGG_EXPLOSION;
    }

    getEggExplosionCooldown() {
        return 1000;
    }

    /**
     * Получает текущее количество ям на поле
     * @returns {number}
     */
    getPitCount() {
        return this.abilities.PIT;
    }

    /**
     * Получает количество доступных лопат
     * @returns {number}
     */
    getShovelCount() {
        return this.abilities.SHOVEL;
    }

    /**
     * Получает текущую регенерацию яйца (HP в секунду)
     * @returns {number}
     */
    getEggRecovery() {
        return this.abilities.EGG_RECOVERY;
    }

    /**
     * Получает здоровье ямы из defenseTypes
     * @returns {number}
     */
    getPitHealth() {
        return defenseTypes.pit.health;
    }

    /**
     * Прокачивает способность на один уровень с ограничением по максимуму
     * @param {string} abilityType - Тип характеристики (TAP_DAMAGE, EGG_DAMAGE, etc.)
     * @returns {boolean} true если прокачка успешна, false если достигнут максимум или ошибка
     */
    upgradeAbility(abilityType) {
        const config = ABILITIES[abilityType];
        if (!config) {
            console.warn(`Неизвестная характеристика: ${abilityType}`);
            return false;
        }
        
        const oldValue = this.abilities[abilityType];
        console.log(`🪓 [DEBUG] upgradeAbility(${abilityType}): старое значение=${oldValue}, maxValue=${config.maxValue}, increase=${config.increase}`);
        
        // Проверяем, не достигнут ли уже максимум
        if (this.abilities[abilityType] >= config.maxValue) {
            console.log(`🪓 [DEBUG] upgradeAbility(${abilityType}): достигнут максимум!`);
            return false; // Уже на максимуме
        }
        
        // Увеличиваем значение
        let newValue = this.abilities[abilityType] + config.increase;
        
        // Ограничиваем максимумом
        newValue = Math.min(newValue, config.maxValue);
        
        this.abilities[abilityType] = newValue;
        
        console.log(`🪓 [DEBUG] upgradeAbility(${abilityType}): новое значение=${newValue}`);
        
        // Эмитим событие изменения
        this.scene.events.emit('ability:upgraded', {
            abilityType,
            oldValue: this.abilities[abilityType] - config.increase,
            newValue: newValue,
            isMaxLevel: newValue >= config.maxValue
        });
        
        return true;
    }

    /**
     * Уменьшает значение способности на указанную величину, с событием для UI
     * @param {string} abilityType
     * @param {number} value
     * @returns {boolean}
     */
    decrementAbility(abilityType, value = 1) {
        if (!this.abilities.hasOwnProperty(abilityType)) {
            return false;
        }
        const oldValue = this.abilities[abilityType];
        const newValue = Math.max(0, oldValue - value);
        if (newValue === oldValue) {
            return false;
        }
        this.abilities[abilityType] = newValue;
        // уведомляем UI тем же событием
        this.scene.events.emit('ability:upgraded', {
            abilityType,
            oldValue,
            newValue,
            isMaxLevel: false
        });
        return true;
    }
    
    
    /**
     * Получает все текущие значения способностей
     * @returns {Object}
     */
    getAllAbilities() {
        return {
            tapDamage: this.getTapDamage(),
            tapExplosion: this.getTapExplosion(),
            tapExplosionDamage: this.getTapExplosionDamage(),
            eggMaxHealth: this.getEggMaxHealth(),
            eggDamage: this.getEggDamage(),
            eggCooldown: this.getEggCooldown(),
            eggRadius: this.getEggRadius(),
            luck: this.getLuck(),
            pitCount: this.getPitCount(),
            shovelCount: this.getShovelCount(),
            eggRecovery: this.getEggRecovery(),
            aura: this.getAura(),
            auraDamage: this.getAuraDamage(),
            eggExplosion: this.getEggExplosion(),
            eggExplosionDamage: this.getEggExplosionDamage(),
            eggExplosionRadius: this.getEggExplosionRadius(),
            eggExplosionCooldown: this.getEggExplosionCooldown()
        };
    }
    
    /**
     * Сбрасывает все способности к базовым значениям
     */
    resetAllAbilities() {
        this.abilities = {
            TAP_DAMAGE: ABILITIES.TAP_DAMAGE.baseValue,
            TAP_EXPLOSION: ABILITIES.TAP_EXPLOSION.baseValue,
            EGG_HEALTH: ABILITIES.EGG_HEALTH.baseValue,
            EGG_DAMAGE: ABILITIES.EGG_DAMAGE.baseValue,
            EGG_COOLDOWN: ABILITIES.EGG_COOLDOWN.baseValue,
            EGG_RADIUS: ABILITIES.EGG_RADIUS.baseValue,
            LUCK: ABILITIES.LUCK.baseValue,
            EGG_AURA: ABILITIES.EGG_AURA.baseValue,
            EGG_EXPLOSION: ABILITIES.EGG_EXPLOSION.baseValue,
            EGG_RECOVERY: ABILITIES.EGG_RECOVERY.baseValue,
            PIT: ABILITIES.PIT.baseValue,
            SHOVEL: ABILITIES.SHOVEL.baseValue
        };
        
        this.scene.events.emit('abilities:reset');
    }
    
    /**
     * Уничтожение системы
     */
    destroy() {
        this.scene = null;
        this.abilities = null;
    }
}
