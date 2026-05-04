import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import {
  DndContext, DragOverlay, MeasuringStrategy,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditableSectionHeader } from '../components/DragDrop'
import { IconCheck, IconClose, IconTrash, IconGrip } from '../components/Icons'

// ── Sortable set item ────────────────────────────────────

function SortableSetItem({ item, setId, isAdded, onRemove, onAdd }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, transform, transition } = useSortable({ id: item.id })
  const key = `${setId}-${item.id}`
  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 0', borderBottom: '1px solid var(--border)',
        opacity: isDragging ? 0 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        onClick={() => onRemove(item.id)}
        style={{
          width: 30, height: 30, borderRadius: '50%', border: 'none',
          background: 'oklch(0.95 0.05 25)', color: 'oklch(0.65 0.15 25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <IconTrash />
      </button>
      <span style={{
        flex: 1, fontSize: 15, fontWeight: 500,
        color: isAdded ? 'var(--text2)' : 'var(--text)',
        textDecoration: isAdded ? 'line-through' : 'none',
        transition: 'all 0.2s',
      }}>
        {item.name}
      </span>
      <button
        onClick={() => onAdd(key, item)}
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
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{ padding: '4px 0 4px 8px', color: 'var(--border)', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
      >
        <IconGrip />
      </div>
    </div>
  )
}

function SetItemOverlay({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{item.name}</span>
      <div style={{ padding: '4px 0 4px 8px', color: 'var(--border)' }}><IconGrip /></div>
    </div>
  )
}

// ── Sortable section header (sets) ───────────────────────

function SortableSetSectionHeader({ id, name, onRename }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <EditableSectionHeader
        name={name}
        onRename={onRename}
        style={{ margin: '10px 0 4px' }}
        sectionDrag={{ ref: setActivatorNodeRef, listeners, attributes }}
      />
    </div>
  )
}

// "Other" header — sortable drop target but not draggable (no handle)
function OtherSetSectionHeader() {
  const { setNodeRef, transform, transition } = useSortable({ id: 'sec:' })
  return (
    <div ref={setNodeRef}
      className="section-header"
      style={{ margin: '10px 0 4px', transform: CSS.Transform.toString(transform), transition }}>
      Other
    </div>
  )
}

// ── Main drawer ─────────────────────────────────────────

export default function SetsDrawer({ listId, onClose, onAddItems }) {
  const setsMap = useStore(s => s.sets)
  const fetchSetsForList = useStore(s => s.fetchSetsForList)
  const addSet = useStore(s => s.addSet)
  const addItemToSet = useStore(s => s.addItemToSet)
  const removeItemFromSet = useStore(s => s.removeItemFromSet)
  const updateSetItemCategory = useStore(s => s.updateSetItemCategory)
  const renameSetCategory = useStore(s => s.renameSetCategory)
  const reorderSetItems = useStore(s => s.reorderSetItems)

  const sets = setsMap[listId] || []
  const [activeIdx, setActiveIdx] = useState(0)
  const [added, setAdded] = useState({})
  const [newItemVal, setNewItemVal] = useState('')
  const [loadingsets, setLoadingSets] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [emptySections, setEmptySections] = useState([])
  const [sectionOrder, setSectionOrder] = useState([])
  const newItemRef = useRef()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  useEffect(() => {
    setLoadingSets(true)
    fetchSetsForList(listId).finally(() => setLoadingSets(false))
  }, [listId]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentSet = sets[activeIdx]

  // Group current set's items by category
  const grouped = {}
  const uncategorized = []
  if (currentSet) {
    for (const item of currentSet.items) {
      if (item.category) {
        (grouped[item.category] ??= []).push(item)
      } else {
        uncategorized.push(item)
      }
    }
  }
  const sortGroup = arr => arr.sort((a, b) => ((a.ord ?? 0) - (b.ord ?? 0)) || ((a.created_at ?? 0) - (b.created_at ?? 0)))
  for (const cat of Object.keys(grouped)) sortGroup(grouped[cat])
  sortGroup(uncategorized)

  const presentCats = Object.keys(grouped)
  const sortedCats = [
    ...sectionOrder.filter(cat => presentCats.includes(cat)),
    ...presentCats.filter(cat => !sectionOrder.includes(cat)).sort(),
  ]
  const allNamedSections = [...sortedCats, ...emptySections.filter(s => !sortedCats.includes(s))]

  // Flat list: section headers and items interleaved in display order.
  // 'sec:' sentinel inserted before uncategorized items as a droppable target.
  const flatList = currentSet ? [
    ...allNamedSections.flatMap(cat => [
      { id: `sec:${cat}`, type: 'section', name: cat },
      ...(grouped[cat] || []),
    ]),
    ...(allNamedSections.length > 0
      ? [{ id: 'sec:', type: 'section', name: null }, ...uncategorized]
      : uncategorized),
  ] : []

  const activeItem = activeId && !activeId.toString().startsWith('sec:')
    ? currentSet?.items.find(i => i.id === activeId)
    : null

  // ── Handlers ──────────────────────────────────────────

  const handleSetChange = (i) => {
    setActiveIdx(i)
    setEmptySections([])
    setSectionOrder([])
    setActiveId(null)
  }

  const handleAdd = (key, item) => {
    if (added[key]) return
    setAdded(prev => ({ ...prev, [key]: true }))
    onAddItems([{ name: item.name, category: item.category ?? null }])
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

  const handleAddSection = () => {
    const name = window.prompt('Section name:')
    if (!name?.trim()) return
    const trimmed = name.trim()
    if (allNamedSections.includes(trimmed)) return
    setEmptySections(prev => [...prev, trimmed])
  }

  const handleRenameSection = (oldName, newName) => {
    if (emptySections.includes(oldName)) {
      setEmptySections(prev => prev.map(s => s === oldName ? newName : s))
    } else {
      renameSetCategory(listId, currentSet.id, oldName, newName)
      setSectionOrder(prev => prev.map(s => s === oldName ? newName : s))
    }
  }

  const handleDragStart = ({ active }) => setActiveId(active.id)
  const handleDragCancel = () => setActiveId(null)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id || !currentSet) return

    const oldIdx = flatList.findIndex(e => e.id === active.id)
    const newIdx = flatList.findIndex(e => e.id === over.id)
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

    const movedEntry = flatList[oldIdx]

    // The 'sec:' sentinel is not draggable
    if (movedEntry.id === 'sec:') return

    // Prevent items from landing before the first named section header
    if (movedEntry.type !== 'section' && allNamedSections.length > 0) {
      const firstSectionIdx = flatList.findIndex(e => e.type === 'section')
      if (newIdx <= firstSectionIdx) return
    }

    const newFlat = arrayMove(flatList, oldIdx, newIdx)

    // Update section display order
    setSectionOrder(newFlat.filter(e => e.type === 'section').map(e => e.name))

    // Only update the moved item's category — other items keep theirs unchanged
    if (movedEntry.type !== 'section') {
      let newCat = null
      for (let i = newIdx - 1; i >= 0; i--) {
        if (newFlat[i].type === 'section') { newCat = newFlat[i].name; break }
      }
      if (newCat !== (movedEntry.category ?? null)) {
        updateSetItemCategory(listId, currentSet.id, movedEntry.id, newCat)
      }
    }

    reorderSetItems(listId, currentSet.id, newFlat.filter(e => e.type !== 'section').map(e => e.id))
  }

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <div className="overlay" onClick={onClose} />
      {/* DndContext is outside div.drawer (position:fixed) so coordinate math uses the viewport frame */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        autoScroll={{ layoutShiftCompensation: false }}
      >
        <div className="drawer">
          <div className="drawer-handle" />
          <div style={{ padding: '0 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              Saved items
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

          {/* Set tabs */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
            {sets.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleSetChange(i)}
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

          {/* Items area */}
          <div style={{ padding: '0 20px', maxHeight: 320, overflowY: 'auto' }}>
            {loadingsets && sets.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: 15, padding: '20px 0' }}>Loading…</p>
            ) : !currentSet ? (
              <p style={{ color: 'var(--text2)', fontSize: 15, padding: '20px 0' }}>No sets yet. Create one above.</p>
            ) : (
              <SortableContext items={flatList.map(e => e.id)} strategy={verticalListSortingStrategy}>
                {flatList.map(entry => {
                  if (entry.id === 'sec:') return <OtherSetSectionHeader key="sec:" />
                  if (entry.type === 'section') return (
                    <SortableSetSectionHeader
                      key={entry.id}
                      id={entry.id}
                      name={entry.name}
                      onRename={newName => handleRenameSection(entry.name, newName)}
                    />
                  )
                  return (
                    <SortableSetItem
                      key={entry.id}
                      item={entry}
                      setId={currentSet.id}
                      isAdded={!!added[`${currentSet.id}-${entry.id}`]}
                      onRemove={itemId => removeItemFromSet(listId, currentSet.id, itemId)}
                      onAdd={handleAdd}
                    />
                  )
                })}
              </SortableContext>
            )}

            {currentSet && (
              <div style={{ marginTop: 12, paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={handleAddSection}
                    style={{
                      background: 'transparent', color: 'var(--text2)',
                      border: '1.5px dashed var(--border)', borderRadius: 999,
                      padding: '6px 14px', fontFamily: 'Figtree,sans-serif',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    + Section
                  </button>
                </div>
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
        <DragOverlay dropAnimation={null}>
          {activeItem && <SetItemOverlay item={activeItem} />}
        </DragOverlay>
      </DndContext>
    </>
  )
}
