import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  assignments as assignmentsApi,
  grades as gradesApi,
  classes as classesApi,
} from '../api';
import type { Assignment } from '../api';

function AddAssignmentForm({
  classId,
  onAdded,
}: {
  classId: string;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [weightPercent, setWeightPercent] = useState('');
  const [gradeReceived, setGradeReceived] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await assignmentsApi.create({
        classId,
        name: name.trim(),
        weightPercent: Number(weightPercent),
        gradeReceived: gradeReceived ? Number(gradeReceived) : undefined,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
      });
      setName('');
      setWeightPercent('');
      setGradeReceived('');
      setDueDate('');
      onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end bg-slate-50 p-4 rounded-lg">
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-3 py-2 border rounded-md text-sm w-40"
        required
      />
      <input
        type="number"
        placeholder="Weight %"
        min={0}
        max={100}
        step={0.1}
        value={weightPercent}
        onChange={(e) => setWeightPercent(e.target.value)}
        className="w-20 px-2 py-2 border rounded-md text-sm"
        required
      />
      <input
        type="number"
        placeholder="Grade (optional)"
        min={0}
        max={100}
        value={gradeReceived}
        onChange={(e) => setGradeReceived(e.target.value)}
        className="w-20 px-2 py-2 border rounded-md text-sm"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="px-2 py-2 border rounded-md text-sm"
        required
      />
      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
        Add
      </button>
      {err && <span className="text-red-600 text-sm">{err}</span>}
    </form>
  );
}

function AssignmentRow({
  assignment,
  onUpdated,
  onDeleted,
}: {
  assignment: Assignment;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [grade, setGrade] = useState(String(assignment.gradeReceived ?? ''));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await assignmentsApi.update(assignment.id, {
        gradeReceived: grade ? Number(grade) : null,
      });
      setEditing(false);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${assignment.name}"?`)) return;
    try {
      await assignmentsApi.delete(assignment.id);
      onDeleted();
    } catch {}
  };

  return (
    <li className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
      <div>
        <span className="font-medium text-slate-800">{assignment.name}</span>
        <span className="text-sm text-slate-500 ml-2">
          {assignment.weightPercent}% · Due {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              type="number"
              min={0}
              max={100}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-16 px-2 py-1 border rounded text-sm"
            />
            <button onClick={handleSave} disabled={loading} className="text-sm text-blue-600">Save</button>
            <button onClick={() => setEditing(false)} className="text-sm text-slate-500">Cancel</button>
          </>
        ) : (
          <>
            <span className="font-medium text-slate-700">
              {assignment.gradeReceived != null ? `${assignment.gradeReceived}%` : '—'}
            </span>
            <button onClick={() => setEditing(true)} className="text-sm text-blue-600">Edit</button>
            <button onClick={handleDelete} className="text-sm text-red-600">Delete</button>
          </>
        )}
      </div>
    </li>
  );
}

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const [className, setClassName] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);
  const [minNeeded, setMinNeeded] = useState<{ minNeeded: number | null; message: string } | null>(null);
  const [priority, setPriority] = useState<(Assignment & { priorityScore: number })[]>([]);
  const [targetGrade, setTargetGrade] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!classId) return;
    try {
      setError(null);
      const [classes, assigns, current, min, prio] = await Promise.all([
        classesApi.list(),
        assignmentsApi.listByClass(classId),
        gradesApi.currentGrade(classId),
        gradesApi.minNeeded(classId, targetGrade),
        gradesApi.priority(classId),
      ]);
      const c = classes.find((x) => x.id === classId);
      setClassName(c?.name ?? '');
      setAssignments(assigns);
      setCurrentGrade(current.currentGrade);
      setMinNeeded(min);
      setPriority(prio);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [classId, targetGrade]);

  useEffect(() => {
    load();
  }, [load]);

  if (!classId || loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div>
      <Link to="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">{className}</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="grid gap-4 mb-8 sm:grid-cols-2">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Current grade</h3>
          <p className="text-2xl font-semibold text-slate-800">
            {currentGrade != null ? `${currentGrade.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Min grade needed (target {targetGrade}%)</h3>
          <p className="text-2xl font-semibold text-slate-800">
            {minNeeded?.minNeeded != null ? `${minNeeded.minNeeded.toFixed(1)}%` : '—'}
          </p>
          {minNeeded?.message && (
            <p className="text-sm text-slate-500 mt-1">{minNeeded.message}</p>
          )}
          <input
            type="number"
            min={0}
            max={100}
            value={targetGrade}
            onChange={(e) => setTargetGrade(Number(e.target.value))}
            className="mt-2 w-20 px-2 py-1 border border-slate-300 rounded text-sm"
          />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Assignments</h2>
        <AddAssignmentForm classId={classId} onAdded={load} />
        {assignments.length === 0 ? (
          <p className="text-slate-600 mt-4">No assignments yet.</p>
        ) : (
          <ul className="space-y-2 mt-4">
            {assignments.map((a) => (
              <AssignmentRow key={a.id} assignment={a} onUpdated={load} onDeleted={load} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-800 mb-4">Priority (what to focus on)</h2>
        {priority.length === 0 ? (
          <p className="text-slate-600">No assignments to rank.</p>
        ) : (
          <ol className="space-y-2">
            {priority.map((a, i) => (
              <li
                key={a.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200"
              >
                <span className="text-slate-600 font-mono w-6">{i + 1}.</span>
                <span className="font-medium text-slate-800">{a.name}</span>
                <span className="text-sm text-slate-500">Score: {a.priorityScore.toFixed(1)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
