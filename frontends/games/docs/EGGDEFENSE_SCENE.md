# EggDefense — обзор сцены, механик и архитектурных принципов

Этот документ описывает ключевые механики, игровые системы и архитектурные принципы сцены `EggDefense` из каталога `frontends/games_old`. Сцена построена модульно и собирается как «оркестратор» поверх набора самостоятельных подсистем.

## Роль сцены
Сцена `EggDefense` является точкой координации:
- создает базовые игровые объекты (фон, яйцо),
- инициализирует и связывает игровые подсистемы,
- конфигурирует UI (таймер, панель способностей),
- управляет жизненным циклом (старт/пауза/продолжение/конец),
- ретранслирует события в интеграционный слой (postMessage).

```12:62:frontends/games_old/src/scenes/EggDefense.js
export class EggDefense extends Phaser.Scene {
  constructor() {
    super({ key: 'EggDefense' });
    this.isGameEnded = false;
    this.isGameStarted = false;
    this.isPaused = false;
  }

  create() {
    this.createGameObjects();
    this.initGameSystems();
    this.setupUI();
    this.setupKeyboardHandlers();
    this.setupResizeHandler();
    this.setupFocusHandlers();
    // сообщаем контейнеру (WebApp) о готовности
    this.time.delayedCall(100, () => this.sendMessageToParent('GAME_READY', { message: 'Egg Defender готова к запуску' }));
  }
}
```

## Ключевые игровые объекты
- Фон — анимированная трава, находится на самом нижнем слое.
- Яйцо — основной защищаемый объект в центре экрана, имеет здоровье и набор способностей (аура/взрыв и т.п.), связанные с `AbilitySystem`.

```270:293:frontends/games_old/src/scenes/EggDefense.js
this.grassBackground = BackgroundUtils.createAnimatedGrassBackground(this, BACKGROUND_SETTINGS);
this.grassBackground.setDepth(DEPTH_CONSTANTS.BACKGROUND);
this.egg = Egg.CreateEgg(this, this.scale.width / 2, this.scale.height / 2, {
  health: ABILITIES.EGG_HEALTH.baseValue,
  texture: '🥚',
  spriteKey: 'egg',
  size: 2
});
```

## Подсистемы и их ответственность
- EventSystem — центральная шина событий. Используется всеми системами для слабой связности.
- AbilitySystem — хранит/апдейтит прокачку и эффекты способностей (яйца, действий игрока).
- ProbabilitySystem — централизованное RNG/балансирование (усиление врагов, дроп и т.д.).
- EffectSystem/EffectHandler — визуальные/геймплейные эффекты и их обработка.
- EnemyEffectSystem — эффекты, применяемые к врагам (статусы, дебаффы).
- WaveSystem — волновой менеджер в стиле Vampire Survivors: темп спавна, рост сложности, лимиты, статистика.
- GestureSystem + GestureActionSystem — распознавание жестов игрока и конвертация их в игровые действия против врагов/объектов.
- StoneManager — управление «каменными» препятствиями на поле.
- DragDropSystem — DnD взаимодействия (раскладка объектов/препятствий).
- ObstacleInteractionSystem — реакция уровня и pathfinding врагов на изменения препятствий.

```124:201:frontends/games_old/src/scenes/EggDefense.js
this.eventSystem = new EventSystem();
this.abilitySystem = new AbilitySystem(this);
this.probabilitySystem = new ProbabilitySystem(this); this.probabilitySystem.init();
this.effectSystem = new EffectSystem(this);
this.enemyEffectSystem = new EnemyEffectSystem(this);
this.waveSystem = new WaveSystem(this, this.probabilitySystem);
this.gestureSystem = new GestureSystem(this, { onTap: g => this.handleGesture(g), ... });
this.gestureActionSystem = new GestureActionSystem(this, this.waveSystem.enemies, this.defenses, this.egg, Enemy.itemDropSystem, this.abilitySystem);
this.stoneManager = new StoneManager(this);
this.dragDropSystem = new DragDropSystem(this);
Enemy.initDropSystems(this, this.egg, this.probabilitySystem, this.abilitySystem);
Enemy.initEventSystem(this.eventSystem);
Enemy.initEffectSystem(this.enemyEffectSystem);
this.waveSystem.setTarget(this.egg);
```

## Игровой цикл
1) Инициализация — создаем объекты/системы, выставляем обработчики ввода/resize/focus.
2) Старт — `startGameFromMenu()` → `startGame()`:
   - создается Telegram-стилизованный таймер,
   - инициализируются камни и взаимодействие с препятствиями,
   - сигналим `GAME_START` и запускаем `WaveSystem`.
3) Апдейт — в `update()` кадра:
   - `ProbabilitySystem.update`,
   - `WaveSystem.update` (время, минуты, условия конца),
   - `WaveSystem.updateEnemies` (обновление ИИ врагов),
   - обновление таймера/индикаторов, проверка окончания игры.
4) Завершение — `gameOver(won)`:
   - эмит событий, остановка волн, очистка предметов,
   - HTML-результаты, кнопки «Рестарт/Меню», postMessage наружу.

```740:768:frontends/games_old/src/scenes/EggDefense.js
update(time, delta) {
  this.probabilitySystem?.update(time, delta);
  this.waveSystem?.update(time, delta);
  this.waveSystem?.updateEnemies(time, delta);
  if (this.isGameStarted) this.updateTimer();
  this.checkGameEnd();
}
```

## Волновая система (WaveSystem)
Центральная логика темпа и сложности:
- Поддерживает состояние игры/волн, считает статистику (spawned/killed).
- Планирует спавн пачками с экспоненциальным ускорением темпа.
- Ограничивает количество врагов на экране и повторно пытается спавн при лимите.
- Выбирает доступные типы врагов по минутам, с весами.
- Назначает цель (яйцо) и отслеживает смерть врагов.
- Окончание наступает при достижении `duration`.

```10:47:frontends/games_old/src/systems/WaveSystem.js
startGame() {
  this.gameStartTime = this.scene?.time?.now ?? Date.now();
  this.isGameActive = true;
  this.currentMinute = 1;
  this.totalEnemiesSpawned = this.totalEnemiesKilled = this.currentEnemiesOnScreen = 0;
  this.enemies = [];
  this.startSpawning();
  this.scene.events.emit('gameStarted', { duration: this.waveSettings.duration });
}
```

```121:168:frontends/games_old/src/systems/WaveSystem.js
scheduleNextSpawn() {
  if (!this.isGameActive) return;
  if (this.currentEnemiesOnScreen >= this.spawnSettings.maxEnemiesOnScreen) {
    this.spawnTimer = setTimeout(() => this.scheduleNextSpawn(), SPAWN_CONSTANTS.RETRY_DELAY);
    return;
  }
  const delay = this.calculateSpawnDelay();
  this.spawnTimer = setTimeout(() => { this.spawnEnemyBatch(); this.scheduleNextSpawn(); }, delay);
}
```

## Ввод и жесты
- `GestureSystem` распознает жесты (tap/longTap/line/circle/triangle).
- `GestureActionSystem` применяет эффекты/действия жестов к врагам и защитным объектам.
- Обновление списков в момент обработки жеста — актуальные ссылки на врагов/дефенсы.

```498:517:frontends/games_old/src/scenes/EggDefense.js
handleGesture(gesture) {
  this.gestureActionSystem.updateObjects(this.waveSystem.enemies, this.defenses);
  return this.gestureActionSystem.handleGesture(gesture);
}
```

## UI и интеграции
- Телеграм-стилизованный таймер (`TelegramTimer`) с цветовыми статусами по оставшемуся времени.
- Панель способностей (`AbilitiesDisplay`) с live обновлением по событиям `ability:upgraded`.
- HTML табличка результатов с DOM-событиями `resultsTable:restart`/`resultsTable:menu`.
- Взаимодействие с WebApp через `window.parent.postMessage` (`GAME_READY`, `GAME_END`).

## Принципы архитектуры
- Модульность: каждая система изолирована и расширяема.
- Слабая связность через Event Bus.
- Детеминированные источники времени (`scene.time.now` с fallback).
- Безопасная инициализация (ленивые `initialize()` у подсистем, задержки до готовности input).
- Чистая очистка в `destroy()` со снятием обработчиков и остановкой таймеров.

## Критерии победы/поражения
- Победа — выжить до конца длительности `WaveSystem.waveSettings.duration`.
- Поражение — здоровье яйца ≤ 0.
- Результат фиксируется в статистике и отправляется наружу.

--- 

Документ служит базой для планирования переноса сцены в новый фронтенд (`frontends/games`) и оптимизации кода по современным практикам Phaser + React.


