import styles from './Avatar.module.css'

/** Initial in a soft circle. The design never uses photos. */
export function Avatar({ initial, size = 28 }: { initial: string; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }} aria-hidden="true">
      {initial.slice(0, 1).toUpperCase()}
    </span>
  )
}
