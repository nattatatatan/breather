import type { ComponentType, SVGProps } from 'react'

/**
 * Large, quiet glyphs for the "still" session scenes (breath, light, water, earth, metta, walking).
 * No board covers these sessions; geometry is the same 24x24 line icons from
 * docs/design/boards/04-practice-object.html, redrawn at scale by simply rendering the same
 * viewBox bigger - the stroke palette (a dark primary stroke, a paler secondary one) carries over.
 */

type GlyphProps = SVGProps<SVGSVGElement> & { size?: number }

export function BreathGlyph({ size = 120, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Breath" style={{ display: 'block' }} {...rest}>
      <path d="M3 10 C7 4 11 16 15 10 C17.5 6.5 20 8 21 10" fill="none" stroke="#55534C" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 16 C7 10 11 22 15 16" fill="none" stroke="#B6B1A7" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function LightGlyph({ size = 120, tone = 'day', ...rest }: GlyphProps & { tone?: 'day' | 'night' }) {
  const c = tone === 'night' ? { ring: '#E7E3DB', rays: '#B4AEA3' } : { ring: '#55534C', rays: '#B6B1A7' }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Light" style={{ display: 'block' }} {...rest}>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke={c.ring} strokeWidth="1.3" />
      <path
        d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.2 5.2 L7 7 M17 17 L18.8 18.8 M18.8 5.2 L17 7 M7 17 L5.2 18.8"
        stroke={c.rays}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WaterGlyph({ size = 120, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Water" style={{ display: 'block' }} {...rest}>
      <path
        d="M12 3 C15.5 8 18 10.5 18 14 C18 17.3 15.3 20 12 20 C8.7 20 6 17.3 6 14 C6 10.5 8.5 8 12 3 Z"
        fill="none"
        stroke="#55534C"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9 14.6 C10 15.6 11.2 15.6 12.2 14.6 C13.2 13.6 14.4 13.6 15.4 14.6" fill="none" stroke="#B6B1A7" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function EarthGlyph({ size = 120, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Earth" style={{ display: 'block' }} {...rest}>
      <ellipse cx="12" cy="14" rx="9" ry="4.4" fill="none" stroke="#55534C" strokeWidth="1.3" />
      <path d="M4.5 10.5 C6.5 12.2 17.5 12.2 19.5 10.5" fill="none" stroke="#B6B1A7" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function MettaGlyph({ size = 120, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Metta" style={{ display: 'block' }} {...rest}>
      <circle cx="12" cy="12" r="2.6" fill="#55534C" />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="#B6B1A7" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="9.6" fill="none" stroke="#DAD5CC" strokeWidth="1.2" />
    </svg>
  )
}

export function WalkingGlyph({ size = 120, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Walking" style={{ display: 'block' }} {...rest}>
      <ellipse cx="8.5" cy="17" rx="2.6" ry="3.6" fill="none" stroke="#55534C" strokeWidth="1.3" />
      <ellipse cx="15.5" cy="8.4" rx="2.6" ry="3.6" fill="none" stroke="#B6B1A7" strokeWidth="1.3" />
    </svg>
  )
}

/** Element slug -> glyph, for the "still" scenes that have no dedicated board. */
export const STILL_GLYPHS: Record<string, ComponentType<GlyphProps>> = {
  breath: BreathGlyph,
  light: LightGlyph,
  water: WaterGlyph,
  earth: EarthGlyph,
  'loving-kindness': MettaGlyph,
  walking: WalkingGlyph,
}
