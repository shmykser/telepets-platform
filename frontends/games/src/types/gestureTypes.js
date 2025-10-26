/**
 * Типы жестов и действий
 */

// Типы целей
export const TARGET_TYPES = {
    ENEMY: 'enemy',
    EGG: 'egg',
    FIELD: 'field',
    DEFENSE: 'defense',
    ITEM: 'item'
};

// Действия по жестам
export const GESTURE_ACTIONS = {
    // Тап по врагу - нанести урон
    'tap_enemy': {
        name: 'damage_enemy',
        description: 'Нанести урон врагу',
        damage: null // Будет браться из AbilitySystem в рантайме
    },
    
    // Тап по яйцу - активировать взрыв
    'tap_egg': {
        name: 'activate_egg_explosion',
        description: 'Активировать взрыв яйца',
        explosionDamage: null // Будет браться из AbilitySystem в рантайме
    },
    
    // Тап по предмету - собрать
    'tap_item': {
        name: 'collect_item',
        description: 'Собрать предмет'
    },
    
    // Тап по полю - создать защиту
    'tap_field': {
        name: 'place_defense',
        description: 'Установить защиту',
        defenseType: 'barrier'
    },
    
    
    //НЕ ИСПОЛЬЗУЮТСЯ ------------------------
    
    // Долгий тап по врагу - заморозка
    'longTap_enemy': {
        name: 'freeze_enemy',
        description: 'Заморозить врага',
    },
    
    // Долгий тап по яйцу - щит
    'longTap_egg': {
        name: 'shield_egg',
        description: 'Создать щит для яйца',
    },
    
    // Долгий тап по полю - стена
    'longTap_field': {
        name: 'create_pit',
        description: 'Создать яму',
    },
    
    // Линия по полю - волна урона
    'line_field': {
        name: 'damage_wave',
        description: 'Волна урона по линии',
    },
    
    // Круг по полю - взрыв
    'circle_field': {
        name: 'explosion',
        description: 'Взрыв в области',
    },
    
    // Треугольник по врагу - критический урон
    'triangle_enemy': {
        name: 'critical_damage',
        description: 'Критический урон врагу',
    },
    
    // Треугольник по полю - взрыв
    'triangle_field': {
        name: 'explosion',
        description: '',
    }
};

// Настройки целей
export const TARGET_SETTINGS = {
    enemy: {
        missTolerance: 10,           // Максимальный промах в пикселях
        priority: 1
    },
    egg: {
        missTolerance: 10,           // Максимальный промах в пикселях
        priority: 2
    },
    field: {
        missTolerance: 0,            // Нет толерантности для поля
        priority: 0
    },
    defense: {
        missTolerance: 10,           // Максимальный промах в пикселях
        priority: 1
    },
    item: {
        missTolerance: 25,           // Максимальный промах в пикселях
        priority: 3
    }
};

// Настройки жестов (перенесено из GameSettings.js)
export const GESTURE_CONSTANTS = {
    TAP: {
        MAX_DURATION: 200,      // Максимальная длительность тапа (мс)
        MAX_DISTANCE: 10        // Максимальное расстояние для тапа (пиксели)
    },
    LONG_TAP: {
        MIN_DURATION: 500,      // Минимальная длительность долгого тапа (мс)
        MAX_DISTANCE: 10        // Максимальное расстояние для долгого тапа (пиксели)
    }
};
