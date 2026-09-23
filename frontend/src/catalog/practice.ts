import type { Element, Intent, PracticeMode } from '@/api/types'

// Presentation catalog. The API owns ids and existence; the UI owns labels, copy and order,
// taken verbatim from docs/ui-design.html.

export type SessionScene = 'buddha' | 'fire' | 'still'

export interface ObjectEntry {
  slug: string
  label: string
  /** Which session renderer draws this object. */
  scene: SessionScene
  /** Environments the object supports; first is the default. */
  environments: readonly ('still' | 'dissolve')[]
}

export const OBJECTS: readonly ObjectEntry[] = [
  { slug: 'breath', label: 'Breath', scene: 'still', environments: ['still'] },
  { slug: 'light', label: 'Light', scene: 'still', environments: ['still'] },
  { slug: 'fire', label: 'Fire', scene: 'fire', environments: ['dissolve', 'still'] },
  { slug: 'water', label: 'Water', scene: 'still', environments: ['still'] },
  { slug: 'earth', label: 'Earth', scene: 'still', environments: ['still'] },
  { slug: 'buddha-recollection', label: 'Buddha', scene: 'buddha', environments: ['still'] },
  { slug: 'loving-kindness', label: 'Metta', scene: 'still', environments: ['still'] },
  { slug: 'walking', label: 'Walking', scene: 'still', environments: ['still'] },
]

export interface IntentEntry {
  slug: string
  label: string
  blurb: string
}

export const INTENTS: readonly IntentEntry[] = [
  { slug: 'calm', label: 'Calm', blurb: 'Something that settles the mind.' },
  { slug: 'joy', label: 'Joy', blurb: 'Something that brings wholesome gladness.' },
  { slug: 'devotion', label: 'Devotion', blurb: 'Something that inspires confidence and reverence.' },
  { slug: 'kindness', label: 'Kindness', blurb: 'A person or beings that support good will.' },
  { slug: 'clarity', label: 'Clarity', blurb: 'Something simple that steadies attention.' },
]

export interface ModeEntry {
  mode: PracticeMode
  label: string
  gloss: string
  blurb: string
}

export const MODES: readonly ModeEntry[] = [
  {
    mode: 'samatha',
    label: 'Samatha',
    gloss: 'Calm abiding',
    blurb: 'One object, held. Attention narrows and gathers until the mind unifies around it.',
  },
  {
    mode: 'vipassana',
    label: 'Vipassana',
    gloss: 'Insight',
    blurb: 'Whatever arises is the object. Attention stays open and notes what comes and goes.',
  },
]

export const modeLabel = (mode: PracticeMode) => MODES.find((m) => m.mode === mode)?.label ?? mode

/** Join catalog entries with API rows, dropping anything the backend does not have. */
export function joinObjects(elements: readonly Element[]) {
  return OBJECTS.flatMap((entry) => {
    const element = elements.find((e) => e.slug === entry.slug)
    return element ? [{ ...entry, id: element.id }] : []
  })
}

export function joinIntents(intents: readonly Intent[]) {
  return INTENTS.flatMap((entry) => {
    const intent = intents.find((i) => i.slug === entry.slug)
    return intent ? [{ ...entry, id: intent.id }] : []
  })
}

/** Label for an element id, falling back to the API name for elements outside the curated list. */
export function objectLabel(elements: readonly Element[] | undefined, id: number | null | undefined): string {
  if (id == null || !elements) return ''
  const element = elements.find((e) => e.id === id)
  if (!element) return ''
  return OBJECTS.find((o) => o.slug === element.slug)?.label ?? element.name
}

export function intentLabel(intents: readonly Intent[] | undefined, id: number | null | undefined): string {
  if (id == null || !intents) return ''
  const intent = intents.find((i) => i.id === id)
  if (!intent) return ''
  return INTENTS.find((i) => i.slug === intent.slug)?.label ?? intent.name
}
