import express from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import * as ai from '../services/ai.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch {
      req.userId = 'guest';
    }
  } else {
    req.userId = 'guest';
  }
  next();
}

// Check if OpenAI API is configured and working
router.get('/ai-status', async (req, res) => {
  const result = await ai.verifyApiKey();
  res.json(result);
});

// AI-built planner from LOCAL syllabi + assignments
router.post('/ai-build-from-syllabi', optionalAuth, async (req, res) => {
  if (!ai.isConfigured()) {
    return res.status(400).json({ error: 'Add OPENAI_API_KEY to backend/.env' });
  }

  const db = getDb();
  const userId = req.userId || 'guest';

  const classes = db.prepare('SELECT id, name FROM classes WHERE user_id = ?').all(userId);
  if (classes.length === 0) {
    return res.status(400).json({ error: 'Add classes first. Go to Dashboard to create classes, then add syllabi to each class.' });
  }

  const syllabi = {};
  const assignments = [];
  const classNames = {};
  for (const c of classes) {
    classNames[c.id] = c.name;
    const syllabusRow = db.prepare('SELECT id, title, content FROM syllabi WHERE class_id = ? ORDER BY created_at DESC LIMIT 1').get(c.id);
    if (syllabusRow?.content) {
      syllabi[c.id] = { title: syllabusRow.title, content: syllabusRow.content };
    }
    const assignRows = db.prepare('SELECT id, name, due_date FROM assignments WHERE class_id = ?').all(c.id);
    for (const a of assignRows) {
      assignments.push({
        classId: c.id,
        name: a.name,
        dueDate: a.due_date,
        course_name: c.name,
      });
    }
  }

  const hasSyllabi = Object.keys(syllabi).length > 0;
  if (!hasSyllabi && assignments.length === 0) {
    return res.status(400).json({ error: 'Add syllabi or assignments to your classes first. Go to each class and upload a syllabus or add assignments.' });
  }

  try {
    const result = await ai.generatePlannerFromLocalData({
      classes,
      syllabi,
      assignments,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    db.prepare('DELETE FROM planner_items').run();
    const insertStmt = db.prepare(
      'INSERT INTO planner_items (title, due_date, course_name, type, notes) VALUES (?, ?, ?, ?, ?)'
    );

    for (const item of result.items || []) {
      const dueDate = item.due_date ? String(item.due_date).slice(0, 10) : null;
      const type = item.type || 'other';
      insertStmt.run(
        item.title || 'Untitled',
        dueDate,
        item.course_name || null,
        type,
        item.notes || null
      );
    }

    const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
    res.json({ planner: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/** Extract text from PDF buffer. Tries pdf-parse first, falls back to pdf2json. */
async function extractTextFromPdf(buffer) {
  let text = '';
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    text = (data?.text || '').trim();
  } catch (err) {
    console.warn('pdf-parse failed, trying pdf2json:', err?.message);
  }
  if (!text || text.length < 50) {
    try {
      const { default: PDFParser } = await import('pdf2json');
      const pdfParser = new PDFParser(null, 1);
      text = await new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', () => {
          try {
            resolve((pdfParser.getRawTextContent() || '').trim());
          } catch (e) {
            reject(e);
          }
        });
        pdfParser.on('pdfParser_dataError', (err) => reject(err?.parserError || err));
        pdfParser.parseBuffer(buffer, 0);
      });
    } catch (err) {
      console.warn('pdf2json fallback failed:', err?.message);
    }
  }
  return text || '';
}

// AI-built planner from uploaded PDF syllabi
router.post('/ai-build-from-pdf', optionalAuth, async (req, res) => {
  if (!ai.isConfigured()) {
    return res.status(400).json({ error: 'Add OPENAI_API_KEY to backend/.env' });
  }

  const { pdfs } = req.body || {};
  if (!Array.isArray(pdfs) || pdfs.length === 0) {
    return res.status(400).json({ error: 'Upload at least one PDF file' });
  }

  const syllabi = [];

  for (const p of pdfs) {
    const name = String(p.name || 'Syllabus').replace(/\.pdf$/i, '');
    const base64 = p.base64;
    if (!base64) continue;
    try {
      const buffer = Buffer.from(base64, 'base64');
      const text = await extractTextFromPdf(buffer);
      if (text) {
        syllabi.push({ courseName: name, text });
      }
    } catch (err) {
      console.error('PDF parse error for', name, err);
    }
  }

  if (syllabi.length === 0) {
    return res.status(400).json({ error: 'Could not extract text from any PDF. Make sure files are text-based (not scanned images).' });
  }

  try {
    const result = await ai.generatePlannerFromPdfText(syllabi);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const db = getDb();
    db.prepare('DELETE FROM planner_items').run();
    const insertStmt = db.prepare(
      'INSERT INTO planner_items (title, due_date, course_name, type, notes) VALUES (?, ?, ?, ?, ?)'
    );

    for (const item of result.items || []) {
      const dueDate = item.due_date ? String(item.due_date).slice(0, 10) : null;
      const type = item.type || 'other';
      insertStmt.run(
        item.title || 'Untitled',
        dueDate,
        item.course_name || null,
        type,
        item.notes || null
      );
    }

    const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
    res.json({ planner: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Build planner from local assignments
router.get('/build', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId || 'guest';
    const classes = db.prepare('SELECT id, name FROM classes WHERE user_id = ?').all(userId);
    const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
    const assignRows = db.prepare('SELECT a.id, a.class_id, a.name as title, a.due_date FROM assignments a INNER JOIN classes c ON a.class_id = c.id WHERE c.user_id = ?').all(userId);

    db.prepare('DELETE FROM planner_items WHERE assignment_id IS NOT NULL').run();

    const insertStmt = db.prepare(
      'INSERT INTO planner_items (assignment_id, course_id, course_name, title, due_date, type) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const a of assignRows) {
      const dueDate = a.due_date ? String(a.due_date).slice(0, 10) : null;
      const courseName = classMap[a.class_id] || 'Unknown';
      insertStmt.run(a.id, a.class_id, courseName, a.title, dueDate, 'assignment');
    }

    const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
    res.json({ planner: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get planner items
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM planner_items ORDER BY due_date ASC, title ASC').all();
  res.json({ planner: items });
});

// Add custom planner item
router.post('/', (req, res) => {
  const { title, due_date, type = 'other', notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO planner_items (title, due_date, type, notes) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(title, due_date || null, type, notes || null);
  const item = db.prepare('SELECT * FROM planner_items WHERE id = ?').get(result.lastInsertRowid);
  res.json({ item });
});

// Toggle completed
router.patch('/:id/complete', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM planner_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const completed = item.completed ? 0 : 1;
  db.prepare('UPDATE planner_items SET completed = ? WHERE id = ?').run(completed, id);
  const updated = db.prepare('SELECT * FROM planner_items WHERE id = ?').get(id);
  res.json({ item: updated });
});

// Delete planner item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const result = db.prepare('DELETE FROM planner_items WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

export default router;
