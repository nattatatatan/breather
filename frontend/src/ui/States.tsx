import { ApiError } from '@/api/client'
import { Button } from './Button'
import styles from './States.module.css'

/** Quiet loading state: a single breathing dot, no spinner. */
export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className={styles.center} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const notFound = error instanceof ApiError && error.status === 404
  return (
    <div className={styles.center} role="alert">
      <p className={styles.message}>{notFound ? 'This is no longer here.' : 'Something did not load.'}</p>
      {onRetry && !notFound && (
        <div className={styles.retry}>
          <Button onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  )
}
