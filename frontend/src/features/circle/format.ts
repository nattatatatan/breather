// Pure view-model helpers for the Circle feature. No fetching, no React - just data in, strings/geometry out.
import type { AttachedSitting, AuthorSummary, Element, Intent, PracticeMode, SharedSitting } from '@/api/types'
import { intentLabel, modeLabel, objectLabel } from '@/catalog/practice'
import { clock, hours, tenure, timeOfDay, weekdayTime } from '@/lib/format'

/** "1y 2m practising" - the discussion-list author line. */
export function tenurePracticing(since: string): string {
  return `${tenure(since)} practising`
}

/** "1y 2m · 138h · samatha" - the thread's original-post header. Descriptor is always the mode. */
export function threadAuthorLine(author: AuthorSummary): string {
  const parts = [tenure(author.practising_since), hours(author.total_seconds)]
  if (author.primary_mode) parts.push(modeLabel(author.primary_mode).toLowerCase())
  return parts.join(' · ')
}

/**
 * "6y · 1,240h · breath" - a reply's author line. Descriptor prefers the object they
 * practise most (more specific than mode) and falls back to mode when no element data exists.
 */
export function replyAuthorLine(author: AuthorSummary, elements: readonly Element[] | undefined): string {
  const parts = [tenure(author.practising_since), hours(author.total_seconds)]
  const object = author.primary_element_id != null ? objectLabel(elements, author.primary_element_id) : ''
  const descriptor = object || (author.primary_mode ? modeLabel(author.primary_mode) : '')
  if (descriptor) parts.push(descriptor.toLowerCase())
  return parts.join(' · ')
}

/** "Samatha · Breath · 30:00" - the compact attached-sitting summary shown in cards. */
export function attachedSittingLine(attached: AttachedSitting, elements: readonly Element[] | undefined): string {
  const parts = [modeLabel(attached.mode), objectLabel(elements, attached.element_id), clock(attached.duration_seconds)]
  return parts.filter(Boolean).join(' · ')
}

/** "Intention: kindness · 3 returns noted" (or just the returns clause when there is no intention). */
export function attachedSittingSubline(attached: AttachedSitting, intents: readonly Intent[] | undefined): string {
  const intent = attached.intent_id != null ? intentLabel(intents, attached.intent_id) : ''
  const returns = returnsNotedLabel(attached.return_count)
  return intent ? `Intention: ${intent.toLowerCase()} · ${returns}` : returns
}

/** "no returns noted" / "1 return noted" / "3 returns noted". */
export function returnsNotedLabel(count: number): string {
  if (count <= 0) return 'no returns noted'
  return `${count} ${count === 1 ? 'return' : 'returns'} noted`
}

/** "7 replies" / "1 reply" / "0 replies". */
export function repliesLabel(count: number): string {
  return `${count} ${count === 1 ? 'reply' : 'replies'}`
}

/** "2 from long practitioners" - null when there are none, so callers can skip rendering it. */
export function longPractitionerLabel(count: number): string | null {
  if (count <= 0) return null
  return `${count} from ${count === 1 ? 'a long practitioner' : 'long practitioners'}`
}

/** "No one else is sitting right now." / "1 person is sitting right now." / "N people are sitting right now." */
export function sittingNowLabel(count: number): string {
  if (count <= 0) return 'No one else is sitting right now.'
  if (count === 1) return '1 person is sitting right now.'
  return `${count} people are sitting right now.`
}

/** "Tuesday 19:40 · 1y 2m practising · see history" - the shared-sitting author subtitle. */
export function sharedSittingSubtitle(startedAt: string, practisingSince: string): string {
  return `${weekdayTime(startedAt).replace(',', '')} · ${tenurePracticing(practisingSince)} · see history`
}

/** Silent/Bell, Timer hidden/shown, time of day - the shared-sitting condition chips. */
export function sharedSittingChips(sitting: Pick<SharedSitting, 'sound' | 'timer_visible' | 'started_at'>): string[] {
  return [sitting.sound === 'bell' ? 'Bell' : 'Silent', sitting.timer_visible ? 'Timer shown' : 'Timer hidden', timeOfDay(sitting.started_at)]
}

/** "Samatha · breath" - a compose-picker row: mode title case, object lower case. */
export function sessionModeObjectLabel(mode: PracticeMode, elementId: number | undefined, elements: readonly Element[] | undefined): string {
  const object = elementId != null ? objectLabel(elements, elementId) : ''
  return object ? `${modeLabel(mode)} · ${object.toLowerCase()}` : modeLabel(mode)
}

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n)
}

function minutesWord(totalSeconds: number): string {
  const m = Math.round(Math.max(0, totalSeconds) / 60)
  if (m <= 0) return 'under a minute'
  return `${m} minute${m === 1 ? '' : 's'}`
}

/**
 * A calm, accurate sentence about where attention went during a sitting. Only describes the
 * returns actually recorded - there is no "warmth" signal in the data, so none is claimed.
 */
export function returnsSummary(returns: readonly number[], durationSeconds: number): string {
  const count = returns.length
  if (count === 0) return 'No returns noted during this sitting.'
  const noun = count === 1 ? 'return' : 'returns'
  const word = countWord(Math.min(count, 10))
  if (durationSeconds <= 0) return `${word} ${noun} noted.`

  const last = returns[returns.length - 1]
  const first = returns[0]
  const third = durationSeconds / 3

  if (last <= third) {
    return `${word} ${noun} noted, all within the first ${minutesWord(third)}.`
  }
  if (first >= durationSeconds - third) {
    return `${word} ${noun} noted, all in the final stretch.`
  }
  return `${word} ${noun} noted, spread across the sitting.`
}

export interface TimelineGeometry {
  width: number
  height: number
  axisY: number
  axisX1: number
  axisX2: number
  tickY1: number
  tickY2: number
  ticks: number[]
}

/** Pixel geometry for the "Where attention went" timeline, matching the design's 334x64 SVG. */
export function timelineGeometry(returns: readonly number[], durationSeconds: number, width = 334, height = 64): TimelineGeometry {
  const axisX1 = 2
  const axisX2 = width - 2
  const axisY = height / 2
  const tickY1 = axisY - 12
  const tickY2 = axisY + 12
  const span = axisX2 - axisX1
  const ticks =
    durationSeconds > 0 ? returns.map((t) => axisX1 + Math.min(1, Math.max(0, t / durationSeconds)) * span) : []
  return { width, height, axisY, axisX1, axisX2, tickY1, tickY2, ticks }
}

/** Splits a post/reply body into paragraphs on blank lines, trimming stray whitespace. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export interface ThreadDraftErrors {
  title?: string
  body?: string
}

/** Contract limits: title 4..140, body 1..5000. */
export function validateThreadDraft(title: string, body: string): ThreadDraftErrors {
  const errors: ThreadDraftErrors = {}
  const t = title.trim()
  const b = body.trim()
  if (t.length < 4 || t.length > 140) errors.title = 'Title should be between 4 and 140 characters.'
  if (b.length < 1 || b.length > 5000) errors.body = b.length ? 'Body should be under 5000 characters.' : 'Say something before you post.'
  return errors
}
