import type { SVGProps } from 'react'
import { Buddha, type BuddhaTone } from './Buddha'

/**
 * The eight practice-object glyphs from docs/design/boards/04-practice-object.html.
 * Each renders at any size (viewBox 0 0 24 24) and recolours from the neutral scheme to the
 * warm accent scheme when `tone="accent"` (selected tile on Object, large Home rendering for fire).
 * Raw hex here matches the board 1:1; components elsewhere should keep using tokens.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number; tone?: 'neutral' | 'accent' }

const NEUTRAL = { primary: '#55534C', secondary: '#B6B1A7' }
const ACCENT = { primary: '#B04A22', secondary: '#E08B3E' }

function colors(tone: 'neutral' | 'accent') {
  return tone === 'accent' ? ACCENT : NEUTRAL
}

export function BreathIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <path d="M3 10 C7 4 11 16 15 10 C17.5 6.5 20 8 21 10" fill="none" stroke={c.primary} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 16 C7 10 11 22 15 16" fill="none" stroke={c.secondary} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function LightIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke={c.primary} strokeWidth="1.3" />
      <path
        d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.2 5.2 L7 7 M17 17 L18.8 18.8 M18.8 5.2 L17 7 M7 17 L5.2 18.8"
        stroke={c.secondary}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FireIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <path
        d="M12 2.5 C15 7.5 18 9.5 18 14 C18 17.6 15.3 20.5 12 20.5 C8.7 20.5 6 17.6 6 14 C6 9.5 9 7.5 12 2.5 Z"
        fill="none"
        stroke={c.primary}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {tone === 'accent' ? (
        <path
          d="M12 11 C13.4 13.6 14.4 14.6 14.4 16.4 C14.4 18 13.3 19.2 12 19.2 C10.7 19.2 9.6 18 9.6 16.4 C9.6 14.6 10.6 13.6 12 11 Z"
          fill={c.secondary}
        />
      ) : (
        <path d="M12 11 C13.4 13.6 14.4 14.6 14.4 16.4 C14.4 18 13.3 19.2 12 19.2 C10.7 19.2 9.6 18 9.6 16.4 C9.6 14.6 10.6 13.6 12 11 Z" fill="none" stroke={c.secondary} strokeWidth="1.2" />
      )}
    </svg>
  )
}

export function WaterIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <path
        d="M12 3 C15.5 8 18 10.5 18 14 C18 17.3 15.3 20 12 20 C8.7 20 6 17.3 6 14 C6 10.5 8.5 8 12 3 Z"
        fill="none"
        stroke={c.primary}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9 14.6 C10 15.6 11.2 15.6 12.2 14.6 C13.2 13.6 14.4 13.6 15.4 14.6" fill="none" stroke={c.secondary} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function EarthIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <ellipse cx="12" cy="14" rx="9" ry="4.4" fill="none" stroke={c.primary} strokeWidth="1.3" />
      <path d="M4.5 10.5 C6.5 12.2 17.5 12.2 19.5 10.5" fill="none" stroke={c.secondary} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function BuddhaGlyphIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const fills = tone === 'accent' ? { body: '#E3C7B4', head: '#D9895E' } : { body: '#D8D4CC', head: '#C8C3B9' }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <ellipse cx="12" cy="19" rx="8" ry="2.6" fill={fills.body} />
      <path d="M6 19 C6.6 13.5 8.8 11 12 11 C15.2 11 17.4 13.5 18 19 Z" fill={fills.body} />
      <circle cx="12" cy="7.4" r="3.4" fill={fills.head} />
      <ellipse cx="12" cy="3.7" rx="1.8" ry="1.3" fill={fills.head} />
    </svg>
  )
}

export function MettaIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <circle cx="12" cy="12" r="2.6" fill={c.primary} />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke={c.secondary} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="9.6" fill="none" stroke={tone === 'accent' ? c.secondary : '#DAD5CC'} strokeWidth="1.2" />
    </svg>
  )
}

export function WalkingIcon({ size = 22, tone = 'neutral', ...rest }: IconProps) {
  const c = colors(tone)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
      <ellipse cx="8.5" cy="17" rx="2.6" ry="3.6" fill="none" stroke={c.primary} strokeWidth="1.3" />
      <ellipse cx="15.5" cy="8.4" rx="2.6" ry="3.6" fill="none" stroke={c.secondary} strokeWidth="1.3" />
    </svg>
  )
}

/** Map from element slug (docs/api-contract.md) to its glyph, for the Object grid and elsewhere. */
export const OBJECT_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  breath: BreathIcon,
  light: LightIcon,
  fire: FireIcon,
  water: WaterIcon,
  earth: EarthIcon,
  'buddha-recollection': BuddhaGlyphIcon,
  'loving-kindness': MettaIcon,
  walking: WalkingIcon,
}

/**
 * A larger, quiet-palette rendering of a non-Buddha object for the Home figure.
 * Fire gets its own warm flame (see `Flame`); everything else scales the board-04 glyph up.
 */
export function ObjectFigure({ slug, size = 180 }: { slug: string; size?: number }) {
  const Icon = OBJECT_ICONS[slug]
  if (!Icon) return null
  return <Icon size={size} tone="neutral" style={{ display: 'block' }} />
}

/**
 * Standalone campfire flame (docs/design/boards/06 / 09 style), used on Home when the practice
 * object is fire and on the fire session scene. Warm-coloured; not part of the quiet palette.
 */
export function Flame({ width = 118, height = 153, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 260" width={width} height={height} role="img" aria-label="Flame" style={{ display: 'block' }} {...rest}>
      <path
        d="M100 14 C122 66 154 88 154 140 C154 182 130 212 100 212 C70 212 46 182 46 140 C46 88 78 66 100 14 Z"
        fill="#8E3A18"
        opacity="0.55"
      />
      <path d="M100 44 C118 84 142 102 142 142 C142 176 124 200 100 200 C76 200 58 176 58 142 C58 102 82 84 100 44 Z" fill="#C0562A" />
      <path d="M100 86 C112 114 128 126 128 152 C128 176 116 192 100 192 C84 192 72 176 72 152 C72 126 88 114 100 86 Z" fill="#E08B3E" />
      <path d="M100 130 C107 148 115 156 115 170 C115 182 108 190 100 190 C92 190 85 182 85 170 C85 156 93 148 100 130 Z" fill="#F6D08A" />
    </svg>
  )
}

/**
 * The user's practice object at any size: the Buddha figure, the flame, or a scaled-up glyph -
 * shared by Home and My practice so both render the same figure for the same profile.
 */
export function PracticeFigure({ slug, size = 252, tone = 'stone' }: { slug: string | null | undefined; size?: number; tone?: BuddhaTone }) {
  if (!slug || slug === 'buddha-recollection') return <Buddha tone={tone} width={size} height={Math.round(size * (302 / 252))} detail={size >= 120} />
  if (slug === 'fire') return <Flame width={Math.round(size * (118 / 252))} height={Math.round(size * (153 / 252))} />
  return <ObjectFigure slug={slug} size={size} />
}
