import type { SVGProps } from 'react'

/**
 * Fire kasina scene art, geometry copied from docs/design/boards/06-session-fire-kasina.html.
 * The session feature drives opacity/scale over time (docs/design/boards/09-fire-the-dissolve.html);
 * these components only draw the fixed shapes.
 */

/** Ground, stones, logs and a few sparks. Fades out over the sitting (opacity is the caller's job). */
export function CampfireGround(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 390 200" width={390} height={200} aria-hidden="true" style={{ display: 'block' }} {...props}>
      <ellipse cx="195" cy="168" rx="158" ry="26" fill="#17140F" />
      <ellipse cx="110" cy="164" rx="16" ry="9" fill="#232019" />
      <ellipse cx="148" cy="174" rx="19" ry="10" fill="#2A261E" />
      <ellipse cx="243" cy="174" rx="19" ry="10" fill="#2A261E" />
      <ellipse cx="281" cy="164" rx="16" ry="9" fill="#232019" />
      <rect x="126" y="140" width="140" height="16" rx="8" fill="#3B2E22" transform="rotate(-11 196 148)" />
      <rect x="126" y="146" width="140" height="16" rx="8" fill="#332719" transform="rotate(10 196 154)" />
      <path d="M150 150 C176 146 216 146 242 150" fill="none" stroke="#5A4530" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="128" cy="96" r="2" fill="#E08B3E" opacity="0.55" />
      <circle cx="262" cy="74" r="1.6" fill="#E08B3E" opacity="0.4" />
      <circle cx="240" cy="40" r="1.4" fill="#F6D08A" opacity="0.35" />
    </svg>
  )
}

/** A single flame. Never re-flickers or loops - the caller only ever scales it down over time. */
export function Flame({ width = 176, height = 229, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 260"
      width={width}
      height={height}
      role="img"
      aria-label="A single flame"
      style={{ display: 'block' }}
      {...rest}
    >
      <path
        d="M100 14 C122 66 154 88 154 140 C154 182 130 212 100 212 C70 212 46 182 46 140 C46 88 78 66 100 14 Z"
        fill="#8E3A18"
        opacity="0.55"
      />
      <path
        d="M100 44 C118 84 142 102 142 142 C142 176 124 200 100 200 C76 200 58 176 58 142 C58 102 82 84 100 44 Z"
        fill="#C0562A"
      />
      <path
        d="M100 86 C112 114 128 126 128 152 C128 176 116 192 100 192 C84 192 72 176 72 152 C72 126 88 114 100 86 Z"
        fill="#E08B3E"
      />
      <path
        d="M100 130 C107 148 115 156 115 170 C115 182 108 190 100 190 C92 190 85 182 85 170 C85 156 93 148 100 130 Z"
        fill="#F6D08A"
      />
    </svg>
  )
}

interface FireGlowProps {
  sizePx: number
  alpha: number
}

/** The soft warm glow behind the flame. Size and alpha shrink together with the dissolve. */
export function FireGlow({ sizePx, alpha }: FireGlowProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '50%',
        top: '52%',
        transform: 'translate(-50%, -50%)',
        width: sizePx,
        height: sizePx,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(224,139,62,${alpha}) 0%, rgba(192,86,42,0.10) 44%, rgba(12,11,10,0) 72%)`,
      }}
    />
  )
}
