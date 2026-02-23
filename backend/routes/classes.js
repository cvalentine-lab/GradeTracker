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

function toClass(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    assignments: [],
  };
}

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

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM classes WHERE user_id = ? ORDER BY created_at ASC').all(req.userId);
  const classes = rows.map((r) => toClass(r));
  for (const c of classes) {
    const assignments = db.prepare('SELECT * FROM assignments WHERE class_id = ? ORDER BY due_date ASC').all(c.id);
    c.assignments = assignments.map(toAssignment);
  }
  res.json(classes);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const db = getDb();
  const id = randomUUID();
  db.prepare('INSERT INTO classes (id, user_id, name) VALUES (?, ?, ?)').run(id, req.userId, String(name).trim());
  const row = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  res.status(201).json(toClass(row));
});

router.patch('/:id', (req, res) => {
  const { name } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Class not found' });
  }
  if (name != null && String(name).trim()) {
    db.prepare('UPDATE classes SET name = ? WHERE id = ?').run(String(name).trim(), req.params.id);
  }
  const row = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  res.json(toClass(row));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Class not found' });
  }
  db.prepare('DELETE FROM assignments WHERE class_id = ?').run(req.params.id);
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
