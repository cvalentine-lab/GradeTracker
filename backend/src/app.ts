import express from 'express';
import cors from 'cors';

import { authRouter } from './routes/auth.js';
import { classesRouter } from './routes/classes.js';
import { assignmentsRouter } from './routes/assignments.js';
import { gradesRouter } from './routes/grades.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/grades', gradesRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export { app };
