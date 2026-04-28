import { useState } from 'react'
import { useStore } from '../store/useStore'
import BottomNav from '../components/BottomNav'
import RecipeDetailScreen from './RecipeDetailScreen'
import AddToListScreen from './AddToListScreen'
import EditRecipeScreen from './EditRecipeScreen'
import { IconPlus, IconSearch } from '../components/Icons'

export default function RecipesScreen() {
  const recipes = useStore(s => s.recipes)
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [picked, setPicked] = useState({})
  const [fabOpen, setFabOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = query
    ? recipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.tags.some(t => t.includes(query.toLowerCase())))
    : recipes

  if (view === 'detail' && selected) {
    return (
      <RecipeDetailScreen
        recipe={selected}
        picked={picked}
        onPick={setPicked}
        onBack={() => setView('list')}
        onAddToList={() => setView('addToList')}
        onEdit={() => setView('edit')}
      />
    )
  }
  if (view === 'addToList' && selected) {
    return (
      <AddToListScreen
        recipe={selected}
        picked={picked}
        onBack={() => setView('detail')}
        onDone={() => setView('list')}
      />
    )
  }
  if (view === 'edit') {
    return (
      <EditRecipeScreen
        recipe={selected}
        onBack={() => setView(selected ? 'detail' : 'list')}
        onSave={(updated) => { setSelected(updated); setView(selected ? 'detail' : 'list') }}
      />
    )
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <div style={{ padding: '24px 24px 8px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>Recipes</h1>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', borderRadius: 20,
          padding: '10px 16px', border: '1.5px solid var(--border)',
        }}>
          <IconSearch />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search recipes…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontFamily: 'Figtree,sans-serif',
              fontSize: 15, color: 'var(--text)',
            }}
          />
        </div>
      </div>

      <div className="scroll-area" style={{ paddingBottom: 100 }}>
        {filtered.map((r, i) => (
          <div
            key={r.id}
            className="card list-card"
            onClick={() => { setSelected(r); setPicked({}); setView('detail') }}
            style={{ animation: `itemIn 0.4s var(--spring) ${i * 0.07}s both` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                  {r.name}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3, fontWeight: 500 }}>
                  {r.time} · serves {r.serves}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {r.tags.map((tag, j) => (
                    <span key={j} className="chip" style={{ fontSize: 11, padding: '3px 10px' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M7 4l6 6-6 6" />
              </svg>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)', fontSize: 15, fontWeight: 500 }}>
            {query ? 'No matching recipes.' : 'No recipes yet. Tap + to create one.'}
          </div>
        )}
      </div>

      {/* FAB */}
      {fabOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 14 }} onClick={() => setFabOpen(false)} />
      )}
      {fabOpen && (
        <div className="fab-menu">
          <div className="fab-menu-item" onClick={() => { setFabOpen(false); setSelected(null); setView('edit') }}>
            <span className="fab-menu-label">New recipe</span>
            <div className="fab-mini">+</div>
          </div>
          <div className="fab-menu-item" onClick={() => setFabOpen(false)}>
            <span className="fab-menu-label">Import from URL</span>
            <div className="fab-mini">↓</div>
          </div>
        </div>
      )}
      <button
        className={`fab${fabOpen ? ' open' : ''}`}
        onClick={() => setFabOpen(o => !o)}
        aria-label="New recipe"
      >
        <IconPlus />
      </button>

      <BottomNav />
    </div>
  )
}
