import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const classesRouter = Router();
classesRouter.use(authMiddleware);

classesRouter.get('/', async (req, res) => {
  const userId = (req as { userId: string }).userId;
  const classes = await prisma.class.findMany({
    where: { userId },
    include: { assignments: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(classes);
});

classesRouter.post(
  '/',
  body('name').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const userId = (req as { userId: string }).userId;
    const { name } = req.body;
    const c = await prisma.class.create({
      data: { userId, name },
    });
    res.status(201).json(c);
  }
);

classesRouter.patch(
  '/:id',
  body('name').optional().trim().notEmpty(),
  async (req, res) => {
    const userId = (req as { userId: string }).userId;
    const { id } = req.params;
    const c = await prisma.class.findFirst({ where: { id, userId } });
    if (!c) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    const { name } = req.body;
    const updated = await prisma.class.update({
      where: { id },
      data: name != null ? { name } : {},
    });
    res.json(updated);
  }
);

classesRouter.delete('/:id', async (req, res) => {
  const userId = (req as { userId: string }).userId;
  const { id } = req.params;
  const c = await prisma.class.findFirst({ where: { id, userId } });
  if (!c) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  await prisma.class.delete({ where: { id } });
  res.status(204).send();
});
