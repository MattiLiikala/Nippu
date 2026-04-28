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
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || res.statusText)
  }
  return res.json()
}
