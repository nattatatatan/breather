// Every path in the app, so links are never hand-built strings.
export const paths = {
  home: '/',
  signIn: '/signin',
  mode: '/practice/mode',
  intention: '/practice/intention',
  object: '/practice/object',
  sit: '/sit',
  sessionComplete: (sessionId: number) => `/sit/complete/${sessionId}`,
  you: '/you',
    youPractice: '/you/practice',
  circle: '/circle',
  hours: '/circle/hours',
  compose: (sessionId?: number) => (sessionId ? `/circle/new?session=${sessionId}` : '/circle/new'),
  /** Opens compose with the sitting picker focused (the "Share a sitting" action). */
  composePick: '/circle/new?pick=1',
  thread: (threadId: number) => `/circle/threads/${threadId}`,
  shared: (sessionId: number) => `/circle/shared/${sessionId}`,
  practitioner: (userId: number) => `/circle/practitioners/${userId}`,
} as const
