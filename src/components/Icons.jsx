export function IconLists({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text2)'
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="16" rx="4" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  )
}

export function IconRecipes({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text2)'
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M8 3v18M8 3C8 3 6 6 6 9s2 4 2 4" />
      <rect x="13" y="3" width="5" height="9" rx="2.5" />
      <line x1="13" y1="15" x2="18" y2="15" />
      <line x1="13" y1="18" x2="16" y2="18" />
    </svg>
  )
}

export function IconHouse({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text2)'
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M3 11L12 3l9 8" />
      <rect x="7" y="14" width="10" height="7" rx="2" />
    </svg>
  )
}

export function IconPlus({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M15 5L8 12l7 7" />
    </svg>
  )
}

export function IconCheck({ color = '#fff', size = 14 }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 14 12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M1 6l4 4 8-8" />
    </svg>
  )
}

export function IconMore() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.5" fill="var(--text2)" />
      <circle cx="12" cy="12" r="1.5" fill="var(--text2)" />
      <circle cx="19" cy="12" r="1.5" fill="var(--text2)" />
    </svg>
  )
}

export function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" />
      <line x1="11" y1="11" x2="15" y2="15" />
    </svg>
  )
}

export function IconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text2)" strokeWidth="1.8" strokeLinecap="round">
      <path d="M11 2l3 3-8 8H3v-3L11 2z" />
    </svg>
  )
}

export function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text2)" strokeWidth="2.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  )
}

export function IconTrash() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h11M4 3V2h5v1M5 6v5M8 6v5M2 3l.7 9h7.6L11 3" />
    </svg>
  )
}

export function IconSun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export function IconMoon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  )
}

export function IconChevron() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--border)" strokeWidth="2" strokeLinecap="round">
      <path d="M7 4l6 6-6 6" />
    </svg>
  )
}

export function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
      <path d="M7 4l7 5-7 5" />
    </svg>
  )
}

export function IconSets() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="1" y="3" width="14" height="10" rx="2.5" />
      <line x1="5" y1="7" x2="11" y2="7" />
      <line x1="5" y1="10" x2="8" y2="10" />
    </svg>
  )
}

export function IconGrip() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
      <circle cx="4.5" cy="3.5" r="1.5" />
      <circle cx="9.5" cy="3.5" r="1.5" />
      <circle cx="4.5" cy="8" r="1.5" />
      <circle cx="9.5" cy="8" r="1.5" />
      <circle cx="4.5" cy="12.5" r="1.5" />
      <circle cx="9.5" cy="12.5" r="1.5" />
    </svg>
  )
}

export function Logo({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <rect x="4" y="9" width="22" height="26" rx="3" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" transform="rotate(-8 4 9)" />
      <rect x="7" y="6" width="22" height="26" rx="3" stroke="var(--accent)" strokeWidth="1.5" opacity="0.65" transform="rotate(-3 7 6)" />
      <rect x="10" y="4" width="22" height="26" rx="3" stroke="var(--accent)" strokeWidth="2" />
      <line x1="14" y1="12" x2="28" y2="12" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <line x1="14" y1="17" x2="28" y2="17" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <line x1="14" y1="22" x2="22" y2="22" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}
