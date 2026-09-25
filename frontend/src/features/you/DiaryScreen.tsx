import { paths } from '@/app/routes'
import { Link } from 'react-router'
import { useSessions } from '@/features/session/queries'
import { useElements, useIntents } from '@/api/catalog'
import { clock, weekdayTime } from '@/lib/format'
import { Screen } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import styles from './DiaryScreen.module.css'
import {
  intentLabel,
  modeLabel,
  objectLabel,
} from '@/catalog/practice'


export function DiaryScreen() {
  const sessionsQuery = useSessions({
    completed: true,
    limit: 50,
  })
  const elementsQuery = useElements()
  const intentsQuery = useIntents()

  if (sessionsQuery.isPending ||
      elementsQuery.isPending ||
      intentsQuery.isPending
  ) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }

  if (
    sessionsQuery.isError ||
    elementsQuery.isError ||
    intentsQuery.isError
  ) {
    return (
      <Screen>
        <ErrorState
          error={sessionsQuery.error ?? elementsQuery.error ?? intentsQuery.error}
          onRetry={() => {
            sessionsQuery.refetch()
            elementsQuery.refetch()
            intentsQuery.refetch()
          }}
        />
      </Screen>
    )
  }

  const sessions = sessionsQuery.data
  const elements = elementsQuery.data
  const intents = intentsQuery.data

  return (
    <Screen>
      <TopBar
        back={paths.you}
        gap={18}
        right={<Eyebrow>Diary</Eyebrow>}
      />

      <Title size={42}>Diary</Title>

      {sessions.length === 0 ? (
        <p>No sittings yet.</p>
      ) : (
        <div className={styles.list}>
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={paths.youDiarySession(session.id)}
              className={styles.session}
            >
              <div className={styles.sessionMain}>
                <div className={styles.sessionDate}>
                  {weekdayTime(session.started_at)}
                </div>

                <div className={styles.sessionPractice}>
                  {modeLabel(session.mode)} ·{' '}
                  {session.element_ids
                    .map((elementId) => objectLabel(elements, elementId))
                    .join(' + ')}
                </div>

                {session.intent_id != null && (
                  <div className={styles.sessionIntent}>
                    {intentLabel(intents, session.intent_id)}
                  </div>
                )}
              </div>

              <div className={styles.sessionMeta}>
                {session.duration_seconds != null && (
                  <span>{clock(session.duration_seconds)}</span>
                )}
              </div>

              <span className={styles.arrow}>→</span>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  )
}