import { useParams } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { paths } from '@/app/routes'
import { intentLabel, modeLabel, objectLabel } from '@/catalog/practice'
import { clock, weekdayTime } from '@/lib/format'
import { Screen } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { useSession } from '@/features/session/queries'
import styles from './DiarySessionScreen.module.css'

export function DiarySessionScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = sessionId ? Number(sessionId) : undefined

  const sessionQuery = useSession(id)
  const elementsQuery = useElements()
  const intentsQuery = useIntents()

  if (
    sessionQuery.isPending ||
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
    sessionQuery.isError ||
    elementsQuery.isError ||
    intentsQuery.isError
  ) {
    return (
      <Screen>
        <ErrorState
          error={
            sessionQuery.error ??
            elementsQuery.error ??
            intentsQuery.error
          }
          onRetry={() => {
            sessionQuery.refetch()
            elementsQuery.refetch()
            intentsQuery.refetch()
          }}
        />
      </Screen>
    )
  }

  const session = sessionQuery.data

  if (!session || id == null) {
    return null
  }

  const elements = elementsQuery.data
  const intents = intentsQuery.data

  const objects = session.element_ids
    .map((elementId) => objectLabel(elements, elementId))
    .filter(Boolean)

  return (
    <Screen>
      <TopBar
        back={paths.youDiary}
        gap={18}
        right={<Eyebrow>Diary</Eyebrow>}
      />

      <div className={styles.header}>
        <Eyebrow>{weekdayTime(session.started_at)}</Eyebrow>

        <Title size={42}>
          {session.duration_seconds != null
            ? clock(session.duration_seconds)
            : 'Incomplete'}
        </Title>
      </div>

      <section className={styles.practice}>
        <div className={styles.primary}>
          {modeLabel(session.mode)}
        </div>

        <div className={styles.objects}>
          {objects.length > 0 ? objects.join(' + ') : '—'}
        </div>

        {session.intent_id != null && (
          <div className={styles.intent}>
            {intentLabel(intents, session.intent_id)}
          </div>
        )}
      </section>

      <section className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.label}>Returns</span>
          <span>
            {session.returns.length === 0
              ? 'None noted'
              : `${session.returns.length} return${
                  session.returns.length === 1 ? '' : 's'
                }`}
          </span>
        </div>

        {session.feeling && (
          <div className={styles.detail}>
            <span className={styles.label}>Feeling</span>
            <span>{session.feeling}</span>
          </div>
        )}
      </section>

      {session.note && (
        <section className={styles.note}>
          <Eyebrow>Note</Eyebrow>
          <p>{session.note}</p>
        </section>
      )}
    </Screen>
  )
}