import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import ListScreen from './screens/ListScreen'
import RecipesScreen from './screens/RecipesScreen'
import HouseholdScreen from './screens/HouseholdScreen'
import BottomNav from './components/BottomNav'
import { IconSun, IconMoon } from './components/Icons'

function DarkToggle() {
  const dark = useStore(s => s.dark)
  const toggleDark = useStore(s => s.toggleDark)
  return (
    <button
      onClick={toggleDark}
      aria-label="Toggle dark mode"
      style={{
        position: 'fixed', top: 16, right: 'max(16px, calc(50vw - 284px))',
        width: 42, height: 42, borderRadius: '50%',
        background: 'var(--surface)', boxShadow: 'var(--shadow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 100, border: 'none',
        transition: 'transform 0.2s var(--spring)',
      }}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  )
}

function RequireAuth({ children }) {
  const household = useStore(s => s.household)
  if (!household) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="screen-enter" style={{ height: '100%' }}>
      <Routes location={location}>
        <Route path="/lists" element={<RequireAuth><HomeScreen /></RequireAuth>} />
        <Route path="/lists/:id" element={<RequireAuth><ListScreen /></RequireAuth>} />
        <Route path="/recipes" element={<RequireAuth><RecipesScreen /></RequireAuth>} />
        <Route path="/household" element={<RequireAuth><HouseholdScreen /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/lists" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const household = useStore(s => s.household)
  const dark = useStore(s => s.dark)
  const fetchAll = useStore(s => s.fetchAll)

  useEffect(() => {
    document.documentElement.setAttribute('data-dark', dark)
  }, [dark])

  useEffect(() => {
    if (household) fetchAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!household) return
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [household, fetchAll])

  if (!household) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DarkToggle />
        <LoginScreen />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DarkToggle />
      <AppRoutes />
      <BottomNav />
    </div>
  )
}
