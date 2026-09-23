import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { useMe } from '@/api/me'
import type { PracticeMode } from '@/api/types'
import { paths } from '@/app/routes'
import { MODES } from '@/catalog/practice'
import { ButtonLink } from '@/ui/Button'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Lead, Quote, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { draftFromProfile, draftToSearch, readDraft, resolveMode } from './flow'
import styles from './ModeScreen.module.css'

/** Concentric rings, warm at the centre: "one object, held". */
function SamathaGlyph() {
  return (
    <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true" className={styles.glyph}>
      <circle cx="32" cy="32" r="27" fill="none" stroke="#E0D6CA" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#D3BFA9" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#C99973" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="4" fill="#B04A22" />
    </svg>
  )
}

/** Scattered points on a line: "whatever arises". */
function VipassanaGlyph() {
  return (
    <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true" className={styles.glyph}>
      <path d="M6 32 H58" fill="none" stroke="#DAD5CC" strokeWidth="1.2" />
      <circle cx="13" cy="22" r="3.4" fill="#C6C1B7" />
      <circle cx="26" cy="40" r="5" fill="#B6B1A7" />
      <circle cx="38" cy="19" r="2.6" fill="#CFCAC1" />
      <circle cx="48" cy="42" r="4" fill="#C6C1B7" />
      <circle cx="56" cy="26" r="2.2" fill="#D6D1C8" />
      <circle cx="32" cy="32" r="1.8" fill="#55534C" />
    </svg>
  )
}

const GLYPHS: Record<PracticeMode, () => React.JSX.Element> = {
  samatha: SamathaGlyph,
  vipassana: VipassanaGlyph,
}

export function ModeScreen() {
  const [searchParams] = useSearchParams()
  const meQuery = useMe()
  const elementsQuery = useElements()
  const intentsQuery = useIntents()
  const [override, setOverride] = useState<PracticeMode | null>(null)

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
  const mode = override ?? resolveMode(urlDraft, profileDraft)
  const continueHref = `${paths.intention}?${draftToSearch({ ...urlDraft, mode })}`

  return (
    <Screen>
      <TopBar back={paths.home} gap={40} />
      <Title>
        How are you
        <br />
        working today?
      </Title>
      <Lead>The mode sets what you do with attention. The intention you choose next is its companion - the flavour, not the method.</Lead>

      <div className={styles.list} role="radiogroup" aria-label="Mode of practice">
        {MODES.map((entry) => {
          const Glyph = GLYPHS[entry.mode]
          const selected = mode === entry.mode
          return (
            <button
              key={entry.mode}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? `${styles.card} ${styles.selected}` : styles.card}
              onClick={() => setOverride(entry.mode)}
            >
              <Glyph />
              <span className={styles.text}>
                <span className={styles.name}>{entry.label}</span>
                <span className={styles.gloss}>{entry.gloss}</span>
                <span className={styles.blurb}>{entry.blurb}</span>
              </span>
            </button>
          )
        })}
      </div>

      <Spacer />
      <Quote style={{ marginBottom: 22 }}>Most practices use both. Choosing one here only decides what this sitting asks of you.</Quote>
      <ButtonLink to={continueHref}>Continue</ButtonLink>
    </Screen>
  )
}
