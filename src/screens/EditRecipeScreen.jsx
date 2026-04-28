import { useState } from 'react'
import { useStore } from '../store/useStore'
import { IconBack, IconTrash } from '../components/Icons'

export default function EditRecipeScreen({ recipe, onBack, onSave }) {
  const addRecipe = useStore(s => s.addRecipe)
  const updateRecipe = useStore(s => s.updateRecipe)

  const [name, setName] = useState(recipe?.name || '')
  const [time, setTime] = useState(recipe?.time || '')
  const [serves, setServes] = useState(recipe?.serves?.toString() || '')
  const [ingredients, setIngredients] = useState(recipe?.ingredients || [])
  const [steps, setSteps] = useState(recipe?.steps?.join('\n\n') || '')
  const [tab, setTab] = useState('ingredients')
  const [newIng, setNewIng] = useState('')
  const [saving, setSaving] = useState(false)

  const addIng = (e) => {
    if (e.key === 'Enter' && newIng.trim()) {
      setIngredients(prev => [...prev, newIng.trim()])
      setNewIng('')
    }
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    const data = {
      name: name.trim() || 'Untitled recipe',
      time: time || '—',
      serves: parseInt(serves) || 1,
      tags: recipe?.tags || [],
      ingredients,
      steps: steps.split('\n\n').map(s => s.trim()).filter(Boolean),
    }
    try {
      let result
      if (recipe) {
        result = await updateRecipe(recipe.id, data)
      } else {
        const id = await addRecipe(data)
        result = { ...data, id }
      }
      onSave(result)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <div style={{ background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="back-btn" onClick={onBack}>
            <IconBack />
          </button>
          <h1 style={{ flex: 1, fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {recipe ? 'Edit recipe' : 'New recipe'}
          </h1>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ width: 'auto', padding: '8px 20px', fontSize: 14, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div style={{ padding: '0 20px' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Recipe name"
            style={{
              width: '100%', fontFamily: 'Figtree,sans-serif', fontSize: 20, fontWeight: 800,
              border: 'none', borderBottom: '2px solid var(--border)', padding: '6px 0',
              outline: 'none', background: 'transparent', color: 'var(--text)', marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
            <input
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="Time (e.g. 30 min)"
              style={{
                flex: 1, fontFamily: 'Figtree,sans-serif', fontSize: 14, color: 'var(--text)',
                border: 'none', borderBottom: '1px solid var(--border)', padding: '5px 0',
                outline: 'none', background: 'transparent',
              }}
            />
            <input
              value={serves}
              onChange={e => setServes(e.target.value)}
              placeholder="Serves"
              type="number"
              min="1"
              style={{
                width: 80, fontFamily: 'Figtree,sans-serif', fontSize: 14, color: 'var(--text)',
                border: 'none', borderBottom: '1px solid var(--border)', padding: '5px 0',
                outline: 'none', background: 'transparent',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', marginTop: 8, padding: '0 20px' }}>
          {['ingredients', 'recipe'].map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                color: tab === t ? 'var(--accent)' : 'var(--text2)',
                borderBottom: tab === t ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                marginBottom: -1.5, textTransform: 'capitalize', transition: 'color 0.2s',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div className="scroll-area" style={{ paddingTop: 8, paddingBottom: 80 }}>
        {tab === 'ingredients' ? (
          <>
            {ingredients.map((ing, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 4px', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{ing}</span>
                <button
                  onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', border: 'none',
                    background: 'oklch(0.95 0.05 25)', color: 'oklch(0.65 0.15 25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
            <div className="add-row" style={{ marginTop: 8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
              </svg>
              <input value={newIng} onChange={e => setNewIng(e.target.value)} onKeyDown={addIng} placeholder="Add ingredient…" />
            </div>
          </>
        ) : (
          <textarea
            value={steps}
            onChange={e => setSteps(e.target.value)}
            placeholder="Write your recipe steps here…&#10;&#10;Separate steps with a blank line."
            style={{
              width: '100%', minHeight: 280, fontFamily: 'Figtree,sans-serif', fontSize: 15,
              border: '1.5px dashed var(--border)', borderRadius: 16, padding: '14px 16px',
              outline: 'none', background: 'var(--surface2)', resize: 'none',
              color: 'var(--text)', lineHeight: 1.7, marginTop: 4,
            }}
          />
        )}
      </div>
    </div>
  )
}
