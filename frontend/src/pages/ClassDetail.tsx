import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  assignments as assignmentsApi,
  grades as gradesApi,
  classes as classesApi,
  syllabi as syllabiApi,
} from '../api';
import type { Syllabus } from '../api';
import type { Assignment } from '../api';

function SyllabusSection({
  classId,
  syllabus,
  onUpdate,
}: {
  classId: string;
  syllabus: Syllabus | null;
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result));
      if (!title) setTitle(file.name.replace(/\.(txt|md)$/i, ''));
    };
    reader.readAsText(file);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErr('Title and content are required');
      return;
    }
    setErr('');
    setUploading(true);
    try {
      await syllabiApi.upload(classId, title.trim(), content.trim());
      setTitle('');
      setContent('');
      setShowForm(false);
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!syllabus || !confirm('Delete this syllabus?')) return;
    try {
      await syllabiApi.delete(syllabus.id);
      onUpdate();
    } catch {}
  };

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Syllabus</h2>
      {syllabus ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{syllabus.title}</h3>
            <button
              onClick={handleDelete}
              style={{ fontSize: 14, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
          <pre
            style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
          >
            {syllabus.content}
          </pre>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Math 101 Syllabus"
              style={{ width: '100%', maxWidth: 400, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Content (paste or upload .txt)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste syllabus text here..."
              rows={12}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'inherit' }}
            />
          </div>
          {err && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 8 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="submit"
              disabled={uploading}
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: uploading ? 'not-allowed' : 'pointer' }}
            >
              {uploading ? 'Uploading...' : 'Save syllabus'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setTitle(''); setContent(''); setErr(''); }}
              style={{ padding: '8px 16px', background: 'none', color: '#64748b', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: '#f8fafc', padding: 24, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b' }}>Upload a syllabus for this class</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
              Choose .txt file
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: '8px 16px', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
            >
              Paste text instead
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

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
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
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
      const [classes, assigns, syllabusRes, current, min, prio] = await Promise.all([
        classesApi.list(),
        assignmentsApi.listByClass(classId),
        syllabiApi.get(classId),
        gradesApi.currentGrade(classId),
        gradesApi.minNeeded(classId, targetGrade),
        gradesApi.priority(classId),
      ]);
      const c = classes.find((x) => x.id === classId);
      setClassName(c?.name ?? '');
      setAssignments(assigns);
      setSyllabus(syllabusRes.syllabus);
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
      <Link to="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
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

      <SyllabusSection classId={classId} syllabus={syllabus} onUpdate={load} />

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
