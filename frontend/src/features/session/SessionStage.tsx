import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { useHoldToEnd } from './holdToEnd'
import styles from './SessionStage.module.css'

type Tone = 'light' | 'night'

interface Ripple {
  id: number
  x: number
  y: number
}

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

interface SessionStageProps {
  tone: Tone
  /** Full-bleed background art (ground/glow/etc.), absolutely positioned. */
  background: ReactNode
  /** The held object, already wrapped by the caller in `<motion.div layoutId="practice-object">`. */
  figure: ReactNode
  topChrome: ReactNode
  hint: string
  /** 0..1. Only fire's dissolve moves these away from 1. */
  hintOpacity?: number
  chromeOpacity?: number
  progressPercent: number
  elapsedSeconds: number
  onReturn: (elapsedAt: number) => void
  onHoldToEndComplete: () => void
  /** Suppresses taps/returns and the hold gesture while ending. */
  disabled?: boolean
  /** True when in-app navigation is being held back (see useBlocker in SessionScreen). */
  leaveBlocked: boolean
  onStay: () => void
  onLeave: () => void
  errorMessage?: string | null
  onRetry?: () => void
}

/**
 * The shared interactive frame for every session scene: tap/Space to note a return, hold-to-end,
 * the quiet progress line, the italic hint, and the "leave without finishing?" prompt. Scenes only
 * supply their background art and the held figure.
 */
export function SessionStage({
  tone,
  background,
  figure,
  topChrome,
  hint,
  hintOpacity = 1,
  chromeOpacity = 1,
  progressPercent,
  elapsedSeconds,
  onReturn,
  onHoldToEndComplete,
  disabled = false,
  leaveBlocked,
  onStay,
  onLeave,
  errorMessage,
  onRetry,
}: SessionStageProps) {
  const reducedMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const holdButtonRef = useRef<HTMLButtonElement>(null)
  const rippleIdRef = useRef(0)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [liveMessage, setLiveMessage] = useState('')

  const hold = useHoldToEnd({ onComplete: onHoldToEndComplete })

  const noteReturn = useCallback(
    (x: number, y: number) => {
      if (disabled || leaveBlocked) return
      onReturn(elapsedSeconds)
      const id = ++rippleIdRef.current
      setRipples((r) => [...r, { id, x, y }])
      window.setTimeout(() => setRipples((r) => r.filter((ripple) => ripple.id !== id)), 650)
      // Re-trigger the aria-live announcement even for consecutive returns.
      setLiveMessage('')
      window.setTimeout(() => setLiveMessage('Return noted'), 30)
    },
    [disabled, leaveBlocked, onReturn, elapsedSeconds],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat) return
      if (document.activeElement === holdButtonRef.current) return
      if (disabled || leaveBlocked) return
      e.preventDefault()
      const rect = stageRef.current?.getBoundingClientRect()
      noteReturn((rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [noteReturn, disabled, leaveBlocked])

  function handleStageClick(e: MouseEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect()
    noteReturn(e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0))
  }

  return (
    <div ref={stageRef} className={styles.stage} onClick={handleStageClick} data-testid="session-stage">
      <div className={styles.background}>{background}</div>

      <div className={styles.topChrome} style={{ opacity: chromeOpacity }}>
        {topChrome}
      </div>

      <div className={styles.figureWrap}>{figure}</div>

      <div className={cx(styles.hint, styles[tone])} style={{ opacity: hintOpacity }}>
        {hint}
      </div>

      {errorMessage && (
        <div className={cx(styles.errorBanner, styles[tone])} role="alert">
          <p>{errorMessage}</p>
          {onRetry && (
            <button
              type="button"
              className={styles.retry}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onRetry()
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      <div className={styles.holdWrap}>
        <button
          ref={holdButtonRef}
          type="button"
          className={cx(styles.holdButton, styles[tone])}
          style={{ letterSpacing: `${(0.3 - hold.progress * 0.12).toFixed(3)}em` }}
          disabled={disabled}
          aria-label="Hold to end the sitting"
          onPointerDown={(e) => {
            e.stopPropagation()
            if (!disabled) hold.start()
          }}
          onPointerUp={(e) => {
            e.stopPropagation()
            hold.cancel()
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            hold.cancel()
          }}
          onPointerCancel={(e) => {
            e.stopPropagation()
            hold.cancel()
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
              e.preventDefault()
              e.stopPropagation()
              if (!disabled) hold.start()
            }
          }}
          onKeyUp={(e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              hold.cancel()
            }
          }}
        >
          Hold to end
          <span className={styles.holdFillTrack} aria-hidden="true">
            <span className={styles.holdFill} style={{ '--hold-progress': hold.progress } as CSSProperties} />
          </span>
        </button>
      </div>

      <div className={cx(styles.progressFill, styles[tone])} style={{ width: `${progressPercent}%` }} aria-hidden="true" />

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className={cx(styles.ripple, styles[tone])}
            style={{ left: r.x, top: r.y }}
            initial={{ opacity: 0.5, scale: 0.3 }}
            animate={{ opacity: 0, scale: reducedMotion ? 1 : 2.2 }}
            transition={{ duration: reducedMotion ? 0.25 : 0.6, ease: 'easeOut' }}
            aria-hidden="true"
          />
        ))}
      </AnimatePresence>

      {leaveBlocked && (
        <div
          className={cx(styles.leaveOverlay, styles[tone])}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className={styles.leaveText}>Leave without finishing? This sitting will not be saved.</p>
          <div className={styles.leaveActions}>
            <button type="button" className={styles.leaveStay} onClick={onStay}>
              Continue sitting
            </button>
            <button type="button" className={styles.leaveLeave} onClick={onLeave}>
              Leave
            </button>
          </div>
        </div>
      )}

      <span className="visually-hidden" role="status" aria-live="polite">
        {liveMessage}
      </span>
    </div>
  )
}
