import { NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Syllabus Planner</h1>
        <nav className={styles.nav}>
          <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : '')} end>
            Dashboard
          </NavLink>
          <NavLink to="/grades" className={({ isActive }) => (isActive ? styles.active : '')}>
            Grades
          </NavLink>
          <NavLink to="/syllabi" className={({ isActive }) => (isActive ? styles.active : '')}>
            Syllabi
          </NavLink>
          <NavLink to="/planner" className={({ isActive }) => (isActive ? styles.active : '')}>
            Planner
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? styles.active : '')}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
