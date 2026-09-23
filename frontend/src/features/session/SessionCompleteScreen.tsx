import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { paths } from '@/app/routes'
import { intentLabel, modeLabel, objectLabel } from '@/catalog/practice'
import { durationLong } from '@/lib/format'
import { Button } from '@/ui/Button'
import { TextArea } from '@/ui/Field'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, Title } from '@/ui/Text'
import { useSession, useUpdateSession } from './queries'
import styles from './SessionCompleteScreen.module.css'

/**
 * No board covers this screen; it is modelled on board 08 (My practice) for the page shell and
 * board 13 (A shared sitting) for the conditions grid. It shows Mode/Intention/Object (not Held -
 * the title above already states the held time, so a fourth "Held" cell would only repeat it).
 */
export function SessionCompleteScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = sessionId ? Number(sessionId) : undefined
  const navigate = useNavigate()

  const sessionQuery = useSession(id)
  const elementsQuery = useElements()
  const intentsQuery = useIntents()
  const updateSession = useUpdateSession()

  const [note, setNote] = useState('')
  // Seeds `note` from the loaded session exactly once, the first render where it's available -
  // the sanctioned "adjust state during render" pattern (see https://react.dev/learn/you-might-not-need-an-effect).
  const [noteSessionId, setNoteSessionId] = useState<number | null>(null)

  const session = sessionQuery.data

  if (session && session.id !== noteSessionId) {
    setNoteSessionId(session.id)
    setNote(session.note ?? '')
  }

  if (sessionQuery.isLoading || elementsQuery.isLoading || intentsQuery.isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }
  if (sessionQuery.isError) {
    return (
      <Screen>
        <ErrorState error={sessionQuery.error} onRetry={() => sessionQuery.refetch()} />
      </Screen>
    )
  }
  if (!session || id == null) return null

  const heldSeconds = session.duration_seconds ?? session.planned_seconds
  const returnCount = session.returns.length
  const conditions = [
    { label: 'Mode', value: modeLabel(session.mode) },
    { label: 'Intention', value: intentLabel(intentsQuery.data, session.intent_id) || '—' },
    { label: 'Object', value: objectLabel(elementsQuery.data, session.element_ids[0]) || '—' },
  ]

  async function save(note_: string) {
    await updateSession.mutateAsync({ id: id!, body: { note: note_.trim() ? note_.trim() : null } })
  }

  async function handleSave() {
    await save(note)
    navigate(paths.home)
  }

  async function handleAskCircle() {
    await save(note)
    navigate(paths.compose(id))
  }

  return (
    <Screen>
      <Eyebrow>Complete</Eyebrow>
      <Title className={styles.title}>{durationLong(heldSeconds)} held</Title>

      <div className={styles.conditions}>
        {conditions.map((c) => (
          <div key={c.label} className={styles.conditionCell}>
            <div className={styles.conditionLabel}>{c.label}</div>
            <div className={styles.conditionValue}>{c.value}</div>
          </div>
        ))}
      </div>

      <p className={styles.returns}>
        {returnCount === 0 ? 'No returns noted.' : `${returnCount} return${returnCount === 1 ? '' : 's'} noted.`}
      </p>

      <TextArea
        label="Your note afterwards"
        placeholder="What actually happened, in a sentence or two."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        rows={4}
        className={styles.note}
      />

      {updateSession.isError && <p className={styles.error} role="alert">Could not save. Check your connection and try again.</p>}

      <Spacer />

      <Button onClick={handleSave} disabled={updateSession.isPending}>
        Save
      </Button>
      <button type="button" className={styles.askCircle} onClick={handleAskCircle} disabled={updateSession.isPending}>
        Ask the circle about this sitting
      </button>
    </Screen>
  )
}
