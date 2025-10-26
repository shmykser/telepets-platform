# Система стратегий поведения

## Обзор
Система стратегий поведения позволяет создавать разнообразные и сложные поведения для врагов в игре. Каждая стратегия отвечает за определенный аспект поведения.

## Типы стратегий

### 🎯 [MovementStrategy](./movement/README.md)
- **Назначение**: Контроль движения врагов
- **Стратегии**: linear, orbital, flying, stealth, burrow, shell
- **Файлы**: `MovementSystem.js`, `OrbitalMovementStrategy.js`

### ⚔️ [AttackStrategy](./attack/README.md)
- **Назначение**: Управление атаками врагов
- **Стратегии**: melee, ranged, area, spawn
- **Файлы**: `AttackSystem.js`, `RangedAttackStrategy.js`, `SpawnAttackStrategy.js`

### 👁️ [DetectionStrategy](./detection/README.md)
- **Назначение**: Обнаружение и отслеживание целей
- **Стратегии**: radius, lineOfSight, sound, movement, heat, group
- **Статус**: 📋 Планируется

### 🏃 [EvasionStrategy](./evasion/README.md)
- **Назначение**: Уклонение от опасности
- **Стратегии**: dodge, obstacle, enemy, hitAndRun, cover, predictable
- **Статус**: 📋 Планируется

### 🚶 [PatrolStrategy](./patrol/README.md)
- **Назначение**: Патрулирование и охрана
- **Стратегии**: waypoint, circular, backAndForth, random, guard, formation
- **Статус**: 📋 Планируется

### 🏃‍♂️ [PursuitStrategy](./pursuit/README.md)
- **Назначение**: Преследование целей
- **Стратегии**: direct, predictive, obstacleAvoiding, group, flanking, intermittent, territorial
- **Статус**: 📋 Планируется

### 👻 [StealthStrategy](./stealth/README.md)
- **Назначение**: Маскировка и невидимость
- **Стратегии**: invisibility, camouflage, shadow, movement, conditional, partial, mimicry, cloaking
- **Статус**: 📋 Планируется

### 💚 [RecoveryStrategy](./recovery/README.md)
- **Назначение**: Восстановление здоровья
- **Стратегии**: timeBased, feeding, zoneBased, group, damageBased, conditional, regeneration, sacrifice
- **Статус**: 📋 Планируется

### 🔧 [InteractionStrategy](./interaction/README.md)
- **Назначение**: Взаимодействие с окружением
- **Стратегии**: objectInteraction, trapActivation, doorControl, itemCollection, switchActivation, containerInteraction, environmentalHazard, communication
- **Статус**: 📋 Планируется

### 💥 [KamikazeStrategy](./kamikaze/README.md)
- **Назначение**: Атака с самоуничтожением
- **Стратегии**: direct, delayed, proximity, homing, swarm, stealth, environmental, adaptive
- **Статус**: 📋 Планируется

## Архитектура

### Базовый класс стратегии
```javascript
export class BaseStrategy {
    constructor(gameObject, config) {
        this.gameObject = gameObject;
        this.config = config;
    }
    
    update(time, delta) {
        // Базовая логика обновления
    }
    
    getName() {
        return 'BaseStrategy';
    }
    
    destroy() {
        this.gameObject = null;
        this.config = null;
    }
}
```

### Интеграция с системами
- **MovementSystem** - управляет стратегиями движения
- **AttackSystem** - управляет стратегиями атаки
- **AICoordinator** - координирует все стратегии

### Конфигурация
```javascript
// Пример конфигурации врага
const enemyConfig = {
    movement: {
        strategy: 'orbital',
        speed: 120,
        orbitRadius: 200
    },
    attack: {
        strategy: 'ranged',
        damage: 8,
        range: 300,
        cooldown: 2000
    },
    detection: {
        strategy: 'radius',
        detectionRange: 400
    }
};
```

## Статус реализации

- ✅ **MovementStrategy** - Реализовано
- ✅ **AttackStrategy** - Реализовано
- 📋 **DetectionStrategy** - Планируется
- 📋 **EvasionStrategy** - Планируется
- 📋 **PatrolStrategy** - Планируется
- 📋 **PursuitStrategy** - Планируется
- 📋 **StealthStrategy** - Планируется
- 📋 **RecoveryStrategy** - Планируется
- 📋 **InteractionStrategy** - Планируется
- 📋 **KamikazeStrategy** - Планируется

## Принципы разработки

1. **Модульность** - каждая стратегия независима
2. **Конфигурируемость** - параметры настраиваются через конфиг
3. **Расширяемость** - легко добавлять новые стратегии
4. **Производительность** - оптимизированные алгоритмы
5. **Тестируемость** - каждая стратегия тестируется отдельно
