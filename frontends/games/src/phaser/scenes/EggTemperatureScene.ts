import Phaser from 'phaser';

import { settings } from '@config/settings';
import { buildUrl } from '@config/endpoints';
import { sendGameEvent } from '@integration/postMessage';

type SceneData = {
  stageSegments?: string[];
  userId?: string;
  petName?: string;
  sceneMeta?: unknown;
};

// Цвета в стиле webapp
const COLORS = {
  background: '#0a0a0a',
  backgroundGradient: ['#0a0a0a', '#1a0a1a', '#0a1a1a'],
  glass: 'rgba(17, 24, 39, 0.65)',
  glassBorder: 'rgba(148, 163, 184, 0.12)',
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5f5',
    muted: '#94a3b8'
  },
  egg: {
    gradient: ['#3b82f6', '#8b5cf6', '#ec4899', '#3b82f6'], // blue to purple to pink
    zone: 'rgba(59, 130, 246, 0.26)', // blue-500 with opacity
    hot: '#f87171', // red-400
    cold: '#60a5fa', // blue-400
    optimal: '#4ade80' // green-400
  },
  gauge: {
    background: 'rgba(15, 23, 42, 0.82)', // gray-900 with opacity
    border: 'rgba(148, 163, 184, 0.6)', // gray-400 with opacity
    fillHot: ['#f87171', '#ef4444'], // red gradient
    fillCold: ['#60a5fa', '#3b82f6'], // blue gradient
    fillOptimal: ['#4ade80', '#22c55e'] // green gradient
  }
};

export class EggTemperatureScene extends Phaser.Scene {
  private userId?: string;
  private petName?: string;
  private stageSegments: string[] = [];
  private petImageKey = 'pet-egg-image';
  private petImageUrl?: string;

  // Игровые переменные
  private config = settings.game.eggTemperature;
  private currentTemp: number;
  private timeInZone: number = 0;
  private successShown: boolean = false;
  private pendingHeat: number = 0;
  private lastPointerPosition: { x: number; y: number; time: number } | null = null;

  // Визуальные элементы
  private petImage?: Phaser.GameObjects.Image;
  private topOverlay?: Phaser.GameObjects.Graphics;
  private bottomOverlay?: Phaser.GameObjects.Graphics;
  private gaugeContainer!: Phaser.GameObjects.Graphics;
  private gaugeFill!: Phaser.GameObjects.Graphics;
  private gaugeGlow!: Phaser.GameObjects.Graphics;
  private optimalZoneOverlay!: Phaser.GameObjects.Graphics;
  private temperatureText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private glowTween?: Phaser.Tweens.Tween;

  // Метрики для адаптивного layout
  private layout: {
    width: number;
    height: number;
    gaugeX: number;
    gaugeY: number;
    gaugeWidth: number;
    gaugeHeight: number;
    petImageX: number;
    petImageY: number;
    petImageScale: number;
  } = {
    width: 0,
    height: 0,
    gaugeX: 0,
    gaugeY: 0,
    gaugeWidth: 0,
    gaugeHeight: 0,
    petImageX: 0,
    petImageY: 0,
    petImageScale: 1
  };

  constructor() {
    super({ key: 'EggTemperatureScene' });
    this.currentTemp = this.config.initialTemp;
  }

  init(data: SceneData) {
    this.userId = data?.userId;
    this.petName = data?.petName;
    this.stageSegments = data?.stageSegments ?? [];

    // Формируем URL изображения питомца в стадии egg
    if (this.userId && this.petName) {
      this.petImageUrl = buildUrl.petImage(this.userId, this.petName, 'egg', false);
    }

    // Сброс игровых переменных
    this.currentTemp = this.config.initialTemp;
    this.timeInZone = 0;
    this.successShown = false;
    this.pendingHeat = 0;
    this.lastPointerPosition = null;
  }

  preload() {
    // Загружаем изображение питомца, если есть URL
    if (this.petImageUrl) {
      this.load.once('loaderror', (file: Phaser.Loader.File) => {
        if (file.key === this.petImageKey) {
          console.error('[EggTemperatureScene] Failed to load pet image:', this.petImageUrl);
          sendGameEvent('GAME_ERROR', {
            scene: 'egg',
            stage: this.stageSegments,
            message: 'Не удалось загрузить изображение питомца',
            userId: this.userId,
            petName: this.petName
          });
        }
      });

      // Загружаем изображение с поддержкой CORS
      this.load.image(this.petImageKey, this.petImageUrl, {
        crossOrigin: 'anonymous'
      });
    }
  }

  create() {
    const { width, height } = this.scale;

    // Устанавливаем фон с градиентом в стиле webapp
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Инициализируем layout
    this.recalculateLayout(width, height);

    // Проверяем наличие параметров
    if (!this.userId || !this.petName) {
      this.showMissingParamsMessage();
      return;
    }

    // Создаем UI элементы (градусник и тексты всегда показываем)
    this.createGaugeGraphics();
    this.createTexts();
    this.applyLayout();
    this.drawGauge();

    // Создаем изображение питомца на фоне
    if (this.petImageUrl && this.textures.exists(this.petImageKey)) {
      this.createPetImage();
      this.setupGameLogic();
    } else if (this.petImageUrl) {
      // Если изображение еще загружается, показываем сообщение и ждем
      const loadingText = this.showLoadingMessage();
      
      // Ждем загрузки изображения
      this.load.once('complete', () => {
        if (this.textures.exists(this.petImageKey)) {
          // Удаляем сообщение о загрузке
          if (loadingText) {
            loadingText.destroy();
          }
          // Создаем изображение и настраиваем игру
          this.createPetImage();
          this.setupGameLogic();
        }
      }, this);
    } else {
      this.setupGameLogic();
    }
  }

  private setupGameLogic() {
    // Настраиваем обработчики свайпов
    this.setupInputHandlers();

    // Настраиваем обработчик изменения размера
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    // Обработчик сброса
    this.events.on(settings.events.RESET_REQUESTED, this.resetGame, this);

    // Отправляем событие о запуске сцены
    sendGameEvent('SCENE_STARTED', {
      scene: 'egg',
      stage: this.stageSegments,
      userId: this.userId,
      petName: this.petName
    });
  }

  update(_: number, delta: number) {
    if (this.successShown) {
      return;
    }

    const deltaSeconds = delta / 1000;

    // Применяем охлаждение
    this.applyCooling(deltaSeconds);

    // Применяем накопленное тепло от свайпов
    this.applyPendingHeat(deltaSeconds);

    // Ограничиваем температуру в допустимых пределах
    this.clampTemperature();

    // Обновляем визуализацию
    this.updateGauge();
    this.updateTimer(deltaSeconds);
    this.updateFeedback();

    // Проверяем победу
    if (!this.successShown && this.timeInZone >= this.config.targetHoldTime) {
      this.handleSuccess();
    }
  }

  private recalculateLayout(width: number, height: number) {
    // Используем gaugePadding для отступов или вычисляем адаптивно
    const padding = Math.max(this.config.gaugePadding, Math.max(width, height) * 0.04);
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    // Размеры градусника (адаптивные, похожие на термометр)
    // Используем config.gaugeWidth и config.gaugeHeight как базовые значения
    const gaugeWidth = Math.max(this.config.gaugeWidth, width * 0.08);
    const gaugeHeight = Math.min(this.config.gaugeHeight, usableHeight * 0.75);

    // Позиция градусника (справа)
    const gaugeX = width - padding - gaugeWidth;
    const gaugeY = height / 2 - gaugeHeight / 2;

    // Позиция изображения питомца (слева от градусника)
    const petImageAreaWidth = gaugeX - padding * 2;
    const petImageAreaHeight = usableHeight;
    
    // Используем реальные размеры текстуры, если она загружена
    let petImageScale = 1;
    if (this.textures.exists(this.petImageKey)) {
      const texture = this.textures.get(this.petImageKey);
      const textureWidth = texture.source[0].width;
      const textureHeight = texture.source[0].height;
      
      // Вычисляем масштаб так, чтобы изображение полностью помещалось в область
      const scaleX = petImageAreaWidth / textureWidth;
      const scaleY = petImageAreaHeight / textureHeight;
      petImageScale = Math.min(scaleX, scaleY) * 0.9; // 0.9 для небольшого отступа
    } else {
      // Fallback: используем примерные размеры
      petImageScale = Math.min(
        petImageAreaWidth / 400,
        petImageAreaHeight / 400
      ) * 0.9;
    }

    const petImageX = padding + petImageAreaWidth / 2;
    const petImageY = height / 2;

    this.layout = {
      width,
      height,
      gaugeX,
      gaugeY,
      gaugeWidth,
      gaugeHeight,
      petImageX,
      petImageY,
      petImageScale
    };
  }

  private createPetImage() {
    if (!this.textures.exists(this.petImageKey)) {
      return;
    }

    // Пересчитываем layout с учетом реальных размеров текстуры
    const { width, height } = this.scale;
    this.recalculateLayout(width, height);

    const { petImageX, petImageY, petImageScale } = this.layout;

    // Создаем изображение питомца
    this.petImage = this.add.image(petImageX, petImageY, this.petImageKey);
    this.petImage.setScale(petImageScale);
    this.petImage.setDepth(0);
    this.petImage.setAlpha(0.8);

    // Делаем изображение интерактивным для свайпов
    this.petImage.setInteractive({
      useHandCursor: false,
      pixelPerfect: false
    });

    // Добавляем затемнение сверху для лучшей читаемости текста (градиент в стиле webapp)
    // Создаем градиентное затемнение через несколько слоев Graphics
    this.topOverlay = this.add.graphics();
    const overlayHeight = this.layout.height * 0.4;
    const overlaySteps = 10;
    
    // Создаем градиент сверху вниз
    for (let i = 0; i < overlaySteps; i++) {
      const y = (i / overlaySteps) * overlayHeight;
      const alpha = 0.6 * (1 - i / overlaySteps); // От 0.6 до 0
      this.topOverlay.fillStyle(0x000000, alpha);
      this.topOverlay.fillRect(0, y, this.layout.width, overlayHeight / overlaySteps);
    }
    this.topOverlay.setDepth(10);

    // Добавляем затемнение снизу для лучшей читаемости текста (градиент)
    this.bottomOverlay = this.add.graphics();
    const bottomOverlayHeight = this.layout.height * 0.35;
    const bottomOverlayY = this.layout.height - bottomOverlayHeight;
    
    // Создаем градиент снизу вверх
    for (let i = 0; i < overlaySteps; i++) {
      const y = bottomOverlayY + (i / overlaySteps) * bottomOverlayHeight;
      const alpha = 0.5 * (i / overlaySteps); // От 0 до 0.5
      this.bottomOverlay.fillStyle(0x000000, alpha);
      this.bottomOverlay.fillRect(0, y, this.layout.width, bottomOverlayHeight / overlaySteps);
    }
    this.bottomOverlay.setDepth(10);
  }

  private showLoadingMessage(): Phaser.GameObjects.Text {
    const { width, height } = this.scale;
    return this.add
      .text(width / 2, height / 2, 'Загрузка изображения питомца...', {
        fontFamily: settings.typography.fontFamily,
        fontSize: '24px',
        color: COLORS.text.secondary,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private showMissingParamsMessage() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Укажите user_id и pet_name в URL параметрах', {
        fontFamily: settings.typography.fontFamily,
        fontSize: '24px',
        color: COLORS.text.secondary,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private createGaugeGraphics() {
    this.gaugeContainer = this.add.graphics();
    this.gaugeFill = this.add.graphics();
    this.gaugeGlow = this.add.graphics();
    this.optimalZoneOverlay = this.add.graphics();
    
    // Устанавливаем глубину для правильного отображения
    this.gaugeContainer.setDepth(5);
    this.gaugeFill.setDepth(6);
    this.gaugeGlow.setDepth(4);
    this.optimalZoneOverlay.setDepth(7);
  }

  private createTexts() {
    const { width, height } = this.scale;

    // Текст температуры (с тенью в стиле webapp)
    this.temperatureText = this.add
      .text(width / 2, 50, '', {
        fontFamily: settings.typography.fontFamily,
        fontSize: '36px',
        color: COLORS.text.primary,
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true
        }
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Текст таймера
    this.timerText = this.add
      .text(width / 2, 95, '', {
        fontFamily: settings.typography.fontFamily,
        fontSize: '22px',
        color: COLORS.text.secondary,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 3,
          fill: true
        }
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Текст инструкции (внизу экрана)
    this.instructionText = this.add
      .text(width / 2, height - 50, 'Свайпайте по яйцу, чтобы нагреть его', {
        fontFamily: settings.typography.fontFamily,
        fontSize: '18px',
        color: COLORS.text.muted,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        }
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Текст обратной связи
    this.feedbackText = this.add
      .text(width / 2, height - 90, '', {
        fontFamily: settings.typography.fontFamily,
        fontSize: '18px',
        color: COLORS.text.secondary,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        }
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private applyLayout() {
    // Layout применяется при создании элементов
    // Дополнительные позиционирования здесь, если нужно
  }

  private drawGauge() {
    const { gaugeX, gaugeY, gaugeWidth, gaugeHeight } = this.layout;

    // Очищаем предыдущие рисунки
    this.gaugeContainer.clear();
    this.gaugeFill.clear();
    this.gaugeGlow.clear();
    this.optimalZoneOverlay.clear();

    // Термометр состоит из:
    // 1. Колбы внизу (круг)
    // 2. Столба сверху (прямоугольник, уже колбы)
    
    // Размеры термометра
    const bulbRadius = gaugeWidth * 0.4; // Радиус колбы (40% ширины)
    const columnWidth = gaugeWidth * 0.25; // Ширина столба (25% ширины)
    const columnHeight = gaugeHeight - bulbRadius * 1.6; // Высота столба (остальное пространство)
    const centerX = gaugeX + gaugeWidth / 2; // Центр по X
    const bulbCenterY = gaugeY + gaugeHeight - bulbRadius; // Центр колбы по Y
    const columnTopY = gaugeY; // Верх столба
    const columnBottomY = bulbCenterY - bulbRadius * 0.8; // Низ столба (соединяется с колбой)

    // Рисуем столб (верхняя часть термометра)
    const columnX = centerX - columnWidth / 2;
    const columnRadius = columnWidth / 2; // Радиус скругления столба
    
    // Фон столба (стеклянный стиль)
    this.gaugeContainer.fillStyle(Phaser.Display.Color.GetColor(17, 24, 39), 0.85);
    this.gaugeContainer.fillRoundedRect(columnX, columnTopY, columnWidth, columnHeight, columnRadius);
    
    // Граница столба
    this.gaugeContainer.lineStyle(2, Phaser.Display.Color.GetColor(148, 163, 184), 0.4);
    this.gaugeContainer.strokeRoundedRect(columnX, columnTopY, columnWidth, columnHeight, columnRadius);

    // Рисуем колбу (нижняя часть термометра)
    // Фон колбы
    this.gaugeContainer.fillStyle(Phaser.Display.Color.GetColor(17, 24, 39), 0.85);
    this.gaugeContainer.fillCircle(centerX, bulbCenterY, bulbRadius);
    
    // Граница колбы
    this.gaugeContainer.lineStyle(3, Phaser.Display.Color.GetColor(148, 163, 184), 0.4);
    this.gaugeContainer.strokeCircle(centerX, bulbCenterY, bulbRadius);

    // Соединительный элемент между столбом и колбой
    const connectorWidth = columnWidth * 1.2;
    const connectorHeight = bulbRadius * 0.3;
    const connectorX = centerX - connectorWidth / 2;
    const connectorY = columnBottomY;
    
    this.gaugeContainer.fillStyle(Phaser.Display.Color.GetColor(17, 24, 39), 0.85);
    this.gaugeContainer.fillRoundedRect(connectorX, connectorY, connectorWidth, connectorHeight, connectorHeight / 2);
    this.gaugeContainer.lineStyle(2, Phaser.Display.Color.GetColor(148, 163, 184), 0.4);
    this.gaugeContainer.strokeRoundedRect(connectorX, connectorY, connectorWidth, connectorHeight, connectorHeight / 2);

    // Сохраняем данные о термометре для использования в других методах
    (this.layout as any).thermometer = {
      centerX,
      bulbCenterY,
      bulbRadius,
      columnX,
      columnY: columnTopY,
      columnWidth,
      columnHeight,
      columnBottomY,
      connectorX,
      connectorY,
      connectorWidth,
      connectorHeight
    };

    // Рисуем зону оптимальной температуры
    this.drawOptimalZone();

    // Рисуем заполнение температуры
    this.updateGauge();
  }

  private drawOptimalZone() {
    const thermometer = (this.layout as any).thermometer;
    if (!thermometer) return;

    // Вычисляем позицию и размер оптимальной зоны
    const tempRange = this.config.maxTemp - this.config.minTemp;
    
    // Проверяем, что оптимальная зона находится в допустимом диапазоне
    if (this.config.optimalZoneMin < this.config.minTemp || 
        this.config.optimalZoneMax > this.config.maxTemp ||
        this.config.optimalZoneMin >= this.config.optimalZoneMax) {
      console.warn('[EggTemperatureScene] Invalid optimal zone configuration:', {
        minTemp: this.config.minTemp,
        maxTemp: this.config.maxTemp,
        optimalZoneMin: this.config.optimalZoneMin,
        optimalZoneMax: this.config.optimalZoneMax
      });
      return;
    }

    // Вычисляем соотношения для оптимальной зоны (0-1, где 0 = minTemp, 1 = maxTemp)
    const optimalMinRatio = (this.config.optimalZoneMin - this.config.minTemp) / tempRange;
    const optimalMaxRatio = (this.config.optimalZoneMax - this.config.minTemp) / tempRange;

    // Рабочая высота термометра - только столб (колба не учитывается для зоны)
    // Столб начинается сверху и заканчивается перед колбой
    const columnTopY = thermometer.columnY;
    const columnBottomY = thermometer.columnBottomY;
    const columnHeight = columnBottomY - columnTopY;

    // Вычисляем позицию зоны в столбе (снизу вверх)
    // Температура отображается снизу (minTemp) вверх (maxTemp)
    const zoneBottomY = columnBottomY - (optimalMinRatio * columnHeight);
    const zoneTopY = columnBottomY - (optimalMaxRatio * columnHeight);
    const zoneHeight = zoneBottomY - zoneTopY;

    // Проверяем, что зона находится в пределах столба
    if (zoneTopY >= columnTopY && zoneBottomY <= columnBottomY && zoneHeight > 0) {
      // Рисуем зону оптимальной температуры в столбе (синяя подсветка с прозрачностью)
      this.optimalZoneOverlay.fillStyle(
        Phaser.Display.Color.GetColor(59, 130, 246), // blue-500
        0.35 // Увеличиваем прозрачность для лучшей видимости
      );
      this.optimalZoneOverlay.fillRoundedRect(
        thermometer.columnX - 2, // Немного расширяем для видимости
        zoneTopY,
        thermometer.columnWidth + 4,
        zoneHeight,
        (thermometer.columnWidth + 4) / 2
      );
      
      // Добавляем границу зоны для лучшей видимости
      this.optimalZoneOverlay.lineStyle(
        2,
        Phaser.Display.Color.GetColor(59, 130, 246), // blue-500
        0.6
      );
      this.optimalZoneOverlay.strokeRoundedRect(
        thermometer.columnX - 2,
        zoneTopY,
        thermometer.columnWidth + 4,
        zoneHeight,
        (thermometer.columnWidth + 4) / 2
      );
    } else {
      // Зона выходит за пределы столба - это означает проблему в конфигурации
      console.warn('[EggTemperatureScene] Optimal zone is outside column bounds:', {
        zoneTopY,
        zoneBottomY,
        columnTopY,
        columnBottomY,
        zoneHeight,
        optimalMinRatio,
        optimalMaxRatio
      });
    }
  }

  private updateGauge() {
    const thermometer = (this.layout as any).thermometer;
    if (!thermometer) return;

    // Очищаем заполнение
    this.gaugeFill.clear();

    // Вычисляем позицию температуры
    const tempRange = this.config.maxTemp - this.config.minTemp;
    let tempRatio = (this.currentTemp - this.config.minTemp) / tempRange;
    tempRatio = Phaser.Math.Clamp(tempRatio, 0, 1);

    // Определяем цвет заполнения в зависимости от температуры
    let fillColor: number;
    let isInZone = this.currentTemp >= this.config.optimalZoneMin && 
                   this.currentTemp <= this.config.optimalZoneMax;

    if (this.currentTemp < this.config.optimalZoneMin) {
      // Холодно - синий
      fillColor = Phaser.Display.Color.GetColor(96, 165, 250); // blue-400
    } else if (this.currentTemp > this.config.optimalZoneMax) {
      // Горячо - красный
      fillColor = Phaser.Display.Color.GetColor(248, 113, 113); // red-400
    } else {
      // В зоне - зеленый
      fillColor = Phaser.Display.Color.GetColor(74, 222, 128); // green-400
    }

    const color = Phaser.Display.Color.ValueToColor(fillColor);
    const brightColor = Phaser.Display.Color.GetColor(
      Math.min(255, color.r + 40),
      Math.min(255, color.g + 40),
      Math.min(255, color.b + 40)
    );
    const darkColor = fillColor;

    // Заполнение термометра: колба всегда заполнена, столб заполняется по температуре
    // Вычисляем высоту заполнения столба
    const columnFillHeight = tempRatio * thermometer.columnHeight;
    const fillTopY = thermometer.columnBottomY - columnFillHeight;

    // Всегда заполняем колбу полностью (жидкость всегда в колбе)
    const bulbFillRadius = thermometer.bulbRadius * 0.85;
    this.gaugeFill.fillGradientStyle(
      brightColor, brightColor, darkColor, darkColor, 0.95
    );
    this.gaugeFill.fillCircle(thermometer.centerX, thermometer.bulbCenterY, bulbFillRadius);

    // Заполняем соединительный элемент (всегда заполнен, если столб заполнен)
    if (columnFillHeight > 0) {
      this.gaugeFill.fillGradientStyle(
        brightColor, brightColor, darkColor, darkColor, 0.95
      );
      this.gaugeFill.fillRoundedRect(
        thermometer.connectorX,
        thermometer.connectorY,
        thermometer.connectorWidth,
        thermometer.connectorHeight,
        thermometer.connectorHeight / 2
      );
    }

    // Заполняем столб (пропорционально температуре)
    if (columnFillHeight > 0) {
      const columnFillTopY = Math.max(thermometer.columnY, fillTopY);
      const actualColumnFillHeight = thermometer.columnBottomY - columnFillTopY;
      
      if (actualColumnFillHeight > 0) {
        this.gaugeFill.fillGradientStyle(
          brightColor, brightColor, darkColor, darkColor, 0.95
        );
        this.gaugeFill.fillRoundedRect(
          thermometer.columnX,
          columnFillTopY,
          thermometer.columnWidth,
          actualColumnFillHeight,
          thermometer.columnWidth / 2
        );
      }
    }

    // Обновляем текст температуры
    this.temperatureText.setText(`Температура: ${this.currentTemp.toFixed(1)}°C`);
    
    // Добавляем свечение вокруг термометра, если в зоне
    if (isInZone) {
      this.drawGaugeGlow();
    } else {
      this.gaugeGlow.clear();
      if (this.glowTween) {
        this.glowTween.stop();
      }
    }
  }

  private drawGaugeGlow() {
    const thermometer = (this.layout as any).thermometer;
    if (!thermometer) return;

    const glowIntensity = 0.4 + Math.sin(Date.now() / 500) * 0.15; // Пульсирующее свечение

    // Очищаем предыдущее свечение
    this.gaugeGlow.clear();

    // Рисуем свечение вокруг термометра (зеленое свечение когда в зоне)
    const glowColor = Phaser.Display.Color.GetColor(74, 222, 128);
    
    // Свечение вокруг столба
    this.gaugeGlow.lineStyle(3, glowColor, glowIntensity);
    this.gaugeGlow.strokeRoundedRect(
      thermometer.columnX - 2,
      thermometer.columnY - 2,
      thermometer.columnWidth + 4,
      thermometer.columnHeight + 4,
      thermometer.columnWidth / 2 + 2
    );
    
    // Свечение вокруг колбы
    this.gaugeGlow.lineStyle(4, glowColor, glowIntensity);
    this.gaugeGlow.strokeCircle(
      thermometer.centerX,
      thermometer.bulbCenterY,
      thermometer.bulbRadius + 3
    );
  }

  private updateTimer(deltaSeconds: number) {
    const isInZone =
      this.currentTemp >= this.config.optimalZoneMin &&
      this.currentTemp <= this.config.optimalZoneMax;

    if (isInZone) {
      // В зоне - увеличиваем таймер
      this.timeInZone += deltaSeconds;
    } else {
      // Вне зоны - применяем логику сброса таймера
      if (this.config.resetTimerOnExit) {
        // Режим полного сброса: таймер сбрасывается сразу при выходе из зоны
        this.timeInZone = 0;
      } else {
        // Режим сохранения прогресса: таймер постепенно уменьшается
        this.timeInZone = Math.max(0, this.timeInZone - deltaSeconds * 0.5);
      }
    }

    const timeLeft = Math.max(0, this.config.targetHoldTime - this.timeInZone);
    const progress = (this.timeInZone / this.config.targetHoldTime) * 100;

    if (this.timeInZone >= this.config.targetHoldTime) {
      this.timerText.setText('✓ Готово!');
      this.timerText.setColor(COLORS.egg.optimal);
    } else if (isInZone) {
      this.timerText.setText(
        `Держите: ${timeLeft.toFixed(1)}с (${progress.toFixed(0)}%)`
      );
      this.timerText.setColor(COLORS.egg.optimal);
    } else {
      // Вне зоны
      if (this.config.resetTimerOnExit) {
        this.timerText.setText('Войдите в зону');
      } else {
        // Показываем прогресс, если таймер не сброшен полностью
        if (this.timeInZone > 0) {
          this.timerText.setText(
            `Вне зоны: ${timeLeft.toFixed(1)}с (${progress.toFixed(0)}%)`
          );
        } else {
          this.timerText.setText('Войдите в зону');
        }
      }
      this.timerText.setColor(COLORS.text.muted);
    }
  }

  private updateFeedback() {
    if (this.successShown) {
      this.feedbackText.setText('Отлично! Температура стабильна 🌟');
      this.feedbackText.setColor(COLORS.egg.optimal);
      return;
    }

    if (this.currentTemp < this.config.optimalZoneMin) {
      this.feedbackText.setText('Слишком холодно! Свайпайте быстрее ❄️');
      this.feedbackText.setColor(COLORS.egg.cold);
      return;
    }

    if (this.currentTemp > this.config.optimalZoneMax) {
      this.feedbackText.setText('Слишком горячо! Прекратите свайпы 🔥');
      this.feedbackText.setColor(COLORS.egg.hot);
      return;
    }

    this.feedbackText.setText('Отлично! Держите этот темп ✨');
    this.feedbackText.setColor(COLORS.egg.optimal);
  }

  private setupInputHandlers() {
    // Обработка свайпов
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointercancel', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    const now = Date.now();
    this.lastPointerPosition = {
      x: pointer.x,
      y: pointer.y,
      time: now
    };
  }

  private handlePointerUp() {
    this.lastPointerPosition = null;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!pointer.isDown || !this.lastPointerPosition) {
      return;
    }

    const now = Date.now();
    const deltaTime = Math.max((now - this.lastPointerPosition.time) / 1000, 0.001);

    // Вычисляем расстояние свайпа
    const distance = Phaser.Math.Distance.Between(
      this.lastPointerPosition.x,
      this.lastPointerPosition.y,
      pointer.x,
      pointer.y
    );

    // Вычисляем скорость свайпа
    const speed = distance / deltaTime;

    // Добавляем тепло пропорционально расстоянию и скорости
    // Быстрые свайпы дают больше тепла
    const heatMultiplier = Math.min(1 + speed / 1000, 2); // От 1x до 2x в зависимости от скорости
    this.pendingHeat += distance * this.config.heatPerSwipe * heatMultiplier;

    // Обновляем позицию
    this.lastPointerPosition = {
      x: pointer.x,
      y: pointer.y,
      time: now
    };
  }

  private applyCooling(deltaSeconds: number) {
    // Температура падает со временем
    this.currentTemp -= this.config.coolingRate * deltaSeconds;
  }

  private applyPendingHeat(deltaSeconds: number) {
    if (this.pendingHeat <= 0) {
      return;
    }

    // Применяем накопленное тепло с ограничением скорости
    const maxHeatThisFrame = this.config.maxHeatPerSecond * deltaSeconds;
    const heatToApply = Math.min(this.pendingHeat, maxHeatThisFrame);

    this.currentTemp += heatToApply;
    this.pendingHeat -= heatToApply;

    // Экспоненциальное затухание накопленного тепла
    this.pendingHeat *= Math.pow(0.7, deltaSeconds * 10);
  }

  private clampTemperature() {
    this.currentTemp = Phaser.Math.Clamp(
      this.currentTemp,
      this.config.minTemp,
      this.config.maxTemp
    );
  }

  private handleSuccess() {
    this.successShown = true;
    this.timeInZone = this.config.targetHoldTime;

    // Отправляем событие о победе
    sendGameEvent('SCENE_COMPLETED', {
      scene: 'egg',
      stage: this.stageSegments,
      userId: this.userId,
      petName: this.petName,
      duration: this.timeInZone,
      temperature: this.currentTemp
    });

    // Показываем сообщение о победе
    this.updateFeedback();
    this.updateTimer(0);
  }

  private resetGame() {
    this.currentTemp = this.config.initialTemp;
    this.timeInZone = 0;
    this.successShown = false;
    this.pendingHeat = 0;
    this.lastPointerPosition = null;

    this.updateGauge();
    this.updateTimer(0);
    this.updateFeedback();

    sendGameEvent('SCENE_RESTARTED', {
      scene: 'egg',
      stage: this.stageSegments,
      userId: this.userId,
      petName: this.petName
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.recalculateLayout(gameSize.width, gameSize.height);

    // Обновляем позиции элементов
    if (this.petImage) {
      this.petImage.setPosition(this.layout.petImageX, this.layout.petImageY);
      this.petImage.setScale(this.layout.petImageScale);
    }

    // Обновляем тексты
    this.temperatureText.setPosition(gameSize.width / 2, 50);
    this.timerText.setPosition(gameSize.width / 2, 95);
    this.instructionText.setPosition(gameSize.width / 2, gameSize.height - 50);
    this.feedbackText.setPosition(gameSize.width / 2, gameSize.height - 90);

    // Обновляем затемнения (перерисовываем градиенты)
    if (this.topOverlay) {
      this.topOverlay.clear();
      const overlayHeight = gameSize.height * 0.4;
      const overlaySteps = 10;
      
      for (let i = 0; i < overlaySteps; i++) {
        const y = (i / overlaySteps) * overlayHeight;
        const alpha = 0.6 * (1 - i / overlaySteps);
        this.topOverlay.fillStyle(0x000000, alpha);
        this.topOverlay.fillRect(0, y, gameSize.width, overlayHeight / overlaySteps);
      }
    }
    
    if (this.bottomOverlay) {
      this.bottomOverlay.clear();
      const bottomOverlayHeight = gameSize.height * 0.35;
      const bottomOverlayY = gameSize.height - bottomOverlayHeight;
      const overlaySteps = 10;
      
      for (let i = 0; i < overlaySteps; i++) {
        const y = bottomOverlayY + (i / overlaySteps) * bottomOverlayHeight;
        const alpha = 0.5 * (i / overlaySteps);
        this.bottomOverlay.fillStyle(0x000000, alpha);
        this.bottomOverlay.fillRect(0, y, gameSize.width, bottomOverlayHeight / overlaySteps);
      }
    }

    // Перерисовываем градусник
    this.drawGauge();
    this.updateGauge();
  }
}

export default EggTemperatureScene;
