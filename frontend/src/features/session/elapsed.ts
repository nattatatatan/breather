import { useEffect, useRef, useState } from 'react'

// Elapsed time is always computed from timestamps (start, now), never by counting ticks.
// That makes it self-correcting after a throttled or backgrounded tab: whenever a tick does
// fire (or the tab becomes visible again), the value jumps straight to the true elapsed time.

/** Elapsed seconds between two `performance.now()` readings, clamped to zero and optionally a max. */
export function elapsedSeconds(startMs: number, nowMs: number, maxSeconds?: number): number {
  const raw = Math.max(0, (nowMs - startMs) / 1000)
  return maxSeconds != null ? Math.min(raw, maxSeconds) : raw
}

interface UseElapsedOptions {
  /** `performance.now()` timestamp the session started; null while there is nothing to run yet. */
  startMs: number | null
  plannedSeconds: number
  /** Called once, the first time elapsed reaches plannedSeconds. */
  onComplete?: () => void
  /** How often to recompute while running, in ms. */
  tickMs?: number
}

/** Ticking elapsed-seconds value, recomputed from timestamps on every tick and visibility change. */
export function useElapsed({ startMs, plannedSeconds, onComplete, tickMs = 250 }: UseElapsedOptions): number {
  const [elapsed, setElapsed] = useState(0)
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (startMs == null) return
    firedRef.current = false

    const tick = () => {
      const value = elapsedSeconds(startMs, performance.now())
      setElapsed(Math.min(value, plannedSeconds))
      if (!firedRef.current && value >= plannedSeconds) {
        firedRef.current = true
        onCompleteRef.current?.()
      }
    }

    tick()
    const interval = window.setInterval(tick, tickMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [startMs, plannedSeconds, tickMs])

  return elapsed
}
