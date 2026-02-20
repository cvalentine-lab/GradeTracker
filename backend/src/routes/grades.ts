import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  calculateCurrentGrade,
  minimumGradeNeeded,
  rankByPriority,
} from '../services/gradeCalculations.js';

export const gradesRouter = Router();
gradesRouter.use(authMiddleware);

gradesRouter.get('/class/:classId/current', async (req, res) => {
  const userId = (req as { userId: string }).userId;
  const { classId } = req.params;
  const c = await prisma.class.findFirst({ where: { id: classId, userId } });
  if (!c) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  const assignments = await prisma.assignment.findMany({ where: { classId } });
  const decimalAssignments = assignments.map((a) => ({
    ...a,
    weightPercent: Number(a.weightPercent),
    gradeReceived: a.gradeReceived != null ? Number(a.gradeReceived) : null,
  }));
  const current = calculateCurrentGrade(decimalAssignments);
  res.json({ currentGrade: current, classId });
});

gradesRouter.get('/class/:classId/min-needed', async (req, res) => {
  const userId = (req as { userId: string }).userId;
  const { classId } = req.params;
  const target = Number(req.query.target ?? 90);
  const c = await prisma.class.findFirst({ where: { id: classId, userId } });
  if (!c) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  const assignments = await prisma.assignment.findMany({ where: { classId } });
  const decimalAssignments = assignments.map((a) => ({
    ...a,
    weightPercent: Number(a.weightPercent),
    gradeReceived: a.gradeReceived != null ? Number(a.gradeReceived) : null,
  }));
  const result = minimumGradeNeeded(decimalAssignments, target);
  res.json({ ...result, targetGrade: target, classId });
});

gradesRouter.get('/class/:classId/priority', async (req, res) => {
  const userId = (req as { userId: string }).userId;
  const { classId } = req.params;
  const c = await prisma.class.findFirst({ where: { id: classId, userId } });
  if (!c) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  const assignments = await prisma.assignment.findMany({ where: { classId } });
  const decimalAssignments = assignments.map((a) => ({
    ...a,
    weightPercent: Number(a.weightPercent),
    gradeReceived: a.gradeReceived != null ? Number(a.gradeReceived) : null,
  }));
  const ranked = rankByPriority(decimalAssignments);
  res.json(ranked.map(({ priorityScore, ...a }) => ({
    ...a,
    weightPercent: Number(a.weightPercent),
    gradeReceived: a.gradeReceived != null ? Number(a.gradeReceived) : null,
    priorityScore,
  })));
});
