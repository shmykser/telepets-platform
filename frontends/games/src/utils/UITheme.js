/**
 * Общие стили для всех UI компонентов
 * Следует принципу Single Responsibility Principle
 */
export const UI_THEME = {
    // Цвета
    colors: {
        primary: '#ffffff',
        secondary: '#000000',
        background: '#000000',
        backgroundAlpha: 0.8,
        border: '#ffffff',
        text: '#ffffff',
        success: '#00ff00',
        warning: '#ffaa00',
        error: '#ff0000',
        info: '#00aaff',
        health: {
            full: '#00ff00',
            medium: '#ffff00',
            low: '#ff0000'
        },
        timer: {
            normal: '#ffffff',
            warning: '#ffaa00',
            critical: '#ff0000'
        }
    },

    // Шрифты
    fonts: {
        family: 'Arial, sans-serif',
        sizes: {
            small: '14px',
            medium: '18px',
            large: '24px',
            xlarge: '32px'
        },
        weights: {
            normal: 'normal',
            bold: 'bold'
        }
    },

    // Отступы и размеры
    spacing: {
        padding: {
            small: 5,
            medium: 10,
            large: 15
        },
        margin: {
            small: 5,
            medium: 10,
            large: 15
        },
        border: {
            width: 2,
            radius: 5
        }
    },

    // Размеры компонентов
    sizes: {
        button: {
            width: 200,
            height: 50
        },
        indicator: {
            width: 250,
            height: 70
        },
        timer: {
            width: 150,
            height: 45
        },
        healthBar: {
            width: 100,
            height: 6
        },
        damageIndicator: {
            fontSize: '24px'
        }
    },

    // Анимации
    animations: {
        duration: {
            fast: 150,
            normal: 300,
            slow: 500
        },
        easing: {
            easeIn: 'Power2.easeIn',
            easeOut: 'Power2.easeOut',
            easeInOut: 'Power2.easeInOut',
            bounce: 'Bounce.easeOut',
            elastic: 'Elastic.easeOut'
        }
    },

    // Состояния
    states: {
        normal: {
            alpha: 1,
            scale: 1
        },
        hover: {
            alpha: 0.9,
            scale: 1.05
        },
        active: {
            alpha: 0.8,
            scale: 0.95
        },
        disabled: {
            alpha: 0.5,
            scale: 1
        }
    }
};

/**
 * Получает цвет по имени
 * @param {string} colorName - Имя цвета
 * @returns {string} Цвет в формате #ffffff
 */
export function getColor(colorName) {
    const keys = colorName.split('.');
    let color = UI_THEME.colors;
    
    for (const key of keys) {
        color = color[key];
        if (!color) return UI_THEME.colors.primary;
    }
    
    return color;
}

/**
 * Получает размер шрифта по имени
 * @param {string} sizeName - Имя размера
 * @returns {string} Размер шрифта
 */
export function getFontSize(sizeName) {
    return UI_THEME.fonts.sizes[sizeName] || UI_THEME.fonts.sizes.medium;
}

/**
 * Получает отступ по имени
 * @param {string} spacingName - Имя отступа
 * @returns {number} Размер отступа
 */
export function getSpacing(spacingName) {
    const keys = spacingName.split('.');
    let spacing = UI_THEME.spacing;
    
    for (const key of keys) {
        spacing = spacing[key];
        if (!spacing) return UI_THEME.spacing.padding.medium;
    }
    
    return spacing;
}

/**
 * Получает размер компонента по имени
 * @param {string} sizeName - Имя размера
 * @returns {Object} Размеры компонента
 */
export function getComponentSize(sizeName) {
    return UI_THEME.sizes[sizeName] || UI_THEME.sizes.button;
}

/**
 * Получает конфигурацию анимации
 * @param {string} animationName - Имя анимации
 * @returns {Object} Конфигурация анимации
 */
export function getAnimationConfig(animationName) {
    return UI_THEME.animations[animationName] || UI_THEME.animations.duration;
}

/**
 * Получает состояние компонента
 * @param {string} stateName - Имя состояния
 * @returns {Object} Состояние компонента
 */
export function getComponentState(stateName) {
    return UI_THEME.states[stateName] || UI_THEME.states.normal;
}
