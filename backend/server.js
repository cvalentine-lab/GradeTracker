import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import plannerRoutes from './routes/planner.js';
import authRoutes from './routes/auth.js';
import classesRoutes from './routes/classes.js';
import assignmentsRoutes from './routes/assignments.js';
import gradesRoutes from './routes/grades.js';
import syllabiRoutes from './routes/syllabi.js';
import { initDb } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProduction ? undefined : true, credentials: true }));
app.use(express.json({ limit: '20mb' }));

// Initialize database and start server
initDb().then(() => {
  app.use('/api/auth', authRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/assignments', assignmentsRoutes);
  app.use('/api/grades', gradesRoutes);
  app.use('/api/syllabi', syllabiRoutes);
  app.use('/api/planner', plannerRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      openaiConfigured: !!process.env.OPENAI_API_KEY?.trim(),
    });
  });

  const clientPath = process.env.CLIENT_PATH
    ? join(__dirname, process.env.CLIENT_PATH)
    : join(__dirname, '../frontend/dist');
  if (existsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get('*', (req, res) => res.sendFile(join(clientPath, 'index.html')));
  }

  app.listen(PORT, () => {
    console.log(`Grade Tracker running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
