import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import uid from '../uid.js'

const router = Router()
router.use(requireAuth)

function serializeRecipe(recipe) {
  const tags = db.prepare('SELECT tag FROM recipe_tags WHERE recipe_id = ?').all(recipe.id).map(r => r.tag)
  const ingredients = db.prepare('SELECT ingredient FROM recipe_ingredients WHERE recipe_id = ? ORDER BY ord').all(recipe.id).map(r => r.ingredient)
  const steps = db.prepare('SELECT step FROM recipe_steps WHERE recipe_id = ? ORDER BY ord').all(recipe.id).map(r => r.step)
  return { ...recipe, tags, ingredients, steps }
}

function upsertRelated(recipeId, tags, ingredients, steps) {
  db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').run(recipeId)
  db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(recipeId)
  db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(recipeId)
  const insertTag = db.prepare('INSERT INTO recipe_tags (id, recipe_id, tag) VALUES (?, ?, ?)')
  const insertIng = db.prepare('INSERT INTO recipe_ingredients (id, recipe_id, ingredient, ord) VALUES (?, ?, ?, ?)')
  const insertStep = db.prepare('INSERT INTO recipe_steps (id, recipe_id, step, ord) VALUES (?, ?, ?, ?)')
  tags?.forEach(tag => insertTag.run(uid(), recipeId, tag))
  ingredients?.forEach((ing, i) => insertIng.run(uid(), recipeId, ing, i))
  steps?.forEach((step, i) => insertStep.run(uid(), recipeId, step, i))
}

router.get('/', (req, res) => {
  const recipes = db.prepare('SELECT * FROM recipes WHERE household_id = ? ORDER BY created_at').all(req.household.householdId)
  res.json(recipes.map(serializeRecipe))
})

router.post('/', (req, res) => {
  const { name, time = '', serves = 1, tags = [], ingredients = [], steps = [] } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  db.prepare('INSERT INTO recipes (id, household_id, name, time, serves) VALUES (?, ?, ?, ?, ?)').run(id, req.household.householdId, name.trim(), time, serves)
  upsertRelated(id, tags, ingredients, steps)
  res.json(serializeRecipe(db.prepare('SELECT * FROM recipes WHERE id = ?').get(id)))
})

router.put('/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').get(req.params.id, req.household.householdId)
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  const { name, time, serves, tags, ingredients, steps } = req.body
  db.prepare('UPDATE recipes SET name = COALESCE(?, name), time = COALESCE(?, time), serves = COALESCE(?, serves) WHERE id = ?').run(name ?? null, time ?? null, serves ?? null, recipe.id)
  upsertRelated(recipe.id, tags, ingredients, steps)
  res.json(serializeRecipe(db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipe.id)))
})

router.delete('/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND household_id = ?').get(req.params.id, req.household.householdId)
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  db.prepare('DELETE FROM recipes WHERE id = ?').run(recipe.id)
  res.json({ ok: true })
})

export default router
