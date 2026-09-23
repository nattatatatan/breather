// The "looking out" crowd for Circle > Hours (docs/design/boards/07-the-circle-hours.html).
// Four depth rows of small seated figures, from behind, plus a large foreground figure whose
// head crops the bottom of the frame - the viewer's own place in the circle.
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Buddha } from './Buddha'

const SEEN_KEY = 'circle-hours-camera-seen'

function hasSeenCameraMove(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

function markCameraMoveSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage unavailable (private mode, etc.) - just skip the intro next time too.
  }
}

const FIGURE = (
  <>
    <ellipse cx="0" cy="0" rx="24" ry="10" />
    <path d="M-19 0 C-17 -21 -8 -31 0 -31 C8 -31 17 -21 19 0 Z" />
    <circle cx="0" cy="-38" r="9.5" />
    <ellipse cx="0" cy="-48" rx="5.5" ry="4" />
  </>
)

/** 390x352 illustration band: identical to the board's resting state. */
export function Crowd({ width = 390, height = 352 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 390 352" width={width} height={height} aria-hidden="true" style={{ display: 'block' }}>
      <rect x="0" y="0" width="390" height="352" fill="#F1EFE9" />
      <ellipse cx="195" cy="300" rx="300" ry="120" fill="#EDEAE3" />

      <g fill="#E0DCD4">
        <g transform="translate(64,150) scale(0.34)">{FIGURE}</g>
        <g transform="translate(150,142) scale(0.3)">{FIGURE}</g>
        <g transform="translate(246,146) scale(0.32)">{FIGURE}</g>
        <g transform="translate(330,152) scale(0.34)">{FIGURE}</g>
      </g>

      <g fill="#D6D1C8">
        <g transform="translate(40,206) scale(0.5)">{FIGURE}</g>
        <g transform="translate(120,196) scale(0.46)">{FIGURE}</g>
        <g transform="translate(272,196) scale(0.46)">{FIGURE}</g>
        <g transform="translate(352,206) scale(0.5)">{FIGURE}</g>
      </g>

      <g fill="#C9C3B9">
        <g transform="translate(26,272) scale(0.66)">{FIGURE}</g>
        <g transform="translate(364,272) scale(0.66)">{FIGURE}</g>
      </g>

      {/* Foreground: the viewer's own figure, seen from behind, cropped by the frame. */}
      <g fill="#B4AEA3">
        <path d="M195 352 C120 352 88 352 84 352 C88 296 128 266 195 266 C262 266 302 296 306 352 Z" />
        <ellipse cx="195" cy="232" rx="63" ry="70" />
        <ellipse cx="195" cy="176" rx="36" ry="27" />
        <circle cx="195" cy="147" r="9" />
      </g>
      <g fill="#A8A298">
        <circle cx="168" cy="200" r="5" />
        <circle cx="182" cy="196" r="5" />
        <circle cx="196" cy="194" r="5" />
        <circle cx="210" cy="196" r="5" />
        <circle cx="224" cy="200" r="5" />
        <circle cx="160" cy="216" r="5" />
        <circle cx="175" cy="212" r="5" />
        <circle cx="190" cy="210" r="5" />
        <circle cx="205" cy="212" r="5" />
        <circle cx="219" cy="216" r="5" />
        <circle cx="232" cy="220" r="5" />
        <circle cx="155" cy="234" r="5" />
        <circle cx="170" cy="230" r="5" />
        <circle cx="185" cy="228" r="5" />
        <circle cx="200" cy="228" r="5" />
        <circle cx="215" cy="230" r="5" />
        <circle cx="230" cy="234" r="5" />
      </g>
    </svg>
  )
}

/**
 * The full "Looking out" band: the crowd, plus - once per session, unless reduced motion is
 * requested - a ~1.4s opening where a front-facing figure swings around and dissolves into it
 * ("Circle - the camera passes behind", docs/design/boards/10-camera-moves.html).
 */
export function HoursBand({ width = 390, height = 352 }: { width?: number; height?: number }) {
  const reducedMotion = useReducedMotion()
  const [showIntro, setShowIntro] = useState(() => !reducedMotion && !hasSeenCameraMove())

  useEffect(() => {
    if (!showIntro) return
    markCameraMoveSeen()
    const timer = setTimeout(() => setShowIntro(false), 1600)
    return () => clearTimeout(timer)
  }, [showIntro])

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', perspective: 700 }}>
      <Crowd width={width} height={height} />
      {showIntro && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 1, rotateY: 0, scale: 1 }}
          animate={{ opacity: 0, rotateY: -68, scale: 1.35 }}
          transition={{ duration: 1.5, ease: [0.22, 0.61, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: '#F4F2ED',
            transformStyle: 'preserve-3d',
          }}
        >
          <Buddha tone="lit" width={220} height={264} style={{ marginBottom: -8 }} />
        </motion.div>
      )}
    </div>
  )
}
