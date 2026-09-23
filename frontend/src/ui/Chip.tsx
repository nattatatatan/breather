import styles from './Chip.module.css'

/** Pill with an accent dot, e.g. the current mode on the Intention screen. */
export function Chip({ label, dot = true }: { label: string; dot?: boolean }) {
  return (
    <span className={styles.chip}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      <span className={styles.label}>{label}</span>
    </span>
  )
}
