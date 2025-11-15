import type Phaser from 'phaser';

export type SceneStatus = 'prototype' | 'in-progress' | 'legacy' | 'planned';

export interface SceneStage {
  slug: string;
  title: string;
  description?: string;
}

export interface LoadedSceneModule {
  Scene: typeof Phaser.Scene;
  key: string;
}

export interface SceneRegistryEntry {
  slug: string;
  title: string;
  summary: string;
  status: SceneStatus;
  sceneKey: string;
  loader: (context: { stageSegments: string[] }) => Promise<LoadedSceneModule>;
  defaultStage?: string[];
  stages?: SceneStage[];
  tags?: string[];
}

/**
 * Реестр сцен игры.
 * Для добавления новой сцены:
 * 1. Создайте класс сцены в src/phaser/scenes/
 * 2. Добавьте запись в sceneRegistry с loader, который динамически импортирует вашу сцену
 * 3. При необходимости добавьте стадии (stages) для сцены
 */
export const sceneRegistry: SceneRegistryEntry[] = [
  {
    slug: 'egg',
    title: 'Egg Temperature',
    summary: 'Игра по контролю температуры яйца. Загружает изображение питомца в стадии egg на фон сцены.',
    status: 'prototype',
    sceneKey: 'EggTemperatureScene',
    loader: async () => {
      const module = await import('@phaser/scenes/EggTemperatureScene');
      const Scene = module.EggTemperatureScene ?? module.default;
      return {
        Scene,
        key: 'EggTemperatureScene'
      };
    },
    defaultStage: ['temperature'],
    stages: [
      {
        slug: 'temperature',
        title: 'Контроль температуры',
        description: 'Игра по контролю температуры яйца с загрузкой изображения питомца на фон.'
      }
    ],
    tags: ['egg', 'temperature', 'prototype']
  }
];

export const sceneRegistryMap = new Map(sceneRegistry.map((scene) => [scene.slug, scene]));

export const buildScenePath = (scene: SceneRegistryEntry, stage?: string[]): string => {
  if (stage && stage.length > 0) {
    return `${scene.slug}/${stage.join('/')}`;
  }
  return scene.slug;
};

export const resolveStage = (scene: SceneRegistryEntry, segments: string[]): SceneStage | null => {
  if (!scene.stages || segments.length === 0) {
    return null;
  }

  const [head] = segments;
  return scene.stages.find((stage) => stage.slug === head) ?? null;
};

