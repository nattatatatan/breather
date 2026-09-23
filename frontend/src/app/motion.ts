// Shared motion constants for route transitions (src/app/RootLayout.tsx) and any screen that
// participates in a shared-layout "camera move" (the Home figure growing into the session figure).
// Kept separate from RootLayout so other features can import the constants without importing React.

/** Mirrors --ease-calm in styles/tokens.css (cubic-bezier(0.22, 0.61, 0.36, 1)). */
export const EASE_CALM: [number, number, number, number] = [0.22, 0.61, 0.36, 1]

/** Default cross-fade between routes. */
export const CALM_MS = 350

/** "Begin - the camera walks in" (Home -> /sit): the figure grows over ~2s while Home dissolves. */
export const WALK_IN_MS = 2000

/**
 * Shared layout id for the practice-object figure. Home puts it on the figure shown while idle;
 * the session screen (features/session) puts it on the wrapper around the same figure so Motion
 * animates one continuous shape growing to fill the frame across the route change.
 */
export const PRACTICE_FIGURE_LAYOUT_ID = 'practice-object'
