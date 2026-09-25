import { paths } from '@/app/routes'
import { useSessions } from '@/features/session/queries'
import { useElements, useIntents } from '@/api/catalog'
import { clock } from '@/lib/format'
import { Screen } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
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

  if (sessionsQuery.isError ||
      elementsQuery.isError ||
      intentsQuery.isError
  ) {
    return (
      <Screen>
        <ErrorState
          error={sessionsQuery.error}
          onRetry={() => sessionsQuery.refetch()}
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
        <div>
          {sessions.map((session) => (
            <div key={session.id}>
                <div>{modeLabel(session.mode)}</div>

                <div>
                {session.element_ids.map((elementId) => (
                    <span key={elementId}>
                        {objectLabel(elements, elementId)}
                    </span>
                    ))}
                </div>

                <div>
                {session.intent_id != null
                    ? intentLabel(intents, session.intent_id)
                    : '-'}
                </div>      

                <div>{session.duration_seconds != null && clock(session.duration_seconds)}</div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  )
}