import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api.js'

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Persisted ──────────────────────────────────────
      token: null,
      household: null, // { name }
      dark: false,

      // ── In-memory (loaded from API) ───────────────────
      lists: [],
      sets: {},      // { [listId]: [...] }
      recipes: [],
      loading: false,
      error: null,

      // ── Auth ──────────────────────────────────────────
      async login(name, password) {
        const data = await api('/auth/join', { method: 'POST', body: { name, password } })
        set({ token: data.token, household: { name: data.name } })
        document.documentElement.setAttribute('data-dark', get().dark)
        await get().fetchAll()
      },

      async createHousehold(name, password) {
        const data = await api('/auth/create', { method: 'POST', body: { name, password } })
        set({ token: data.token, household: { name: data.name } })
        document.documentElement.setAttribute('data-dark', get().dark)
        await get().fetchAll()
      },

      logout() {
        set({ token: null, household: null, lists: [], sets: {}, recipes: [] })
      },

      async changePassword(oldPassword, newPassword) {
        await api('/auth/change-password', {
          method: 'POST',
          body: { name: get().household.name, oldPassword, newPassword },
        })
      },

      // ── Fetch all data ─────────────────────────────────
      async fetchAll() {
        set({ loading: true, error: null })
        try {
          const [lists, recipes] = await Promise.all([
            api('/lists'),
            api('/recipes'),
          ])
          set({ lists, recipes, loading: false })
        } catch (e) {
          set({ loading: false, error: e.message })
        }
      },

      async fetchSetsForList(listId) {
        const sets = await api(`/lists/${listId}/sets`)
        set(s => ({ sets: { ...s.sets, [listId]: sets } }))
        return sets
      },

      // ── Lists ─────────────────────────────────────────
      async addList(name, emoji = '📋') {
        const list = await api('/lists', { method: 'POST', body: { name, emoji } })
        set(s => ({ lists: [...s.lists, list] }))
        return list.id
      },

      async renameList(id, name) {
        const updated = await api(`/lists/${id}`, { method: 'PATCH', body: { name } })
        set(s => ({ lists: s.lists.map(l => l.id === id ? updated : l) }))
      },

      async removeList(id) {
        await api(`/lists/${id}`, { method: 'DELETE' })
        set(s => ({ lists: s.lists.filter(l => l.id !== id) }))
      },

      // ── List items ────────────────────────────────────
      async addItem(listId, name) {
        const item = await api(`/lists/${listId}/items`, { method: 'POST', body: { name } })
        set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, items: [...l.items, item] } : l) }))
        return item
      },

      async removeItem(listId, itemId) {
        await api(`/lists/${listId}/items/${itemId}`, { method: 'DELETE' })
        set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l) }))
      },

      restoreItem(listId, item) {
        set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, items: [item, ...l.items] } : l) }))
      },

      async addItemsFromSet(listId, names) {
        const items = await api(`/lists/${listId}/items/bulk`, { method: 'POST', body: { names } })
        set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, items: [...l.items, ...items] } : l) }))
      },

      // ── Sets ──────────────────────────────────────────
      async addSet(listId, name) {
        const set_ = await api(`/lists/${listId}/sets`, { method: 'POST', body: { name } })
        set(s => ({ sets: { ...s.sets, [listId]: [...(s.sets[listId] || []), set_] } }))
        return set_.id
      },

      async addItemToSet(listId, setId, name) {
        const item = await api(`/lists/${listId}/sets/${setId}/items`, { method: 'POST', body: { name } })
        set(s => ({
          sets: {
            ...s.sets,
            [listId]: (s.sets[listId] || []).map(st =>
              st.id === setId ? { ...st, items: [...st.items, item] } : st
            ),
          },
        }))
      },

      async removeItemFromSet(listId, setId, itemId) {
        await api(`/lists/${listId}/sets/${setId}/items/${itemId}`, { method: 'DELETE' })
        set(s => ({
          sets: {
            ...s.sets,
            [listId]: (s.sets[listId] || []).map(st =>
              st.id === setId ? { ...st, items: st.items.filter(i => i.id !== itemId) } : st
            ),
          },
        }))
      },

      // ── Recipes ───────────────────────────────────────
      async addRecipe(data) {
        const recipe = await api('/recipes', { method: 'POST', body: data })
        set(s => ({ recipes: [...s.recipes, recipe] }))
        return recipe.id
      },

      async updateRecipe(id, data) {
        const recipe = await api(`/recipes/${id}`, { method: 'PUT', body: data })
        set(s => ({ recipes: s.recipes.map(r => r.id === id ? recipe : r) }))
        return recipe
      },

      async removeRecipe(id) {
        await api(`/recipes/${id}`, { method: 'DELETE' })
        set(s => ({ recipes: s.recipes.filter(r => r.id !== id) }))
      },

      // ── Household name (local only — name is in JWT) ──
      renameHousehold(name) {
        set(s => ({ household: { ...s.household, name } }))
      },

      // ── Dark mode ─────────────────────────────────────
      toggleDark() {
        const next = !get().dark
        document.documentElement.setAttribute('data-dark', next)
        set({ dark: next })
      },
    }),
    {
      name: 'nippu-storage',
      partialize: s => ({ token: s.token, household: s.household, dark: s.dark }),
      onRehydrateStorage: () => state => {
        if (state?.dark) document.documentElement.setAttribute('data-dark', 'true')
      },
    }
  )
)
