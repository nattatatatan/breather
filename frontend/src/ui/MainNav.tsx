import { NavLink } from 'react-router'
import styles from './MainNav.module.css'

const ITEMS = [
  { to: '/', label: 'Sit', end: true },
  { to: '/circle', label: 'Circle', end: false },
  { to: '/you', label: 'You', end: false },
]

/** Sit / Circle / You text navigation from the Home screen. */
export function MainNav() {
  return (
    <nav aria-label="Main" className={styles.nav}>
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
