import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import uid from '../uid.js'

const router = Router()
router.use(requireAuth)

async function serializeRecipe(recipe) {
  const [tagRows, ingRows, stepRows] = await Promise.all([
    db.all('SELECT tag FROM recipe_tags WHERE recipe_id = ?', [recipe.id]),
    db.all('SELECT ingredient FROM recipe_ingredients WHERE recipe_id = ? ORDER BY ord', [recipe.id]),
    db.all('SELECT step FROM recipe_steps WHERE recipe_id = ? ORDER BY ord', [recipe.id]),
  ])
  return {
    ...recipe,
    tags: tagRows.map(r => r.tag),
    ingredients: ingRows.map(r => r.ingredient),
    steps: stepRows.map(r => r.step),
  }
}

async function upsertRelated(recipeId, tags, ingredients, steps) {
  await db.batch([
    { sql: 'DELETE FROM recipe_tags WHERE recipe_id = ?',        args: [recipeId] },
    { sql: 'DELETE FROM recipe_ingredients WHERE recipe_id = ?', args: [recipeId] },
    { sql: 'DELETE FROM recipe_steps WHERE recipe_id = ?',       args: [recipeId] },
    ...(tags || []).map(tag => ({
      sql: 'INSERT INTO recipe_tags (id, recipe_id, tag) VALUES (?, ?, ?)',
      args: [uid(), recipeId, tag],
    })),
    ...(ingredients || []).map((ing, i) => ({
      sql: 'INSERT INTO recipe_ingredients (id, recipe_id, ingredient, ord) VALUES (?, ?, ?, ?)',
      args: [uid(), recipeId, ing, i],
    })),
    ...(steps || []).map((step, i) => ({
      sql: 'INSERT INTO recipe_steps (id, recipe_id, step, ord) VALUES (?, ?, ?, ?)',
      args: [uid(), recipeId, step, i],
    })),
  ])
}

router.get('/', async (req, res) => {
  const recipes = await db.all('SELECT * FROM recipes WHERE household_id = ? ORDER BY created_at', [req.household.householdId])
  res.json(await Promise.all(recipes.map(serializeRecipe)))
})

router.post('/', async (req, res) => {
  const { name, time = '', serves = 1, tags = [], ingredients = [], steps = [] } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = uid()
  await db.run(
    'INSERT INTO recipes (id, household_id, name, time, serves) VALUES (?, ?, ?, ?, ?)',
    [id, req.household.householdId, name.trim(), time, serves],
  )
  await upsertRelated(id, tags, ingredients, steps)
  res.json(await serializeRecipe(await db.get('SELECT * FROM recipes WHERE id = ?', [id])))
})

router.put('/:id', async (req, res) => {
  const recipe = await db.get('SELECT * FROM recipes WHERE id = ? AND household_id = ?', [req.params.id, req.household.householdId])
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  const { name, time, serves, tags, ingredients, steps } = req.body
  await db.run(
    'UPDATE recipes SET name = COALESCE(?, name), time = COALESCE(?, time), serves = COALESCE(?, serves) WHERE id = ?',
    [name ?? null, time ?? null, serves ?? null, recipe.id],
  )
  await upsertRelated(recipe.id, tags, ingredients, steps)
  res.json(await serializeRecipe(await db.get('SELECT * FROM recipes WHERE id = ?', [recipe.id])))
})

router.delete('/:id', async (req, res) => {
  const recipe = await db.get('SELECT * FROM recipes WHERE id = ? AND household_id = ?', [req.params.id, req.household.householdId])
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM recipes WHERE id = ?', [recipe.id])
  res.json({ ok: true })
})

export default router
