import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { populi, planner } from '../api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [term, setTerm] = useState(null);
  const [grades, setGrades] = useState([]);
  const [plannerItems, setPlannerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [s, t, g, p] = await Promise.all([
          populi.status(),
          populi.term(),
          populi.grades(),
          planner.list(),
        ]);
        setStatus(s);
        setTerm(t?.term);
        setGrades(g?.grades || []);
        setPlannerItems(p?.planner || []);
      } catch (e) {
        console.error(e);
        setError(
          'Cannot connect to the backend. Make sure both servers are running: run "npm run dev" in the backend folder, then "npm run dev" in the frontend folder. Open http://localhost:5173 in your browser.'
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h1>Connection Error</h1>
        <p>{error}</p>
        <p className={styles.errorHint}>
          Open two terminals. In the first: <code>cd backend && npm run dev</code>. 
          In the second: <code>cd frontend && npm run dev</code>. 
          Then visit <strong>http://localhost:5173</strong>
        </p>
      </div>
    );
  }

  const avgGpa = grades.length
    ? (grades.reduce((sum, g) => sum + (g.gpa || 0), 0) / grades.length).toFixed(2)
    : null;
  const upcoming = plannerItems
    .filter((i) => !i.completed && i.due_date)
    .slice(0, 5);

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      {status?.mode === 'demo' && (
        <div className={styles.demoBanner}>
          Demo mode — using sample data. <Link to="/settings">Connect Populi</Link> in Settings to link your account and build a planner from your syllabi.
        </div>
      )}

      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Current Term</h3>
          <p className={styles.termName}>{term?.name || '—'}</p>
          {term?.start_date && (
            <p className={styles.termDates}>
              {term.start_date} — {term.end_date}
            </p>
          )}
        </div>
        <div className={styles.card}>
          <h3>GPA</h3>
          <p className={styles.gpa}>{avgGpa ?? '—'}</p>
          <Link to="/grades">View grades →</Link>
        </div>
        <div className={styles.card}>
          <h3>Courses</h3>
          <p className={styles.count}>{grades.length}</p>
          <Link to="/grades">View courses →</Link>
        </div>
      </div>

      <section className={styles.section}>
        <h2>Upcoming Assignments</h2>
        {upcoming.length === 0 ? (
          <p className={styles.empty}>
            No upcoming assignments. <Link to="/planner">Build your planner</Link> from your courses.
          </p>
        ) : (
          <ul className={styles.list}>
            {upcoming.map((item) => (
              <li key={item.id} className={styles.listItem}>
                <span className={styles.listTitle}>{item.title}</span>
                <span className={styles.listMeta}>{item.course_name} · {item.due_date}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/planner" className={styles.link}>Go to Planner →</Link>
      </section>
    </div>
  );
}
