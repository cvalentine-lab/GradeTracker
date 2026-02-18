import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export function initDb() {
  db = new Database(join(__dirname, 'grade_tracker.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS planner_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id TEXT,
      course_id TEXT,
      course_name TEXT,
      title TEXT NOT NULL,
      due_date TEXT,
      type TEXT DEFAULT 'assignment',
      completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  return db;
}

export function getDb() {
  if (!db) initDb();
  return db;
}
