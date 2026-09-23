import { useId, type SVGProps } from 'react'

/**
 * The seated stone figure used on Home, the still-image session and My practice.
 * Geometry is copied from docs/ui-design.html; only the palette varies per context.
 */
const PALETTES = {
  /** Home, My practice. */
  stone: {
    stops: ['#F4F2EC', '#E0DCD4', '#C2BDB2'],
    shadow: '#EEEBE5', robe: '#CBC6BC', lap: '#D4CFC5', hands: '#E6E2DA',
    neck: '#D9D4CB', top: '#D4CFC5', eyes: '#B0AA9F', urna: '#C3BDB2', mouth: '#BBB5AA',
  },
  /** Still-image session: lit from the front, a touch paler. */
  lit: {
    stops: ['#FBFAF7', '#E7E3DB', '#C6C1B6'],
    shadow: '#EAE7E0', robe: '#CFCAC0', lap: '#D8D3C9', hands: '#ECE8E0',
    neck: '#DDD8CF', top: '#D8D3C9', eyes: '#B4AEA3', urna: '#C7C1B6', mouth: '#BFB9AE',
  },
} as const

export type BuddhaTone = keyof typeof PALETTES

type BuddhaProps = Omit<SVGProps<SVGSVGElement>, 'viewBox'> & {
  tone?: BuddhaTone
  /** Small renderings (under ~120px) drop the face and hands, as in the design. */
  detail?: boolean
  label?: string
}

export function Buddha({ tone = 'stone', detail = true, label = 'Seated Buddha figure', width = 252, height = 302, ...rest }: BuddhaProps) {
  const id = useId()
  const gradientId = `stone-${id}`
  const c = PALETTES[tone]
  const fill = `url(#${gradientId})`
  return (
    <svg viewBox="0 0 400 480" width={width} height={height} role="img" aria-label={label} style={{ display: 'block' }} {...rest}>
      <defs>
        <linearGradient id={gradientId} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={c.stops[0]} />
          <stop offset="0.5" stopColor={c.stops[1]} />
          <stop offset="1" stopColor={c.stops[2]} />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="452" rx="152" ry="17" fill={c.shadow} />
      <path d="M200 292 C124 292 64 360 58 424 C56 440 66 448 84 448 L316 448 C334 448 344 440 342 424 C336 360 276 292 200 292 Z" fill={fill} />
      <path d="M200 164 C168 164 146 184 140 214 C131 258 128 300 130 334 C158 312 176 304 200 304 C224 304 242 312 270 334 C272 300 269 258 260 214 C254 184 232 164 200 164 Z" fill={fill} />
      <path d="M164 176 C188 214 216 252 264 270" fill="none" stroke={c.robe} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M166 212 C176 246 178 280 172 302" fill="none" stroke={c.robe} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M236 212 C228 246 226 280 231 302" fill="none" stroke={c.robe} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="200" cy="332" rx="46" ry="15" fill={c.lap} />
      {detail && <ellipse cx="200" cy="323" rx="30" ry="10" fill={c.hands} />}
      <rect x="183" y="146" width="34" height="32" rx="15" fill={c.neck} />
      <ellipse cx="200" cy="112" rx="43" ry="51" fill={fill} />
      <ellipse cx="200" cy="70" rx="27" ry="21" fill={fill} />
      <circle cx="200" cy="47" r="7" fill={c.top} />
      {detail && (
        <>
          <path d="M159 98 C148 104 148 128 159 136" fill="none" stroke={c.robe} strokeWidth="3" strokeLinecap="round" />
          <path d="M241 98 C252 104 252 128 241 136" fill="none" stroke={c.robe} strokeWidth="3" strokeLinecap="round" />
          <path d="M177 119 C183 125 191 125 196 119" fill="none" stroke={c.eyes} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M204 119 C209 125 217 125 223 119" fill="none" stroke={c.eyes} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="200" cy="103" r="2.6" fill={c.urna} />
          <path d="M190 141 C195 144 205 144 210 141" fill="none" stroke={c.mouth} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
