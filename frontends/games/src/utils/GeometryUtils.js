/**
 * Утилитарные функции для геометрических вычислений
 * Следует принципу Single Responsibility Principle
 */
export class GeometryUtils {
    // Математические константы
    static TWO_PI = Math.PI * 2;
    /**
     * Вычисляет расстояние между двумя точками
     * @param {number} x1 - X координата первой точки
     * @param {number} y1 - Y координата первой точки
     * @param {number} x2 - X координата второй точки
     * @param {number} y2 - Y координата второй точки
     * @returns {number} Расстояние между точками
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Вычисляет угол между двумя точками в радианах
     * @param {number} x1 - X координата первой точки
     * @param {number} y1 - Y координата первой точки
     * @param {number} x2 - X координата второй точки
     * @param {number} y2 - Y координата второй точки
     * @returns {number} Угол в радианах
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Вычисляет угол к цели (алиас для angle)
     * @param {number} x1 - X координата первой точки
     * @param {number} y1 - Y координата первой точки
     * @param {number} x2 - X координата второй точки
     * @param {number} y2 - Y координата второй точки
     * @returns {number} Угол в радианах
     */
    static angleToTarget(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Нормализует вектор
     * @param {number} x - X компонент вектора
     * @param {number} y - Y компонент вектора
     * @returns {Object} Нормализованный вектор {x, y}
     */
    static normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }

    /**
     * Проверяет, находится ли точка внутри прямоугольника
     * @param {number} x - X координата точки
     * @param {number} y - Y координата точки
     * @param {number} rectX - X координата прямоугольника
     * @param {number} rectY - Y координата прямоугольника
     * @param {number} rectWidth - Ширина прямоугольника
     * @param {number} rectHeight - Высота прямоугольника
     * @returns {boolean} true если точка внутри прямоугольника
     */
    static pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
        return x >= rectX && x <= rectX + rectWidth && 
               y >= rectY && y <= rectY + rectHeight;
    }


    /**
     * Проверяет, находится ли точка в радиусе от центра
     * @param {number} x - X координата точки
     * @param {number} y - Y координата точки
     * @param {number} centerX - X координата центра
     * @param {number} centerY - Y координата центра
     * @param {number} radius - Радиус
     * @returns {boolean} true если точка в радиусе
     */
    static isInRadius(x, y, centerX, centerY, radius) {
        const distance = this.distance(x, y, centerX, centerY);
        return distance <= radius;
    }


    /**
     * Ограничивает значение в заданном диапазоне
     * @param {number} value - Значение для ограничения
     * @param {number} min - Минимальное значение
     * @param {number} max - Максимальное значение
     * @returns {number} Ограниченное значение
     */
    static clamp(value, min, max) {
        return this.min(this.max(value, min), max);
    }

    /**
     * Линейная интерполяция между двумя значениями
     * @param {number} a - Начальное значение
     * @param {number} b - Конечное значение
     * @param {number} t - Параметр интерполяции (0-1)
     * @returns {number} Интерполированное значение
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Генерирует случайное целое число между min и max (включительно)
     * @param {number} min - Минимальное значение
     * @param {number} max - Максимальное значение
     * @returns {number} Случайное целое число
     */
    static randomBetween(min, max) {
        return this.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Генерирует случайное число с плавающей точкой между min и max
     * @param {number} min - Минимальное значение
     * @param {number} max - Максимальное значение
     * @returns {number} Случайное число с плавающей точкой
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Конвертирует градусы в радианы
     * @param {number} degrees - Значение в градусах
     * @returns {number} Значение в радианах
     */
    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Конвертирует радианы в градусы
     * @param {number} radians - Значение в радианах
     * @returns {number} Значение в градусах
     */
    static radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Определяет направление по дельтам координат
     * @param {number} deltaX - Изменение по X
     * @param {number} deltaY - Изменение по Y
     * @returns {string} Направление: 'left', 'right', 'up', 'down', 'unknown'
     */
    static directionFromDeltas(deltaX, deltaY) {
        if (this.abs(deltaX) > this.abs(deltaY)) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    /**
     * Проверяет, находится ли направление в указанном направлении
     * @param {number} deltaX - Изменение по X
     * @param {number} deltaY - Изменение по Y
     * @param {string} direction - Направление для проверки
     * @returns {boolean} true если направление совпадает
     */
    static isInDirection(deltaX, deltaY, direction) {
        switch (direction) {
            case 'left':
                return deltaX < 0 && this.abs(deltaY) < this.abs(deltaX);
            case 'right':
                return deltaX > 0 && this.abs(deltaY) < this.abs(deltaX);
            case 'up':
                return deltaY < 0 && this.abs(deltaX) < this.abs(deltaY);
            case 'down':
                return deltaY > 0 && this.abs(deltaX) < this.abs(deltaY);
            default:
                return false;
        }
    }

    /**
     * Округляет число до указанного количества знаков после запятой
     * @param {number} value - Значение для округления
     * @param {number} decimals - Количество знаков после запятой
     * @returns {number} Округленное значение
     */
    static roundToDecimal(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * Возвращает абсолютное значение числа
     * @param {number} value - Значение
     * @returns {number} Абсолютное значение
     */
    static abs(value) {
        return Math.abs(value);
    }

    /**
     * Округляет число вниз до ближайшего целого
     * @param {number} value - Значение
     * @returns {number} Округленное вниз значение
     */
    static floor(value) {
        return Math.floor(value);
    }

    /**
     * Округляет число вверх до ближайшего целого
     * @param {number} value - Значение
     * @returns {number} Округленное вверх значение
     */
    static ceil(value) {
        return Math.ceil(value);
    }

    /**
     * Возвращает минимальное значение из двух
     * @param {number} a - Первое значение
     * @param {number} b - Второе значение
     * @returns {number} Минимальное значение
     */
    static min(a, b) {
        return Math.min(a, b);
    }

    /**
     * Возвращает максимальное значение из двух
     * @param {number} a - Первое значение
     * @param {number} b - Второе значение
     * @returns {number} Максимальное значение
     */
    static max(a, b) {
        return Math.max(a, b);
    }

    /**
     * Вычисляет волновое смещение для синусоидальных движений
     * @param {number} time - Время
     * @param {number} frequency - Частота волны
     * @param {number} amplitude - Амплитуда волны
     * @returns {number} Смещение по волне
     */
    static calculateWaveOffset(time, frequency, amplitude) {
        return Math.sin(time * frequency) * amplitude;
    }

    /**
     * Вычисляет позицию на окружности
     * @param {number} centerX - X координата центра
     * @param {number} centerY - Y координата центра
     * @param {number} radius - Радиус окружности
     * @param {number} angle - Угол в радианах
     * @returns {Object} Позиция {x, y}
     */
    static calculateCircularPosition(centerX, centerY, radius, angle) {
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    }

    /**
     * Генерирует случайное смещение
     * @param {number} intensity - Интенсивность смещения
     * @returns {Object} Случайное смещение {x, y}
     */
    static generateRandomOffset(intensity) {
        return {
            x: (Math.random() - 0.5) * intensity,
            y: (Math.random() - 0.5) * intensity
        };
    }

    /**
     * Вычисляет зигзагообразное смещение
     * @param {number} time - Время
     * @param {number} intensity - Интенсивность зигзага
     * @returns {Object} Зигзагообразное смещение {x, y}
     */
    static calculateZigzag(time, intensity) {
        return {
            x: Math.sin(time * 0.01) * intensity * 0.5,
            y: Math.cos(time * 0.007) * intensity * 0.3
        };
    }

    /**
     * Вычисляет порхающее смещение
     * @param {number} time - Время
     * @param {number} intensity - Интенсивность порхания
     * @returns {Object} Порхающее смещение {x, y}
     */
    static calculateFlutter(time, intensity) {
        return {
            x: Math.sin(time * 0.02) * intensity * 0.3,
            y: Math.cos(time * 0.015) * intensity * 0.2
        };
    }

    /**
     * Находит объекты в радиусе от центра
     * @param {Array} objects - Массив объектов для проверки
     * @param {number} centerX - X координата центра
     * @param {number} centerY - Y координата центра
     * @param {number} radius - Радиус поиска
     * @param {Function} filterFn - Функция фильтрации (опционально)
     * @returns {Array} Массив объектов в радиусе
     */
    static findObjectsInRadius(objects, centerX, centerY, radius, filterFn = null) {
        const objectsInRange = [];
        for (const obj of objects) {
            if (filterFn && !filterFn(obj)) continue;
            
            const distance = this.distance(centerX, centerY, obj.x, obj.y);
            if (distance <= radius) {
                objectsInRange.push(obj);
            }
        }
        return objectsInRange;
    }

    /**
     * Находит объекты в направлении от центра
     * @param {Array} objects - Массив объектов для проверки
     * @param {number} centerX - X координата центра
     * @param {number} centerY - Y координата центра
     * @param {string} direction - Направление ('left', 'right', 'up', 'down')
     * @param {number} range - Дальность поиска
     * @param {Function} filterFn - Функция фильтрации (опционально)
     * @returns {Array} Массив объектов в направлении
     */
    static findObjectsInDirection(objects, centerX, centerY, direction, range, filterFn = null) {
        const objectsInDirection = [];
        for (const obj of objects) {
            if (filterFn && !filterFn(obj)) continue;
            
            const deltaX = obj.x - centerX;
            const deltaY = obj.y - centerY;
            const distance = this.distance(centerX, centerY, obj.x, obj.y);
            
            if (distance <= range && this.isInDirection(deltaX, deltaY, direction)) {
                objectsInDirection.push(obj);
            }
        }
        return objectsInDirection;
    }

    /**
     * Находит первый объект в радиусе от центра
     * @param {Array} objects - Массив объектов для проверки
     * @param {number} centerX - X координата центра
     * @param {number} centerY - Y координата центра
     * @param {number} radius - Радиус поиска
     * @param {Function} filterFn - Функция фильтрации (опционально)
     * @returns {Object|null} Первый найденный объект или null
     */
    static findFirstObjectInRadius(objects, centerX, centerY, radius, filterFn = null) {
        for (const obj of objects) {
            if (filterFn && !filterFn(obj)) continue;
            
            if (this.isInRadius(centerX, centerY, obj.x, obj.y, radius)) {
                return obj;
            }
        }
        return null;
    }

    /**
     * Вычисляет динамический радиус попадания для объекта
     * @param {Object} object - Игровой объект
     * @param {string} objectType - Тип объекта ('enemy', 'egg', 'defense', 'item', 'field')
     * @param {Object} targetSettings - Настройки целей из TARGET_SETTINGS
     * @returns {number} Динамический радиус попадания
     */
    static calculateHitRadius(object, objectType, targetSettings) {
        const settings = targetSettings[objectType];
        if (!settings) return 0;
        
        let baseRadius = 0;
        
        // Для врагов и яйца используем _size (1, 2, 3) и конвертируем в пиксели
        if ((objectType === 'enemy' || objectType === 'egg') && object._size) {
            baseRadius = object._size * 10; // 1 = 10px, 2 = 20px, 3 = 30px
        }
        // Для других объектов используем стандартные width/height
        else {
            baseRadius = this.max(object.width || 0, object.height || 0) / 2;
        }
        
        // Если размер не определен, используем минимальный размер
        if (baseRadius === 0) {
            baseRadius = 10; // Минимальный размер 10px
        }
        
        // Общий радиус = размер объекта + толерантность промаха для данного типа объекта
        const totalRadius = baseRadius + settings.missTolerance;
        
        return totalRadius;
    }

    /**
     * Универсальный метод получения размера объекта в пикселях
     * @param {Object} obj - игровой объект
     * @returns {number} размер в пикселях
     */
    static getObjectSize(obj) {
        if (!obj) return 32;
        // Используем реальный размер спрайта, если он есть
        if (typeof obj.displayWidth === 'number' && obj.displayWidth > 0) {
            return obj.displayWidth;
        }
        // Phaser Arcade Body может иметь ширину
        if (obj.body && typeof obj.body.width === 'number' && obj.body.width > 0) {
            return obj.body.width;
        }
        if (typeof obj.getSizeInPixels === 'function') {
            return obj.getSizeInPixels();
        }
        if (typeof obj.size === 'number') {
            return 32 * Math.pow(2, obj.size - 1);
        }
        return 32;
    }

    /**
     * Универсальный расчет effectiveAttackRange с учетом размеров объектов
     * @param {Object} attacker
     * @param {Object} target
     * @param {number} baseRange
     * @returns {number}
     */
    static effectiveAttackRange(attacker, target, baseRange) {
        // Простой расчет: половина реального спрайта атакующего + половина спрайта цели + baseRange
        const attackerHalf = (attacker && typeof attacker.displayWidth === 'number' && attacker.displayWidth > 0)
            ? attacker.displayWidth / 2
            : GeometryUtils.getObjectSize(attacker) / 2;
        const targetHalf = (target && typeof target.displayWidth === 'number' && target.displayWidth > 0)
            ? target.displayWidth / 2
            : GeometryUtils.getObjectSize(target) / 2;
        return (baseRange || 0) + attackerHalf + targetHalf;
    }
}
