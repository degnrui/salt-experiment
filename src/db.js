const Database = require('better-sqlite3');

function createDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      name TEXT NOT NULL,
      simulation_type TEXT NOT NULL DEFAULT 'salt_dissolution',
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
      name TEXT NOT NULL,
      join_code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
      group_id INTEGER NOT NULL REFERENCES groups(id),
      task_type TEXT NOT NULL,
      beaker_a TEXT NOT NULL,
      beaker_b TEXT NOT NULL,
      salt_timing TEXT,
      stir_timing TEXT,
      is_correct INTEGER NOT NULL,
      error_types TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const classroomColumns = db.prepare('PRAGMA table_info(classrooms)').all().map(column => column.name);
  if (!classroomColumns.includes('simulation_type')) {
    db.exec("ALTER TABLE classrooms ADD COLUMN simulation_type TEXT NOT NULL DEFAULT 'salt_dissolution'");
  }
  if (!classroomColumns.includes('deleted_at')) {
    db.exec('ALTER TABLE classrooms ADD COLUMN deleted_at TEXT');
  }

  db.prepare(`
    INSERT OR IGNORE INTO teachers (username, password)
    VALUES ('teacher', 'teacher123')
  `).run();

  return db;
}

module.exports = { createDb };
