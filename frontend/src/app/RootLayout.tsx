import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { createContext, useContext, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation, useOutlet } from 'react-router'
import { CALM_MS, EASE_CALM, WALK_IN_MS } from './motion'
import { paths } from './routes'

export type TransitionKind = 'calm' | 'walkIn'

interface TransitionState {
  kind: TransitionKind
  reducedMotion: boolean
}

const TransitionContext = createContext<TransitionState>({ kind: 'calm', reducedMotion: false })

/**
 * What kind of route transition is currently playing. Home reads this to decide whether its
 * wordmark/tagline/nav dissolve individually (the "walk in" move) or just ride the page-level
 * cross-fade (everything else). The session screen can read it too when it lands from Home.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useTransitionKind(): TransitionState {
  return useContext(TransitionContext)
}

/**
 * Keeps rendering the outlet element that was current when this component last mounted, even as
 * the router moves on to a new route. AnimatePresence mounts one of these per route (keyed by
 * pathname below); each instance freezes its own outlet on first render, so the outgoing route
 * keeps rendering its own screen - unaffected by the new route's data - for the length of its
 * exit animation.
 */
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

/**
 * Wraps every route: page transitions and the "camera" moves (docs/design/boards/10-camera-moves.html)
 * are orchestrated here. Default route changes get a calm cross-fade; Home -> /sit ("Begin") gets the
 * camera-walks-in move via a motion shared layout (see PRACTICE_FIGURE_LAYOUT_ID in ./motion).
 */
export function RootLayout() {
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  // Track the pathname before this one, without a ref or an effect: adjusting state while
  // rendering (see https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // keeps it correct for this same render, which a `useEffect` (running after paint) could not.
  const [previousPathname, setPreviousPathname] = useState(location.pathname)
  const [seenPathname, setSeenPathname] = useState(location.pathname)
  if (location.pathname !== seenPathname) {
    setPreviousPathname(seenPathname)
    setSeenPathname(location.pathname)
  }

  const isWalkIn = previousPathname === paths.home && location.pathname === paths.sit
  const kind: TransitionKind = isWalkIn ? 'walkIn' : 'calm'

  // The auth gate (RequireAuth, SignInScreen) redirects using a `state` payload that changes on
  // every render, so a frozen-but-still-mounted instance of it can keep re-navigating as the
  // location it observes keeps moving underneath it - freezing it for a crossfade risks feeding
  // that loop. Auth transitions were never part of the "camera" motion language anyway, so swap
  // instantly there instead of animating.
  const isAuthBoundary = location.pathname === paths.signIn || previousPathname === paths.signIn

  if (isAuthBoundary) {
    return (
      <TransitionContext.Provider value={{ kind: 'calm', reducedMotion: !!reducedMotion }}>
        <Outlet />
        <ScrollRestoration />
      </TransitionContext.Provider>
    )
  }

  const variants = reducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1, transition: { duration: 0 } } }
    : kind === 'walkIn'
      ? {
          // No page-level fade: the figure must stay visible while it grows. Home's own children
          // dissolve themselves (see useTransitionKind), and this wrapper just holds the outgoing
          // route mounted for as long as that takes.
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 1, transition: { duration: WALK_IN_MS / 1000 } },
        }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: CALM_MS / 1000, ease: EASE_CALM } },
          exit: { opacity: 0, transition: { duration: CALM_MS / 1000, ease: EASE_CALM } },
        }

  return (
    <TransitionContext.Provider value={{ kind, reducedMotion: !!reducedMotion }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={location.pathname} initial={variants.initial} animate={variants.animate} exit={variants.exit}>
          <FrozenOutlet />
        </motion.div>
      </AnimatePresence>
      <ScrollRestoration />
    </TransitionContext.Provider>
  )
}
