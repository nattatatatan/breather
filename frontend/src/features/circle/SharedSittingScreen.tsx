import { Link, useParams } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { paths } from '@/app/routes'
import { ChevronRightIcon } from '@/art/icons'
import { intentLabel, modeLabel, objectLabel } from '@/catalog/practice'
import { clock } from '@/lib/format'
import { Avatar } from '@/ui/Avatar'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow, SectionLabel } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { returnsSummary, sharedSittingChips, sharedSittingSubtitle, timelineGeometry } from './format'
import { useSharedSitting } from './queries'
import styles from './SharedSittingScreen.module.css'

export function SharedSittingScreen() {
  const { sessionId } = useParams()
  const id = Number(sessionId)
  const sittingQuery = useSharedSitting(id)
  const elementsQuery = useElements()
  const intentsQuery = useIntents()

  const sitting = sittingQuery.data
  const backTo = sitting?.thread_id ? paths.thread(sitting.thread_id) : paths.circle

  return (
    <Screen>
      <TopBar back={backTo} backLabel="Back to the thread" right={<Eyebrow>Shared sitting</Eyebrow>} gap={20} />

      {sittingQuery.isPending && <Loading label="Loading the sitting" />}
      {sittingQuery.isError && <ErrorState error={sittingQuery.error} onRetry={() => sittingQuery.refetch()} />}

      {sitting && (
        <>
          <Link to={paths.practitioner(sitting.author.id)} className={styles.authorRow}>
            <Avatar initial={sitting.author.initial} size={38} />
            <span className={styles.authorText}>
              <span className={styles.authorTitle}>{sitting.author.display_name}&rsquo;s sitting</span>
              <span className={styles.authorSub}>{sharedSittingSubtitle(sitting.started_at, sitting.author.practising_since)}</span>
            </span>
            <ChevronRightIcon size={16} className={styles.chevron} />
          </Link>

          <div className={styles.grid}>
            <div className={styles.cell}>
              <span className={styles.cellLabel}>Mode</span>
              <span className={styles.cellValue}>{modeLabel(sitting.mode)}</span>
            </div>
            <div className={styles.cell}>
              <span className={styles.cellLabel}>Intention</span>
              <span className={styles.cellValue}>{sitting.intent_id != null ? intentLabel(intentsQuery.data, sitting.intent_id) : '-'}</span>
            </div>
            <div className={styles.cell}>
              <span className={styles.cellLabel}>Object</span>
              <span className={styles.cellValue}>{objectLabel(elementsQuery.data, sitting.element_id)}</span>
            </div>
            <div className={styles.cell}>
              <span className={styles.cellLabel}>Held</span>
              <span className={styles.cellValue}>{clock(sitting.duration_seconds)}</span>
            </div>
          </div>

          <div className={styles.chips}>
            {sharedSittingChips(sitting).map((chip) => (
              <span key={chip} className={styles.chip}>
                {chip}
              </span>
            ))}
          </div>

          <SectionLabel className={styles.sectionLabel}>Where attention went</SectionLabel>
          <Timeline returns={sitting.returns} durationSeconds={sitting.duration_seconds} />
          <p className={styles.summary}>{returnsSummary(sitting.returns, sitting.duration_seconds)}</p>

          {sitting.note && (
            <>
              <SectionLabel className={styles.sectionLabel}>Note afterwards</SectionLabel>
              <div className={styles.noteBox}>
                <p className={styles.note}>&ldquo;{sitting.note}&rdquo;</p>
              </div>
            </>
          )}

          <Spacer />

          <div className={styles.actions}>
            <Link to={paths.practitioner(sitting.author.id)} className={styles.actionQuiet}>
              Their practice
            </Link>
            {sitting.thread_id != null && (
              <Link to={paths.thread(sitting.thread_id)} className={styles.actionInk}>
                Reply
              </Link>
            )}
          </div>

          <p className={styles.footnote}>
            Only what {sitting.author.display_name} chose to attach is visible. Their other sittings stay private.
          </p>
        </>
      )}
    </Screen>
  )
}

function Timeline({ returns, durationSeconds }: { returns: readonly number[]; durationSeconds: number }) {
  const geo = timelineGeometry(returns, durationSeconds)
  return (
    <svg
      viewBox={`0 0 ${geo.width} ${geo.height}`}
      width={geo.width}
      height={geo.height}
      role="img"
      aria-label={`Timeline of the sitting: ${returnsSummary(returns, durationSeconds)}`}
      className={styles.timeline}
    >
      <line x1={geo.axisX1} y1={geo.axisY} x2={geo.axisX2} y2={geo.axisY} stroke="#E0DCD4" strokeWidth={2} strokeLinecap="round" />
      <g stroke="#B04A22" strokeWidth={2} strokeLinecap="round">
        {geo.ticks.map((x, i) => (
          <line key={i} x1={x} y1={geo.tickY1} x2={x} y2={geo.tickY2} />
        ))}
      </g>
      <text x={geo.axisX1} y={geo.height - 4} fontFamily="Jost, sans-serif" fontSize={10} fill="#6E6B62">
        0:00
      </text>
      <text x={geo.axisX2 - 30} y={geo.height - 4} fontFamily="Jost, sans-serif" fontSize={10} fill="#6E6B62">
        {clock(durationSeconds)}
      </text>
    </svg>
  )
}
