import express from 'express';
import jwt from 'jsonwebtoken';
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

router.get('/class/:classId/current', (req, res) => {
  const db = getDb();
  try {
    assertClassOwnership(db, req.params.classId, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  const rows = db.prepare('SELECT * FROM assignments WHERE class_id = ?').all(req.params.classId);
  let totalWeight = 0;
  let weightedSum = 0;
  for (const a of rows) {
    totalWeight += a.weight_percent;
    if (a.grade_received != null) {
      weightedSum += (a.weight_percent / 100) * a.grade_received;
    }
  }
  const currentGrade = totalWeight > 0 ? weightedSum / (totalWeight / 100) : null;
  res.json({ currentGrade, classId: req.params.classId });
});

router.get('/class/:classId/min-needed', (req, res) => {
  const target = Number(req.query.target) || 90;
  const db = getDb();
  try {
    assertClassOwnership(db, req.params.classId, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  const rows = db.prepare('SELECT * FROM assignments WHERE class_id = ?').all(req.params.classId);
  let gradedWeight = 0;
  let weightedSum = 0;
  let remainingWeight = 0;
  for (const a of rows) {
    if (a.grade_received != null) {
      gradedWeight += a.weight_percent;
      weightedSum += (a.weight_percent / 100) * a.grade_received;
    } else {
      remainingWeight += a.weight_percent;
    }
  }
  let minNeeded = null;
  let message = '';
  if (remainingWeight <= 0) {
    const current = gradedWeight > 0 ? weightedSum / (gradedWeight / 100) : null;
    minNeeded = current;
    message = 'No assignments remaining.';
  } else {
    const neededFromRemaining = (target / 100) * (gradedWeight + remainingWeight) - weightedSum;
    minNeeded = (neededFromRemaining / remainingWeight) * 100;
    message = `Need ${minNeeded.toFixed(1)}% on remaining assignments (${remainingWeight}% of grade) to get ${target}%.`;
  }
  res.json({ minNeeded, message, targetGrade: target, classId: req.params.classId });
});

router.get('/class/:classId/priority', (req, res) => {
  const db = getDb();
  try {
    assertClassOwnership(db, req.params.classId, req.userId);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
  const rows = db.prepare('SELECT * FROM assignments WHERE class_id = ? AND grade_received IS NULL ORDER BY due_date ASC').all(req.params.classId);
  const now = Date.now();
  const withScore = rows.map((a) => {
    const dueTime = new Date(a.due_date).getTime();
    const daysUntilDue = Math.max(0, (dueTime - now) / (1000 * 60 * 60 * 24));
    const urgency = 100 / (1 + daysUntilDue);
    const priorityScore = a.weight_percent * urgency;
    return {
      id: a.id,
      classId: a.class_id,
      name: a.name,
      weightPercent: a.weight_percent,
      gradeReceived: a.grade_received,
      dueDate: a.due_date,
      priorityScore,
    };
  });
  withScore.sort((a, b) => b.priorityScore - a.priorityScore);
  res.json(withScore);
});

export default router;
