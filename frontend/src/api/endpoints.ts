import { localTimeZone, request } from './client'
import type {
  Element, HelpfulState, Hours, Intent, Me, MeUpdate, PracticeProfile, PracticeStats, Practitioner,
  Reply, Session, SessionCreate, SessionUpdate, SharedSitting, ThreadCreate, ThreadDetail, ThreadSummary,
} from './types'

// One function per endpoint in docs/api-contract.md. Features wrap these in TanStack Query hooks.

export const catalogApi = {
  elements: () => request<Element[]>('GET', '/api/elements', { auth: false }),
  intents: () => request<Intent[]>('GET', '/api/intents', { auth: false }),
}

export const meApi = {
  get: () => request<Me>('GET', '/api/me'),
  update: (body: MeUpdate) => request<Me>('PATCH', '/api/me', { body }),
  putPractice: (body: PracticeProfile) => request<PracticeProfile>('PUT', '/api/me/practice', { body }),
  stats: () => request<PracticeStats>('GET', '/api/me/stats', { query: { tz: localTimeZone() } }),
}

export const sessionsApi = {
  list: (params: { limit?: number; offset?: number; completed?: boolean } = {}) =>
    request<Session[]>('GET', '/api/sessions', { query: params }),
  get: (id: number) => request<Session>('GET', `/api/sessions/${id}`),
  create: (body: SessionCreate) => request<Session>('POST', '/api/sessions', { body }),
  update: (id: number, body: SessionUpdate) => request<Session>('PATCH', `/api/sessions/${id}`, { body }),
  complete: (id: number, returns: number[]) =>
    request<Session>('POST', `/api/sessions/${id}/complete`, { body: { returns } }),
  remove: (id: number) => request<void>('DELETE', `/api/sessions/${id}`),
}

export const circleApi = {
  threads: (params: { limit?: number; offset?: number } = {}) =>
    request<ThreadSummary[]>('GET', '/api/circle/threads', { query: params }),
  thread: (id: number) => request<ThreadDetail>('GET', `/api/circle/threads/${id}`),
  createThread: (body: ThreadCreate) => request<ThreadDetail>('POST', '/api/circle/threads', { body }),
  reply: (threadId: number, body: string) =>
    request<Reply>('POST', `/api/circle/threads/${threadId}/replies`, { body: { body } }),
  markHelpful: (replyId: number) => request<HelpfulState>('PUT', `/api/circle/replies/${replyId}/helpful`),
  unmarkHelpful: (replyId: number) => request<HelpfulState>('DELETE', `/api/circle/replies/${replyId}/helpful`),
  shared: (sessionId: number) => request<SharedSitting>('GET', `/api/circle/shared/${sessionId}`),
  practitioner: (userId: number) =>
    request<Practitioner>('GET', `/api/circle/practitioners/${userId}`, { query: { tz: localTimeZone() } }),
  hours: () => request<Hours>('GET', '/api/circle/hours', { query: { tz: localTimeZone() } }),
}
