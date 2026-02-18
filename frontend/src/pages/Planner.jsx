import { useState, useEffect } from 'react';
import { planner } from '../api';
import { format, parseISO, isPast } from 'date-fns';
import styles from './Planner.module.css';

export default function Planner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  async function load() {
    try {
      const { planner: p } = await planner.list();
      setItems(p || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleBuild() {
    setBuilding(true);
    try {
      const { planner: p } = await planner.build();
      setItems(p || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBuilding(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await planner.add({ title: newTitle.trim(), due_date: newDueDate || null });
      setNewTitle('');
      setNewDueDate('');
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggle(id) {
    try {
      await planner.toggleComplete(id);
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id) {
    try {
      await planner.delete(id);
      load();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading planner...</div>;
  }

  const upcoming = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  return (
    <div className={styles.planner}>
      <h1>Planner</h1>
      <p className={styles.desc}>
        Automatically build your planner from Populi assignments, or add custom items.
      </p>

      <div className={styles.actions}>
        <button
          className={styles.buildBtn}
          onClick={handleBuild}
          disabled={building}
        >
          {building ? 'Building...' : 'Build planner from courses'}
        </button>
      </div>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add custom item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.input}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className={styles.dateInput}
        />
        <button type="submit" className={styles.addBtn}>Add</button>
      </form>

      <section className={styles.list}>
        <h2>Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className={styles.empty}>No upcoming items. Build your planner or add custom items.</p>
        ) : (
          <ul>
            {upcoming.map((item) => {
              const overdue = item.due_date && isPast(parseISO(item.due_date));
              return (
                <li key={item.id} className={styles.item}>
                  <button
                    className={styles.checkbox}
                    onClick={() => handleToggle(item.id)}
                    aria-label="Mark complete"
                  >
                    ○
                  </button>
                  <div className={styles.itemContent}>
                    <span className={styles.title}>{item.title}</span>
                    <span className={styles.meta}>
                      {item.course_name && `${item.course_name} · `}
                      {item.due_date ? format(parseISO(item.due_date), 'MMM d, yyyy') : 'No due date'}
                      {overdue && <span className={styles.overdue}> overdue</span>}
                    </span>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {completed.length > 0 && (
        <section className={styles.list}>
          <h2>Completed</h2>
          <ul>
            {completed.map((item) => (
              <li key={item.id} className={`${styles.item} ${styles.completed}`}>
                <button
                  className={styles.checkbox}
                  onClick={() => handleToggle(item.id)}
                  aria-label="Mark incomplete"
                >
                  ✓
                </button>
                <div className={styles.itemContent}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.meta}>{item.course_name}</span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
