import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import uid from '../uid.js'

const router = Router()
router.use(requireAuth)

function getList(listId, householdId) {
  return db.prepare('SELECT * FROM lists WHERE id = ? AND household_id = ?').get(listId, householdId)
}

function nextOrd(table, idCol, idVal) {
  const row = db.prepare(`SELECT COALESCE(MAX(ord), -1) + 1 AS next FROM ${table} WHERE ${idCol} = ?`).get(idVal)
  return row.next
}

function serializeList(list) {
  const items = db.prepare('SELECT * FROM list_items WHERE list_id = ? ORDER BY ord, created_at').all(list.id)
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
  const { name, emoji, section_order } = req.body
  db.prepare('UPDATE lists SET name = COALESCE(?, name), emoji = COALESCE(?, emoji), section_order = COALESCE(?, section_order) WHERE id = ?')
    .run(name ?? null, emoji ?? null, section_order ?? null, list.id)
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
  const { name, setId, category } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  const ord = nextOrd('list_items', 'list_id', list.id)
  db.prepare('INSERT INTO list_items (id, list_id, name, set_id, category, ord) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, list.id, name.trim(), setId ?? null, category ?? null, ord)
  res.json(db.prepare('SELECT * FROM list_items WHERE id = ?').get(id))
})

router.post('/:id/items/bulk', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be array' })
  const insert = db.prepare('INSERT INTO list_items (id, list_id, name, set_id, category, ord) VALUES (?, ?, ?, NULL, ?, ?)')
  let baseOrd = nextOrd('list_items', 'list_id', list.id)
  const insertMany = db.transaction((rows) => rows.map(({ name, category }) => {
    const id = uid()
    insert.run(id, list.id, name.trim(), category ?? null, baseOrd++)
    return db.prepare('SELECT * FROM list_items WHERE id = ?').get(id)
  }))
  res.json(insertMany(items.filter(i => i?.name?.trim())))
})

router.patch('/:id/items/reorder', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' })
  const update = db.prepare('UPDATE list_items SET ord = ? WHERE id = ? AND list_id = ?')
  const updateAll = db.transaction(() => ids.forEach((id, idx) => update.run(idx, id, list.id)))
  updateAll()
  res.json({ ok: true })
})

router.patch('/:id/sections/reorder', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { order } = req.body
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' })
  db.prepare('UPDATE lists SET section_order = ? WHERE id = ?').run(JSON.stringify(order), list.id)
  res.json({ ok: true })
})

router.patch('/:id/items/:itemId', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const item = db.prepare('SELECT * FROM list_items WHERE id = ? AND list_id = ?').get(req.params.itemId, list.id)
  if (!item) return res.status(404).json({ error: 'Item not found' })
  const { category } = req.body
  db.prepare('UPDATE list_items SET category = ? WHERE id = ?').run(category ?? null, item.id)
  res.json(db.prepare('SELECT * FROM list_items WHERE id = ?').get(item.id))
})

router.delete('/:id/items/:itemId', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM list_items WHERE id = ? AND list_id = ?').run(req.params.itemId, list.id)
  res.json({ ok: true })
})

router.patch('/:id/categories', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { oldName, newName } = req.body
  if (!oldName || !newName?.trim()) return res.status(400).json({ error: 'oldName and newName required' })
  db.prepare('UPDATE list_items SET category = ? WHERE list_id = ? AND category = ?')
    .run(newName.trim(), list.id, oldName)
  res.json({ ok: true })
})

// ── Sets ─────────────────────────────────────────────────

router.get('/:id/sets', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const sets = db.prepare('SELECT * FROM sets WHERE list_id = ? ORDER BY created_at').all(list.id)
  res.json(sets.map(s => ({
    ...s,
    items: db.prepare('SELECT * FROM set_items WHERE set_id = ? ORDER BY ord, created_at').all(s.id)
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
  const { name, category } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  const ord = nextOrd('set_items', 'set_id', set.id)
  db.prepare('INSERT INTO set_items (id, set_id, name, category, ord) VALUES (?, ?, ?, ?, ?)').run(id, set.id, name.trim(), category ?? null, ord)
  res.json(db.prepare('SELECT * FROM set_items WHERE id = ?').get(id))
})

router.patch('/:id/sets/:setId/items/reorder', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const set = db.prepare('SELECT * FROM sets WHERE id = ? AND list_id = ?').get(req.params.setId, list.id)
  if (!set) return res.status(404).json({ error: 'Set not found' })
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' })
  const update = db.prepare('UPDATE set_items SET ord = ? WHERE id = ? AND set_id = ?')
  const updateAll = db.transaction(() => ids.forEach((id, idx) => update.run(idx, id, set.id)))
  updateAll()
  res.json({ ok: true })
})

router.patch('/:id/sets/:setId/items/:itemId', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const item = db.prepare('SELECT * FROM set_items WHERE id = ? AND set_id = ?').get(req.params.itemId, req.params.setId)
  if (!item) return res.status(404).json({ error: 'Item not found' })
  const { category } = req.body
  db.prepare('UPDATE set_items SET category = ? WHERE id = ?').run(category ?? null, item.id)
  res.json(db.prepare('SELECT * FROM set_items WHERE id = ?').get(item.id))
})

router.patch('/:id/sets/:setId/categories', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { oldName, newName } = req.body
  if (!oldName || !newName?.trim()) return res.status(400).json({ error: 'oldName and newName required' })
  db.prepare('UPDATE set_items SET category = ? WHERE set_id = ? AND category = ?')
    .run(newName.trim(), req.params.setId, oldName)
  res.json({ ok: true })
})

router.delete('/:id/sets/:setId/items/:itemId', (req, res) => {
  const list = getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM set_items WHERE id = ? AND set_id = ?').run(req.params.itemId, req.params.setId)
  res.json({ ok: true })
})

export default router
