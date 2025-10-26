/**
 * Сцена тестирования рисования с распознаванием жестов
 * Позволяет рисовать фигуры и распознавать их с помощью $Q
 */
import { QDollarRecognizer, Point } from '../utils/qdollar.js';

export class TestGestures extends Phaser.Scene {
    constructor() {
        super({ key: 'TestGestures' });
        
        // Инициализация $Q распознавателя
        this.recognizer = null;
        
        // Состояние рисования
        this.isDrawing = false;
        this.strokeGraphics = null;
        this.lastPoint = null;
        this.drawingPoints = []; // Точки для распознавания
        
        // UI элементы
        this.clearButton = null;
        this.resultText = null;
    }

    create() {
        const { width, height } = this.scale;
        
        // Создаем фон
        this.createBackground();
        
        // Инициализируем $Q распознаватель
        this.initializeRecognizer();
        
        // Создаем UI элементы
        this.createUI();
        
        // Создаем область для рисования
        this.createDrawingArea();
        
        // Настраиваем обработчики ввода
        this.setupInputHandlers();
    }

    createBackground() {
        // Создаем градиентный фон
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x2c3e50, 1);
        graphics.fillRect(0, 0, this.scale.width, this.scale.height);
        
        // Добавляем статичную траву
        this.add.tileSprite(0, 0, this.scale.width, 200, 'grass')
            .setOrigin(0, 0)
            .setAlpha(0.2);
    }

    initializeRecognizer() {
        // Создаем экземпляр $Q распознавателя
        this.recognizer = new QDollarRecognizer();
        
        // Добавляем кастомный жест круга
        this.addCustomGestures();
        
        console.log('$Q Recognizer initialized with', this.recognizer.PointClouds.length, 'gestures');
        
        // Выводим список доступных жестов
        const gestureNames = this.recognizer.PointClouds.map(cloud => cloud.Name);
        console.log('Available gestures:', gestureNames.join(', '));
    }

    addCustomGestures() {
        // Создаем шаблон круга
        const circlePoints = this.createCircleTemplate();
        this.recognizer.AddGesture("circle", circlePoints);
        
        // Создаем шаблон треугольника
        const trianglePoints = this.createTriangleTemplate();
        this.recognizer.AddGesture("triangle", trianglePoints);
        
        // Создаем шаблоны линий под разными углами
        this.addLineTemplates();
        
        console.log('Added custom gestures: circle, triangle, improved lines');
    }

    createCircleTemplate() {
        // Создаем круг по образцу встроенного жеста "null", но без точки внутри
        const centerX = 50;
        const centerY = 50;
        const radius = 25;
        const numPoints = 40; // Много точек для плавного круга
        
        const points = [];
        
        // Создаем круг из одного штриха (ID = 1)
        for (let i = 0; i <= numPoints; i++) {
            const angle = (2 * Math.PI * i) / numPoints;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(new Point(x, y, 1));
        }
        
        return points;
    }

    createTriangleTemplate() {
        // Создаем равносторонний треугольник из 3 отдельных штрихов
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
        
        // Штрих 1: левая сторона (от верхней вершины к левой нижней)
        points.push(new Point(topX, topY, 1));
        points.push(new Point(leftX, leftY, 1));
        
        // Штрих 2: правая сторона (от левой нижней к правой нижней)
        points.push(new Point(leftX, leftY, 2));
        points.push(new Point(rightX, rightY, 2));
        
        // Штрих 3: верхняя сторона (от правой нижней к верхней вершине)
        points.push(new Point(rightX, rightY, 3));
        points.push(new Point(topX, topY, 3));
        
        return points;
    }

    addLineTemplates() {
        // Создаем шаблоны линий под разными углами (каждые 30 градусов)
        for (let angle = 0; angle < 180; angle += 30) {
            const linePoints = this.createLineTemplate(angle);
            this.recognizer.AddGesture("line", linePoints);
        }
        
        console.log('Added line templates for angles: 0°, 30°, 60°, 90°, 120°, 150°');
    }

    createLineTemplate(angleDegrees) {
        const centerX = 50;
        const centerY = 50;
        const length = 40;
        const numPoints = 20;
        
        const points = [];
        const angleRad = (angleDegrees * Math.PI) / 180;
        
        // Создаем линию под заданным углом
        for (let i = 0; i <= numPoints; i++) {
            const t = (i / numPoints) - 0.5; // от -0.5 до 0.5
            const x = centerX + t * length * Math.cos(angleRad);
            const y = centerY + t * length * Math.sin(angleRad);
            points.push(new Point(x, y, 1));
        }
        
        return points;
    }

    createUI() {
        const { width, height } = this.scale;
        
        // Заголовок
        this.add.text(width / 2, 50, '🎨 Тест Рисования с $Q', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        
        // Инструкции
        this.add.text(width / 2, 90, 'Рисуйте жесты: T, N, D, P, X, H, I, !, line, star, circle, triangle, arrow, null', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#bdc3c7',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Результат распознавания (оригинальный)
        this.resultText = this.add.text(width / 2, 120, 'Нарисуйте жест на поле ниже', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0.5);
        
        // Итоговое распознавание (фильтрованное)
        this.filteredResultText = this.add.text(width / 2, 160, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#27ae60',
            padding: { x: 15, y: 8 },
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);
        
        // Кнопка очистки
        this.clearButton = this.add.rectangle(width - 100, height - 80, 150, 50, 0xe74c3c)
            .setInteractive()
            .on('pointerdown', () => this.clearCanvas())
            .on('pointerover', () => this.clearButton.setAlpha(0.8))
            .on('pointerout', () => this.clearButton.setAlpha(1));
        
        this.add.text(width - 100, height - 80, 'Очистить', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Кнопка возврата в меню
        const menuButton = this.add.rectangle(100, height - 80, 150, 50, 0x2d5a27)
            .setInteractive()
            .on('pointerdown', () => this.scene.start('MenuScene'))
            .on('pointerover', () => menuButton.setAlpha(0.8))
            .on('pointerout', () => menuButton.setAlpha(1));
        
        this.add.text(100, height - 80, '🏠 В меню', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
    }

    createDrawingArea() {
        const { width, height } = this.scale;
        
        // Создаем область для рисования (центр экрана)
        const canvasX = width / 2;
        const canvasY = height / 2 + 50;
        const canvasWidth = Math.min(width - 100, 500);
        const canvasHeight = Math.min(height - 300, 400);
        
        // Фон области рисования
        this.canvasArea = this.add.rectangle(canvasX, canvasY, canvasWidth, canvasHeight, 0x2c3e50)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive();
        
        // Графика для отрисовки жестов
        this.strokeGraphics = this.add.graphics();
        this.strokeGraphics.setDepth(10);
        
        // Текст "Нарисуйте здесь"
        this.add.text(canvasX, canvasY, 'Нарисуйте здесь', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#7f8c8d',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Сохраняем границы области рисования
        this.canvasBounds = {
            x: canvasX - canvasWidth / 2,
            y: canvasY - canvasHeight / 2,
            width: canvasWidth,
            height: canvasHeight
        };
    }

    setupInputHandlers() {
        // Обработчики для мыши
        this.canvasArea.on('pointerdown', this.startDrawing, this);
        this.canvasArea.on('pointermove', this.draw, this);
        this.canvasArea.on('pointerup', this.stopDrawing, this);
        
        // Обработчики для тач-событий
        this.canvasArea.on('pointerdown', this.startDrawing, this);
        this.canvasArea.on('pointermove', this.draw, this);
        this.canvasArea.on('pointerup', this.stopDrawing, this);
    }

    startDrawing(pointer) {
        if (!this.isPointInCanvas(pointer.x, pointer.y)) return;
        
        this.isDrawing = true;
        this.lastPoint = { x: pointer.x, y: pointer.y };
        this.drawingPoints = []; // Сбрасываем точки для нового жеста
        
        // Очищаем предыдущий рисунок
        this.strokeGraphics.clear();
        
        // Сбрасываем результат
        this.resultText.setText('Рисую...');
        this.resultText.setStyle({ fill: '#f39c12' });
        
        console.log('Начало рисования в точке:', pointer.x, pointer.y);
    }

    draw(pointer) {
        if (!this.isDrawing || !this.isPointInCanvas(pointer.x, pointer.y)) return;
        
        // Рисуем линию от предыдущей точки
        if (this.lastPoint) {
            this.strokeGraphics.lineStyle(3, 0xffffff, 1);
            this.strokeGraphics.beginPath();
            this.strokeGraphics.moveTo(this.lastPoint.x, this.lastPoint.y);
            this.strokeGraphics.lineTo(pointer.x, pointer.y);
            this.strokeGraphics.strokePath();
        }
        
        // Добавляем точку для распознавания
        this.drawingPoints.push(new Point(pointer.x, pointer.y, 1));
        
        // Обновляем последнюю точку
        this.lastPoint = { x: pointer.x, y: pointer.y };
    }

    stopDrawing(pointer) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        // Добавляем последнюю точку
        if (pointer && this.isPointInCanvas(pointer.x, pointer.y)) {
            this.drawingPoints.push(new Point(pointer.x, pointer.y, 1));
        }
        
        // Распознаем жест, если нарисовано достаточно точек
        if (this.drawingPoints.length >= 5) {
            this.recognizeGesture();
        } else {
            this.resultText.setText('Слишком короткий жест. Нарисуйте более длинную фигуру.');
            this.resultText.setStyle({ fill: '#e74c3c' });
        }
        
        console.log('Завершение рисования. Точек:', this.drawingPoints.length);
    }

    recognizeGesture() {
        try {
            // Распознаем жест с помощью $Q
            const result = this.recognizer.Recognize(this.drawingPoints);
            
            console.log('Оригинальный результат $Q:', result);
            
            // Показываем оригинальный результат
            if (result.Name === 'No match.') {
                this.resultText.setText('Жест не распознан');
                this.resultText.setStyle({ fill: '#e74c3c' });
            } else {
                const gestureName = this.translateGestureName(result.Name);
                this.resultText.setText(`$Q: ${gestureName} (${Math.round(result.Score * 100)}%)`);
                this.resultText.setStyle({ fill: '#f39c12' });
            }
            
            // Фильтруем результат и показываем итоговое распознавание
            const filteredResult = this.filterGestureResult(result);
            this.displayFilteredResult(filteredResult);
            
        } catch (error) {
            console.error('Ошибка распознавания:', error);
            this.resultText.setText('Ошибка распознавания');
            this.resultText.setStyle({ fill: '#e74c3c' });
            this.filteredResultText.setText('ОШИБКА');
            this.filteredResultText.setStyle({ backgroundColor: '#e74c3c' });
        }
    }

    displayFilteredResult(filteredResult) {
        const { name, score, color } = filteredResult;
        
        // Обновляем фильтрованный лейбл
        this.filteredResultText.setText(`${name} (${score}%)`);
        this.filteredResultText.setStyle({ backgroundColor: color });
        
        // Анимация для успешного распознавания
        if (name !== 'НЕ РАСПОЗНАНО') {
            this.playSuccessAnimation();
        }
        
        console.log('Итоговое распознавание:', name, score + '%');
    }

    isLikelyLine() {
        if (this.drawingPoints.length < 3) return false;
        
        // Находим крайние точки
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const point of this.drawingPoints) {
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

    filterGestureResult(originalResult) {
        // Фильтруем результат в 4 категории
        const gestureName = originalResult.Name;
        const score = originalResult.Score;
        
        // ЛИНИЯ: если $Q распознал как line, exclamation, I, H, или геометрия показывает линию
        if (gestureName === 'line' || gestureName === 'exclamation' || gestureName === 'I' || gestureName === 'H' || this.isLikelyLine()) {
            return { name: 'ЛИНИЯ', score: Math.round(score * 100), color: '#27ae60' };
        }
        
        // КРУГ: распознался как circle, null (круг с точкой), или D
        if (gestureName === 'circle' || gestureName === 'null' || gestureName === 'D') {
            return { name: 'КРУГ', score: Math.round(score * 100), color: '#3498db' };
        }
        
        // ТРЕУГОЛЬНИК: распознался как triangle или P
        if (gestureName === 'triangle' || gestureName === 'P') {
            return { name: 'ТРЕУГОЛЬНИК', score: Math.round(score * 100), color: '#e67e22' };
        }
        
        // Остальные жесты считаем не распознанными
        return { name: 'НЕ РАСПОЗНАНО', score: 0, color: '#e74c3c' };
    }

    playSuccessAnimation() {
        // Анимация успеха для фильтрованного лейбла
        this.tweens.add({
            targets: this.filteredResultText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
            ease: 'Power2.easeInOut'
        });
    }

    translateGestureName(englishName) {
        const translations = {
            'circle': 'Круг',
            'triangle': 'Треугольник',
            'T': 'Буква T',
            'N': 'Буква N', 
            'D': 'Буква D',
            'P': 'Буква P',
            'X': 'Буква X',
            'H': 'Буква H',
            'I': 'Буква I',
            'exclamation': 'Восклицательный знак (!)',
            'line': 'Горизонтальная линия',
            'five-point star': 'Пятиконечная звезда',
            'six-point star': 'Шестиконечная звезда',
            'asterisk': 'Звездочка (*)',
            'null': 'Ноль (круг с точкой)',
            'arrowhead': 'Стрелка',
            'pitchfork': 'Вилы',
            'half-note': 'Половинная нота'
        };
        
        return translations[englishName] || englishName;
    }

    clearCanvas() {
        // Очищаем графику
        this.strokeGraphics.clear();
        
        // Сбрасываем состояние
        this.isDrawing = false;
        this.lastPoint = null;
        this.drawingPoints = [];
        
        // Сбрасываем результаты
        this.resultText.setText('Нарисуйте жест на поле ниже');
        this.resultText.setStyle({ fill: '#ffffff' });
        
        this.filteredResultText.setText('');
        this.filteredResultText.setStyle({ backgroundColor: '#27ae60' });
        
        console.log('Холст очищен');
    }

    isPointInCanvas(x, y) {
        return x >= this.canvasBounds.x && 
               x <= this.canvasBounds.x + this.canvasBounds.width &&
               y >= this.canvasBounds.y && 
               y <= this.canvasBounds.y + this.canvasBounds.height;
    }

    update() {
        // Обновление сцены (если необходимо)
    }

    destroy() {
        // Очистка ресурсов
        if (this.strokeGraphics) {
            this.strokeGraphics.destroy();
        }
    }
}
