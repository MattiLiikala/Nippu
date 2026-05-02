import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function CategoryPicker({ value, onChange, categories = [] }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const btnRef = useRef()
  const [rect, setRect] = useState(null)

  const handleToggle = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(v => !v)
    setDraft('')
  }

  const handleSelect = (cat) => {
    onChange(cat)
    setOpen(false)
    setDraft('')
  }

  const lower = draft.trim().toLowerCase()
  const filtered = draft ? categories.filter(c => c.toLowerCase().includes(lower)) : categories
  const canCreate = lower && !categories.some(c => c.toLowerCase() === lower)

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          padding: '4px 10px', borderRadius: 999,
          border: value ? 'none' : '1.5px solid var(--border)',
          background: value ? 'var(--accent-lt)' : 'transparent',
          color: value ? 'var(--accent-dk)' : 'var(--text2)',
          fontFamily: 'Figtree,sans-serif', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'all 0.2s var(--ease)',
        }}
      >
        {value || '+ category'}
      </button>

      {open && rect && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: window.innerHeight - rect.top + 6,
            right: window.innerWidth - rect.right,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: 8,
            minWidth: 190,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (canCreate) handleSelect(draft.trim())
                  else if (filtered[0]) handleSelect(filtered[0])
                }
                if (e.key === 'Escape') setOpen(false)
              }}
              placeholder="New category…"
              style={{
                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '7px 10px', fontFamily: 'Figtree,sans-serif', fontSize: 13,
                color: 'var(--text)', background: 'var(--bg)', outline: 'none',
                width: '100%', marginBottom: 4,
              }}
            />
            {canCreate && (
              <button onClick={() => handleSelect(draft.trim())} style={opt(false)}>
                Create "{draft.trim()}"
              </button>
            )}
            {filtered.map(c => (
              <button key={c} onClick={() => handleSelect(c)} style={opt(c === value)}>
                {c}
              </button>
            ))}
            {value && !draft && (
              <button
                onClick={() => handleSelect(null)}
                style={{ ...opt(false), color: 'var(--text2)', marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 8 }}
              >
                Remove category
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function opt(active) {
  return {
    padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: active ? 'var(--accent-lt)' : 'transparent',
    color: active ? 'var(--accent-dk)' : 'var(--text)',
    fontFamily: 'Figtree,sans-serif', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textAlign: 'left', width: '100%',
  }
}
