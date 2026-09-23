import { HoursBand } from '@/art/crowd'
import { paths } from '@/app/routes'
import { hours } from '@/lib/format'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { RouteTabs } from '@/ui/Tabs'
import { Eyebrow, Quote, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { sittingNowLabel } from './format'
import { useHours } from './queries'
import styles from './HoursScreen.module.css'

export function HoursScreen() {
  const hoursQuery = useHours()
  const data = hoursQuery.data

  const meInEntries = data?.me != null && data.entries.some((e) => e.user_id === data.me!.user_id)
  const rows = data ? (data.me && !meInEntries ? [...data.entries, data.me] : data.entries) : []

  return (
    <Screen variant="bleed">
      <div className={styles.band}>
        <HoursBand />
        <div className={styles.overlayBar}>
          <TopBar back={paths.circle} backLabel="Back to the circle" right={<Eyebrow>Looking out</Eyebrow>} gap={0} />
        </div>
      </div>

      <div className={styles.content}>
        <Title size={34} style={{ marginBottom: 14 }}>The circle</Title>
        <RouteTabs tabs={[{ label: 'Discussion', to: paths.circle, end: true }, { label: 'Hours', to: paths.hours }]} />

        {hoursQuery.isPending && <Loading label="Loading the circle's hours" />}
        {hoursQuery.isError && <ErrorState error={hoursQuery.error} onRetry={() => hoursQuery.refetch()} />}

        {data && (
          <>
            <p className={styles.lead}>Hours held this month.</p>
            {rows.length === 0 ? (
              <div className={styles.empty}>
                <Quote size={17}>No one has sat enough this month to appear here yet.</Quote>
              </div>
            ) : (
              <div className={styles.rows}>
                {rows.map((row) => (
                  <div key={row.user_id} className={row.is_me ? `${styles.row} ${styles.rowMe}` : styles.row}>
                    <span className={row.is_me ? `${styles.rank} ${styles.rankMe}` : styles.rank}>{row.rank}</span>
                    <span className={styles.name}>{row.is_me ? 'You' : row.display_name}</span>
                    <span className={styles.hours}>{hours(row.seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Spacer />

        {data && (
          <div className={styles.sittingNow}>
            <span className={styles.dot} aria-hidden="true" />
            <span>{sittingNowLabel(data.sitting_now)}</span>
          </div>
        )}
      </div>
    </Screen>
  )
}
