import { useEffect, useRef, useState } from 'react'

// "Hold to end": press-and-hold for HOLD_TO_END_MS. Releasing early cancels with no side effect.

export const HOLD_TO_END_MS = 1500

/** Progress through the hold, clamped to [0, 1]. */
export function holdProgress(startMs: number, nowMs: number, durationMs: number): number {
  if (durationMs <= 0) return 1
  return Math.max(0, Math.min(1, (nowMs - startMs) / durationMs))
}

export function isHoldComplete(progress: number): boolean {
  return progress >= 1
}

interface UseHoldToEndOptions {
  durationMs?: number
  /** Fired once, the moment progress reaches 1. */
  onComplete: () => void
}

interface HoldToEndState {
  /** 0..1 while holding; snaps back to 0 on cancel. */
  progress: number
  holding: boolean
  start: () => void
  /** Releasing before completion: no end is triggered. */
  cancel: () => void
}

/** Drives the press-and-hold gesture off `requestAnimationFrame`, timed from `performance.now()`. */
export function useHoldToEnd({ durationMs = HOLD_TO_END_MS, onComplete }: UseHoldToEndOptions): HoldToEndState {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const stopFrame = () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }

  const start = () => {
    if (startRef.current != null) return
    firedRef.current = false
    startRef.current = performance.now()
    setHolding(true)

    const tick = () => {
      if (startRef.current == null) return
      const value = holdProgress(startRef.current, performance.now(), durationMs)
      setProgress(value)
      if (isHoldComplete(value)) {
        if (!firedRef.current) {
          firedRef.current = true
          onCompleteRef.current()
        }
        stopFrame()
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  const cancel = () => {
    stopFrame()
    startRef.current = null
    setHolding(false)
    setProgress(0)
  }

  useEffect(() => stopFrame, [])

  return { progress, holding, start, cancel }
}
