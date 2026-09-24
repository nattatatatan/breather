import { useState } from 'react'
import { Link } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { useMe } from '@/api/me'
import type { Environment, PracticeProfile, Sound } from '@/api/types'
import { paths } from '@/app/routes'
import { ChevronRightIcon } from '@/art/icons'
import { PracticeFigure } from '@/art/objectIcons'
import { useAuth } from '@/auth/AuthProvider'
import { intentLabel, objectLabel, OBJECTS } from '@/catalog/practice'
import { draftToSearch, type PracticeDraft } from '@/features/practice/flow'
import { durationLong, minutes, tenure } from '@/lib/format'
import { ButtonLink } from '@/ui/Button'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, Quote, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { useUpdatePractice } from './queries'
import styles from './PracticeScreen.module.css'

const DURATIONS = [300, 600, 1200, 1800, 2700, 3600]
const ENVIRONMENT_LABEL: Record<Environment, string> = { still: 'Still image', dissolve: 'The dissolve' }
const SOUND_LABEL: Record<Sound, string> = { silent: 'Silent', bell: 'Bell' }

type EditableKey = 'environment' | 'duration' | 'sound' | 'timer'

function withField(practice: PracticeProfile, key: EditableKey, raw: string): PracticeProfile {
  switch (key) {
    case 'environment':
      return { ...practice, environment: raw as Environment }
    case 'duration':
      return { ...practice, duration_seconds: Number(raw) }
    case 'sound':
      return { ...practice, sound: raw as Sound }
    case 'timer':
      return { ...practice, timer_visible: raw === 'true' }
  }
}

export function PracticeScreen() {
  const meQuery = useMe()
  const elementsQuery = useElements()
  const intentsQuery = useIntents()
  const updatePractice = useUpdatePractice()
  const { signOut } = useAuth()
  const [expanded, setExpanded] = useState<EditableKey | null>(null)

  if (meQuery.isPending || elementsQuery.isPending || intentsQuery.isPending) {
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
  if (elementsQuery.isError || intentsQuery.isError) {
    return (
      <Screen>
        <ErrorState
          error={elementsQuery.error ?? intentsQuery.error}
          onRetry={() => {
            void elementsQuery.refetch()
            void intentsQuery.refetch()
          }}
        />
      </Screen>
    )
  }

  const me = meQuery.data
  const practice = me.practice

  if (!practice) {
    return (
      <Screen>
        <TopBar back={paths.home} gap={18} right={<Eyebrow>You</Eyebrow>} />
        <div className={styles.empty}>
          <PracticeFigure slug={undefined} size={140} />
          <Quote size={19} style={{ marginTop: 24 }}>
            You have not chosen a practice yet.
          </Quote>
        </div>
        <Spacer />
        <ButtonLink to={paths.mode}>Begin</ButtonLink>
      </Screen>
    )
  }

  const elementSlug = elementsQuery.data.find((e) => e.id === practice.element_id)?.slug
  const objectEntry = OBJECTS.find((o) => o.slug === elementSlug)
  const draft: PracticeDraft = { mode: practice.mode, intent: intentsQuery.data.find((i) => i.id === practice.intent_id)?.slug, object: elementSlug }
  const draftSearch = draftToSearch(draft)

  function select(key: EditableKey, raw: string) {
    if (!practice) return
    setExpanded(null)
    updatePractice.mutate(withField(practice, key, raw))
  }

  return (
    <Screen>
      <TopBar back={paths.home} gap={18} right={<Eyebrow>You</Eyebrow>} />

      <div className={styles.header}>
        <PracticeFigure slug={elementSlug} size={82} />
        <div>
          <Title size={36} style={{ marginBottom: 0 }}>
            My practice
          </Title>
          <p className={styles.subtitle}>Set once. Changed rarely.</p>
        </div>
      </div>

      <div className={styles.list}>
        <div className={styles.rowWrap}>
          <Link to={`${paths.object}?${draftSearch}`} className={styles.row}>
            <span className={styles.label}>Object</span>
            <span className={styles.valueGroup}>
              <span className={styles.value}>{objectLabel(elementsQuery.data, practice.element_id)}</span>
              <ChevronRightIcon size={14} className={styles.chevron} />
            </span>
          </Link>
        </div>

        <div className={styles.rowWrap}>
          <button
            type="button"
            className={styles.row}
            disabled={!objectEntry || objectEntry.environments.length <= 1}
            aria-expanded={expanded === 'environment'}
            onClick={() => setExpanded(expanded === 'environment' ? null : 'environment')}
          >
            <span className={styles.label}>Environment</span>
            <span className={styles.value}>{ENVIRONMENT_LABEL[practice.environment]}</span>
          </button>
          {expanded === 'environment' && objectEntry && (
            <div className={styles.picker} role="radiogroup" aria-label="Environment">
              {objectEntry.environments.map((env) => (
                <button
                  key={env}
                  type="button"
                  role="radio"
                  aria-checked={env === practice.environment}
                  className={env === practice.environment ? `${styles.pill} ${styles.pillSelected}` : styles.pill}
                  onClick={() => select('environment', env)}
                >
                  {ENVIRONMENT_LABEL[env]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rowWrap}>
          <Link to={`${paths.intention}?${draftSearch}`} className={styles.row}>
            <span className={styles.label}>Intention</span>
            <span className={styles.valueGroup}>
              <span className={styles.value}>{intentLabel(intentsQuery.data, practice.intent_id)}</span>
              <ChevronRightIcon size={14} className={styles.chevron} />
            </span>
          </Link>
        </div>

        <div className={styles.rowWrap}>
          <button type="button" className={styles.row} aria-expanded={expanded === 'duration'} onClick={() => setExpanded(expanded === 'duration' ? null : 'duration')}>
            <span className={styles.label}>Duration</span>
            <span className={styles.value}>{durationLong(practice.duration_seconds)}</span>
          </button>
          {expanded === 'duration' && (
            <div className={styles.picker} role="radiogroup" aria-label="Duration">
              {DURATIONS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  role="radio"
                  aria-checked={seconds === practice.duration_seconds}
                  className={seconds === practice.duration_seconds ? `${styles.pill} ${styles.pillSelected}` : styles.pill}
                  onClick={() => select('duration', String(seconds))}
                >
                  {minutes(seconds)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rowWrap}>
          <button type="button" className={styles.row} aria-expanded={expanded === 'sound'} onClick={() => setExpanded(expanded === 'sound' ? null : 'sound')}>
            <span className={styles.label}>Sound</span>
            <span className={styles.value}>{SOUND_LABEL[practice.sound]}</span>
          </button>
          {expanded === 'sound' && (
            <div className={styles.picker} role="radiogroup" aria-label="Sound">
              {(['silent', 'bell'] as const).map((sound) => (
                <button
                  key={sound}
                  type="button"
                  role="radio"
                  aria-checked={sound === practice.sound}
                  className={sound === practice.sound ? `${styles.pill} ${styles.pillSelected}` : styles.pill}
                  onClick={() => select('sound', sound)}
                >
                  {SOUND_LABEL[sound]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.rowWrap} ${styles.last}`}>
          <button type="button" className={styles.row} aria-expanded={expanded === 'timer'} onClick={() => setExpanded(expanded === 'timer' ? null : 'timer')}>
            <span className={styles.label}>Timer</span>
            <span className={styles.value}>{practice.timer_visible ? 'Shown' : 'Hidden'}</span>
          </button>
          {expanded === 'timer' && (
            <div className={styles.picker} role="radiogroup" aria-label="Timer">
              {([false, true] as const).map((shown) => (
                <button
                  key={String(shown)}
                  type="button"
                  role="radio"
                  aria-checked={shown === practice.timer_visible}
                  className={shown === practice.timer_visible ? `${styles.pill} ${styles.pillSelected}` : styles.pill}
                  onClick={() => select('timer', String(shown))}
                >
                  {shown ? 'Shown' : 'Hidden'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Spacer />

      <div className={styles.bottom}>
        <Quote size={19}>The app does not judge whether your object is a fitting one. It helps you stay with the one you chose.</Quote>
        <ButtonLink to={`${paths.mode}?${draftSearch}`}>Change practice</ButtonLink>
        <p className={styles.identity}>
          {me.display_name} - practising {tenure(me.practising_since)}
        </p>
        <button type="button" className={styles.signOut} onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </Screen>
  )
}
