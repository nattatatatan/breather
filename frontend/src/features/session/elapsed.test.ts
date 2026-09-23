import { act, renderHook } from '@testing-library/react'
import { elapsedSeconds, useElapsed } from './elapsed'

describe('elapsedSeconds', () => {
  it('is the difference in seconds', () => {
    expect(elapsedSeconds(0, 5000)).toBe(5)
  })

  it('never goes negative', () => {
    expect(elapsedSeconds(5000, 0)).toBe(0)
  })

  it('clamps to a maximum', () => {
    expect(elapsedSeconds(0, 100_000, 30)).toBe(30)
  })
})

describe('useElapsed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ticks up from a start time and fires onComplete once at the planned duration', () => {
    const start = performance.now()
    const onComplete = vi.fn()
    const { result } = renderHook(() => useElapsed({ startMs: start, plannedSeconds: 2, onComplete, tickMs: 100 }))

    expect(result.current).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBeCloseTo(1, 1)
    expect(onComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(result.current).toBe(2)
    expect(onComplete).toHaveBeenCalledTimes(1)

    // Elapsed is clamped to the plan; onComplete never fires a second time.
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe(2)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does nothing while startMs is null', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useElapsed({ startMs: null, plannedSeconds: 60, onComplete }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current).toBe(0)
    expect(onComplete).not.toHaveBeenCalled()
  })
})
