import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const USE_SQLITE = !process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL

let db, closeDb

export async function initDb() {
  if (USE_SQLITE) {
    const { default: Database } = await import('better-sqlite3')
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const sqlite = new Database(join(__dirname, '..', 'nippu.db'))
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    db = {
      async get(sql, args = []) { return sqlite.prepare(sql).get(...args) ?? undefined },
      async all(sql, args = []) { return sqlite.prepare(sql).all(...args) },
      async run(sql, args = []) { sqlite.prepare(sql).run(...args) },
      async batch(stmts) {
        sqlite.transaction(() => {
          for (const { sql: q, args: a = [] } of stmts) sqlite.prepare(q).run(...a)
        })()
      },
    }

    closeDb = () => sqlite.close()

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        emoji TEXT NOT NULL DEFAULT '📋',
        created_at INTEGER DEFAULT (unixepoch()),
        section_order TEXT
      );
      CREATE TABLE IF NOT EXISTS list_items (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        set_id TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        category TEXT,
        ord INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );
      CREATE TABLE IF NOT EXISTS set_items (
        id TEXT PRIMARY KEY,
        set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        category TEXT,
        ord INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT '',
        serves INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      );
      CREATE TABLE IF NOT EXISTS recipe_tags (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        tag TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        ord INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS recipe_steps (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        step TEXT NOT NULL,
        ord INTEGER NOT NULL DEFAULT 0
      );
    `)

    const hasColumn = (table, col) =>
      sqlite.prepare(`PRAGMA table_info(${table})`).all().some(r => r.name === col)

    const migrations = [
      ['list_items', 'category',      'ALTER TABLE list_items ADD COLUMN category TEXT'],
      ['list_items', 'ord',           'ALTER TABLE list_items ADD COLUMN ord INTEGER DEFAULT 0'],
      ['set_items',  'category',      'ALTER TABLE set_items ADD COLUMN category TEXT'],
      ['set_items',  'ord',           'ALTER TABLE set_items ADD COLUMN ord INTEGER DEFAULT 0'],
      ['lists',      'section_order', 'ALTER TABLE lists ADD COLUMN section_order TEXT'],
      ['sets',       'description',   'ALTER TABLE sets ADD COLUMN description TEXT'],
    ]
    for (const [table, col, sql] of migrations) {
      if (!hasColumn(table, col)) sqlite.exec(sql)
    }
  } else {
    const { Pool } = await import('@neondatabase/serverless')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
      max: 1,
    })

    function positional(sql) {
      let i = 0
      return sql.replace(/\?/g, () => `$${++i}`)
    }

    db = {
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
          for (const { sql: q, args: a = [] } of stmts) await client.query(positional(q), a)
          await client.query('COMMIT')
        } catch (e) {
          await client.query('ROLLBACK')
          throw e
        } finally {
          client.release()
        }
      },
    }

    closeDb = () => pool.end()

    await pool.query('CREATE EXTENSION IF NOT EXISTS citext')
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
    const migrations = [
      'ALTER TABLE list_items  ADD COLUMN IF NOT EXISTS category      TEXT',
      'ALTER TABLE list_items  ADD COLUMN IF NOT EXISTS ord           INTEGER DEFAULT 0',
      'ALTER TABLE set_items   ADD COLUMN IF NOT EXISTS category      TEXT',
      'ALTER TABLE set_items   ADD COLUMN IF NOT EXISTS ord           INTEGER DEFAULT 0',
      'ALTER TABLE lists       ADD COLUMN IF NOT EXISTS section_order TEXT',
      'ALTER TABLE sets        ADD COLUMN IF NOT EXISTS description   TEXT',
    ]
    for (const sql of migrations) await pool.query(sql)
  }
}

export { db, closeDb }
