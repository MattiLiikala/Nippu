import { Pool } from '@neondatabase/serverless'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
  max: 1,
})

export const closeDb = () => pool.end()

// Convert SQLite-style ? placeholders to Postgres $1, $2, ...
function positional(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

export const db = {
  async get(sql, args = []) {
    const { rows } = await pool.query(positional(sql), args)
    return rows[0]
  },
  async all(sql, args = []) {
    const { rows } = await pool.query(positional(sql), args)
    return rows
  },
  async run(sql, args = []) {
    await pool.query(positional(sql), args)
  },
  async batch(stmts) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const { sql: q, args: a = [] } of stmts) {
        await client.query(positional(q), a)
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },
}

export async function initDb() {
  // CITEXT gives case-insensitive equality on the households.name column
  await pool.query('CREATE EXTENSION IF NOT EXISTS citext')

  // Create tables — all idempotent
  const tables = [
    `CREATE TABLE IF NOT EXISTS households (
      id           TEXT    PRIMARY KEY,
      name         CITEXT  UNIQUE NOT NULL,
      password_hash TEXT   NOT NULL,
      created_at   INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()))::INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS lists (
      id           TEXT    PRIMARY KEY,
      household_id TEXT    NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      name         TEXT    NOT NULL,
      emoji        TEXT    NOT NULL DEFAULT '📋',
      created_at   INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()))::INTEGER,
      section_order TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS list_items (
      id         TEXT    PRIMARY KEY,
      list_id    TEXT    NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      set_id     TEXT,
      created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()))::INTEGER,
      category   TEXT,
      ord        INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sets (
      id         TEXT    PRIMARY KEY,
      list_id    TEXT    NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()))::INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS set_items (
      id         TEXT    PRIMARY KEY,
      set_id     TEXT    NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()))::INTEGER,
      category   TEXT,
      ord        INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS recipes (
      id           TEXT    PRIMARY KEY,
      household_id TEXT    NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      name         TEXT    NOT NULL,
      time         TEXT    NOT NULL DEFAULT '',
      serves       INTEGER NOT NULL DEFAULT 1,
      created_at   INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()))::INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS recipe_tags (
      id        TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      tag       TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id         TEXT    PRIMARY KEY,
      recipe_id  TEXT    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient TEXT    NOT NULL,
      ord        INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS recipe_steps (
      id        TEXT    PRIMARY KEY,
      recipe_id TEXT    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      step      TEXT    NOT NULL,
      ord       INTEGER NOT NULL DEFAULT 0
    )`,
  ]
  for (const sql of tables) await pool.query(sql)

  // Column migrations — Postgres supports IF NOT EXISTS directly
  const migrations = [
    'ALTER TABLE list_items  ADD COLUMN IF NOT EXISTS category      TEXT',
    'ALTER TABLE list_items  ADD COLUMN IF NOT EXISTS ord           INTEGER DEFAULT 0',
    'ALTER TABLE set_items   ADD COLUMN IF NOT EXISTS category      TEXT',
    'ALTER TABLE set_items   ADD COLUMN IF NOT EXISTS ord           INTEGER DEFAULT 0',
    'ALTER TABLE lists       ADD COLUMN IF NOT EXISTS section_order TEXT',
  ]
  for (const sql of migrations) await pool.query(sql)
}
