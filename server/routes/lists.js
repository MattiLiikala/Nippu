import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import uid from '../uid.js'

const router = Router()
router.use(requireAuth)

async function getList(listId, householdId) {
  return db.get('SELECT * FROM lists WHERE id = ? AND household_id = ?', [listId, householdId])
}

async function nextOrd(table, idCol, idVal) {
  const row = await db.get(`SELECT COALESCE(MAX(ord), -1) + 1 AS next FROM ${table} WHERE ${idCol} = ?`, [idVal])
  return Number(row.next)
}

async function serializeList(list) {
  const items = await db.all('SELECT * FROM list_items WHERE list_id = ? ORDER BY ord, created_at', [list.id])
  return { ...list, items }
}

// ── Lists ────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const lists = await db.all('SELECT * FROM lists WHERE household_id = ? ORDER BY created_at', [req.household.householdId])
  res.json(await Promise.all(lists.map(serializeList)))
})

router.post('/', async (req, res) => {
  const { name, emoji = '📋' } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  await db.run('INSERT INTO lists (id, household_id, name, emoji) VALUES (?, ?, ?, ?)', [id, req.household.householdId, name.trim(), emoji])
  res.json(await serializeList(await db.get('SELECT * FROM lists WHERE id = ?', [id])))
})

router.patch('/:id', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { name, emoji, section_order } = req.body
  await db.run(
    'UPDATE lists SET name = COALESCE(?, name), emoji = COALESCE(?, emoji), section_order = COALESCE(?, section_order) WHERE id = ?',
    [name ?? null, emoji ?? null, section_order ?? null, list.id],
  )
  res.json(await serializeList(await db.get('SELECT * FROM lists WHERE id = ?', [list.id])))
})

router.delete('/:id', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM lists WHERE id = ?', [list.id])
  res.json({ ok: true })
})

// ── List items ───────────────────────────────────────────

router.post('/:id/items', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { name, setId, category } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  const ord = await nextOrd('list_items', 'list_id', list.id)
  await db.run(
    'INSERT INTO list_items (id, list_id, name, set_id, category, ord) VALUES (?, ?, ?, ?, ?, ?)',
    [id, list.id, name.trim(), setId ?? null, category ?? null, ord],
  )
  res.json(await db.get('SELECT * FROM list_items WHERE id = ?', [id]))
})

router.post('/:id/items/bulk', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be array' })
  const valid = items.filter(i => i?.name?.trim())
  if (!valid.length) return res.json([])
  let baseOrd = await nextOrd('list_items', 'list_id', list.id)
  const ids = valid.map(() => uid())
  await db.batch(valid.map(({ name, category }, i) => ({
    sql: 'INSERT INTO list_items (id, list_id, name, set_id, category, ord) VALUES (?, ?, ?, NULL, ?, ?)',
    args: [ids[i], list.id, name.trim(), category ?? null, baseOrd + i],
  })))
  const placeholders = ids.map(() => '?').join(',')
  res.json(await db.all(`SELECT * FROM list_items WHERE id IN (${placeholders}) ORDER BY ord`, ids))
})

router.patch('/:id/items/reorder', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' })
  await db.batch(ids.map((id, idx) => ({
    sql: 'UPDATE list_items SET ord = ? WHERE id = ? AND list_id = ?',
    args: [idx, id, list.id],
  })))
  res.json({ ok: true })
})

router.patch('/:id/sections/reorder', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { order } = req.body
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' })
  await db.run('UPDATE lists SET section_order = ? WHERE id = ?', [JSON.stringify(order), list.id])
  res.json({ ok: true })
})

router.patch('/:id/items/:itemId', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const item = await db.get('SELECT * FROM list_items WHERE id = ? AND list_id = ?', [req.params.itemId, list.id])
  if (!item) return res.status(404).json({ error: 'Item not found' })
  const { category } = req.body
  await db.run('UPDATE list_items SET category = ? WHERE id = ?', [category ?? null, item.id])
  res.json(await db.get('SELECT * FROM list_items WHERE id = ?', [item.id]))
})

router.delete('/:id/items/:itemId', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM list_items WHERE id = ? AND list_id = ?', [req.params.itemId, list.id])
  res.json({ ok: true })
})

router.patch('/:id/categories', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { oldName, newName } = req.body
  if (!oldName || !newName?.trim()) return res.status(400).json({ error: 'oldName and newName required' })
  await db.run('UPDATE list_items SET category = ? WHERE list_id = ? AND category = ?', [newName.trim(), list.id, oldName])
  res.json({ ok: true })
})

// ── Sets ─────────────────────────────────────────────────

router.get('/:id/sets', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const sets = await db.all('SELECT * FROM sets WHERE list_id = ? ORDER BY created_at', [list.id])
  res.json(await Promise.all(sets.map(async s => ({
    ...s,
    items: await db.all('SELECT * FROM set_items WHERE set_id = ? ORDER BY ord, created_at', [s.id]),
  }))))
})

router.post('/:id/sets', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  await db.run('INSERT INTO sets (id, list_id, name) VALUES (?, ?, ?)', [id, list.id, name.trim()])
  res.json({ ...(await db.get('SELECT * FROM sets WHERE id = ?', [id])), items: [] })
})

router.post('/:id/sets/:setId/items', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const set = await db.get('SELECT * FROM sets WHERE id = ? AND list_id = ?', [req.params.setId, list.id])
  if (!set) return res.status(404).json({ error: 'Set not found' })
  const { name, category } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  const ord = await nextOrd('set_items', 'set_id', set.id)
  await db.run(
    'INSERT INTO set_items (id, set_id, name, category, ord) VALUES (?, ?, ?, ?, ?)',
    [id, set.id, name.trim(), category ?? null, ord],
  )
  res.json(await db.get('SELECT * FROM set_items WHERE id = ?', [id]))
})

router.patch('/:id/sets/:setId/items/reorder', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const set = await db.get('SELECT * FROM sets WHERE id = ? AND list_id = ?', [req.params.setId, list.id])
  if (!set) return res.status(404).json({ error: 'Set not found' })
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' })
  await db.batch(ids.map((id, idx) => ({
    sql: 'UPDATE set_items SET ord = ? WHERE id = ? AND set_id = ?',
    args: [idx, id, set.id],
  })))
  res.json({ ok: true })
})

router.patch('/:id/sets/:setId/items/:itemId', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const item = await db.get('SELECT * FROM set_items WHERE id = ? AND set_id = ?', [req.params.itemId, req.params.setId])
  if (!item) return res.status(404).json({ error: 'Item not found' })
  const { category } = req.body
  await db.run('UPDATE set_items SET category = ? WHERE id = ?', [category ?? null, item.id])
  res.json(await db.get('SELECT * FROM set_items WHERE id = ?', [item.id]))
})

router.patch('/:id/sets/:setId/categories', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const { oldName, newName } = req.body
  if (!oldName || !newName?.trim()) return res.status(400).json({ error: 'oldName and newName required' })
  await db.run(
    'UPDATE set_items SET category = ? WHERE set_id = ? AND category = ?',
    [newName.trim(), req.params.setId, oldName],
  )
  res.json({ ok: true })
})

router.delete('/:id/sets/:setId/items/:itemId', async (req, res) => {
  const list = await getList(req.params.id, req.household.householdId)
  if (!list) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM set_items WHERE id = ? AND set_id = ?', [req.params.itemId, req.params.setId])
  res.json({ ok: true })
})

export default router
