import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import BottomNav from '../components/BottomNav'
import SetsDrawer from './SetsDrawer'
import { IconBack, IconCheck, IconMore, IconSets } from '../components/Icons'

export default function ListScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lists = useStore(s => s.lists)
  const removeItem = useStore(s => s.removeItem)
  const restoreItem = useStore(s => s.restoreItem)
  const addItem = useStore(s => s.addItem)
  const addItemsFromSet = useStore(s => s.addItemsFromSet)

  const list = lists.find(l => l.id === id)
  const [removing, setRemoving] = useState(null)
  const [lastRemoved, setLastRemoved] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const inputRef = useRef()

  if (!list) return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text2)' }}>List not found.</p>
    </div>
  )

  const handleCheck = async (item) => {
    if (removing === item.id) return
    setRemoving(item.id)
    setTimeout(async () => {
      await removeItem(list.id, item.id)
      setLastRemoved(item)
      setRemoving(null)
    }, 220)
  }

  const handleUndo = () => {
    if (lastRemoved) {
      restoreItem(list.id, lastRemoved)
      setLastRemoved(null)
    }
  }

  const handleAddItem = async (e) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      const val = inputVal.trim()
      setInputVal('')
      await addItem(list.id, val)
    }
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <div style={{
        padding: '16px 24px 12px', display: 'flex', alignItems: 'center',
        gap: 12, background: 'var(--bg)', flexShrink: 0,
      }}>
        <button className="back-btn" onClick={() => navigate('/lists')}>
          <IconBack />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', marginTop: 1 }}>
            {list.name}
          </h1>
        </div>
        <div style={{ cursor: 'pointer', padding: 4 }}><IconMore /></div>
      </div>

      <div className="scroll-area" style={{ paddingTop: 4, paddingBottom: 120 }}>
        {list.items.map((item, i) => (
          <div
            key={item.id}
            className={`item-row${removing === item.id ? ' removing' : ''}`}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <div
              className={`check-circle${removing === item.id ? ' done' : ''}`}
              onClick={() => handleCheck(item)}
            >
              {removing === item.id && <IconCheck />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{item.name}</span>
            </div>
          </div>
        ))}

        {list.items.length === 0 && !lastRemoved && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)', fontSize: 15, fontWeight: 500 }}>
            All done! Add items below.
          </div>
        )}

        <div className="add-row" onClick={() => inputRef.current?.focus()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
            <line x1="9" y1="4" x2="9" y2="14" /><line x1="4" y1="9" x2="14" y2="9" />
          </svg>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleAddItem}
            placeholder="Add item…"
          />
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
            background: 'var(--accent-lt)', color: 'var(--accent-dk)',
            border: 'none', borderRadius: 999, padding: '10px 18px',
            fontFamily: 'Figtree,sans-serif', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'transform 0.15s var(--spring)',
          }}
        >
          <IconSets />
          Add from sets
        </button>

        {lastRemoved && (
          <div className="undo-toast">
            <span style={{ fontSize: 14, fontWeight: 500 }}>Removed: {lastRemoved.name}</span>
            <button className="undo-btn" onClick={handleUndo}>Undo</button>
          </div>
        )}
      </div>

      <BottomNav />

      {drawerOpen && (
        <SetsDrawer
          listId={list.id}
          onClose={() => setDrawerOpen(false)}
          onAddItems={names => addItemsFromSet(list.id, names)}
        />
      )}
    </div>
  )
}
