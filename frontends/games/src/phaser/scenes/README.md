# Сцены Phaser

Эта директория предназначена для хранения классов сцен Phaser.

## Как создать новую сцену

1. **Создайте файл с классом сцены** в этой директории (например, `MyScene.ts`):

```typescript
import Phaser from 'phaser';
import { settings } from '@config/settings';
import { sendGameEvent } from '@integration/postMessage';

type SceneData = {
  stageSegments?: string[];
};

export class MyScene extends Phaser.Scene {
  private stageSegments: string[] = [];

  constructor() {
    super({ key: 'MyScene' });
  }

  init(data: SceneData) {
    this.stageSegments = data?.stageSegments ?? [];
  }

  create() {
    // Создание игровых объектов
    this.cameras.main.setBackgroundColor(settings.graphics.backgroundColor);
    
    sendGameEvent('SCENE_STARTED', {
      scene: 'my-scene',
      stage: this.stageSegments
    });
  }

  update(_: number, delta: number) {
    // Обновление логики игры
  }
}

export default MyScene;
```

2. **Зарегистрируйте сцену** в `src/data/sceneRegistry.ts`:

```typescript
export const sceneRegistry: SceneRegistryEntry[] = [
  {
    slug: 'my-scene',
    title: 'My Scene',
    summary: 'Описание сцены',
    status: 'prototype',
    sceneKey: 'MyScene',
    loader: async () => {
      const module = await import('@phaser/scenes/MyScene');
      const Scene = module.MyScene ?? module.default;
      return {
        Scene,
        key: 'MyScene'
      };
    },
    defaultStage: ['main'],
    stages: [
      {
        slug: 'main',
        title: 'Основной режим',
        description: 'Описание стадии'
      }
    ]
  }
];
```

3. **Сцена будет доступна** по адресу `/games/my-scene/main`

## Полезные ресурсы

- [Документация Phaser 3](https://photonstorm.github.io/phaser3-docs/)
- [Настройки проекта](src/config/settings.ts)
- [Интеграция с WebApp](src/integration/postMessage.ts)

