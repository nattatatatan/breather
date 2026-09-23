import { Link } from 'react-router'
import type { Element, Intent, ThreadSummary } from '@/api/types'
import { paths } from '@/app/routes'
import { ChevronRightIcon, SittingGlyph } from '@/art/icons'
import { modeLabel, objectLabel } from '@/catalog/practice'
import { ago } from '@/lib/format'
import { Avatar } from '@/ui/Avatar'
import { attachedSittingLine, attachedSittingSubline, longPractitionerLabel, repliesLabel, tenurePracticing } from './format'
import styles from './ThreadCard.module.css'

interface ThreadCardProps {
  thread: ThreadSummary
  elements: readonly Element[] | undefined
  intents: readonly Intent[] | undefined
}

/**
 * One row in the discussion list. The whole card links to the thread; when a sitting is
 * attached, the inset is its own link to the shared sitting. Two real links, never nested -
 * the card's link is a full-bleed overlay and the inset paints above it (see the CSS module).
 */
export function ThreadCard({ thread, elements, intents }: ThreadCardProps) {
  const attached = thread.attached
  const longLabel = longPractitionerLabel(thread.long_practitioner_reply_count)

  return (
    <article className={attached ? `${styles.card} ${styles.featured}` : styles.card}>
      <Link to={paths.thread(thread.id)} aria-label={thread.title} className={styles.stretch} />

      <div className={styles.header}>
        <Avatar initial={thread.author.initial} size={22} />
        <span className={styles.name}>{thread.author.display_name}</span>
        <span className={styles.sep} aria-hidden="true">·</span>
        <span className={styles.tenure}>{tenurePracticing(thread.author.practising_since)}</span>
        <span className={styles.grow} />
        <span className={styles.age}>{ago(thread.created_at)}</span>
      </div>

      <h2 className={attached ? `${styles.title} ${styles.titleLarge}` : styles.title}>{thread.title}</h2>

      {attached ? (
        <>
          {thread.excerpt && <p className={styles.excerpt}>{thread.excerpt}</p>}
          <Link to={paths.shared(attached.session_id)} className={styles.inset}>
            <SittingGlyph />
            <span className={styles.insetText}>
              <span className={styles.insetLine}>{attachedSittingLine(attached, elements)}</span>
              <span className={styles.insetSub}>{attachedSittingSubline(attached, intents)}</span>
            </span>
            <ChevronRightIcon size={16} className={styles.chevron} />
          </Link>
          <div className={styles.metaRow}>
            <span>{repliesLabel(thread.reply_count)}</span>
            {longLabel && <span>{longLabel}</span>}
          </div>
        </>
      ) : (
        <div className={styles.tagsRow}>
          {thread.mode && <span className={styles.pill}>{modeLabel(thread.mode)}</span>}
          {thread.element_id != null && <span className={styles.pill}>{objectLabel(elements, thread.element_id)}</span>}
          <span className={styles.tagText}>{repliesLabel(thread.reply_count)}</span>
          {longLabel && <span className={styles.tagText}>{longLabel}</span>}
        </div>
      )}
    </article>
  )
}
