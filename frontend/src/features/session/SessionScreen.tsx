import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useBeforeUnload, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { useElements } from '@/api/catalog'
import { useMe } from '@/api/me'
import { paths } from '@/app/routes'
import { Buddha } from '@/art/Buddha'
import { CampfireGround, FireGlow, Flame } from '@/art/fire'
import { STILL_GLYPHS } from '@/art/stillObjects'
import { joinObjects, type SessionScene } from '@/catalog/practice'
import { clock } from '@/lib/format'
import { Screen } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { SessionBell } from './audio'
import { useElapsed } from './elapsed'
import { fireDissolveStyle } from './fireDissolve'
import { sessionCreateFromProfile, useCompleteSession, useCreateSession, useDeleteSession } from './queries'
import { recordReturn, shouldDiscard } from './returns'
import screenStyles from './SessionScreen.module.css'
import stageStyles from './SessionStage.module.css'
import { SessionStage } from './SessionStage'
import { useWakeLock } from './wakeLock'

type Tone = 'light' | 'night'

/** Object-specific italic hints for the "still" scenes, which have no board of their own. */
const STILL_HINTS: Record<string, string> = {
  breath: 'Rest on the breath. When it wanders, return.',
  light: 'Rest in the light. Let it fill the mind.',
  water: 'Let the mind settle like still water.',
  earth: 'Steady as the ground beneath you.',
  'loving-kindness': 'Hold one easy being in mind.',
  walking: 'Feel each step land.',
}

const BUDDHA_HINT = 'When it wanders, return.'
const FIRE_HINT = 'Let the room go. Keep the flame.'

function TopDots() {
  return (
    <div className={stageStyles.dots}>
      <span className={stageStyles.dot} />
      <span className={stageStyles.dot} />
      <span className={stageStyles.dot} />
    </div>
  )
}

function TimerLabel({ tone, label }: { tone: Tone; label: string | null }) {
  if (!label) return null
  return <div className={[stageStyles.timer, stageStyles[tone]].join(' ')}>{label}</div>
}

export function SessionScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meQuery = useMe()
  const elementsQuery = useElements()

  const [startPerf, setStartPerf] = useState<number | null>(null)
  const [returns, setReturns] = useState<number[]>([])
  const [completed, setCompleted] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  // Captured from the mutation's onMutate callback (fired synchronously by react-query, but as a
  // reaction to the mutation starting rather than a direct call in the mount effect below) - this
  // is the sitting's t=0 for the local monotonic timer.
  const createSession = useCreateSession({ onMutate: () => setStartPerf(performance.now()) })
  const completeSession = useCompleteSession()
  const deleteSession = useDeleteSession()

  const attemptedCreateRef = useRef(false)
  const bellRef = useRef<SessionBell | null>(null)
  /** Which ending path is in flight, so a network-error retry repeats the same action. */
  const endModeRef = useRef<'complete' | 'discard' | null>(null)

  const session = createSession.data
  const practice = meQuery.data?.practice

  // Dev-only preview of the fire dissolve at an arbitrary progress, without creating a session.
  // e.g. /sit?preview=0.58 - see verification notes in the frontend agent task.
  const previewParam = import.meta.env.DEV ? searchParams.get('preview') : null
  const parsedPreview = previewParam != null && previewParam !== '' ? Number(previewParam) : null
  const inPreview = parsedPreview != null && !Number.isNaN(parsedPreview)

  function beginSession() {
    if (!practice) return
    createSession.mutate(sessionCreateFromProfile(practice))
  }

  useEffect(() => {
    if (inPreview) return
    if (attemptedCreateRef.current) return
    if (!practice) return
    attemptedCreateRef.current = true
    beginSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inPreview, practice])

  useEffect(() => {
    if (!session || session.sound !== 'bell') return
    bellRef.current ??= new SessionBell()
    bellRef.current.play()
  }, [session])

  useEffect(() => () => bellRef.current?.dispose(), [])

  const plannedSeconds = inPreview ? (practice?.duration_seconds ?? 0) : (session?.planned_seconds ?? 0)

  function completeSitting() {
    if (!session || completed) return
    endModeRef.current = 'complete'
    setCompleted(true)
    setEndError(null)
    completeSession.mutate(
      { id: session.id, returns },
      {
        onSuccess: (updated) => {
          if (session.sound === 'bell') bellRef.current?.play()
          navigate(paths.sessionComplete(updated.id), { replace: true })
        },
        onError: () => {
          setCompleted(false)
          setEndError('Could not finish the sitting. Your time and returns are safe - try again.')
        },
      },
    )
  }

  function discardSitting() {
    if (!session || discarding) return
    endModeRef.current = 'discard'
    setDiscarding(true)
    setEndError(null)
    deleteSession.mutate(session.id, {
      onSuccess: () => navigate(paths.home, { replace: true }),
      onError: () => {
        setDiscarding(false)
        setEndError('Could not end the sitting. Try again.')
      },
    })
  }

  // useElapsed keeps the latest `onComplete` in a ref internally, so passing a fresh closure
  // here on every render is safe - it always sees the current `session`/`completed`/`returns`.
  const elapsedLive = useElapsed({
    startMs: session ? startPerf : null,
    plannedSeconds,
    onComplete: completeSitting,
  })

  const elapsed = inPreview ? parsedPreview! * plannedSeconds : elapsedLive

  const sessionActive = !inPreview && !!session && !completed && !discarding

  const blocker = useBlocker(sessionActive)
  useBeforeUnload((event: BeforeUnloadEvent) => {
    if (!sessionActive) return
    event.preventDefault()
  })
  useWakeLock(sessionActive)

  function handleHoldToEndComplete() {
    if (inPreview || !session) return
    if (shouldDiscard(elapsed)) discardSitting()
    else completeSitting()
  }

  function handleReturn(elapsedAt: number) {
    setReturns((r) => recordReturn(r, elapsedAt, plannedSeconds || undefined))
  }

  function handleRetryEnd() {
    if (endModeRef.current === 'discard') discardSitting()
    else completeSitting()
  }

  if (meQuery.isLoading || elementsQuery.isLoading) {
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
  if (elementsQuery.isError) {
    return (
      <Screen>
        <ErrorState error={elementsQuery.error} onRetry={() => elementsQuery.refetch()} />
      </Screen>
    )
  }

  const me = meQuery.data
  if (!me) return null
  if (!me.practice) return <Navigate to={paths.mode} replace />

  const objects = joinObjects(elementsQuery.data ?? [])
  const objectEntry = objects.find((o) => o.id === me.practice!.element_id)
  if (!objectEntry) {
    return (
      <Screen>
        <ErrorState error={new Error('Unknown practice object')} />
      </Screen>
    )
  }

  if (!inPreview && !session) {
    if (createSession.isError) {
      return (
        <Screen variant="bleed" background="var(--bg-still)">
          <div className={screenStyles.centeredError}>
            <ErrorState error={createSession.error} onRetry={beginSession} />
          </div>
        </Screen>
      )
    }
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }

  const scene: SessionScene = objectEntry.scene
  const environment = inPreview ? 'dissolve' : (session?.environment ?? 'still')
  const timerLabel = (inPreview ? false : me.practice.timer_visible) ? clock(Math.max(0, plannedSeconds - elapsed)) : null
  const progressPercent = plannedSeconds > 0 ? Math.min(100, (elapsed / plannedSeconds) * 100) : 0

  const fireProgress = scene === 'fire' && environment === 'dissolve' && plannedSeconds > 0 ? Math.min(1, elapsed / plannedSeconds) : 0
  const dissolve = fireDissolveStyle(fireProgress)

  const disabled = inPreview || completed || discarding

  let background: ReactNode
  let figure: ReactNode
  let topChrome: ReactNode
  let hint: string
  let tone: Tone
  let bg: string

  if (scene === 'buddha') {
    tone = 'light'
    bg = 'var(--bg-still)'
    hint = BUDDHA_HINT
    background = <div className={screenStyles.softGlow} />
    figure = (
      <motion.div layoutId="practice-object">
        <Buddha tone="lit" width={322} height={386} />
      </motion.div>
    )
    topChrome = (
      <>
        <TopDots />
        <TimerLabel tone={tone} label={timerLabel} />
      </>
    )
  } else if (scene === 'fire') {
    tone = 'night'
    bg = 'var(--bg-night)'
    hint = FIRE_HINT
    // Glow, ground and flame all share one relatively-positioned 460px stage (as in board 06),
    // so their absolute bottom-anchored coordinates agree - this must not be split across the
    // stage's separate background/figure layers.
    background = null
    figure = (
      <div className={screenStyles.flameStage}>
        <FireGlow sizePx={dissolve.glowSizePx} alpha={dissolve.glowAlpha} />
        <div className={screenStyles.campfireGround} style={{ opacity: dissolve.sceneOpacity }}>
          <CampfireGround />
        </div>
        <motion.div layoutId="practice-object" className={screenStyles.flamePosition}>
          <div className={screenStyles.flameScale} style={{ transform: `scale(${dissolve.flameScale})` }}>
            <Flame />
          </div>
        </motion.div>
      </div>
    )
    topChrome = (
      <>
        <div className={[stageStyles.eyebrow, stageStyles.night].join(' ')}>Fire · staying</div>
        <TimerLabel tone={tone} label={timerLabel} />
      </>
    )
  } else {
    const Glyph = STILL_GLYPHS[objectEntry.slug]
    const isLightKasina = objectEntry.slug === 'light'
    tone = isLightKasina ? 'night' : 'light'
    bg = isLightKasina ? 'var(--bg-night)' : 'var(--bg-still)'
    hint = STILL_HINTS[objectEntry.slug] ?? 'Rest here. When it wanders, return.'
    background = isLightKasina ? <div className={screenStyles.nightGlow} /> : null
    figure = (
      <motion.div layoutId="practice-object">
        {Glyph ? <Glyph size={128} {...(isLightKasina ? { tone: 'night' as const } : {})} /> : null}
      </motion.div>
    )
    topChrome = (
      <>
        <TopDots />
        <TimerLabel tone={tone} label={timerLabel} />
      </>
    )
  }

  return (
    <Screen variant="bleed" background={bg}>
      <SessionStage
        tone={tone}
        background={background}
        figure={figure}
        topChrome={topChrome}
        hint={hint}
        hintOpacity={dissolve.hintOpacity}
        chromeOpacity={dissolve.chromeOpacity}
        progressPercent={progressPercent}
        elapsedSeconds={elapsed}
        onReturn={handleReturn}
        onHoldToEndComplete={handleHoldToEndComplete}
        disabled={disabled}
        leaveBlocked={blocker.state === 'blocked'}
        onStay={() => blocker.state === 'blocked' && blocker.reset()}
        onLeave={() => blocker.state === 'blocked' && blocker.proceed()}
        errorMessage={endError}
        onRetry={endError ? handleRetryEnd : undefined}
      />
    </Screen>
  )
}
