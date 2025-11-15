# EvasionStrategy - Стратегии уклонения

## Описание
Стратегии уклонения отвечают за то, как враги избегают опасности и атак.

## Варианты стратегий

### 1. DodgeEvasionStrategy
- **Описание**: Уклонение от атак игрока
- **Параметры**:
  - `dodgeDistance` - расстояние уклонения
  - `dodgeSpeed` - скорость уклонения
  - `dodgeCooldown` - кулдаун между уклонениями
  - `dodgeDirection` - направление уклонения (random, away, perpendicular)
- **Поведение**: Враг уклоняется от приближающихся атак

### 2. ObstacleEvasionStrategy
- **Описание**: Уклонение от препятствий
- **Параметры**:
  - `obstacleDetectionRange` - радиус обнаружения препятствий
  - `avoidanceForce` - сила избежания
  - `smoothFactor` - плавность обхода
- **Поведение**: Враг обходит препятствия на пути

### 3. EnemyEvasionStrategy
- **Описание**: Уклонение от других врагов
- **Параметры**:
  - `enemyAvoidanceRange` - радиус избежания других врагов
  - `avoidanceStrength` - сила избежания
  - `groupSeparation` - разделение в группе
- **Поведение**: Враги не сталкиваются друг с другом

### 4. HitAndRunStrategy
- **Описание**: Партизанская тактика (атака-отступление)
- **Параметры**:
  - `attackRange` - радиус атаки
  - `retreatDistance` - расстояние отступления
  - `retreatSpeed` - скорость отступления
  - `retreatDuration` - время отступления
- **Поведение**: Атакует и сразу отступает

### 5. CoverEvasionStrategy
- **Описание**: Укрытие за препятствиями
- **Параметры**:
  - `coverDetectionRange` - радиус поиска укрытия
  - `coverPreference` - предпочтение укрытия
  - `coverDuration` - время в укрытии
- **Поведение**: Враг прячется за препятствиями

### 6. PredictableEvasionStrategy
- **Описание**: Предсказуемое уклонение
- **Параметры**:
  - `evasionPattern` - паттерн уклонения
  - `patternDuration` - длительность паттерна
  - `patternVariation` - вариация паттерна
- **Поведение**: Враг использует предсказуемые паттерны уклонения

## Использование
```javascript
// Пример конфигурации
evasion: {
    strategy: 'dodge',
    dodgeDistance: 100,
    dodgeSpeed: 200,
    dodgeCooldown: 1000,
    dodgeDirection: 'perpendicular'
}
```
