import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '@/api/client'
import { useElements } from '@/api/catalog'
import { paths } from '@/app/routes'
import { minutes, weekdayShort } from '@/lib/format'
import { Button } from '@/ui/Button'
import { Field, TextArea } from '@/ui/Field'
import { Screen, Spacer } from '@/ui/Screen'
import { Eyebrow, SectionLabel } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { sessionModeObjectLabel, validateThreadDraft, type ThreadDraftErrors } from './format'
import { useAttachableSessions, useCreateThread } from './queries'
import styles from './ComposeScreen.module.css'

function parseSessionParam(raw: string | null): number | null {
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function ComposeScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionsQuery = useAttachableSessions()
  const elementsQuery = useElements()
  const createThread = useCreateThread()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(() => parseSessionParam(searchParams.get('session')))
  const [errors, setErrors] = useState<ThreadDraftErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const attachRef = useRef<HTMLDivElement>(null)
  const pickHandled = useRef(false)

  useEffect(() => {
    if (pickHandled.current || searchParams.get('pick') !== '1' || !sessionsQuery.data) return
    pickHandled.current = true
    if (sessionsQuery.data.length === 0 || !attachRef.current) return
    attachRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    attachRef.current.querySelector('button')?.focus()
  }, [searchParams, sessionsQuery.data])

  function submit(event: FormEvent) {
    event.preventDefault()
    const draftErrors = validateThreadDraft(title, body)
    setErrors(draftErrors)
    if (draftErrors.title || draftErrors.body) return

    setSubmitError(null)
    createThread.mutate(
      { title: title.trim(), body: body.trim(), session_id: selectedSessionId ?? undefined },
      {
        onSuccess: (thread) => navigate(paths.thread(thread.id), { replace: true }),
        onError: (error) => setSubmitError(error instanceof ApiError && typeof error.detail === 'string' ? error.detail : 'That did not post - try again.'),
      },
    )
  }

  const sessions = sessionsQuery.data ?? []

  return (
    <Screen>
      <TopBar back={paths.circle} backLabel="Back to the circle" right={<Eyebrow>Ask the circle</Eyebrow>} gap={30} />

      <form className={styles.form} onSubmit={submit} noValidate>
        <Field
          label="Title"
          value={title}
          maxLength={140}
          hint={errors.title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
          }}
        />
        <TextArea
          label="Body"
          value={body}
          maxLength={5000}
          rows={7}
          hint={errors.body}
          onChange={(e) => {
            setBody(e.target.value)
            if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }))
          }}
        />

        {sessions.length > 0 && (
          <div className={styles.attach} ref={attachRef} tabIndex={-1}>
            <SectionLabel className={styles.attachLabel}>Attach a sitting</SectionLabel>
            <p className={styles.attachHint}>Only the sitting you attach becomes visible. Your other sittings stay private.</p>
            <div className={styles.sessionList}>
              {sessions.map((session) => {
                const selected = session.id === selectedSessionId
                return (
                  <button
                    key={session.id}
                    type="button"
                    aria-pressed={selected}
                    className={selected ? `${styles.sessionRow} ${styles.sessionRowSelected}` : styles.sessionRow}
                    onClick={() => setSelectedSessionId(selected ? null : session.id)}
                  >
                    <span className={styles.sessionDay}>{weekdayShort(session.started_at)}</span>
                    <span className={styles.sessionLine}>
                      {sessionModeObjectLabel(session.mode, session.element_ids[0], elementsQuery.data)}
                    </span>
                    <span className={styles.sessionDuration}>{minutes(session.duration_seconds ?? session.planned_seconds)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {submitError && (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        )}

        <Spacer />

        <Button type="submit" disabled={createThread.isPending}>
          {createThread.isPending ? 'Posting' : 'Post'}
        </Button>
      </form>
    </Screen>
  )
}
