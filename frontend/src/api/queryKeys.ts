// Central query keys so features can invalidate each other's data without guessing strings.
export const queryKeys = {
  elements: ['elements'] as const,
  intents: ['intents'] as const,
  me: ['me'] as const,
  myStats: ['me', 'stats'] as const,
  sessions: ['sessions'] as const,
  session: (id: number) => ['sessions', id] as const,
  threads: ['circle', 'threads'] as const,
  thread: (id: number) => ['circle', 'threads', id] as const,
  shared: (sessionId: number) => ['circle', 'shared', sessionId] as const,
  practitioner: (userId: number) => ['circle', 'practitioners', userId] as const,
  hours: ['circle', 'hours'] as const,
}
