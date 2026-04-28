import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import BottomNav from '../components/BottomNav'

export default function HouseholdScreen() {
  const household = useStore(s => s.household)
  const changePassword = useStore(s => s.changePassword)
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const handleSave = async () => {
    if (!oldPw || !newPw) { setPwError('Both fields required.'); return }
    setSaving(true); setPwError('')
    try {
      await changePassword(oldPw, newPw)
      setEditing(false); setOldPw(''); setNewPw('')
    } catch (e) {
      setPwError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLeave = () => { logout(); navigate('/') }

  return (
    <div className="screen">
      <div style={{ padding: '24px 24px 8px', flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 2 }}>{household?.name}</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>Household</h1>
      </div>
      <div className="scroll-area" style={{ paddingBottom: 100 }}>
        <div className="section-header">Access</div>
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Password
          </p>
          {editing ? (
            <>
              <input
                className="input-field"
                type="password"
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                placeholder="Current password"
                style={{ marginBottom: 8 }}
                disabled={saving}
              />
              <input
                className="input-field"
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="New password"
                style={{ marginBottom: 8, borderColor: 'var(--accent)' }}
                disabled={saving}
              />
              {pwError && (
                <p style={{ fontSize: 13, color: 'oklch(0.55 0.18 25)', marginBottom: 8 }}>{pwError}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ padding: '10px 24px', width: 'auto', fontSize: 14, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-ghost" style={{ padding: '10px 24px', width: 'auto', fontSize: 14 }} onClick={() => { setEditing(false); setOldPw(''); setNewPw(''); setPwError('') }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <input type="password" value="••••••••" disabled className="input-field" style={{ marginBottom: 12 }} readOnly />
              <button className="btn-ghost" style={{ padding: '10px 24px', width: 'auto', fontSize: 14 }} onClick={() => setEditing(true)}>
                Change password
              </button>
            </>
          )}
        </div>

        <div className="section-header" style={{ marginTop: 24 }}>Danger zone</div>
        <div className="card" style={{ borderLeft: '3px solid oklch(0.55 0.18 25)' }}>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>
            Leaving will remove your access to all shared lists.
          </p>
          {showLeaveConfirm ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleLeave} style={{
                background: 'oklch(0.55 0.18 25)', color: '#fff', border: 'none',
                borderRadius: 999, padding: '10px 20px', fontFamily: 'Figtree,sans-serif',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Yes, leave</button>
              <button className="btn-ghost" style={{ padding: '10px 20px', width: 'auto', fontSize: 14 }} onClick={() => setShowLeaveConfirm(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLeaveConfirm(true)} style={{
              background: 'none', border: '1.5px solid oklch(0.55 0.18 25)',
              borderRadius: 999, padding: '10px 20px', fontFamily: 'Figtree,sans-serif',
              fontSize: 14, fontWeight: 600, color: 'oklch(0.55 0.18 25)', cursor: 'pointer',
            }}>Leave household</button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
