import { useState } from 'react'
import { useStore } from '../store/useStore'
import { IconBack, IconCheck, IconArrowRight } from '../components/Icons'

export default function AddToListScreen({ recipe, picked, onBack, onDone }) {
  const lists = useStore(s => s.lists)
  const addItemsFromSet = useStore(s => s.addItemsFromSet)
  const [selectedList, setSelectedList] = useState(null)
  const pickedItems = recipe.ingredients.filter((_, i) => picked[i])

  const handleConfirm = () => {
    if (selectedList) {
      addItemsFromSet(selectedList, pickedItems)
      onDone()
    }
  }

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button className="back-btn" onClick={onBack}>
          <IconBack />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Add to list</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 1 }}>{pickedItems.length} ingredients selected</p>
        </div>
      </div>

      <div className="scroll-area" style={{ paddingBottom: 120 }}>
        <div className="section-header">Selected</div>
        <div className="card" style={{ padding: '12px 16px' }}>
          {pickedItems.map((ing, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                borderBottom: i < pickedItems.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 6,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <IconCheck size={10} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{ing}</span>
            </div>
          ))}
        </div>

        <div className="section-header">Choose list</div>
        {lists.map(list => (
          <div
            key={list.id}
            onClick={() => setSelectedList(list.id)}
            className="card list-card"
            style={{
              border: selectedList === list.id ? '2px solid var(--accent)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{list.name}</span>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `2px solid ${selectedList === list.id ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedList === list.id ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s var(--spring)',
            }}>
              {selectedList === list.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
            </div>
          </div>
        ))}
      </div>

      {selectedList && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 }}>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
          >
            <span>Add to {lists.find(l => l.id === selectedList)?.name}</span>
            <IconArrowRight />
          </button>
        </div>
      )}
    </div>
  )
}
