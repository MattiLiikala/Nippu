import { createClient } from '@libsql/client'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? `file:${join(__dirname, '..', 'nippu.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Thin async wrapper matching the call patterns used in the routes
export const db = {
  async get(sql, args = []) {
    const { rows } = await client.execute({ sql, args })
    return rows[0]
  },
  async all(sql, args = []) {
    const { rows } = await client.execute({ sql, args })
    return rows
  },
  async run(sql, args = []) {
    await client.execute({ sql, args })
  },
  async batch(stmts) {
    await client.batch(stmts, 'write')
  },
}

export async function initDb() {
  // Enable foreign keys (supported on local SQLite; no-op on Turso cloud)
  await client.execute('PRAGMA foreign_keys = ON').catch(() => {})

  // Create tables (idempotent)
  await client.batch([
    { sql: `CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        emoji TEXT NOT NULL DEFAULT '📋',
        created_at INTEGER DEFAULT (unixepoch()),
        section_order TEXT
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS list_items (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        set_id TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        category TEXT,
        ord INTEGER DEFAULT 0
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS set_items (
        id TEXT PRIMARY KEY,
        set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        category TEXT,
        ord INTEGER DEFAULT 0
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT '',
        serves INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS recipe_tags (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        tag TEXT NOT NULL
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        ord INTEGER NOT NULL DEFAULT 0
      )` },
    { sql: `CREATE TABLE IF NOT EXISTS recipe_steps (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        step TEXT NOT NULL,
        ord INTEGER NOT NULL DEFAULT 0
      )` },
  ], 'write')

  // Column migrations for databases created before these columns existed
  const migrations = [
    ['list_items',  'category',      'TEXT'],
    ['list_items',  'ord',           'INTEGER DEFAULT 0'],
    ['set_items',   'category',      'TEXT'],
    ['set_items',   'ord',           'INTEGER DEFAULT 0'],
    ['lists',       'section_order', 'TEXT'],
  ]
  for (const [table, col, def] of migrations) {
    const { rows } = await client.execute(`PRAGMA table_info(${table})`)
    if (rows.length && !rows.find(r => r.name === col)) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)
    }
  }
}
