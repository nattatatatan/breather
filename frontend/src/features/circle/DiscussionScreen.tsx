import { Link } from 'react-router'
import { useElements, useIntents } from '@/api/catalog'
import { paths } from '@/app/routes'
import { ShareUpIcon } from '@/art/icons'
import { ButtonLink } from '@/ui/Button'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { RouteTabs } from '@/ui/Tabs'
import { Eyebrow, Quote, Title } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { useThreads } from './queries'
import { ThreadCard } from './ThreadCard'
import styles from './DiscussionScreen.module.css'

export function DiscussionScreen() {
  const threadsQuery = useThreads()
  const elementsQuery = useElements()
  const intentsQuery = useIntents()

  const threads = threadsQuery.data?.pages.flat() ?? []

  return (
    <Screen>
      <TopBar back={paths.home} right={<Eyebrow>Circle</Eyebrow>} gap={16} />
      <Title size={34} style={{ marginBottom: 14 }}>The circle</Title>

      <RouteTabs tabs={[{ label: 'Discussion', to: paths.circle, end: true }, { label: 'Hours', to: paths.hours }]} />

      <div className={styles.list}>
        {threadsQuery.isPending && <Loading label="Loading the circle" />}
        {threadsQuery.isError && <ErrorState error={threadsQuery.error} onRetry={() => threadsQuery.refetch()} />}
        {threadsQuery.isSuccess && threads.length === 0 && (
          <div className={styles.empty}>
            <Quote size={17}>Nothing has been asked yet.</Quote>
          </div>
        )}
        {threadsQuery.isSuccess &&
          threads.map((thread) => <ThreadCard key={thread.id} thread={thread} elements={elementsQuery.data} intents={intentsQuery.data} />)}
        {threadsQuery.hasNextPage && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={() => threadsQuery.fetchNextPage()}
            disabled={threadsQuery.isFetchingNextPage}
          >
            {threadsQuery.isFetchingNextPage ? 'Loading' : 'Load more'}
          </button>
        )}
      </div>

      <Spacer />

      <div className={styles.footer}>
        <ButtonLink to={paths.compose()} className={styles.ask}>
          Ask the circle
        </ButtonLink>
        <Link to={paths.composePick} aria-label="Share a sitting" className={styles.share}>
          <ShareUpIcon />
        </Link>
      </div>
    </Screen>
  )
}
