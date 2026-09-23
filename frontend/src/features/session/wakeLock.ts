import { useEffect, useRef } from 'react'

/**
 * Keeps the screen awake for as long as `enabled` is true, using the Screen Wake Lock API.
 * Re-acquires on visibilitychange (the lock is released by the browser when a tab is hidden),
 * releases on unmount, and feature-detects: unsupported or denied is silently a no-op.
 */
export function useWakeLock(enabled: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!('wakeLock' in navigator)) return
    let cancelled = false

    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          lock.release().catch(() => {})
          return
        }
        lockRef.current = lock
      } catch {
        // Not supported, denied, or the document isn't visible; the screen may sleep.
      }
    }

    acquire()

    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && !lockRef.current) acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [enabled])
}
