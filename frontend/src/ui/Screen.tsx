import type { CSSProperties, ReactNode } from 'react'
import styles from './Screen.module.css'

interface ScreenProps {
  children: ReactNode
  /** Standard padded column (default) or edge-to-edge for illustrated/session screens. */
  variant?: 'padded' | 'bleed'
  /** Background token; defaults to var(--bg). */
  background?: string
  className?: string
  style?: CSSProperties
}

/**
 * One phone-sized column, centred on wider viewports. Every route renders exactly one Screen.
 * Content stretches to at least the viewport height so bottom-pinned actions sit where the design puts them.
 */
export function Screen({ children, variant = 'padded', background, className, style }: ScreenProps) {
  const classes = [styles.screen, variant === 'padded' ? styles.padded : styles.bleed, className].filter(Boolean).join(' ')
  return (
    <div className={styles.page} style={background ? { background } : undefined}>
      <main className={classes} style={background ? { ...style, background } : style}>
        {children}
      </main>
    </div>
  )
}

/** Flexible spacer that pushes following content to the bottom of the screen. */
export function Spacer() {
  return <div className={styles.spacer} aria-hidden="true" />
}
