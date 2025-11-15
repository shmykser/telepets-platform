import { Link } from 'react-router-dom';

import styles from './NotFound.module.css';

const NotFound = () => {
  return (
    <div className={styles.container}>
      <h1>Страница не найдена</h1>
      <p>Кажется, вы попали на несуществующий маршрут. Вернитесь в каталог сцен.</p>
      <Link to="/" className={styles.backLink}>
        Вернуться в меню
      </Link>
    </div>
  );
};

export default NotFound;

