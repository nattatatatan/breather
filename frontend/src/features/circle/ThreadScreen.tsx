import { useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import type { AttachedSitting, Element, Reply } from '@/api/types'
import { useElements } from '@/api/catalog'
import { useMe } from '@/api/me'
import { paths } from '@/app/routes'
import { EyeIcon, SendIcon, SittingGlyph } from '@/art/icons'
import { modeLabel, objectLabel } from '@/catalog/practice'
import { agoLong, clock, weekdayTime } from '@/lib/format'
import { Avatar } from '@/ui/Avatar'
import { Screen, Spacer } from '@/ui/Screen'
import { ErrorState, Loading } from '@/ui/States'
import { Eyebrow } from '@/ui/Text'
import { TopBar } from '@/ui/TopBar'
import { repliesLabel, replyAuthorLine, splitParagraphs, threadAuthorLine } from './format'
import { useReply, useThread, useToggleHelpful } from './queries'
import styles from './ThreadScreen.module.css'

export function ThreadScreen() {
  const { threadId } = useParams()
  const id = Number(threadId)
  const threadQuery = useThread(id)
  const elementsQuery = useElements()
  const meQuery = useMe()
  const replyMutation = useReply(id)

  const [replyBody, setReplyBody] = useState('')
  const replyInputRef = useRef<HTMLInputElement>(null)

  function focusReply() {
    replyInputRef.current?.focus()
  }

  function submitReply(event: FormEvent) {
    event.preventDefault()
    const body = replyBody.trim()
    if (!body || replyMutation.isPending) return
    replyMutation.mutate(body, { onSuccess: () => setReplyBody('') })
  }

  const thread = threadQuery.data

  return (
    <Screen>
      <TopBar back={paths.circle} backLabel="Back to the circle" right={<Eyebrow>Thread</Eyebrow>} gap={18} />

      {threadQuery.isPending && <Loading label="Loading the thread" />}
      {threadQuery.isError && <ErrorState error={threadQuery.error} onRetry={() => threadQuery.refetch()} />}

      {thread && (
        <>
          <div className={styles.op}>
            <div className={styles.authorRow}>
              <Link to={paths.practitioner(thread.author.id)} className={styles.authorLink}>
                <Avatar initial={thread.author.initial} size={30} />
                <span>
                  <span className={styles.authorName}>{thread.author.display_name}</span>
                  <span className={styles.authorMeta}>{threadAuthorLine(thread.author)}</span>
                </span>
              </Link>
              <span className={styles.grow} />
              <span className={styles.age}>{agoLong(thread.created_at)}</span>
            </div>

            <h1 className={styles.title}>{thread.title}</h1>

            {splitParagraphs(thread.body).map((paragraph, i) => (
              <p key={i} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}

            {thread.attached && <AttachedSittingCard attached={thread.attached} elements={elementsQuery.data} />}
          </div>

          <div className={styles.repliesLabel}>{repliesLabel(thread.replies.length)}</div>

          <div className={styles.replies}>
            {thread.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                threadId={id}
                elements={elementsQuery.data}
                isOwn={meQuery.data?.id === reply.author.id}
                onReplyClick={focusReply}
              />
            ))}
          </div>

          <Spacer />

          <form className={styles.composer} onSubmit={submitReply}>
            <label htmlFor="reply" className="visually-hidden">
              Write a reply
            </label>
            <input
              id="reply"
              ref={replyInputRef}
              type="text"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Answer from your own practice"
              maxLength={5000}
              className={styles.input}
            />
            <button type="submit" aria-label="Send reply" className={styles.send} disabled={!replyBody.trim() || replyMutation.isPending}>
              <SendIcon />
            </button>
          </form>
        </>
      )}
    </Screen>
  )
}

function AttachedSittingCard({ attached, elements }: { attached: AttachedSitting; elements: readonly Element[] | undefined }) {
  return (
    <Link to={paths.shared(attached.session_id)} className={styles.attached}>
      <div className={styles.attachedHeader}>
        <SittingGlyph size={22} />
        <span className={styles.attachedText}>
          <span className={styles.attachedTitle}>{weekdayTime(attached.started_at)}</span>
          <span className={styles.attachedSub}>Shared sitting</span>
        </span>
        <span className={styles.open}>Open</span>
      </div>
      <div className={styles.attachedGrid}>
        <span>
          <span className={styles.gridLabel}>Mode</span>
          <span className={styles.gridValue}>{modeLabel(attached.mode)}</span>
        </span>
        <span>
          <span className={styles.gridLabel}>Object</span>
          <span className={styles.gridValue}>{objectLabel(elements, attached.element_id)}</span>
        </span>
        <span>
          <span className={styles.gridLabel}>Held</span>
          <span className={styles.gridValue}>{clock(attached.duration_seconds)}</span>
        </span>
      </div>
    </Link>
  )
}

interface ReplyItemProps {
  reply: Reply
  threadId: number
  elements: readonly Element[] | undefined
  isOwn: boolean
  onReplyClick: () => void
}

/** One reply, including the "Helpful" toggle - optimistic via useToggleHelpful. Exported for testing. */
export function ReplyItem({ reply, threadId, elements, isOwn, onReplyClick }: ReplyItemProps) {
  const toggleHelpful = useToggleHelpful(threadId)

  return (
    <div className={styles.reply}>
      <div className={styles.authorRow}>
        <Link to={paths.practitioner(reply.author.id)} className={styles.authorLink}>
          <Avatar initial={reply.author.initial} size={30} />
          <span>
            <span className={styles.authorName}>{reply.author.display_name}</span>
            <span className={styles.authorMeta}>{replyAuthorLine(reply.author, elements)}</span>
          </span>
        </Link>
        <span className={styles.grow} />
        <span className={styles.age}>{agoLong(reply.created_at)}</span>
      </div>

      {reply.read_context && (
        <div className={styles.readContext}>
          <EyeIcon size={14} className={styles.eye} />
          <span>Read your sitting and your history before answering</span>
        </div>
      )}

      {splitParagraphs(reply.body).map((paragraph, i) => (
        <p key={i} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          disabled={isOwn}
          aria-pressed={reply.marked_helpful_by_me}
          onClick={() => toggleHelpful.mutate({ replyId: reply.id, marked: reply.marked_helpful_by_me })}
        >
          Helpful · {reply.helpful_count}
        </button>
        <button type="button" className={styles.action} onClick={onReplyClick}>
          Reply
        </button>
      </div>
    </div>
  )
}
