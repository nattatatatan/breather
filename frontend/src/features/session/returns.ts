// Pure helpers for the "I wandered and came back" log and the discard rule.

/** A sitting ended by hold-to-end before this many seconds is discarded rather than completed. */
export const DISCARD_UNDER_SECONDS = 60

/** Appends a return at the given elapsed second, clamped to non-negative and to the session length. */
export function recordReturn(existing: readonly number[], elapsedAt: number, maxSeconds?: number): number[] {
  const rounded = Math.max(0, Math.round(elapsedAt))
  const bounded = maxSeconds != null ? Math.min(rounded, Math.max(0, Math.floor(maxSeconds))) : rounded
  return [...existing, bounded]
}

/** True when a sitting ended this early should be discarded instead of completed. */
export function shouldDiscard(elapsedSeconds: number): boolean {
  return elapsedSeconds < DISCARD_UNDER_SECONDS
}
