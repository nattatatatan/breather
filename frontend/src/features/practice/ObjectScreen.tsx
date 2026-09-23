import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { useMe } from '@/api/me'
import { paths } from '@/app/routes'
import { OBJECT_ICONS } from '@/art/objectIcons'
import { intentLabel, joinObjects } from '@/catalog/practice'
import { Button } from '@/ui/Button'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { ButtonTabs } from '@/ui/Tabs'
import { Eyebrow, Lead, Quote, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { buildPracticePayload, draftFromProfile, draftToSearch, needsModeRedirect, readDraft, resolveIntent, resolveMode, resolveObject, stayWithLabel } from './flow'
import styles from './ObjectScreen.module.css'
import { usePutPractice } from './queries'

type SourceTab = 'traditional' | 'personal'

export function ObjectScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const meQuery = useMe()
  const elementsQuery = useElements()
  const intentsQuery = useIntents()
  const putPractice = usePutPractice()
  const [override, setOverride] = useState<string | null>(null)
  const [tab, setTab] = useState<SourceTab>('traditional')

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
  const intent = resolveIntent(urlDraft, profileDraft)
  const objectSlug = override ?? resolveObject(urlDraft, profileDraft)
  const backHref = `${paths.intention}?${draftToSearch({ ...urlDraft, mode })}`
  const objects = joinObjects(elementsQuery.data)
  const chosenIntent = intentsQuery.data.find((i) => i.slug === intent)
  const chosenElement = objectSlug ? elementsQuery.data.find((e) => e.slug === objectSlug) : undefined

  async function handleStay() {
    if (!chosenIntent || !chosenElement || !objectSlug) return
    const payload = buildPracticePayload(meQuery.data?.practice, {
      mode,
      intentId: chosenIntent.id,
      elementSlug: objectSlug,
      elementId: chosenElement.id,
    })
    await putPractice.mutateAsync(payload)
    navigate(paths.sit)
  }

  return (
    <Screen>
      <TopBar back={backHref} gap={30} right={<Eyebrow>{intentLabel(intentsQuery.data, chosenIntent?.id)}</Eyebrow>} />
      <Title size={40} style={{ marginBottom: 4 }}>
        Your practice object
      </Title>
      <Lead style={{ marginBottom: 26 }}>One object, chosen once. If holding it in mind brings agitation or craving rather than a steady, comfortable mind, choose another.</Lead>

      <ButtonTabs
        label="Object source"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'traditional', label: 'Traditional' },
          { value: 'personal', label: 'Personal' },
        ]}
      />

      <div className={styles.body}>
        {tab === 'traditional' ? (
          <div className={styles.grid} role="radiogroup" aria-label="Practice object">
            {objects.map((entry) => {
              const Icon = OBJECT_ICONS[entry.slug]
              const selected = objectSlug === entry.slug
              return (
                <button
                  key={entry.slug}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? `${styles.tile} ${styles.selected}` : styles.tile}
                  onClick={() => setOverride(entry.slug)}
                >
                  {Icon && <Icon tone={selected ? 'accent' : 'neutral'} />}
                  <span className={styles.label}>{entry.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className={styles.personal}>
            <Quote size={17}>Your own object - a photo, a person, a word - comes later.</Quote>
          </div>
        )}
      </div>

      <Spacer />
      {putPractice.isError && (
        <p className={styles.error} role="alert">
          That did not save. Try again.
        </p>
      )}
      <Button onClick={() => void handleStay()} disabled={!objectSlug || putPractice.isPending}>
        {putPractice.isPending ? 'One moment' : stayWithLabel(elementsQuery.data, objectSlug)}
      </Button>
    </Screen>
  )
}
