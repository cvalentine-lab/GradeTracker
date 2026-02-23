import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(String(password), 10);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      id,
      trimmedEmail,
      passwordHash
    );

    const token = jwt.sign({ userId: id }, JWT_SECRET);
    res.status(201).json({
      user: { id, email: trimmedEmail },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(
      trimmedEmail
    );
    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
