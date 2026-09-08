// Thin fetch wrapper — reads token from store on every call so it's always fresh
import { useStore } from '../store/useStore.js'

export async function api(path, { method = 'GET', body } = {}) {
  const token = useStore.getState().token
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  // Sliding session: the server reissues a fresh token once the current one
  // is past the midpoint of its lifetime — pick it up so an actively-used
  // session keeps renewing itself instead of expiring on a fixed clock.
  const renewed = res.headers.get('X-Renewed-Token')
  if (renewed) useStore.setState({ token: renewed })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    // A request that carried a token and still got rejected means the
    // session itself is dead (expired/invalid) — drop back to the login
    // screen instead of leaving the UI stuck in a broken "logged in" state.
    if (res.status === 401 && token) useStore.getState().logout()
    throw new Error(text || res.statusText)
  }
  return res.json()
}
