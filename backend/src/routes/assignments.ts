import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const assignmentsRouter = Router();
assignmentsRouter.use(authMiddleware);

// Ensure class belongs to user before assignment ops
async function checkClassAccess(userId: string, classId: string) {
  return prisma.class.findFirst({
    where: { id: classId, userId },
  });
}

assignmentsRouter.get('/class/:classId', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { classId } = req.params;
  const c = await checkClassAccess(userId, classId);
  if (!c) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  const assignments = await prisma.assignment.findMany({
    where: { classId },
    orderBy: { dueDate: 'asc' },
  });
  res.json(assignments);
});

assignmentsRouter.post(
  '/',
  body('classId').notEmpty(),
  body('name').trim().notEmpty(),
  body('weightPercent').isFloat({ min: 0, max: 100 }),
  body('gradeReceived').optional().isFloat({ min: 0, max: 100 }),
  body('dueDate').isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const userId = (req as unknown as { userId: string }).userId;
    const { classId, name, weightPercent, gradeReceived, dueDate } = req.body;
    const c = await checkClassAccess(userId, classId);
    if (!c) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    const a = await prisma.assignment.create({
      data: {
        classId,
        name,
        weightPercent: Number(weightPercent),
        gradeReceived: gradeReceived != null ? Number(gradeReceived) : null,
        dueDate: new Date(dueDate),
      },
    });
    res.status(201).json(a);
  }
);

assignmentsRouter.patch(
  '/:id',
  body('name').optional().trim().notEmpty(),
  body('weightPercent').optional().isFloat({ min: 0, max: 100 }),
  body('gradeReceived').optional().custom((val) => val === null || val === undefined || (typeof val === 'number' && val >= 0 && val <= 100) || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100)),
  body('dueDate').optional().isISO8601(),
  async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const id = req.params!.id;
    const a = await prisma.assignment.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!a || a.class.userId !== userId) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    const { name, weightPercent, gradeReceived, dueDate } = req.body;
    const data: Record<string, unknown> = {};
    if (name != null) data.name = name;
    if (weightPercent != null) data.weightPercent = Number(weightPercent);
    if (gradeReceived !== undefined) data.gradeReceived = gradeReceived == null ? null : Number(gradeReceived);
    if (dueDate != null) data.dueDate = new Date(dueDate);
    const updated = await prisma.assignment.update({
      where: { id },
      data,
    });
    res.json(updated);
  }
);

assignmentsRouter.delete('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const id = req.params!.id;
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: { class: true },
  });
  if (!a || a.class.userId !== userId) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }
  await prisma.assignment.delete({ where: { id } });
  res.status(204).send();
});
