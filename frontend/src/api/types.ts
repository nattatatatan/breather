// TypeScript mirror of docs/api-contract.md. Keep the two in lockstep.

export type PracticeMode = 'samatha' | 'vipassana'
export type SessionVisibility = 'private' | 'community'
export type Environment = 'still' | 'dissolve'
export type Sound = 'silent' | 'bell'

/** ISO-8601 UTC timestamp. */
export type Timestamp = string
/** ISO date, YYYY-MM-DD. */
export type IsoDate = string

export const LONG_PRACTITIONER_SECONDS = 300 * 3600

export interface Element {
  id: number
  name: string
  slug: string
  domain: 'rupa' | 'nama' | null
  description: string | null
  image_url: string | null
}

export interface Intent {
  id: number
  name: string
  slug: string
  description: string | null
}

export interface PracticeProfile {
  mode: PracticeMode
  intent_id: number
  element_id: number
  environment: Environment
  duration_seconds: number
  sound: Sound
  timer_visible: boolean
}

export interface Me {
  id: number
  display_name: string
  practising_since: IsoDate
  location: string | null
  bio: string | null
  created_at: Timestamp
  practice: PracticeProfile | null
}

export interface MeUpdate {
  display_name?: string
  practising_since?: IsoDate
  location?: string | null
  bio?: string | null
}

export interface PracticeStats {
  total_seconds: number
  longest_seconds: number
  session_count: number
  shared_count: number
  current_streak_days: number
  month_seconds: number
  mode_split: { mode: PracticeMode; seconds: number }[]
  by_element: { element_id: number; seconds: number }[]
}

export interface Session {
  id: number
  started_at: Timestamp
  completed_at: Timestamp | null
  duration_seconds: number | null
  planned_seconds: number
  mode: PracticeMode
  intent_id: number | null
  element_ids: number[]
  environment: Environment
  sound: Sound
  timer_visible: boolean
  returns: number[]
  note: string | null
  feeling: string | null
  visibility: SessionVisibility
  thread_id: number | null
}

export interface SessionCreate {
  element_ids: number[]
  mode: PracticeMode
  intent_id?: number | null
  planned_seconds: number
  environment: Environment
  sound: Sound
  timer_visible: boolean
}

export interface SessionUpdate {
  note?: string | null
  feeling?: string | null
  visibility?: SessionVisibility
}

export interface AuthorSummary {
  id: number
  display_name: string
  initial: string
  practising_since: IsoDate
  total_seconds: number
  primary_mode: PracticeMode | null
  primary_element_id: number | null
}

export interface AttachedSitting {
  session_id: number
  started_at: Timestamp
  mode: PracticeMode
  element_id: number
  intent_id: number | null
  duration_seconds: number
  return_count: number
}

export interface ThreadSummary {
  id: number
  author: AuthorSummary
  title: string
  excerpt: string
  created_at: Timestamp
  mode: PracticeMode | null
  element_id: number | null
  attached: AttachedSitting | null
  reply_count: number
  long_practitioner_reply_count: number
}

export interface Reply {
  id: number
  author: AuthorSummary
  body: string
  created_at: Timestamp
  helpful_count: number
  marked_helpful_by_me: boolean
  read_context: boolean
}

export interface ThreadDetail extends ThreadSummary {
  body: string
  replies: Reply[]
}

export interface ThreadCreate {
  title: string
  body: string
  mode?: PracticeMode | null
  element_id?: number | null
  session_id?: number | null
}

export interface HelpfulState {
  helpful_count: number
  marked_helpful_by_me: boolean
}

export interface SharedSitting {
  session_id: number
  author: AuthorSummary
  started_at: Timestamp
  mode: PracticeMode
  intent_id: number | null
  element_id: number
  duration_seconds: number
  planned_seconds: number
  environment: Environment
  sound: Sound
  timer_visible: boolean
  returns: number[]
  note: string | null
  thread_id: number | null
}

export interface Practitioner {
  author: AuthorSummary
  location: string | null
  bio: string | null
  stats: PracticeStats
  shared_sittings: AttachedSitting[]
  open_thread_id: number | null
}

export interface HoursEntry {
  rank: number
  user_id: number
  display_name: string
  seconds: number
  is_me: boolean
}

export interface Hours {
  month: string
  entries: HoursEntry[]
  me: HoursEntry | null
  sitting_now: number
}
