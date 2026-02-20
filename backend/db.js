import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'grade_tracker.db');
let db;
let SQL;

/**
 * Wraps sql.js to match better-sqlite3 style API (prepare/run/get/all)
 * so routes don't need to change.
 */
function wrapDb(sqliteDb) {
  const persist = () => {
    try {
      const data = sqliteDb.export();
      writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) {
      console.error('Failed to persist db:', e.message);
    }
  };

  return {
    exec(sql) {
      sqliteDb.run(sql);
    },
    prepare(sql) {
      const stmt = sqliteDb.prepare(sql);
      return {
        run(...params) {
          stmt.bind(params.length ? params : []);
          stmt.step();
          stmt.free();
          persist();
          const lastId = sqliteDb.exec('SELECT last_insert_rowid() as id');
          const changes = sqliteDb.exec('SELECT changes() as n');
          return {
            lastInsertRowid: lastId[0]?.values[0]?.[0] ?? 0,
            changes: changes[0]?.values[0]?.[0] ?? 0,
          };
        },
        get(...params) {
          stmt.bind(params.length ? params : []);
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        },
        all(...params) {
          stmt.bind(params.length ? params : []);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },
  };
}

export async function initDb() {
  SQL = await initSqlJs();
  const fileBuffer = existsSync(DB_PATH) ? readFileSync(DB_PATH) : null;
  const sqliteDb = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  sqliteDb.exec(`
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
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db = wrapDb(sqliteDb);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call await initDb() first.');
  return db;
}
