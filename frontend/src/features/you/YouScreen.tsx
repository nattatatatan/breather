import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { useMe } from '@/api/me'
import { useAuth } from '@/auth/AuthProvider'
import styles from './YouScreen.module.css'

import { Screen } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'



export function YouScreen() {
  const meQuery = useMe()
  const { signOut } = useAuth()

  if (meQuery.isPending) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }

  if (meQuery.isError) {
    return (
      <Screen>
        <ErrorState error={meQuery.error} onRetry={() => meQuery.refetch()} />
      </Screen>
    )
  }

  const me = meQuery.data

  return (
    <Screen>
      <Link to={paths.youPractice} className={styles.card}>
        <span className={styles.label}>My practice</span>

        <span className={styles.value}>
          {me.practice ? 'Your current practice' : 'Choose a practice'}
        </span>

        <span className={styles.meta}>
          Set your meditation preference.
        </span>

        <span className={styles.arrow}>→</span>
      </Link>

      <div className={styles.card}>
        <span className={styles.label}>Diary</span>

        <span className={styles.value}>
          Your sittings
        </span>

        <span className={styles.meta}>
          Coming next: look back at previous practice.
        </span>
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Avatar</span>

        <span className={styles.value}>
          Your appearance
        </span>

        <span className={styles.meta}>
          Coming next: customise your avatar.
        </span>
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.signOut} onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </Screen>
  )
}
