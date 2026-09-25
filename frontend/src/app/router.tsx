import { createBrowserRouter } from 'react-router'
import { SignInScreen } from '@/features/auth/SignInScreen'
import { ComposeScreen } from '@/features/circle/ComposeScreen'
import { DiscussionScreen } from '@/features/circle/DiscussionScreen'
import { HoursScreen } from '@/features/circle/HoursScreen'
import { PractitionerScreen } from '@/features/circle/PractitionerScreen'
import { SharedSittingScreen } from '@/features/circle/SharedSittingScreen'
import { ThreadScreen } from '@/features/circle/ThreadScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { IntentionScreen } from '@/features/practice/IntentionScreen'
import { ModeScreen } from '@/features/practice/ModeScreen'
import { ObjectScreen } from '@/features/practice/ObjectScreen'
import { SessionCompleteScreen } from '@/features/session/SessionCompleteScreen'
import { SessionScreen } from '@/features/session/SessionScreen'
import { YouScreen } from '@/features/you/YouScreen'
import { PracticeScreen } from '@/features/you/PracticeScreen'
import { DiaryScreen } from '@/features/you/DiaryScreen'
import { RequireAuth } from './RequireAuth'
import { RootLayout } from './RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/signin', element: <SignInScreen /> },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <HomeScreen /> },
          { path: 'practice/mode', element: <ModeScreen /> },
          { path: 'practice/intention', element: <IntentionScreen /> },
          { path: 'practice/object', element: <ObjectScreen /> },
          { path: 'sit', element: <SessionScreen /> },
          { path: 'sit/complete/:sessionId', element: <SessionCompleteScreen /> },
          { path: 'you', element: <YouScreen /> },
          { path: 'you/practice', element: <PracticeScreen />},
          { path: 'you/diary', element: <DiaryScreen/>},
          { path: 'you/diary/:sessionId', element: <DiarySessionScreen /> },
          { path: 'circle', element: <DiscussionScreen /> },
          { path: 'circle/hours', element: <HoursScreen /> },
          { path: 'circle/new', element: <ComposeScreen /> },
          { path: 'circle/threads/:threadId', element: <ThreadScreen /> },
          { path: 'circle/shared/:sessionId', element: <SharedSittingScreen /> },
          { path: 'circle/practitioners/:userId', element: <PractitionerScreen /> },
        ],
      },
      { path: '*', element: <HomeScreen /> },
    ],
  },
])
