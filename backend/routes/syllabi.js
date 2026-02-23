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
  const row = db.prepare('SELECT * FROM syllabi WHERE class_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.classId);
  if (!row) {
    return res.json({ syllabus: null });
  }
  res.json({
    syllabus: {
      id: row.id,
      classId: row.class_id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
    },
  });
});

router.post('/', (req, res) => {
  const { classId, title, content } = req.body;
  if (!classId || !title || content == null) {
    return res.status(400).json({ error: 'classId, title, and content are required' });
  }
  const db = getDb();
  try {
    assertClassOwnership(db, classId, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  const id = randomUUID();
  db.prepare('INSERT INTO syllabi (id, class_id, title, content) VALUES (?, ?, ?, ?)').run(
    id,
    classId,
    String(title).trim(),
    String(content)
  );
  const row = db.prepare('SELECT * FROM syllabi WHERE id = ?').get(id);
  res.status(201).json({
    syllabus: {
      id: row.id,
      classId: row.class_id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
    },
  });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM syllabi WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Syllabus not found' });
  }
  try {
    assertClassOwnership(db, row.class_id, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  db.prepare('DELETE FROM syllabi WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
