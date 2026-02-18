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

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Initialize database
initDb();

// Routes
app.use('/api/populi', populiRoutes);
app.use('/api/planner', plannerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, populiConfigured: !!(process.env.POPULI_API_URL && process.env.POPULI_ACCESS_TOKEN) });
});

app.listen(PORT, () => {
  console.log(`Grade Tracker API running on http://localhost:${PORT}`);
});
