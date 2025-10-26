/**
 * Игровые константы и настройки
 * Все настройки Phaser и игрового процесса
 */


// ========== НАСТРОЙКИ PHASER ==========

// Основные настройки приложения Phaser
export const PHASER_SETTINGS = {
    width: 720,
    height: 1280,
    backgroundColor: 0x0b1221,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    responsive: {
        minWidth: 320,
        minHeight: 480,
        maxWidth: 720,
        maxHeight: 1280
    }
};

// ========== НАСТРОЙКИ ИГРЫ ==========


// Настройки фона
export const BACKGROUND_SETTINGS = {
    tileSize: 512,
    animate: true,
    animation: {
        speedX: 8,
        speedY: 4,
        duration: 20000
    }
};

// Настройки камней
export const STONE_SETTINGS = {
    MIN_STONES: 3,
    MAX_STONES: 10,
    STONE_SPAWN_MARGIN: 50,  // Отступ от краев экрана
    AVOIDANCE_RADIUS: 80,    // Радиус обхода для врагов
    DRAG_FEEDBACK: {
        ALPHA: 0.7,
        SCALE_MULTIPLIER: 1.1
    }
};


// ========== КОНСТАНТЫ ==========

// Физические константы
export const PHYSICS_CONSTANTS = {
    // Размеры объектов
    DEFAULT_TEXTURE_SIZE: 32,
    BASE_ENEMY_SIZE: 10,
    
    // Сопротивление для яйца
    EGG_DRAG: 1000,
    EGG_BOUNCE: 0.1,
    
    // Размеры для HealthBar
    HEALTH_BAR_OFFSET: 5,
    EGG_HEALTH_BAR_OFFSET: 15,
    
    // Константы для врагов
    ENEMY_BOUNCE: 0.1,
    ENEMY_DRAG_X: 50,
    ENEMY_DRAG_Y: 50,
    ENEMY_ATTACK_RANGE_DEFAULT: 10,
    
    // Базовые константы для всех объектов
    DEFAULT_BOUNCE: 0.2,
    DEFAULT_DRAG: 100
};

// Цвета
export const COLORS = {
    // Цвета здоровья
    HEALTH_GREEN: 0x00ff00,
    HEALTH_YELLOW: 0xffff00,
    HEALTH_RED: 0xff0000,
    
    // Базовые цвета
    WHITE: 0xffffff,
    BLACK: 0x000000,
    GRAY: 0x6b7280,
    DARK_GRAY: 0x374151,
    YELLOW: 0xfbbf24,
    RED: 0xdc2626,
    GREEN: 0x16a34a
};


// ========== TELEGRAM WEBAPP UI СТИЛИ ==========

// Основные стили в стиле Telegram WebApp
export const TELEGRAM_UI_STYLES = {
    // Цвета
    colors: {
        primary: '#2481cc',           // Основной цвет Telegram
        primaryDark: '#1e6bb8',       // Темнее для hover
        text: '#ffffff',              // Белый текст
        textSecondary: '#8e8e93',     // Вторичный текст
        background: 'rgba(0, 0, 0, 0.15)',  // Полупрозрачный фон
        backgroundHover: 'rgba(0, 0, 0, 0.25)', // Фон при hover
        border: 'rgba(255, 255, 255, 0.2)',    // Полупрозрачная граница
        shadow: 'rgba(0, 0, 0, 0.15)',         // Тень
        success: '#34c759',           // Зеленый для успеха
        warning: '#ff9500',           // Оранжевый для предупреждения
        error: '#ff3b30'              // Красный для ошибки
    },
    
    // Размеры (уменьшены в 2 раза)
    sizes: {
        borderRadius: '4px',          // Скругление углов
        borderRadiusSmall: '3px',     // Маленькое скругление
        borderRadiusLarge: '6px',     // Большое скругление
        padding: '0 8px',             // Стандартные отступы
        paddingSmall: '0 6px',        // Маленькие отступы
        paddingLarge: '0 10px',       // Большие отступы
        height: '18px',               // Стандартная высота кнопок
        heightSmall: '14px',          // Маленькая высота
        heightLarge: '22px',          // Большая высота
        minWidth: '30px'              // Минимальная ширина
    },
    
    // Шрифты (уменьшены в 2 раза + еще на 20%)
    fonts: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        size: '5.6px',                // Стандартный размер (7px * 0.8)
        sizeSmall: '4.8px',           // Маленький размер (6px * 0.8)
        sizeLarge: '6.4px',           // Большой размер (8px * 0.8)
        weight: '500',                // Средний вес
        weightBold: '600',            // Жирный вес
        lineHeight: '1.2'             // Межстрочный интервал (относительный)
    },
    
    // Эффекты
    effects: {
        transition: 'all 0.2s ease-in-out',  // Плавные переходы
        backdropFilter: 'blur(10px)',        // Размытие фона
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Тень
        boxShadowHover: '0 4px 12px rgba(0, 0, 0, 0.2)', // Тень при hover
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' // Тень текста
    },
    
    // Z-index слои
    zIndex: {
        base: 1000,                   // Базовый слой
        modal: 2000,                  // Модальные окна
        tooltip: 3000,                // Подсказки
        notification: 4000            // Уведомления
    }
};

// Константы для UI компонентов (обновленные)
export const UI_CONSTANTS = {
    BUTTON: {
        DEFAULT_WIDTH: 200,
        DEFAULT_HEIGHT: 50,
        DEFAULT_FONT_SIZE: TELEGRAM_UI_STYLES.fonts.size,
        DEFAULT_FONT_FAMILY: TELEGRAM_UI_STYLES.fonts.family,
        DEFAULT_BORDER_RADIUS: TELEGRAM_UI_STYLES.sizes.borderRadius,
        DEFAULT_PADDING: TELEGRAM_UI_STYLES.sizes.padding,
        DEFAULT_HOVER_SCALE: 1.05,
        DEFAULT_CLICK_SCALE: 0.95,
        DEFAULT_BACKGROUND_COLOR: TELEGRAM_UI_STYLES.colors.background,
        DEFAULT_TEXT_COLOR: TELEGRAM_UI_STYLES.colors.text
    },
    DAMAGE_INDICATOR: {
        DEFAULT_DURATION: 1000,
        DEFAULT_DRIFT_DISTANCE: 50,
        DEFAULT_FONT_SIZE: '18px',
        DEFAULT_COLOR: TELEGRAM_UI_STYLES.colors.error,
        DEFAULT_STROKE_COLOR: TELEGRAM_UI_STYLES.colors.text,
        DEFAULT_STROKE_THICKNESS: 2,
        DEFAULT_FONT_FAMILY: TELEGRAM_UI_STYLES.fonts.family,
        DEFAULT_FONT_STYLE: 'bold',
        DEFAULT_APPEAR_DURATION: 200,
        DEFAULT_PULSE_DURATION: 150,
        DEFAULT_PULSE_REPEAT: 2
    },
    GAME_TIMER: {
        DEFAULT_UPDATE_INTERVAL: 100,
        DEFAULT_WARNING_TIME: 60000,  // 1 минута
        DEFAULT_CRITICAL_TIME: 30000, // 30 секунд
        DEFAULT_PADDING_X: 15,
        DEFAULT_PADDING_Y: 8
    },
    ABILITIES_DISPLAY: {
        DEFAULT_WIDTH: 200,
        DEFAULT_HEIGHT: 150,
        DEFAULT_BACKGROUND_COLOR: TELEGRAM_UI_STYLES.colors.background,
        DEFAULT_TEXT_COLOR: TELEGRAM_UI_STYLES.colors.text,
        DEFAULT_FONT_SIZE: TELEGRAM_UI_STYLES.fonts.sizeSmall,
        DEFAULT_FONT_FAMILY: TELEGRAM_UI_STYLES.fonts.family,
        DEFAULT_BORDER_RADIUS: TELEGRAM_UI_STYLES.sizes.borderRadius,
        DEFAULT_PADDING: '12px'
    },
    RESULTS_TABLE: {
        DEFAULT_WIDTH: 350,
        DEFAULT_HEIGHT: 200,
        DEFAULT_BACKGROUND_COLOR: TELEGRAM_UI_STYLES.colors.background,
        DEFAULT_TEXT_COLOR: TELEGRAM_UI_STYLES.colors.text,
        DEFAULT_FONT_SIZE: TELEGRAM_UI_STYLES.fonts.size,
        DEFAULT_FONT_FAMILY: TELEGRAM_UI_STYLES.fonts.family,
        DEFAULT_BORDER_RADIUS: TELEGRAM_UI_STYLES.sizes.borderRadiusLarge,
        DEFAULT_PADDING: '20px'
    }
};

// Константы глубины отображения объектов
export const DEPTH_CONSTANTS = {
    // Фон (самый задний план)
    BACKGROUND: -100,
    
    // Игровые объекты (от заднего к переднему)
    DEFENSE: 10,
    EGG: 20,
    ENEMY: 30,
    PROJECTILE: 5,
    ITEM: 100,
    
    // UI элементы (передний план)
    HEALTH_BAR: 101,
    UI_ELEMENTS: 1000,
    TIMER: 1001
};




