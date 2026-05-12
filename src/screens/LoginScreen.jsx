import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function LoginScreen() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('join')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const login = useStore(s => s.login)
  const createHousehold = useStore(s => s.createHousehold)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!name.trim() || !password) { setError('Enter a household name and password.'); return }
    setBusy(true); setError('')
    try {
      if (mode === 'join') {
        await login(name.trim(), password)
      } else {
        await createHousehold(name.trim(), password)
      }
      navigate('/lists')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '32px 28px 48px', overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/icon-192.png"
            alt="Nippu"
            style={{ width: 160, height: 160, objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text2)',
              marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Household name</label>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Baggins Household"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={busy}
            />
          </div>
          <div>
            <label style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text2)',
              marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={busy}
            />
          </div>

          {error && (
            <p style={{ fontSize: 14, color: 'oklch(0.55 0.18 25)', fontWeight: 500, marginTop: -4 }}>
              {error}
            </p>
          )}

          <button className="btn-primary" style={{ marginTop: 4, opacity: busy ? 0.7 : 1 }} onClick={handleSubmit} disabled={busy}>
            {busy ? '…' : mode === 'join' ? 'Join household' : 'Create household'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button className="btn-ghost" disabled={busy} onClick={() => { setMode(m => m === 'join' ? 'create' : 'join'); setError('') }}>
            {mode === 'join' ? 'Create a household' : 'Join existing'}
          </button>
        </div>
      </div>
    </div>
  )
}
