import { Link } from 'react-router'

import { paths } from '@/app/routes'
import { useMe } from '@/api/me'

import { useAuth } from '@/auth/AuthProvider'

import styles from './YouScreen.module.css'

import { Eyebrow, Title } from '@/ui/Text'
import { Screen } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { TopBar } from '@/ui/TopBar'




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

      <TopBar
        back={paths.home}
        gap={18}
        right={<Eyebrow>You</Eyebrow>}
      />

      <div className={styles.header}>
        <Title size={42} style={{ marginBottom: 0 }}>
          You
        </Title>

        <p className={styles.subtitle}>
          Your practice, your history, and your presence.
        </p>
      </div>

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
