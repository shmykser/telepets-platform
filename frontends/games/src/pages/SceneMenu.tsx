import { Link } from 'react-router-dom';

import { buildScenePath, sceneRegistry } from '@data/sceneRegistry';

import styles from './SceneMenu.module.css';

const SceneMenu = () => {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1>Telepets Mini Games</h1>
        <p>
          Библиотека мини-игр нового поколения. Здесь появятся прогулки, активности и события для
          питомцев. Выберите сцену, чтобы запустить её в режиме отладки.
        </p>
      </section>

      <section className={styles.grid}>
        {sceneRegistry.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Реестр сцен пуст. Создайте новую сцену, чтобы начать работу.</p>
            <p>
              Для добавления сцены создайте класс сцены в <code>src/phaser/scenes/</code> и
              зарегистрируйте её в <code>src/data/sceneRegistry.ts</code>
            </p>
          </div>
        ) : (
          sceneRegistry.map((scene) => {
            const defaultPath = buildScenePath(scene, scene.defaultStage);
            const stageLabel =
              scene.defaultStage && scene.stages
                ? scene.stages.find((stage) => stage.slug === scene.defaultStage?.[0])?.title
                : null;

            return (
              <article key={scene.slug} className={styles.card}>
                <div className={styles.cardBody}>
                  <span className={styles.status} data-status={scene.status}>
                    {scene.status === 'prototype'
                      ? 'Прототип'
                      : scene.status === 'planned'
                        ? 'В разработке'
                        : scene.status === 'legacy'
                          ? 'Legacy'
                          : 'Подготовка'}
                  </span>
                  <h2>{scene.title}</h2>
                  <p>{scene.summary}</p>
                </div>
                <div className={styles.cardFooter}>
                  <Link to={`/${defaultPath}`} className={styles.primaryLink}>
                    Открыть{stageLabel ? ` · ${stageLabel}` : ''}
                  </Link>
                  {scene.stages && scene.stages.length > 1 && (
                    <div className={styles.stageList}>
                      {scene.stages.map((stage) => (
                        <Link
                          key={stage.slug}
                          to={`/${buildScenePath(scene, [stage.slug])}`}
                          className={styles.stageLink}
                        >
                          {stage.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default SceneMenu;

