import { GeometryUtils } from '../utils/GeometryUtils.js';
import { GESTURE_CONSTANTS } from '../types/gestureTypes.js';
import { QDollarRecognizer, Point } from '../utils/qdollar.js';

/**
 * Объединенная система жестов на основе Phaser Input Events и $Q распознавателя
 * Поддерживает: tap, longTap (через Phaser), line, circle, triangle (через $Q)
 */
export class GestureSystem {
    constructor(scene, callbacks = {}) {
        this.scene = scene;
        this.callbacks = callbacks;
        
        // Отслеживание активных жестов (по примеру EffectSystem)
        this.activeGestures = new Map();
        this.gestureStats = {
            totalGestures: 0,
            gesturesByType: {}
        };
        
        // $Q распознаватель для сложных жестов
        this.qRecognizer = new QDollarRecognizer();
        this.initializeQRecognizer();
        
        // Состояние рисования для $Q жестов
        this.drawingState = {
            isDrawing: false,
            drawingPoints: []
        };
        
        // Настройки жестов из констант
        this.settings = {
            tap: {
                maxDuration: GESTURE_CONSTANTS.TAP.MAX_DURATION,
                maxDistance: GESTURE_CONSTANTS.TAP.MAX_DISTANCE
            },
            longTap: {
                minDuration: GESTURE_CONSTANTS.LONG_TAP.MIN_DURATION,
                maxDistance: GESTURE_CONSTANTS.LONG_TAP.MAX_DISTANCE
            }
        };
        
        // Состояние жестов
        this.gestureState = {
            isPointerDown: false,
            startTime: 0,
            startX: 0,
            startY: 0,
            lastTapTime: 0,
            lastTapX: 0,
            lastTapY: 0,
            currentX: 0,
            currentY: 0,
            moveDistance: 0
        };
        
        this.setupInputHandlers();
    }
    
    /**
     * Инициализация $Q распознавателя с шаблонами жестов
     */
    initializeQRecognizer() {
        // Создаем шаблон круга
        const circlePoints = this.createCircleTemplate();
        this.qRecognizer.AddGesture("circle", circlePoints);
        
        // Создаем шаблон треугольника
        const trianglePoints = this.createTriangleTemplate();
        this.qRecognizer.AddGesture("triangle", trianglePoints);
        
        // Создаем шаблоны линий под разными углами
        this.addLineTemplates();
    }
    
    /**
     * Создание шаблона круга для $Q
     */
    createCircleTemplate() {
        const centerX = 50;
        const centerY = 50;
        const radius = 25;
        const numPoints = 40;
        
        const points = [];
        
        for (let i = 0; i <= numPoints; i++) {
            const angle = (2 * Math.PI * i) / numPoints;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(new Point(x, y, 1));
        }
        
        return points;
    }
    
    /**
     * Создание шаблона треугольника для $Q
     */
    createTriangleTemplate() {
        const centerX = 50;
        const centerY = 50;
        const radius = 30;
        
        const points = [];
        
        // Вычисляем вершины треугольника
        const topX = centerX;
        const topY = centerY - radius;
        const leftX = centerX - radius * Math.cos(Math.PI/6);
        const leftY = centerY + radius * Math.sin(Math.PI/6);
        const rightX = centerX + radius * Math.cos(Math.PI/6);
        const rightY = centerY + radius * Math.sin(Math.PI/6);
        
        // Штрих 1: левая сторона
        points.push(new Point(topX, topY, 1));
        points.push(new Point(leftX, leftY, 1));
        
        // Штрих 2: правая сторона
        points.push(new Point(leftX, leftY, 2));
        points.push(new Point(rightX, rightY, 2));
        
        // Штрих 3: верхняя сторона
        points.push(new Point(rightX, rightY, 3));
        points.push(new Point(topX, topY, 3));
        
        return points;
    }
    
    /**
     * Добавление шаблонов линий под разными углами
     */
    addLineTemplates() {
        for (let angle = 0; angle < 180; angle += 30) {
            const linePoints = this.createLineTemplate(angle);
            this.qRecognizer.AddGesture("line", linePoints);
        }
    }
    
    /**
     * Создание шаблона линии для $Q
     */
    createLineTemplate(angleDegrees) {
        const centerX = 50;
        const centerY = 50;
        const length = 40;
        const numPoints = 20;
        
        const points = [];
        const angleRad = (angleDegrees * Math.PI) / 180;
        
        for (let i = 0; i <= numPoints; i++) {
            const t = (i / numPoints) - 0.5;
            const x = centerX + t * length * Math.cos(angleRad);
            const y = centerY + t * length * Math.sin(angleRad);
            points.push(new Point(x, y, 1));
        }
        
        return points;
    }
    
    /**
     * Настройка обработчиков Phaser Input Events
     */
    setupInputHandlers() {
        // Начало касания
        this.scene.input.on('pointerdown', (pointer, currentlyOver, event) => {
            if (event && event.defaultPrevented) return;
            this.handlePointerDown(pointer);
        });
        
        // Движение пальца
        this.scene.input.on('pointermove', (pointer, currentlyOver, event) => {
            if (event && event.defaultPrevented) return;
            this.handlePointerMove(pointer);
        });
        
        // Конец касания
        this.scene.input.on('pointerup', (pointer, currentlyOver, event) => {
            if (event && event.defaultPrevented) return;
            this.handlePointerUp(pointer);
        });
        
        // Выход за пределы экрана
        this.scene.input.on('pointerupoutside', (pointer, event) => {
            if (event && event.defaultPrevented) return;
            this.handlePointerUp(pointer);
        });
    }
    
    /**
     * Обработка начала касания
     */
    handlePointerDown(pointer) {
        // Проверяем, не нажали ли мы на интерактивный объект (камень для drag & drop)
        const hitObjects = this.scene.input.hitTestPointer(pointer);
        for (const obj of hitObjects) {
            if (obj.isDraggable && obj.interactive) {
                // Игнорируем жест, позволяя drag & drop системе обработать это
                return;
            }
        }
        
        this.gestureState.isPointerDown = true;
        this.gestureState.startTime = this.scene.time.now;
        this.gestureState.startX = pointer.x;
        this.gestureState.startY = pointer.y;
        this.gestureState.currentX = pointer.x;
        this.gestureState.currentY = pointer.y;
        this.gestureState.moveDistance = 0;
        this.gestureState.longTapTriggered = false;
        
        // Начинаем отслеживание для $Q жестов
        this.drawingState.isDrawing = true;
        this.drawingState.drawingPoints = [];
        this.drawingState.drawingPoints.push(new Point(pointer.x, pointer.y, 1));
        
        // Запускаем таймер для долгого тапа
        this.gestureState.longTapTimer = this.scene.time.delayedCall(
            this.settings.longTap.minDuration,
            () => {
                if (this.gestureState.isPointerDown && !this.gestureState.longTapTriggered) {
                    this.triggerLongTap(pointer);
                }
            }
        );
    }
    
    /**
     * Обработка движения пальца
     */
    handlePointerMove(pointer) {
        if (!this.gestureState.isPointerDown) return;
        
        this.gestureState.currentX = pointer.x;
        this.gestureState.currentY = pointer.y;
        
        // Вычисляем общее расстояние движения
        const distance = GeometryUtils.distance(
            this.gestureState.startX, 
            this.gestureState.startY, 
            pointer.x, 
            pointer.y
        );
        this.gestureState.moveDistance = distance;
        
        // Если движение превышает лимит долгого тапа, отменяем его
        if (this.gestureState.moveDistance > this.settings.longTap.maxDistance) {
            this.cancelLongTap();
        }
        
        // Добавляем точку для $Q распознавания
        if (this.drawingState.isDrawing) {
            this.drawingState.drawingPoints.push(new Point(pointer.x, pointer.y, 1));
        }
    }
    
    /**
     * Обработка окончания касания
     */
    handlePointerUp(pointer) {
        if (!this.gestureState.isPointerDown) return;
        
        // Отменяем таймер долгого тапа
        this.cancelLongTap();
        
        const currentTime = this.scene.time.now;
        const duration = currentTime - this.gestureState.startTime;
        const distance = this.gestureState.moveDistance;
        
        // Добавляем последнюю точку для $Q
        if (this.drawingState.isDrawing) {
            this.drawingState.drawingPoints.push(new Point(pointer.x, pointer.y, 1));
        }
        
        // Определяем тип жеста (Phaser или $Q), но только если долгий тап не был уже сработан
        if (!this.gestureState.longTapTriggered) {
            const gesture = this.detectGesture(duration, distance, pointer);
            if (gesture) {
                this.executeGesture(gesture, pointer);
            }
        }
        
        // Сбрасываем состояние
        this.gestureState.isPointerDown = false;
        this.gestureState.longTapTriggered = false;
        this.drawingState.isDrawing = false;
    }
    
    /**
     * Определение типа жеста
     */
    detectGesture(duration, distance, pointer) {
        const settings = this.settings;
        
        // Сначала пробуем $Q распознавание для сложных жестов
        if (this.drawingState.drawingPoints.length >= 5) {
            const qGesture = this.tryQRecognition();
            if (qGesture) {
                return qGesture;
            }
        }
        
        // Проверяем долгий тап
        if (duration >= settings.longTap.minDuration && 
            distance <= settings.longTap.maxDistance) {
            console.log(`🎯 [DEBUG] Long tap detected: duration=${duration}ms, distance=${distance}px`);
            return this.createLongTapGesture(pointer);
        }
        
        // Проверяем обычный тап
        if (duration <= settings.tap.maxDuration && 
            distance <= settings.tap.maxDistance) {
            return this.createTapGesture(pointer);
        }
        
        return null;
    }
    
    /**
     * Попытка распознавания через $Q
     */
    tryQRecognition() {
        try {
            // Распознаем жест с помощью $Q
            const result = this.qRecognizer.Recognize(this.drawingState.drawingPoints);
            
            if (result.Name === 'No match.') {
                return null;
            }
            
            // Фильтруем результат в наши категории
            const filteredResult = this.filterQGestureResult(result);
            
            if (filteredResult.type !== 'unknown') {
                return filteredResult;
            }
            
        } catch (error) {
            console.error('Ошибка $Q распознавания:', error);
        }
        
        return null;
    }
    
    /**
     * Фильтрация результата $Q в наши категории
     */
    filterQGestureResult(originalResult) {
        const gestureName = originalResult.Name;
        const score = originalResult.Score;
        
        // ЛИНИЯ: если $Q распознал как line, exclamation, I, H, или геометрия показывает линию
        if (gestureName === 'line' || gestureName === 'exclamation' || gestureName === 'I' || gestureName === 'H' || this.isLikelyLine()) {
            return {
                type: 'line',
                x: this.gestureState.startX,
                y: this.gestureState.startY,
                endX: this.gestureState.currentX,
                endY: this.gestureState.currentY,
                score: Math.round(score * 100),
                duration: this.scene.time.now - this.gestureState.startTime
            };
        }
        
        // КРУГ: распознался как circle, null (круг с точкой), или D
        if (gestureName === 'circle' || gestureName === 'null' || gestureName === 'D') {
            return {
                type: 'circle',
                x: this.gestureState.startX,
                y: this.gestureState.startY,
                score: Math.round(score * 100),
                duration: this.scene.time.now - this.gestureState.startTime
            };
        }
        
        // ТРЕУГОЛЬНИК: распознался как triangle или P
        if (gestureName === 'triangle' || gestureName === 'P') {
            return {
                type: 'triangle',
                x: this.gestureState.startX,
                y: this.gestureState.startY,
                score: Math.round(score * 100),
                duration: this.scene.time.now - this.gestureState.startTime
            };
        }
        
        return { type: 'unknown' };
    }
    
    /**
     * Проверка, является ли жест линией по геометрии
     */
    isLikelyLine() {
        if (this.drawingState.drawingPoints.length < 3) return false;
        
        // Находим крайние точки
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const point of this.drawingState.drawingPoints) {
            minX = Math.min(minX, point.X);
            maxX = Math.max(maxX, point.X);
            minY = Math.min(minY, point.Y);
            maxY = Math.max(maxY, point.Y);
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Проверяем соотношение сторон
        const aspectRatio = Math.max(width, height) / Math.min(width, height);
        
        // Если одна сторона намного больше другой, это скорее всего линия
        return aspectRatio > 3;
    }
    
    
    /**
     * Создание жеста тапа
     */
    createTapGesture(pointer) {
        return {
            type: 'tap',
            x: pointer.x,
            y: pointer.y,
            duration: this.scene.time.now - this.gestureState.startTime
        };
    }
    
    
    /**
     * Создание жеста долгого тапа
     */
    createLongTapGesture(pointer) {
        return {
            type: 'longTap',
            x: pointer.x,
            y: pointer.y,
            duration: this.scene.time.now - this.gestureState.startTime
        };
    }
    
    /**
     * Выполнение жеста
     */
    executeGesture(gesture, pointer) {
        // Отслеживаем статистику жестов
        this.trackGesture(gesture);
        
        
        // Вызываем соответствующий callback
        const callback = this.callbacks[`on${gesture.type.charAt(0).toUpperCase() + gesture.type.slice(1)}`];
        if (callback && typeof callback === 'function') {
            callback(gesture);
        }
    }
    
    /**
     * Отслеживает выполненный жест (по примеру EffectSystem)
     */
    trackGesture(gesture) {
        this.gestureStats.totalGestures++;
        
        if (!this.gestureStats.gesturesByType[gesture.type]) {
            this.gestureStats.gesturesByType[gesture.type] = 0;
        }
        this.gestureStats.gesturesByType[gesture.type]++;
        
        // Сохраняем последний жест с временной меткой
        this.activeGestures.set('last', {
            gesture: gesture,
            timestamp: this.scene.time.now
        });
    }

    /**
     * Получает статистику жестов (по примеру EffectSystem)
     */
    getStats() {
        return {
            totalGestures: this.gestureStats.totalGestures,
            gesturesByType: { ...this.gestureStats.gesturesByType },
            activeGestures: this.activeGestures.size
        };
    }

    /**
     * Очищает статистику жестов
     */
    clearStats() {
        this.gestureStats.totalGestures = 0;
        this.gestureStats.gesturesByType = {};
        this.activeGestures.clear();
    }

    /**
     * Срабатывает долгий тап по таймеру
     * @param {Object} pointer - Объект указателя
     */
    triggerLongTap(pointer) {
        if (!this.gestureState.isPointerDown || this.gestureState.longTapTriggered) return;
        
        // Проверяем, что палец не сдвинулся слишком далеко
        if (this.gestureState.moveDistance <= this.settings.longTap.maxDistance) {
            this.gestureState.longTapTriggered = true;
            console.log(`🎯 [DEBUG] Long tap triggered by timer: duration=${this.settings.longTap.minDuration}ms`);
            
            const longTapGesture = this.createLongTapGesture(pointer);
            this.executeGesture(longTapGesture, pointer);
        }
    }
    
    /**
     * Отменяет долгий тап (при движении или отпускании пальца)
     */
    cancelLongTap() {
        if (this.gestureState.longTapTimer) {
            this.gestureState.longTapTimer.remove();
            this.gestureState.longTapTimer = null;
        }
    }

    /**
     * Уничтожение системы жестов
     */
    destroy() {
        // Отменяем таймер долгого тапа
        this.cancelLongTap();
        
        // Удаляем обработчики событий
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerup');
        this.scene.input.off('pointerupoutside');
        
        // Очищаем отслеживание состояния
        this.activeGestures.clear();
        this.gestureStats = null;
    }
}
