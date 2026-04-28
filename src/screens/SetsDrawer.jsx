import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { IconCheck, IconClose, IconTrash } from '../components/Icons'

export default function SetsDrawer({ listId, onClose, onAddItems }) {
  const setsMap = useStore(s => s.sets)
  const fetchSetsForList = useStore(s => s.fetchSetsForList)
  const addSet = useStore(s => s.addSet)
  const addItemToSet = useStore(s => s.addItemToSet)
  const removeItemFromSet = useStore(s => s.removeItemFromSet)

  const sets = setsMap[listId] || []
  const [activeIdx, setActiveIdx] = useState(0)
  const [added, setAdded] = useState({})
  const [newItemVal, setNewItemVal] = useState('')
  const [loadingsets, setLoadingSets] = useState(false)
  const newItemRef = useRef()

  useEffect(() => {
    setLoadingSets(true)
    fetchSetsForList(listId).finally(() => setLoadingSets(false))
  }, [listId]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentSet = sets[activeIdx]

  const handleAdd = (key, itemName) => {
    if (added[key]) return
    setAdded(prev => ({ ...prev, [key]: true }))
    onAddItems([itemName])
  }

  const handleAddItemToSet = async (e) => {
    if (e.key === 'Enter' && newItemVal.trim() && currentSet) {
      const val = newItemVal.trim()
      setNewItemVal('')
      await addItemToSet(listId, currentSet.id, val)
    }
  }

  const handleNewSet = async () => {
    const name = prompt('Set name:')
    if (name?.trim()) {
      await addSet(listId, name.trim())
      setActiveIdx(sets.length)
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-handle" />
        <div style={{ padding: '0 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Add from sets
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
          {sets.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '8px 16px', borderRadius: 999, border: 'none',
                background: activeIdx === i ? 'var(--accent)' : 'var(--surface2)',
                color: activeIdx === i ? '#fff' : 'var(--text2)',
                fontFamily: 'Figtree,sans-serif', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
                transition: 'all 0.2s var(--spring)',
                transform: activeIdx === i ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={handleNewSet}
            style={{
              padding: '8px 16px', borderRadius: 999, background: 'none',
              border: '1.5px dashed var(--border)', color: 'var(--text2)',
              fontFamily: 'Figtree,sans-serif', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            + Set
          </button>
        </div>

        <div style={{ padding: '0 20px', maxHeight: 280, overflowY: 'auto' }}>
          {loadingsets && sets.length === 0 ? (
            <p style={{ color: 'var(--text2)', fontSize: 15, padding: '20px 0' }}>Loading…</p>
          ) : !currentSet ? (
            <p style={{ color: 'var(--text2)', fontSize: 15, padding: '20px 0' }}>No sets yet. Create one above.</p>
          ) : currentSet.items.map((item) => {
            const key = `${currentSet.id}-${item.id}`
            const isAdded = added[key]
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => removeItemFromSet(listId, currentSet.id, item.id)}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', border: 'none',
                    background: 'oklch(0.95 0.05 25)', color: 'oklch(0.65 0.15 25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s var(--spring)',
                  }}
                >
                  <IconTrash />
                </button>
                <span style={{
                  flex: 1, fontSize: 16, fontWeight: 500,
                  color: isAdded ? 'var(--text2)' : 'var(--text)',
                  textDecoration: isAdded ? 'line-through' : 'none', transition: 'all 0.2s',
                }}>{item.name}</span>
                <button
                  onClick={() => handleAdd(key, item.name)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: isAdded ? 'var(--surface2)' : 'var(--accent)',
                    color: isAdded ? 'var(--text2)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 300, cursor: isAdded ? 'default' : 'pointer',
                    transition: 'all 0.2s var(--spring)',
                    transform: isAdded ? 'scale(0.9)' : 'scale(1)',
                    fontFamily: 'Figtree,sans-serif', flexShrink: 0,
                  }}
                >
                  {isAdded ? <IconCheck /> : '+'}
                </button>
              </div>
            )
          })}

          {currentSet && (
            <div style={{ marginTop: 12, paddingBottom: 8 }}>
              <div className="add-row">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
                </svg>
                <input
                  ref={newItemRef}
                  value={newItemVal}
                  onChange={e => setNewItemVal(e.target.value)}
                  onKeyDown={handleAddItemToSet}
                  placeholder="Add item to set…"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
