import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
  req.userId = 'guest';
  next();
}

router.use(authMiddleware);

function toAssignment(row) {
  if (!row) return null;
  return {
    id: row.id,
    classId: row.class_id,
    name: row.name,
    weightPercent: row.weight_percent,
    gradeReceived: row.grade_received,
    dueDate: row.due_date,
  };
}

function assertClassOwnership(db, classId, userId) {
  const c = db.prepare('SELECT id FROM classes WHERE id = ? AND user_id = ?').get(classId, userId);
  if (!c) throw { status: 404, message: 'Class not found' };
}

router.get('/class/:classId', (req, res) => {
  const db = getDb();
  try {
    assertClassOwnership(db, req.params.classId, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  const rows = db.prepare('SELECT * FROM assignments WHERE class_id = ? ORDER BY due_date ASC').all(req.params.classId);
  res.json(rows.map(toAssignment));
});

router.post('/', (req, res) => {
  const { classId, name, weightPercent, gradeReceived, dueDate } = req.body;
  if (!classId || !name || weightPercent == null || !dueDate) {
    return res.status(400).json({ error: 'classId, name, weightPercent, and dueDate are required' });
  }
  const db = getDb();
  try {
    assertClassOwnership(db, classId, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  const id = randomUUID();
  db.prepare(
    'INSERT INTO assignments (id, class_id, name, weight_percent, grade_received, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, classId, String(name).trim(), Number(weightPercent), gradeReceived ?? null, String(dueDate).slice(0, 10));
  const row = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  res.status(201).json(toAssignment(row));
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!a) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  const c = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(a.class_id, req.userId);
  if (!c) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  const { name, weightPercent, gradeReceived, dueDate } = req.body;
  const updates = [];
  const params = [];
  if (name != null) {
    updates.push('name = ?');
    params.push(String(name).trim());
  }
  if (weightPercent != null) {
    updates.push('weight_percent = ?');
    params.push(Number(weightPercent));
  }
  if (gradeReceived !== undefined) {
    updates.push('grade_received = ?');
    params.push(gradeReceived === null ? null : Number(gradeReceived));
  }
  if (dueDate != null) {
    updates.push('due_date = ?');
    params.push(String(dueDate).slice(0, 10));
  }
  if (updates.length) {
    params.push(req.params.id);
    db.prepare(`UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const row = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  res.json(toAssignment(row));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!a) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  const c = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(a.class_id, req.userId);
  if (!c) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
