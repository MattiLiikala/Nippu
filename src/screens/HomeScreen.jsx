import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import BottomNav from '../components/BottomNav'
import { IconPlus, IconChevron } from '../components/Icons'

export default function HomeScreen() {
  const navigate = useNavigate()
  const lists = useStore(s => s.lists)
  const loading = useStore(s => s.loading)
  const household = useStore(s => s.household)
  const renameHousehold = useStore(s => s.renameHousehold)
  const addList = useStore(s => s.addList)

  const [fabOpen, setFabOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(household?.name || 'My Household')
  const [newListOpen, setNewListOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)

  const commitName = () => {
    setEditing(false)
    if (nameVal.trim()) renameHousehold(nameVal.trim())
  }

  const handleNewList = async () => {
    if (!newListName.trim() || creating) return
    setCreating(true)
    try {
      const id = await addList(newListName.trim())
      setNewListName('')
      setNewListOpen(false)
      navigate(`/lists/${id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <div style={{ padding: '24px 24px 8px', flexShrink: 0 }}>
        {editing ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => e.key === 'Enter' && commitName()}
            style={{
              fontSize: 26, fontWeight: 900, color: 'var(--text)',
              letterSpacing: '-0.5px', border: 'none',
              borderBottom: '2px solid var(--accent)', outline: 'none',
              background: 'transparent', fontFamily: 'Figtree,sans-serif',
              width: '100%', padding: '2px 0',
            }}
          />
        ) : (
          <h1
            onClick={() => setEditing(true)}
            style={{
              fontSize: 26, fontWeight: 900, color: 'var(--text)',
              letterSpacing: '-0.5px', cursor: 'text',
              borderBottom: '2px solid transparent', padding: '2px 0',
            }}
          >
            {nameVal}
          </h1>
        )}
      </div>

      <div className="scroll-area" style={{ paddingTop: 8, paddingBottom: 100 }}>
        {loading && lists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)', fontSize: 15 }}>
            Loading…
          </div>
        ) : lists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)', fontSize: 15, fontWeight: 500 }}>
            No lists yet. Tap + to create one.
          </div>
        ) : (
          lists.map((list, i) => (
            <div
              key={list.id}
              className="card list-card"
              onClick={() => navigate(`/lists/${list.id}`)}
              style={{ animation: `itemIn 0.4s var(--spring) ${i * 0.07}s both` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 18, fontWeight: 800, color: 'var(--text)',
                    letterSpacing: '-0.3px', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{list.name}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, fontWeight: 500 }}>
                    {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <IconChevron />
              </div>
            </div>
          ))
        )}
      </div>

      {fabOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 14 }} onClick={() => setFabOpen(false)} />
      )}
      {fabOpen && (
        <div className="fab-menu">
          <div className="fab-menu-item" onClick={() => { setFabOpen(false); setNewListOpen(true) }}>
            <span className="fab-menu-label">New list</span>
            <div className="fab-mini">+</div>
          </div>
        </div>
      )}

      <button className={`fab${fabOpen ? ' open' : ''}`} onClick={() => setFabOpen(o => !o)} aria-label="New list">
        <IconPlus />
      </button>

      <BottomNav />

      {newListOpen && (
        <>
          <div className="overlay" onClick={() => setNewListOpen(false)} />
          <div className="drawer" style={{ paddingBottom: 24 }}>
            <div className="drawer-handle" />
            <div style={{ padding: '0 20px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>New list</h2>
              <input
                autoFocus
                className="input-field"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNewList()}
                placeholder="List name…"
                style={{ marginBottom: 12 }}
                disabled={creating}
              />
              <button className="btn-primary" onClick={handleNewList} disabled={creating} style={{ opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Creating…' : 'Create list'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
