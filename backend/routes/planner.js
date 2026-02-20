import express from 'express';
import { getDb } from '../db.js';
import * as populi from '../services/populi.js';
import * as ai from '../services/ai.js';
import { DEMO_COURSES, DEMO_ASSIGNMENTS } from '../services/demoData.js';

const router = express.Router();

function useDemoData() {
  return !populi.isConfigured();
}

// AI-built planner (only when Populi connected + OpenAI configured)
router.post('/ai-build', async (req, res) => {
  if (!populi.isConfigured()) {
    return res.status(400).json({ error: 'Connect Populi in Settings first' });
  }
  if (!ai.isConfigured()) {
    return res.status(400).json({ error: 'Add OPENAI_API_KEY to backend/.env' });
  }

  try {
    const termResult = await populi.getCurrentTerm();
    const term = termResult?.term;
    const termId = term?.id;

    const { courses = [] } = await populi.getCourseOfferings(termId);
    const syllabi = {};
    const assignments = [];

    for (const course of courses) {
      const { syllabus } = await populi.getCourseSyllabus(course.id);
      if (syllabus?.content || syllabus?.body) {
        syllabi[course.id] = { title: syllabus.title, content: syllabus.content || syllabus.body };
      }
      const { assignments: courseAssignments } = await populi.getAssignments(course.id);
      (courseAssignments || []).forEach((a) => {
        assignments.push({
          ...a,
          course_name: course.name,
          due_at: a.due_at || a.due_date,
        });
      });
    }

    const result = await ai.generatePlanner({
      courses,
      syllabi,
      assignments,
      term,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const db = getDb();
    const deleteOld = db.prepare('DELETE FROM planner_items');
    deleteOld.run();

    const insertStmt = db.prepare(
      'INSERT INTO planner_items (title, due_date, course_name, type, notes) VALUES (?, ?, ?, ?, ?)'
    );

    for (const item of result.items || []) {
      const dueDate = item.due_date ? String(item.due_date).slice(0, 10) : null;
      const type = item.type || 'other';
      insertStmt.run(
        item.title || 'Untitled',
        dueDate,
        item.course_name || null,
        type,
        item.notes || null
      );
    }

    const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
    res.json({ planner: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Build planner from assignments (auto-generate)
router.get('/build', async (req, res) => {
  try {
    const db = getDb();
    const termId = req.query.term_id;

    let assignments = [];
    if (useDemoData()) {
      assignments = DEMO_ASSIGNMENTS.map((a) => ({
        ...a,
        course_name: DEMO_COURSES.find((c) => c.id === a.course_offering_id)?.name || 'Unknown',
      }));
    } else {
      // Fetch courses for term, then assignments per course
      const { courses } = await populi.getCourseOfferings(termId || (await populi.getCurrentTerm())?.term?.id);
      for (const course of courses || []) {
        const { assignments: courseAssignments } = await populi.getAssignments(course.id);
        (courseAssignments || []).forEach((a) => {
          assignments.push({
            ...a,
            course_offering_id: course.id,
            course_name: course.name,
            due_at: a.due_at || a.due_date,
          });
        });
      }
    }

    const deleteOld = db.prepare('DELETE FROM planner_items WHERE assignment_id IS NOT NULL');
    deleteOld.run();

    for (const a of assignments) {
      const dueDate = a.due_at ? new Date(a.due_at).toISOString().slice(0, 10) : null;
      db.prepare(
        'INSERT INTO planner_items (assignment_id, course_id, course_name, title, due_date, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(a.id, a.course_offering_id, a.course_name, a.title, dueDate, 'assignment');
    }

    const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
    res.json({ planner: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get planner items
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
  res.json({ planner: items });
});

// Add custom planner item
router.post('/', (req, res) => {
  const { title, due_date, type = 'other', notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO planner_items (title, due_date, type, notes) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(title, due_date || null, type, notes || null);
  const item = db.prepare('SELECT * FROM planner_items WHERE id = ?').get(result.lastInsertRowid);
  res.json({ item });
});

// Toggle completed
router.patch('/:id/complete', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM planner_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const completed = item.completed ? 0 : 1;
  db.prepare('UPDATE planner_items SET completed = ? WHERE id = ?').run(completed, id);
  const updated = db.prepare('SELECT * FROM planner_items WHERE id = ?').get(id);
  res.json({ item: updated });
});

// Delete planner item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const result = db.prepare('DELETE FROM planner_items WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

export default router;
