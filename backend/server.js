import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import populiRoutes from './routes/populi.js';
import plannerRoutes from './routes/planner.js';
import { initDb } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProduction ? undefined : 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Initialize database and start server
initDb().then(() => {
  app.use('/api/populi', populiRoutes);
  app.use('/api/planner', plannerRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, populiConfigured: !!(process.env.POPULI_API_URL && process.env.POPULI_ACCESS_TOKEN) });
  });

  if (isProduction) {
    const clientPath = join(__dirname, '../frontend/dist');
    app.use(express.static(clientPath));
    app.get('*', (req, res) => {
      res.sendFile(join(clientPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Syllabus Planner running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
