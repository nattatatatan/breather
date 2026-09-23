import type { AttachedSitting, AuthorSummary, Element, Intent } from '@/api/types'
import {
  attachedSittingLine,
  attachedSittingSubline,
  longPractitionerLabel,
  repliesLabel,
  replyAuthorLine,
  returnsNotedLabel,
  returnsSummary,
  sessionModeObjectLabel,
  sharedSittingChips,
  sharedSittingSubtitle,
  sittingNowLabel,
  splitParagraphs,
  tenurePracticing,
  threadAuthorLine,
  timelineGeometry,
  validateThreadDraft,
} from './format'

const ELEMENTS: Element[] = [
  { id: 4, name: 'Breath', slug: 'breath', domain: 'rupa', description: null, image_url: null },
  { id: 6, name: 'Loving-kindness', slug: 'loving-kindness', domain: 'nama', description: null, image_url: null },
]

const INTENTS: Intent[] = [{ id: 4, name: 'Kindness', slug: 'kindness', description: null }]

const MAI: AuthorSummary = {
  id: 1,
  display_name: 'Mai',
  initial: 'M',
  practising_since: '2025-07-01',
  total_seconds: 138 * 3600,
  primary_mode: 'samatha',
  primary_element_id: 4,
}

const ARI: AuthorSummary = {
  id: 2,
  display_name: 'Ari',
  initial: 'A',
  practising_since: '2020-05-01',
  total_seconds: 1240 * 3600,
  primary_mode: 'samatha',
  primary_element_id: 6,
}

describe('circle format', () => {
  it('tenurePracticing', () => {
    expect(tenurePracticing('2025-07-01')).toContain('practising')
  })

  it('threadAuthorLine always uses the mode', () => {
    expect(threadAuthorLine(MAI)).toBe(`${'1y 2m'} · 138h · samatha`)
  })

  it('replyAuthorLine prefers the object over the mode', () => {
    expect(replyAuthorLine(ARI, ELEMENTS)).toBe('6y · 1,240h · metta')
  })

  it('replyAuthorLine falls back to mode with no element data', () => {
    const noElement: AuthorSummary = { ...ARI, primary_element_id: null }
    expect(replyAuthorLine(noElement, ELEMENTS)).toBe('6y · 1,240h · samatha')
  })

  it('attachedSittingLine', () => {
    const attached: AttachedSitting = {
      session_id: 42,
      started_at: '2026-09-22T12:40:00Z',
      mode: 'samatha',
      element_id: 4,
      intent_id: 4,
      duration_seconds: 1800,
      return_count: 3,
    }
    expect(attachedSittingLine(attached, ELEMENTS)).toBe('Samatha · Breath · 30:00')
    expect(attachedSittingSubline(attached, INTENTS)).toBe('Intention: kindness · 3 returns noted')
  })

  it('attachedSittingSubline without an intention', () => {
    const attached: AttachedSitting = {
      session_id: 42,
      started_at: '2026-09-22T12:40:00Z',
      mode: 'samatha',
      element_id: 4,
      intent_id: null,
      duration_seconds: 1800,
      return_count: 0,
    }
    expect(attachedSittingSubline(attached, INTENTS)).toBe('no returns noted')
  })

  it('returnsNotedLabel pluralises', () => {
    expect(returnsNotedLabel(0)).toBe('no returns noted')
    expect(returnsNotedLabel(1)).toBe('1 return noted')
    expect(returnsNotedLabel(3)).toBe('3 returns noted')
  })

  it('repliesLabel pluralises', () => {
    expect(repliesLabel(0)).toBe('0 replies')
    expect(repliesLabel(1)).toBe('1 reply')
    expect(repliesLabel(7)).toBe('7 replies')
  })

  it('longPractitionerLabel', () => {
    expect(longPractitionerLabel(0)).toBeNull()
    expect(longPractitionerLabel(1)).toBe('1 from a long practitioner')
    expect(longPractitionerLabel(2)).toBe('2 from long practitioners')
  })

  it('sittingNowLabel', () => {
    expect(sittingNowLabel(0)).toBe('No one else is sitting right now.')
    expect(sittingNowLabel(1)).toBe('1 person is sitting right now.')
    expect(sittingNowLabel(23)).toBe('23 people are sitting right now.')
  })

  it('sharedSittingChips', () => {
    expect(sharedSittingChips({ sound: 'silent', timer_visible: false, started_at: '2026-09-22T19:40:00' })).toEqual([
      'Silent',
      'Timer hidden',
      'Evening',
    ])
    expect(sharedSittingChips({ sound: 'bell', timer_visible: true, started_at: '2026-09-22T07:00:00' })).toEqual([
      'Bell',
      'Timer shown',
      'Morning',
    ])
  })

  it('sessionModeObjectLabel', () => {
    expect(sessionModeObjectLabel('samatha', 4, ELEMENTS)).toBe('Samatha · breath')
    expect(sessionModeObjectLabel('vipassana', undefined, ELEMENTS)).toBe('Vipassana')
  })

  it('returnsSummary with no returns', () => {
    expect(returnsSummary([], 1800)).toBe('No returns noted during this sitting.')
  })

  it('returnsSummary concentrated early', () => {
    expect(returnsSummary([95, 240, 530], 1800)).toBe('Three returns noted, all within the first 10 minutes.')
  })

  it('returnsSummary concentrated late', () => {
    expect(returnsSummary([1700, 1750], 1800)).toBe('Two returns noted, all in the final stretch.')
  })

  it('returnsSummary spread out', () => {
    expect(returnsSummary([100, 900, 1700], 1800)).toBe('Three returns noted, spread across the sitting.')
  })

  it('timelineGeometry maps returns onto the axis', () => {
    const geo = timelineGeometry([0, 1800], 1800, 334, 64)
    expect(geo.axisX1).toBe(2)
    expect(geo.axisX2).toBe(332)
    expect(geo.ticks[0]).toBeCloseTo(2)
    expect(geo.ticks[1]).toBeCloseTo(332)
  })

  it('validateThreadDraft', () => {
    expect(validateThreadDraft('Hi', 'A body')).toEqual({ title: 'Title should be between 4 and 140 characters.' })
    expect(validateThreadDraft('A good title', '')).toEqual({ body: 'Say something before you post.' })
    expect(validateThreadDraft('A good title', 'A fine body')).toEqual({})
  })

  it('sharedSittingSubtitle', () => {
    expect(sharedSittingSubtitle('2026-09-22T19:40:00', '2025-07-01')).toBe('Tuesday 19:40 · 1y 2m practising · see history')
  })

  it('splitParagraphs', () => {
    expect(splitParagraphs('One.\n\nTwo.\n\n\nThree.')).toEqual(['One.', 'Two.', 'Three.'])
    expect(splitParagraphs('Just one line.')).toEqual(['Just one line.'])
  })
})
