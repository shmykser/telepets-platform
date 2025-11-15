import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

import PhaserCanvas from '@components/PhaserCanvas';
import { buildScenePath, resolveStage, sceneRegistryMap } from '@data/sceneRegistry';

import styles from './SceneRunner.module.css';

const SceneRunner = () => {
  const params = useParams<{ sceneSlug?: string; '*': string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const sceneSlug = params.sceneSlug ?? '';
  const sceneEntry = sceneRegistryMap.get(sceneSlug);
  const stageSegments =
    params['*']?.split('/').filter((segment) => segment.length > 0) ?? [];
  const stage = sceneEntry ? resolveStage(sceneEntry, stageSegments) : null;

  // Извлекаем query параметры для передачи в сцену
  const sceneParams = useMemo(() => {
    const userId = searchParams.get('user_id');
    const petName = searchParams.get('pet_name');
    return {
      userId: userId ?? undefined,
      petName: petName ?? undefined
    };
  }, [searchParams]);

  if (!sceneEntry) {
    return (
      <div className={styles.notFound}>
        <h1>Сцена не найдена</h1>
        <p>Проверьте название сцены в адресной строке или вернитесь к списку игр.</p>
        <Link to="/" className={styles.backLink}>
          Вернуться в меню
        </Link>
      </div>
    );
  }

  if (sceneEntry.defaultStage && sceneEntry.defaultStage.length > 0 && stageSegments.length === 0) {
    return <Navigate to={`/${buildScenePath(sceneEntry, sceneEntry.defaultStage)}`} replace />;
  }

  if (stageSegments.length > 0 && !stage) {
    return (
      <div className={styles.notFound}>
        <h1>Стадия не определена</h1>
        <p>
          Запрашиваемая стадия не зарегистрирована для сцены «{sceneEntry.title}». Выберите одну из
          доступных стадий ниже.
        </p>
        <div className={styles.stageList}>
          {(sceneEntry.stages ?? []).map((candidate) => (
            <Link
              key={candidate.slug}
              to={`/${buildScenePath(sceneEntry, [candidate.slug])}`}
              className={styles.stageLink}
            >
              {candidate.title}
            </Link>
          ))}
        </div>
        <Link to="/" className={styles.backLink}>
          Вернуться в меню
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumbs}>
            <Link to="/" className={styles.breadcrumbLink}>
              Сцены
            </Link>
            <span>/</span>
            <span>{sceneEntry.title}</span>
            {stage && (
              <>
                <span>/</span>
                <span>{stage.title}</span>
              </>
            )}
          </p>
          <h1>{sceneEntry.title}</h1>
          <p className={styles.summary}>{sceneEntry.summary}</p>
        </div>
        <div className={styles.meta}>
          <span className={styles.statusLabel} data-status={sceneEntry.status}>
            {sceneEntry.status === 'prototype'
              ? 'Прототип'
              : sceneEntry.status === 'planned'
                ? 'В разработке'
                : sceneEntry.status === 'legacy'
                  ? 'Legacy'
                  : 'Подготовка'}
          </span>

          <div className={styles.routeInfo}>
            <span className={styles.routeLabel}>Текущий путь:</span>
            <code>{location.pathname}</code>
          </div>

          {sceneEntry.stages && sceneEntry.stages.length > 0 && (
            <div className={styles.stagePicker}>
              {sceneEntry.stages.map((candidate) => {
                const active = candidate.slug === (stage?.slug ?? sceneEntry.defaultStage?.[0]);
                return (
                  <Link
                    key={candidate.slug}
                    to={`/${buildScenePath(sceneEntry, [candidate.slug])}`}
                    className={`${styles.stageButton} ${active ? styles.stageButtonActive : ''}`}
                  >
                    {candidate.title}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <section className={styles.canvasSection}>
        <PhaserCanvas sceneEntry={sceneEntry} stageSegments={stageSegments} sceneParams={sceneParams} />
      </section>
    </div>
  );
};

export default SceneRunner;

