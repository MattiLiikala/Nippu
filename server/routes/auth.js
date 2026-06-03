import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { sign, requireAuth } from '../auth.js'
import uid from '../uid.js'

const router = Router()

router.post('/create', async (req, res) => {
  const { name, password } = req.body
  if (!name?.trim() || !password) return res.status(400).json({ error: 'Name and password required' })

  const exists = await db.get('SELECT id FROM households WHERE name = ?', [name.trim()])
  if (exists) return res.status(409).json({ error: 'Household name already taken' })

  const hash = await bcrypt.hash(password, 10)
  const id = uid()
  await db.run('INSERT INTO households (id, name, password_hash) VALUES (?, ?, ?)', [id, name.trim(), hash])

  res.json({ token: sign({ householdId: id, householdName: name.trim() }), name: name.trim() })
})

router.post('/join', async (req, res) => {
  const { name, password } = req.body
  if (!name?.trim() || !password) return res.status(400).json({ error: 'Name and password required' })

  const row = await db.get('SELECT id, name, password_hash FROM households WHERE name = ?', [name.trim()])
  if (!row) return res.status(404).json({ error: 'Household not found' })

  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) return res.status(401).json({ error: 'Wrong password' })

  res.json({ token: sign({ householdId: row.id, householdName: row.name }), name: row.name })
})

router.patch('/rename', requireAuth, async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const newName = name.trim()
  const existing = await db.get('SELECT id FROM households WHERE name = ?', [newName])
  if (existing && existing.id !== req.household.householdId) {
    return res.status(409).json({ error: 'Household name already taken' })
  }
  await db.run('UPDATE households SET name = ? WHERE id = ?', [newName, req.household.householdId])
  const token = sign({ householdId: req.household.householdId, householdName: newName })
  res.json({ token, name: newName })
})

router.post('/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body
  if (!newPassword) return res.status(400).json({ error: 'New password required' })

  const hash = await bcrypt.hash(newPassword, 10)
  await db.run('UPDATE households SET password_hash = ? WHERE id = ?', [hash, req.household.householdId])
  res.json({ ok: true })
})

export default router
