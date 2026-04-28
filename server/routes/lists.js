import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import uid from '../uid.js'

const router = Router()
router.use(requireAuth)

function getList(listId, householdId) {
  return db.prepare('SELECT * FROM lists WHERE id = ? AND household_id = ?').get(listId, householdId)
}

function serializeList(list) {
  const items = db.prepare('SELECT * FROM list_items WHERE list_id = ? ORDER BY created_at').all(list.id)
  return { ...list, items }
}

// ── Lists ────────────────────────────────────────────────

router.get('/', (req, res) => {
  const lists = db.prepare('SELECT * FROM lists WHERE household_id = ? ORDER BY created_at').all(req.household.householdId)
  res.json(lists.map(serializeList))
})

router.post('/', (req, res) => {
  const { name, emoji = '📋' } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  db.prepare('INSERT INTO lists (id, household_id, name, emoji) VALUES (?, ?, ?, ?)').run(id, req.household.householdId, name.trim(), emoji)
  res.json(serializeList(db.prepare('SELECT * FROM lists WHERE id = ?').get(id)))
})

router.patch('/:id', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { name, emoji } = req.body
  db.prepare('UPDATE lists SET name = COALESCE(?, name), emoji = COALESCE(?, emoji) WHERE id = ?').run(name ?? null, emoji ?? null, list.id)
  res.json(serializeList(db.prepare('SELECT * FROM lists WHERE id = ?').get(list.id)))
})

router.delete('/:id', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM lists WHERE id = ?').run(list.id)
  res.json({ ok: true })
})

// ── List items ───────────────────────────────────────────

router.post('/:id/items', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { name, setId } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  db.prepare('INSERT INTO list_items (id, list_id, name, set_id) VALUES (?, ?, ?, ?)').run(id, list.id, name.trim(), setId ?? null)
  res.json(db.prepare('SELECT * FROM list_items WHERE id = ?').get(id))
})

router.post('/:id/items/bulk', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { names } = req.body
  if (!Array.isArray(names)) return res.status(400).json({ error: 'names must be array' })
  const insert = db.prepare('INSERT INTO list_items (id, list_id, name, set_id) VALUES (?, ?, ?, NULL)')
  const insertMany = db.transaction((items) => items.map(name => {
    const id = uid()
    insert.run(id, list.id, name.trim())
    return db.prepare('SELECT * FROM list_items WHERE id = ?').get(id)
  }))
  res.json(insertMany(names.filter(n => n?.trim())))
})

router.delete('/:id/items/:itemId', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM list_items WHERE id = ? AND list_id = ?').run(req.params.itemId, list.id)
  res.json({ ok: true })
})

// ── Sets ─────────────────────────────────────────────────

router.get('/:id/sets', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const sets = db.prepare('SELECT * FROM sets WHERE list_id = ? ORDER BY created_at').all(list.id)
  res.json(sets.map(s => ({
    ...s,
    items: db.prepare('SELECT * FROM set_items WHERE set_id = ? ORDER BY created_at').all(s.id)
  })))
})

router.post('/:id/sets', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  db.prepare('INSERT INTO sets (id, list_id, name) VALUES (?, ?, ?)').run(id, list.id, name.trim())
  const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(id)
  res.json({ ...set, items: [] })
})

router.post('/:id/sets/:setId/items', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const set = db.prepare('SELECT * FROM sets WHERE id = ? AND list_id = ?').get(req.params.setId, list.id)
  if (!set) return res.status(404).json({ error: 'Set not found' })
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  db.prepare('INSERT INTO set_items (id, set_id, name) VALUES (?, ?, ?)').run(id, set.id, name.trim())
  res.json(db.prepare('SELECT * FROM set_items WHERE id = ?').get(id))
})

router.delete('/:id/sets/:setId/items/:itemId', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM set_items WHERE id = ? AND set_id = ?').run(req.params.itemId, req.params.setId)
  res.json({ ok: true })
})

export default router
