import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { IconGrip } from './Icons'

export function EditableSectionHeader({ name, onRename, style, sectionDrag }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== name) onRename(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{
          display: 'block', width: '100%',
          fontSize: 13, fontWeight: 700, color: 'var(--accent)',
          letterSpacing: '0.08em',
          margin: '20px 0 10px',
          padding: '0 0 3px',
          background: 'transparent',
          border: 'none', outline: 'none',
          borderBottom: '1.5px solid var(--accent)',
          fontFamily: 'Figtree,sans-serif',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      className="section-header"
      style={{ display: 'flex', alignItems: 'center', cursor: 'default', ...style }}
    >
      {sectionDrag && (
        <span
          ref={sectionDrag.ref}
          {...sectionDrag.listeners}
          {...sectionDrag.attributes}
          onClick={e => e.stopPropagation()}
          style={{
            cursor: 'grab', marginRight: 6, color: 'var(--border)',
            touchAction: 'none', display: 'flex', flexShrink: 0,
          }}
        >
          <IconGrip />
        </span>
      )}
      <span
        onClick={() => { setDraft(name); setEditing(true) }}
        style={{ cursor: 'text', flex: 1 }}
      >
        {name}
      </span>
    </div>
  )
}

export function DroppableSection({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 'var(--radius-md)',
        background: isOver ? 'var(--accent-lt)' : 'transparent',
        outline: isOver ? '2px solid var(--accent)' : '2px solid transparent',
        outlineOffset: 2,
        transition: 'background 0.15s, outline-color 0.15s',
        marginBottom: 2,
      }}
    >
      {children}
    </div>
  )
}
