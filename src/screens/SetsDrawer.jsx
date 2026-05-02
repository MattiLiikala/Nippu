import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
  closestCenter, useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditableSectionHeader } from '../components/DragDrop'
import { IconCheck, IconClose, IconTrash, IconGrip } from '../components/Icons'

// ── Custom collision: filter droppables by drag type ────
function customCollision(args) {
  const { active, droppableContainers } = args
  const isSection = active.data.current?.type === 'section'
  return closestCenter({
    ...args,
    droppableContainers: droppableContainers.filter(c => {
      const id = c.id.toString()
      return isSection ? id.startsWith('sec:') : !id.startsWith('sec:')
    }),
  })
}

// ── Sortable set item ────────────────────────────────────

function SortableSetItem({ item, setId, isAdded, onRemove, onAdd }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, transform, transition } = useSortable({
    id: item.id,
    data: { type: 'item', category: item.category ?? null },
  })
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
        style={{
          padding: '4px 0 4px 8px', color: 'var(--border)',
          cursor: 'grab', touchAction: 'none', flexShrink: 0,
        }}
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

// ── Sortable section container (sets) ────────────────────

function SortableSetSectionContainer({ cat, items: sectionItems, activeId, onRename, children }) {
  const { attributes, listeners, setNodeRef: sortableRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: `sec:${cat}`,
    data: { type: 'section', cat },
  })
  const { setNodeRef: droppableRef, isOver } = useDroppable({ id: `cat:${cat}` })
  const setRef = useCallback((el) => { sortableRef(el); droppableRef(el) }, [sortableRef, droppableRef])

  return (
    <div
      ref={setRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'background 0.15s, outline-color 0.15s',
        opacity: isDragging ? 0.4 : 1,
        borderRadius: 'var(--radius-md)',
        background: isOver ? 'var(--accent-lt)' : 'transparent',
        outline: isOver ? '2px solid var(--accent)' : '2px solid transparent',
        outlineOffset: 2, marginBottom: 2,
      }}
    >
      <EditableSectionHeader
        name={cat}
        onRename={onRename}
        style={{ margin: '10px 0 4px' }}
        sectionDrag={{ ref: setActivatorNodeRef, listeners, attributes }}
      />
      <SortableContext items={sectionItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      {sectionItems.length === 0 && activeId && activeId.toString().startsWith('sec:') === false && (
        <div style={{
          height: 40, borderRadius: 'var(--radius-sm)',
          border: '2px dashed var(--border)', margin: '4px 0',
        }} />
      )}
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
  const hasNamedSections = allNamedSections.length > 0
  const activeItem = activeId && !activeId.toString().startsWith('sec:') ? currentSet?.items.find(i => i.id === activeId) : null

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

    const isSection = active.data.current?.type === 'section'

    if (isSection) {
      const activeCat = active.data.current.cat
      const overCat = over.id.toString().replace(/^sec:/, '')
      const oldIdx = allNamedSections.indexOf(activeCat)
      const newIdx = allNamedSections.indexOf(overCat)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setSectionOrder(arrayMove(allNamedSections, oldIdx, newIdx))
      }
      return
    }

    const item = currentSet.items.find(i => i.id === active.id)
    if (!item) return

    const overId = over.id.toString()
    const overIsCatDrop = overId.startsWith('cat:')
    let targetCat
    if (overIsCatDrop) {
      targetCat = overId.replace('cat:', '') || null
    } else {
      const overItem = currentSet.items.find(i => i.id === over.id)
      targetCat = overItem ? (overItem.category ?? null) : null
    }

    const itemCat = item.category ?? null

    if (itemCat === targetCat && !overIsCatDrop) {
      const sectionItems = targetCat ? (grouped[targetCat] || []) : uncategorized
      const oldIdx = sectionItems.findIndex(i => i.id === active.id)
      const newIdx = sectionItems.findIndex(i => i.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const newOrder = arrayMove(sectionItems, oldIdx, newIdx)
        reorderSetItems(listId, currentSet.id, newOrder.map(i => i.id))
      }
    } else if (itemCat !== targetCat) {
      if (targetCat && emptySections.includes(targetCat)) {
        setEmptySections(prev => prev.filter(s => s !== targetCat))
      }
      updateSetItemCategory(listId, currentSet.id, item.id, targetCat)
    }
  }

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <div className="overlay" onClick={onClose} />
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
            <DndContext
              sensors={sensors}
              collisionDetection={customCollision}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={allNamedSections.map(cat => `sec:${cat}`)} strategy={verticalListSortingStrategy}>
                {allNamedSections.map(cat => (
                  <SortableSetSectionContainer
                    key={cat}
                    cat={cat}
                    items={grouped[cat] || []}
                    activeId={activeId}
                    onRename={(newName) => handleRenameSection(cat, newName)}
                  >
                    {(grouped[cat] || []).map(item => (
                      <SortableSetItem
                        key={item.id}
                        item={item}
                        setId={currentSet.id}
                        isAdded={!!added[`${currentSet.id}-${item.id}`]}
                        onRemove={(itemId) => removeItemFromSet(listId, currentSet.id, itemId)}
                        onAdd={handleAdd}
                      />
                    ))}
                  </SortableSetSectionContainer>
                ))}
              </SortableContext>

              {/* Uncategorized */}
              <UncategorizedSetSection hasNamedSections={hasNamedSections} activeId={activeId}>
                <SortableContext items={uncategorized.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {uncategorized.map(item => (
                    <SortableSetItem
                      key={item.id}
                      item={item}
                      setId={currentSet.id}
                      isAdded={!!added[`${currentSet.id}-${item.id}`]}
                      onRemove={(itemId) => removeItemFromSet(listId, currentSet.id, itemId)}
                      onAdd={handleAdd}
                    />
                  ))}
                </SortableContext>
              </UncategorizedSetSection>

              <DragOverlay dropAnimation={null}>
                {activeItem && <SetItemOverlay item={activeItem} />}
              </DragOverlay>
            </DndContext>
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
    </>
  )
}

function UncategorizedSetSection({ hasNamedSections, activeId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'cat:' })
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
      {hasNamedSections && <div className="section-header" style={{ margin: '10px 0 4px' }}>Other</div>}
      {children}
      {isOver && activeId && activeId.toString().startsWith('sec:') === false && (
        <div style={{
          height: 40, borderRadius: 'var(--radius-sm)',
          border: '2px dashed var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: 'var(--text2)', margin: '4px 0',
        }}>
          Drop to remove category
        </div>
      )}
    </div>
  )
}
