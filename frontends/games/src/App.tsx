import { Route, Routes } from 'react-router-dom';

import NotFound from '@pages/NotFound';
import SceneMenu from '@pages/SceneMenu';
import SceneRunner from '@pages/SceneRunner';

import styles from './App.module.css';

function App() {
  return (
    <div className={styles.appRoot}>
      <main className={styles.layout}>
        <Routes>
          <Route path="/" element={<SceneMenu />} />
          <Route path=":sceneSlug/*" element={<SceneRunner />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

