import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { sign } from '../auth.js'
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

router.post('/change-password', async (req, res) => {
  const { name, oldPassword, newPassword } = req.body
  if (!name?.trim() || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })

  const row = await db.get('SELECT id, password_hash FROM households WHERE name = ?', [name.trim()])
  if (!row) return res.status(404).json({ error: 'Household not found' })

  const ok = await bcrypt.compare(oldPassword, row.password_hash)
  if (!ok) return res.status(401).json({ error: 'Wrong password' })

  const hash = await bcrypt.hash(newPassword, 10)
  await db.run('UPDATE households SET password_hash = ? WHERE id = ?', [hash, row.id])
  res.json({ ok: true })
})

export default router
