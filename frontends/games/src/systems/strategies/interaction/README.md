# InteractionStrategy - Стратегии взаимодействия

## Описание
Стратегии взаимодействия отвечают за то, как враги взаимодействуют с объектами окружения.

## Варианты стратегий

### 1. ObjectInteractionStrategy
- **Описание**: Взаимодействие с объектами
- **Параметры**:
  - `interactableObjects` - типы взаимодействующих объектов
  - `interactionRange` - радиус взаимодействия
  - `interactionTime` - время взаимодействия
  - `interactionEffects` - эффекты взаимодействия
- **Поведение**: Враг может взаимодействовать с определенными объектами

### 2. TrapActivationStrategy
- **Описание**: Активация ловушек
- **Параметры**:
  - `trapTypes` - типы активируемых ловушек
  - `trapActivationRange` - радиус активации ловушек
  - `trapCooldown` - кулдаун активации ловушек
  - `trapEffects` - эффекты активации ловушек
- **Поведение**: Враг активирует ловушки для защиты или атаки

### 3. DoorControlStrategy
- **Описание**: Контроль дверей
- **Параметры**:
  - `doorTypes` - типы контролируемых дверей
  - `doorControlRange` - радиус контроля дверей
  - `doorState` - состояние дверей (открыто/закрыто)
  - `doorLocking` - возможность блокировки дверей
- **Поведение**: Враг может открывать/закрывать/блокировать двери

### 4. ItemCollectionStrategy
- **Описание**: Сбор предметов
- **Параметры**:
  - `collectibleItems` - типы собираемых предметов
  - `collectionRange` - радиус сбора
  - `inventorySize` - размер инвентаря
  - `itemUsage` - использование собранных предметов
- **Поведение**: Враг собирает и использует предметы

### 5. SwitchActivationStrategy
- **Описание**: Активация переключателей
- **Параметры**:
  - `switchTypes` - типы переключателей
  - `switchActivationRange` - радиус активации
  - `switchEffects` - эффекты активации
  - `switchCooldown` - кулдаун активации
- **Поведение**: Враг активирует переключатели для изменения окружения

### 6. ContainerInteractionStrategy
- **Описание**: Взаимодействие с контейнерами
- **Параметры**:
  - `containerTypes` - типы контейнеров
  - `interactionRange` - радиус взаимодействия
  - `lootingTime` - время разграбления
  - `lootTypes` - типы добычи
- **Поведение**: Враг может открывать и разграблять контейнеры

### 7. EnvironmentalHazardStrategy
- **Описание**: Создание опасностей в окружении
- **Параметры**:
  - `hazardTypes` - типы создаваемых опасностей
  - `hazardCreationRange` - радиус создания опасностей
  - `hazardDuration` - длительность опасностей
  - `hazardDamage` - урон от опасностей
- **Поведение**: Враг создает опасности в окружении

### 8. CommunicationStrategy
- **Описание**: Коммуникация с другими врагами
- **Параметры**:
  - `communicationRange` - радиус коммуникации
  - `messageTypes` - типы сообщений
  - `communicationCooldown` - кулдаун коммуникации
  - `groupCoordination` - координация группы
- **Поведение**: Враг может общаться с другими врагами

## Использование
```javascript
// Пример конфигурации
interaction: {
    strategy: 'objectInteraction',
    interactableObjects: ['lever', 'button', 'switch'],
    interactionRange: 50,
    interactionTime: 1000,
    interactionEffects: {
        'lever': 'openDoor',
        'button': 'activateTrap',
        'switch': 'changeLighting'
    }
}
```
