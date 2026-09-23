import type { Element, Intent, PracticeProfile } from '@/api/types'
import {
  buildPracticePayload,
  draftFromProfile,
  draftToSearch,
  needsModeRedirect,
  readDraft,
  resolveIntent,
  resolveMode,
  resolveObject,
  stayWithLabel,
} from './flow'

const ELEMENTS: Element[] = [
  { id: 4, name: 'Breath', slug: 'breath', domain: 'rupa', description: null, image_url: null },
  { id: 6, name: 'Fire Kasina', slug: 'fire', domain: 'rupa', description: null, image_url: null },
]

const INTENTS: Intent[] = [
  { id: 1, name: 'Calm', slug: 'calm', description: null },
  { id: 3, name: 'Devotion', slug: 'devotion', description: null },
]

describe('readDraft / draftToSearch', () => {
  it('round-trips a full draft through a query string', () => {
    const search = draftToSearch({ mode: 'samatha', intent: 'calm', object: 'fire' })
    expect(search).toBe('mode=samatha&intent=calm&object=fire')
    expect(readDraft(new URLSearchParams(search))).toEqual({ mode: 'samatha', intent: 'calm', object: 'fire' })
  })

  it('drops an invalid mode instead of trusting the URL', () => {
    expect(readDraft(new URLSearchParams('mode=nonsense'))).toEqual({ mode: undefined, intent: undefined, object: undefined })
  })

  it('omits empty fields when serializing', () => {
    expect(draftToSearch({ mode: 'vipassana' })).toBe('mode=vipassana')
  })
})

describe('needsModeRedirect', () => {
  it('is true with no mode param', () => {
    expect(needsModeRedirect(new URLSearchParams(''))).toBe(true)
  })

  it('is true for a malformed mode', () => {
    expect(needsModeRedirect(new URLSearchParams('mode=zen'))).toBe(true)
  })

  it('is false once a real mode is present', () => {
    expect(needsModeRedirect(new URLSearchParams('mode=samatha'))).toBe(false)
  })
})

describe('draftFromProfile', () => {
  it('is empty with no profile', () => {
    expect(draftFromProfile(null, ELEMENTS, INTENTS)).toEqual({})
  })

  it('resolves slugs from the profile ids', () => {
    const profile: PracticeProfile = { mode: 'samatha', intent_id: 3, element_id: 6, environment: 'dissolve', duration_seconds: 1800, sound: 'silent', timer_visible: false }
    expect(draftFromProfile(profile, ELEMENTS, INTENTS)).toEqual({ mode: 'samatha', intent: 'devotion', object: 'fire' })
  })
})

describe('resolveMode / resolveIntent / resolveObject', () => {
  it('mode: URL wins over the profile, which wins over the default', () => {
    expect(resolveMode({ mode: 'vipassana' }, { mode: 'samatha' })).toBe('vipassana')
    expect(resolveMode({}, { mode: 'samatha' })).toBe('samatha')
    expect(resolveMode({}, {})).toBe('samatha') // calm abiding is the flow's default
  })

  it('intent falls back to "calm" when neither the URL nor the profile has one', () => {
    expect(resolveIntent({ intent: 'joy' }, { intent: 'calm' })).toBe('joy')
    expect(resolveIntent({}, { intent: 'devotion' })).toBe('devotion')
    expect(resolveIntent({}, {})).toBe('calm')
  })

  it('object has no fallback: a first-time visitor must choose one', () => {
    expect(resolveObject({ object: 'water' }, { object: 'fire' })).toBe('water')
    expect(resolveObject({}, { object: 'fire' })).toBe('fire')
    expect(resolveObject({}, {})).toBeUndefined()
  })
})

describe('buildPracticePayload', () => {
  it('defaults duration/sound/timer for a first-time practitioner', () => {
    const payload = buildPracticePayload(null, { mode: 'samatha', intentId: 1, elementSlug: 'breath', elementId: 4 })
    expect(payload).toEqual({
      mode: 'samatha',
      intent_id: 1,
      element_id: 4,
      environment: 'still',
      duration_seconds: 1200,
      sound: 'silent',
      timer_visible: false,
    })
  })

  it('carries over duration/sound/timer from the existing profile', () => {
    const current: PracticeProfile = { mode: 'vipassana', intent_id: 3, element_id: 6, environment: 'still', duration_seconds: 2700, sound: 'bell', timer_visible: true }
    const payload = buildPracticePayload(current, { mode: 'samatha', intentId: 1, elementSlug: 'fire', elementId: 6 })
    expect(payload.duration_seconds).toBe(2700)
    expect(payload.sound).toBe('bell')
    expect(payload.timer_visible).toBe(true)
  })

  it("uses the object's first supported environment, e.g. fire defaults to dissolve", () => {
    const payload = buildPracticePayload(null, { mode: 'samatha', intentId: 1, elementSlug: 'fire', elementId: 6 })
    expect(payload.environment).toBe('dissolve')
  })

  it('non-fire objects default to a still environment', () => {
    const payload = buildPracticePayload(null, { mode: 'samatha', intentId: 1, elementSlug: 'breath', elementId: 4 })
    expect(payload.environment).toBe('still')
  })
})

describe('stayWithLabel', () => {
  it('is generic until an object is chosen', () => {
    expect(stayWithLabel(ELEMENTS, undefined)).toBe('Stay with it')
  })

  it('lower-cases the catalog label', () => {
    expect(stayWithLabel(ELEMENTS, 'fire')).toBe('Stay with fire')
    expect(stayWithLabel(ELEMENTS, 'breath')).toBe('Stay with breath')
  })
})
