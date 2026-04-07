/**
 * Database schema DDL and migrations for the note-taker app.
 * Portable: no Electrobun or platform-specific dependencies.
 */

import type Database from "bun:sqlite";

type DatabaseInstance = InstanceType<typeof Database>;

export const INIT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS property_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(id),
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('string', 'number', 'date', 'time', 'checkbox')),
    position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Unnamed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL DEFAULT '',
    updated_by TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '[]',
    properties TEXT NOT NULL DEFAULT '{}',
    collection_id INTEGER NOT NULL REFERENCES collections(id),
    parent_id INTEGER REFERENCES documents(id),
    icon TEXT,
    child_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS bluesky_auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    handle TEXT NOT NULL,
    did TEXT NOT NULL,
    service TEXT NOT NULL,
    access_jwt TEXT NOT NULL,
    refresh_jwt TEXT NOT NULL,
    publication_uri TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

/**
 * Run migrations for databases created before the final schema.
 * Each migration is idempotent (catches "column already exists" errors).
 */
export function runMigrations(db: DatabaseInstance): void {
  const migrations = [
    "ALTER TABLE documents ADD COLUMN icon TEXT",
    "ALTER TABLE property_definitions ADD COLUMN collection_id INTEGER REFERENCES collections(id)",
    "ALTER TABLE documents ADD COLUMN child_order INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE documents ADD COLUMN published_uri TEXT",
    "ALTER TABLE documents ADD COLUMN published_cid TEXT",
    "ALTER TABLE documents ADD COLUMN published_at TEXT",
    "ALTER TABLE documents ADD COLUMN content_hash TEXT",
  ];

  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists
    }
  }

  // Backfill collection_id for property_definitions created before per-collection support
  try {
    db.exec(
      "UPDATE property_definitions SET collection_id = (SELECT id FROM collections LIMIT 1) WHERE collection_id IS NULL",
    );
  } catch {
    // No rows to backfill or column didn't exist
  }
}

/**
 * Ensure at least one default collection exists.
 */
export function ensureDefaultCollection(db: DatabaseInstance): void {
  if (!db.query("SELECT id FROM collections LIMIT 1").get()) {
    db.exec("INSERT INTO collections (name) VALUES ('Default')");
  }
}
