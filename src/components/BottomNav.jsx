import { useLocation, useNavigate } from 'react-router-dom'
import { IconLists, IconRecipes, IconHouse } from './Icons'

const TABS = [
  { id: 'lists',     label: 'Lists',     path: '/lists',     Icon: IconLists },
  { id: 'recipes',   label: 'Recipes',   path: '/recipes',   Icon: IconRecipes },
  { id: 'household', label: 'Household', path: '/household', Icon: IconHouse },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const active = TABS.find(t => location.pathname.startsWith(t.path))?.id || 'lists'

  return (
    <div className="bottom-nav">
      {TABS.map(({ id, label, path, Icon }) => (
        <div
          key={id}
          className={`nav-item${active === id ? ' active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon active={active === id} />
          <span className="nav-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
