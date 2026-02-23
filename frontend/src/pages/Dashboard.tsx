import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classes as classesApi } from '../api';

export default function Dashboard() {
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof classesApi.list>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newClass, setNewClass] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const data = await classesApi.list();
      setClasses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.trim()) return;
    setCreating(true);
    try {
      await classesApi.create(newClass.trim());
      setNewClass('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its assignments?`)) return;
    try {
      await classesApi.delete(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-slate-800 dark:text-slate-100 mb-6">Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          placeholder="New class name"
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={creating || !newClass.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Add Class
        </button>
      </form>

      {classes.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">No classes yet. Add your first class above.</p>
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Link to={`/dashboard/class/${c.id}`} className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400">
                {c.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">{c.assignments.length} assignments</span>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
