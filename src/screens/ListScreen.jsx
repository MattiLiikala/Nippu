import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import SetsDrawer from './SetsDrawer'
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
import { IconBack, IconCheck, IconMore, IconSets, IconGrip } from '../components/Icons'

// ── Sortable item ────────────────────────────────────────

function SortableItem({ item, removing, onCheck }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, transform, transition } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      className={`item-row${removing === item.id ? ' removing' : ''}`}
      style={{ opacity: isDragging ? 0 : 1, transform: CSS.Transform.toString(transform), transition }}
    >
      <div className={`check-circle${removing === item.id ? ' done' : ''}`} onClick={() => onCheck(item)}>
        {removing === item.id && <IconCheck />}
      </div>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{item.name}</span>
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{ padding: '4px 0 4px 12px', color: 'var(--border)', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
      >
        <IconGrip />
      </div>
    </div>
  )
}

function ItemOverlay({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 4px',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      cursor: 'grabbing',
    }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{item.name}</span>
      <div style={{ padding: '4px 0 4px 12px', color: 'var(--border)' }}><IconGrip /></div>
    </div>
  )
}

// ── Sortable section header ──────────────────────────────

function SortableSectionHeader({ id, name, onRename }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <EditableSectionHeader
        name={name}
        onRename={onRename}
        sectionDrag={{ ref: setActivatorNodeRef, listeners, attributes }}
      />
    </div>
  )
}

// "Other" header — sortable drop target but not draggable (no handle)
function OtherSectionHeader() {
  const { setNodeRef, transform, transition } = useSortable({ id: 'sec:' })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className="section-header">
      Other
    </div>
  )
}

// ── Main screen ─────────────────────────────────────────

export default function ListScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lists = useStore(s => s.lists)
  const removeItem = useStore(s => s.removeItem)
  const restoreItem = useStore(s => s.restoreItem)
  const addItem = useStore(s => s.addItem)
  const addItemsFromSet = useStore(s => s.addItemsFromSet)
  const updateItemCategory = useStore(s => s.updateItemCategory)
  const renameCategory = useStore(s => s.renameCategory)
  const reorderListItems = useStore(s => s.reorderListItems)
  const updateListSectionOrder = useStore(s => s.updateListSectionOrder)

  const list = lists.find(l => l.id === id)
  const [removing, setRemoving] = useState(null)
  const [lastRemoved, setLastRemoved] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [emptySections, setEmptySections] = useState([])
  const inputRef = useRef()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  if (!list) return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text2)' }}>List not found.</p>
    </div>
  )

  // Group items by category
  const grouped = {}
  const uncategorized = []
  for (const item of list.items) {
    if (item.category) {
      (grouped[item.category] ??= []).push(item)
    } else {
      uncategorized.push(item)
    }
  }
  const sortGroup = arr => arr.sort((a, b) => ((a.ord ?? 0) - (b.ord ?? 0)) || ((a.created_at ?? 0) - (b.created_at ?? 0)))
  for (const cat of Object.keys(grouped)) sortGroup(grouped[cat])
  sortGroup(uncategorized)

  const savedOrder = list.section_order ? JSON.parse(list.section_order) : []
  const presentCats = Object.keys(grouped)
  const sortedCats = [
    ...savedOrder.filter(cat => presentCats.includes(cat)),
    ...presentCats.filter(cat => !savedOrder.includes(cat)).sort(),
  ]
  const allNamedSections = [...sortedCats, ...emptySections.filter(s => !sortedCats.includes(s))]

  // Flat list: section headers and items interleaved in display order.
  // When named sections exist, a non-draggable 'sec:' sentinel is inserted before
  // uncategorized items so they have a reachable drop zone.
  const flatList = [
    ...allNamedSections.flatMap(cat => [
      { id: `sec:${cat}`, type: 'section', name: cat },
      ...(grouped[cat] || []),
    ]),
    ...(allNamedSections.length > 0
      ? [{ id: 'sec:', type: 'section', name: null }, ...uncategorized]
      : uncategorized),
  ]

  const activeItem = activeId && !activeId.toString().startsWith('sec:')
    ? list.items.find(i => i.id === activeId)
    : null

  // ── Handlers ──────────────────────────────────────────

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
      renameCategory(list.id, oldName, newName)
      if (savedOrder.includes(oldName)) {
        updateListSectionOrder(list.id, allNamedSections.map(s => s === oldName ? newName : s))
      }
    }
  }

  const handleDragStart = ({ active }) => setActiveId(active.id)
  const handleDragCancel = () => setActiveId(null)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return

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
    updateListSectionOrder(list.id, newFlat.filter(e => e.type === 'section').map(e => e.name))

    // Only update the moved item's category — other items keep theirs unchanged
    if (movedEntry.type !== 'section') {
      let newCat = null
      for (let i = newIdx - 1; i >= 0; i--) {
        if (newFlat[i].type === 'section') { newCat = newFlat[i].name; break }
      }
      if (newCat !== (movedEntry.category ?? null)) {
        updateItemCategory(list.id, movedEntry.id, newCat)
      }
    }

    reorderListItems(list.id, newFlat.filter(e => e.type !== 'section').map(e => e.id))
  }

  // ── Render ────────────────────────────────────────────

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        autoScroll={{ layoutShiftCompensation: false }}
      >
        <div className="scroll-area" style={{ paddingTop: 4, paddingBottom: 120 }}>
          <SortableContext items={flatList.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {flatList.map(entry => {
              if (entry.id === 'sec:') return <OtherSectionHeader key="sec:" />
              if (entry.type === 'section') return (
                <SortableSectionHeader
                  key={entry.id}
                  id={entry.id}
                  name={entry.name}
                  onRename={newName => handleRenameSection(entry.name, newName)}
                />
              )
              return <SortableItem key={entry.id} item={entry} removing={removing} onCheck={handleCheck} />
            })}
          </SortableContext>

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

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={handleAddSection}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', color: 'var(--text2)',
                border: '1.5px dashed var(--border)', borderRadius: 999, padding: '10px 16px',
                fontFamily: 'Figtree,sans-serif', fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Section
            </button>
          </div>

          {lastRemoved && (
            <div className="undo-toast">
              <span style={{ fontSize: 14, fontWeight: 500 }}>Removed: {lastRemoved.name}</span>
              <button className="undo-btn" onClick={handleUndo}>Undo</button>
            </div>
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeItem && <ItemOverlay item={activeItem} />}
        </DragOverlay>
      </DndContext>

      <button
        onClick={() => setDrawerOpen(true)}
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 999,
          padding: '12px 24px',
          fontFamily: 'Figtree,sans-serif', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', zIndex: 15,
          boxShadow: '0 4px 16px rgba(85,134,140,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        <IconSets />
        Saved items
      </button>

      {drawerOpen && (
        <SetsDrawer
          listId={list.id}
          onClose={() => setDrawerOpen(false)}
          onAddItems={items => addItemsFromSet(list.id, items)}
          listCategories={allNamedSections}
        />
      )}
    </div>
  )
}
