import { useState, useEffect } from 'react';
import { populi } from '../api';
import styles from './Grades.module.css';

export default function Grades() {
  const [term, setTerm] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const t = await populi.term();
        const g = await populi.grades(t?.term?.id);
        setTerm(t?.term);
        setGrades(g?.grades || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading grades...</div>;
  }

  const avgGpa = grades.length
    ? (grades.reduce((sum, g) => sum + (g.gpa || 0), 0) / grades.length).toFixed(2)
    : null;

  return (
    <div className={styles.grades}>
      <h1>Grades</h1>
      {term && (
        <p className={styles.term}>{term.name}</p>
      )}
      {grades.length > 0 && avgGpa && (
        <div className={styles.summary}>
          Term GPA: <strong>{avgGpa}</strong>
        </div>
      )}
      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Letter Grade</th>
              <th>GPA</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.course_id}>
                <td>{g.course_name || g.course_id}</td>
                <td className={styles.grade}>{g.letter_grade || g.grade || '—'}</td>
                <td>{g.gpa ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grades.length === 0 && (
        <p className={styles.empty}>No grades available. Connect Populi in Settings.</p>
      )}
    </div>
  );
}
