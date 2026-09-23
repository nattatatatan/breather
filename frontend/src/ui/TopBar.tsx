import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BackIcon } from '@/art/icons'
import styles from './TopBar.module.css'

interface TopBarProps {
  /** Route the back chevron goes to. Omit to hide it. */
  back?: string
  backLabel?: string
  /** Right side: usually an <Eyebrow>, sometimes a <Chip>. */
  right?: ReactNode
  /** Space below the bar in px; screens in the design vary between 18 and 44. */
  gap?: number
}

export function TopBar({ back, backLabel = 'Back', right, gap = 40 }: TopBarProps) {
  return (
    <div className={styles.bar} style={{ marginBottom: gap }}>
      {back ? (
        <Link to={back} aria-label={backLabel} className={styles.back}>
          <BackIcon />
        </Link>
      ) : (
        <span />
      )}
      {right}
    </div>
  )
}
