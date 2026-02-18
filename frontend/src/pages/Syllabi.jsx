import { useState, useEffect } from 'react';
import { populi } from '../api';
import styles from './Syllabi.module.css';

export default function Syllabi() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { courses: c } = await populi.courses();
        setCourses(c || []);
        if (c?.length) setSelected(c[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setSyllabus(null);
    populi.syllabus(selected)
      .then((r) => setSyllabus(r?.syllabus))
      .catch(() => setSyllabus({ error: 'Could not load syllabus' }));
  }, [selected]);

  if (loading) {
    return <div className={styles.loading}>Loading courses...</div>;
  }

  return (
    <div className={styles.syllabi}>
      <h1>Syllabi</h1>
      <p className={styles.desc}>View syllabi for your courses</p>
      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <h3>Courses</h3>
          <ul>
            {courses.map((c) => (
              <li key={c.id}>
                <button
                  className={selected === c.id ? styles.active : ''}
                  onClick={() => setSelected(c.id)}
                >
                  {c.name || c.course_number || c.id}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className={styles.viewer}>
          {!selected ? (
            <p className={styles.empty}>Select a course</p>
          ) : syllabus?.error ? (
            <p className={styles.error}>{syllabus.error}</p>
          ) : !syllabus ? (
            <p className={styles.loading}>Loading syllabus...</p>
          ) : (
            <article className={styles.syllabus}>
              <h2>{syllabus.title || 'Syllabus'}</h2>
              <div
                className={styles.body}
                dangerouslySetInnerHTML={{
                  __html: formatSyllabus(syllabus.content || syllabus.body || ''),
                }}
              />
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSyllabus(content) {
  if (!content || typeof content !== 'string') return '';
  let html = content
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}
