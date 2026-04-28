import { useState } from 'react'
import { IconBack, IconCheck, IconEdit, IconArrowRight } from '../components/Icons'

export default function RecipeDetailScreen({ recipe, picked, onPick, onBack, onAddToList, onEdit }) {
  const [tab, setTab] = useState('ingredients')
  const selCount = Object.values(picked).filter(Boolean).length

  const toggle = (i) => onPick(prev => ({ ...prev, [i]: !prev[i] }))
  const selectAll = () => {
    const all = {}
    recipe.ingredients.forEach((_, i) => { all[i] = true })
    onPick(all)
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <div style={{ background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="back-btn" onClick={onBack}>
            <IconBack />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{recipe.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 1 }}>
              {recipe.time} · serves {recipe.serves}
            </p>
          </div>
          <button className="back-btn" onClick={onEdit}>
            <IconEdit />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', marginTop: 4, padding: '0 20px' }}>
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

      <div className="scroll-area" style={{ paddingTop: 4, paddingBottom: selCount > 0 ? 120 : 40 }}>
        {tab === 'ingredients' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px 8px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {recipe.ingredients.length} ingredients
              </span>
              <span onClick={selectAll} style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>
                Select all
              </span>
            </div>
            {recipe.ingredients.map((ing, i) => (
              <div
                key={i}
                onClick={() => toggle(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 4px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  border: `2px solid ${picked[i] ? 'var(--accent)' : 'var(--border)'}`,
                  background: picked[i] ? 'var(--accent)' : 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s var(--spring)',
                }}>
                  {picked[i] && <IconCheck />}
                </div>
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{ing}</span>
              </div>
            ))}
          </>
        ) : (
          <div style={{ paddingTop: 8 }}>
            {recipe.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-lt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-dk)' }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6, fontWeight: 400 }}>{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {tab === 'ingredients' && selCount > 0 && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 }}>
          <button
            className="btn-primary"
            onClick={onAddToList}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
          >
            <span>Add {selCount} ingredient{selCount > 1 ? 's' : ''} to list</span>
            <IconArrowRight />
          </button>
        </div>
      )}
    </div>
  )
}
