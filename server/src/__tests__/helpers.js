const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { createApp } = require('../index');

function buildTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      content TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
      owner_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE document_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      shared_with_user_id INTEGER NOT NULL REFERENCES users(id),
      permission TEXT NOT NULL DEFAULT 'edit',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(document_id, shared_with_user_id)
    );
  `);

  const hash = bcrypt.hashSync('password123', 1);
  const insertUser = db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)');
  insertUser.run('alice@example.com', 'Alice Chen', hash);
  insertUser.run('bob@example.com', 'Bob Smith', hash);
  insertUser.run('charlie@example.com', 'Charlie Davis', hash);

  return db;
}

function buildTestApp() {
  const db = buildTestDb();
  const app = createApp(db);
  return { app, db };
}

module.exports = { buildTestApp };
