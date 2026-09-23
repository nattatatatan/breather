import { NavLink } from 'react-router'
import styles from './Tabs.module.css'

// Underlined uppercase tabs. Route tabs (Circle: Discussion / Hours) use links;
// in-page tabs (Object: Traditional / Personal) use buttons with aria-selected.

interface RouteTab { label: string; to: string; end?: boolean }

export function RouteTabs({ tabs, gap = 24 }: { tabs: RouteTab[]; gap?: number }) {
  return (
    <nav className={styles.tabs} style={{ gap }}>
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

interface ButtonTabsProps<T extends string> {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  gap?: number
}

export function ButtonTabs<T extends string>({ tabs, value, onChange, label, gap = 26 }: ButtonTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={styles.tabs} style={{ gap }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === value}
          className={t.value === value ? `${styles.tab} ${styles.active}` : styles.tab}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
