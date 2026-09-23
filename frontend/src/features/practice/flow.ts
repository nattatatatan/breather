import type { Element, Intent, PracticeMode, PracticeProfile } from '@/api/types'
import { OBJECTS } from '@/catalog/practice'

// The Mode -> Intention -> Object flow keeps its draft in the URL (search params), not React state or
// context: it survives a refresh and back/forward navigation for free, and "Change practice" can deep-link
// straight into it pre-filled. Params are catalog slugs, never raw API ids, so the URL stays readable.

export interface PracticeDraft {
  mode?: PracticeMode
  intent?: string
  object?: string
}

const MODES: readonly PracticeMode[] = ['samatha', 'vipassana']
const DEFAULT_MODE: PracticeMode = 'samatha'
const DEFAULT_INTENT_SLUG = 'calm'

function isPracticeMode(value: string | null): value is PracticeMode {
  return value !== null && (MODES as readonly string[]).includes(value)
}

/** Read the draft carried in the URL. Unknown or malformed values are dropped, not trusted. */
export function readDraft(params: URLSearchParams): PracticeDraft {
  const mode = params.get('mode')
  const intent = params.get('intent')
  const object = params.get('object')
  return {
    mode: isPracticeMode(mode) ? mode : undefined,
    intent: intent ?? undefined,
    object: object ?? undefined,
  }
}

/** Serialize a draft back to a query string (no leading `?`), omitting empty fields. */
export function draftToSearch(draft: PracticeDraft): string {
  const params = new URLSearchParams()
  if (draft.mode) params.set('mode', draft.mode)
  if (draft.intent) params.set('intent', draft.intent)
  if (draft.object) params.set('object', draft.object)
  return params.toString()
}

/** Slug of the mode/intent/object on an existing profile, for pre-filling "Change practice". */
export function draftFromProfile(profile: PracticeProfile | null | undefined, elements: readonly Element[] | undefined, intents: readonly Intent[] | undefined): PracticeDraft {
  if (!profile) return {}
  return {
    mode: profile.mode,
    intent: intents?.find((i) => i.id === profile.intent_id)?.slug,
    object: elements?.find((e) => e.id === profile.element_id)?.slug,
  }
}

/** Mode screen: URL wins, else the existing profile's mode, else the calm-abiding default. */
export function resolveMode(urlDraft: PracticeDraft, profileDraft: PracticeDraft): PracticeMode {
  return urlDraft.mode ?? profileDraft.mode ?? DEFAULT_MODE
}

/** Intention screen: URL wins, else the existing profile's intent, else "Calm". */
export function resolveIntent(urlDraft: PracticeDraft, profileDraft: PracticeDraft): string {
  return urlDraft.intent ?? profileDraft.intent ?? DEFAULT_INTENT_SLUG
}

/** Object screen has no fallback default: a first-time visitor must choose one explicitly. */
export function resolveObject(urlDraft: PracticeDraft, profileDraft: PracticeDraft): string | undefined {
  return urlDraft.object ?? profileDraft.object
}

/** Intention and Object both require a mode to already be in the URL; otherwise send the visitor back. */
export function needsModeRedirect(params: URLSearchParams): boolean {
  return !isPracticeMode(params.get('mode'))
}

/**
 * The PUT /api/me/practice body for finishing the flow: mode/intent/object come from the draft,
 * environment defaults to the object's first supported one, everything else is carried over from
 * the existing profile (or the contract's own defaults for a first-time practitioner).
 */
export function buildPracticePayload(
  current: PracticeProfile | null | undefined,
  draft: { mode: PracticeMode; intentId: number; elementSlug: string; elementId: number },
): PracticeProfile {
  const entry = OBJECTS.find((o) => o.slug === draft.elementSlug)
  const environment = entry?.environments[0] ?? 'still'
  return {
    mode: draft.mode,
    intent_id: draft.intentId,
    element_id: draft.elementId,
    environment,
    duration_seconds: current?.duration_seconds ?? 1200,
    sound: current?.sound ?? 'silent',
    timer_visible: current?.timer_visible ?? false,
  }
}

/** "Stay with fire" from a chosen object slug; empty until one is picked. */
export function stayWithLabel(elements: readonly Element[] | undefined, slug: string | undefined): string {
  if (!slug || !elements) return 'Stay with it'
  const element = elements.find((e) => e.slug === slug)
  const label = element ? OBJECTS.find((o) => o.slug === element.slug)?.label ?? element.name : undefined
  return label ? `Stay with ${label.toLowerCase()}` : 'Stay with it'
}
