import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { useMe } from '@/api/me'
import { paths } from '@/app/routes'
import { INTENTS, modeLabel } from '@/catalog/practice'
import { ButtonLink } from '@/ui/Button'
import { Chip } from '@/ui/Chip'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Lead, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { draftFromProfile, draftToSearch, needsModeRedirect, readDraft, resolveIntent, resolveMode } from './flow'
import styles from './IntentionScreen.module.css'

export function IntentionScreen() {
  const [searchParams] = useSearchParams()
  const meQuery = useMe()
  const elementsQuery = useElements()
  const intentsQuery = useIntents()
  const [override, setOverride] = useState<string | null>(null)

  if (needsModeRedirect(searchParams)) return <Navigate to={paths.mode} replace />

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

  const urlDraft = readDraft(searchParams)
  const profileDraft = draftFromProfile(meQuery.data.practice, elementsQuery.data, intentsQuery.data)
  const mode = resolveMode(urlDraft, profileDraft)
  const intent = override ?? resolveIntent(urlDraft, profileDraft)
  const backHref = `${paths.mode}?${draftToSearch(urlDraft)}`
  const continueHref = `${paths.object}?${draftToSearch({ ...urlDraft, mode, intent })}`

  return (
    <Screen>
      <TopBar back={backHref} gap={44} right={<Chip label={modeLabel(mode)} />} />
      <Title>
        What would you
        <br />
        like to cultivate?
      </Title>
      <Lead style={{ marginBottom: 38 }}>
        A companion to the mode, not a substitute for it: {modeLabel(mode).toLowerCase()} is <em>how</em> you work, this is the flavour it takes. Change it before any sitting.
      </Lead>

      <div className={styles.list} role="radiogroup" aria-label="Intention">
        {INTENTS.map((entry) => {
          const selected = intent === entry.slug
          return (
            <button
              key={entry.slug}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? `${styles.row} ${styles.selected}` : styles.row}
              onClick={() => setOverride(entry.slug)}
            >
              <span className={styles.text}>
                <span className={styles.name}>{entry.label}</span>
                <span className={styles.blurb}>{entry.blurb}</span>
              </span>
              {selected && <span className={styles.dot} aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <Spacer />
      <ButtonLink to={continueHref}>Continue</ButtonLink>
    </Screen>
  )
}
