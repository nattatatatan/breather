import { Link, useParams } from 'react-router'
import { useElements } from '@/api/catalog'
import { paths } from '@/app/routes'
import { objectLabel, MODES } from '@/catalog/practice'
import { hours, minutes, monthYear, percent, weekdayShort } from '@/lib/format'
import { ButtonLink } from '@/ui/Button'
import { Avatar } from '@/ui/Avatar'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, SectionLabel } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { sessionModeObjectLabel } from './format'
import { usePractitioner } from './queries'
import styles from './PractitionerScreen.module.css'

export function PractitionerScreen() {
  const { userId } = useParams()
  const id = Number(userId)
  const practitionerQuery = usePractitioner(id)
  const elementsQuery = useElements()

  const practitioner = practitionerQuery.data
  const stats = practitioner?.stats

  return (
    <Screen>
      <TopBar back={paths.circle} backLabel="Back to the circle" right={<Eyebrow>Practice</Eyebrow>} gap={22} />

      {practitionerQuery.isPending && <Loading label="Loading their practice" />}
      {practitionerQuery.isError && <ErrorState error={practitionerQuery.error} onRetry={() => practitionerQuery.refetch()} />}

      {practitioner && stats && (
        <>
          <div className={styles.header}>
            <Avatar initial={practitioner.author.initial} size={54} />
            <span>
              <span className={styles.name}>{practitioner.author.display_name}</span>
              <span className={styles.since}>
                Sitting since {monthYear(practitioner.author.practising_since)}
                {practitioner.location ? ` · ${practitioner.location}` : ''}
              </span>
            </span>
          </div>

          {practitioner.bio && <p className={styles.bio}>&ldquo;{practitioner.bio}&rdquo;</p>}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{hours(stats.total_seconds)}</div>
              <div className={styles.statLabel}>Held</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{hours(stats.longest_seconds)}</div>
              <div className={styles.statLabel}>Longest</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.shared_count}</div>
              <div className={styles.statLabel}>Shared</div>
            </div>
          </div>

          <SectionLabel className={styles.sectionLabel}>Modes</SectionLabel>
          <div className={styles.modes}>
            {(() => {
              const bestSeconds = Math.max(0, ...stats.mode_split.map((m) => m.seconds))
              return MODES.map(({ mode, label }) => {
                const seconds = stats.mode_split.find((m) => m.mode === mode)?.seconds ?? 0
                const pct = percent(seconds, stats.total_seconds)
                const primary = stats.mode_split.length > 0 && seconds === bestSeconds
                return (
                  <div key={mode} className={styles.modeRow}>
                    <span className={styles.modeName}>{label}</span>
                    <span className={styles.modeBar}>
                      <span className={primary ? styles.modeFillPrimary : styles.modeFillSecondary} style={{ width: `${pct}%` }} />
                    </span>
                    <span className={styles.modePct}>{pct}%</span>
                  </div>
                )
              })
            })()}
          </div>

          <SectionLabel className={styles.sectionLabel}>Objects they stay with</SectionLabel>
          <div className={styles.objects}>
            {stats.by_element.map((entry, i) => (
              <span key={entry.element_id} className={i === 0 ? styles.objectPrimary : styles.objectPill}>
                {objectLabel(elementsQuery.data, entry.element_id)} · {hours(entry.seconds)}
              </span>
            ))}
          </div>

          <SectionLabel className={styles.sharedLabel}>Shared sittings</SectionLabel>
          <div className={styles.sharedList}>
            {practitioner.shared_sittings.map((sitting) => (
              <Link key={sitting.session_id} to={paths.shared(sitting.session_id)} className={styles.sharedRow}>
                <span className={styles.sharedDay}>{weekdayShort(sitting.started_at)}</span>
                <span className={styles.sharedLine}>{sessionModeObjectLabel(sitting.mode, sitting.element_id, elementsQuery.data)}</span>
                <span className={styles.sharedDuration}>{minutes(sitting.duration_seconds)}</span>
              </Link>
            ))}
          </div>

          <Spacer />

          {practitioner.open_thread_id != null && (
            <ButtonLink to={paths.thread(practitioner.open_thread_id)}>Answer their question</ButtonLink>
          )}
        </>
      )}
    </Screen>
  )
}
