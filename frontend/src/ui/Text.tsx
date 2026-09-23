import type { CSSProperties, ReactNode } from 'react'
import styles from './Text.module.css'

// Typographic primitives. Each maps to one recurring style in the design.

interface TextProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

/** 10px spaced uppercase label: top-bar titles, row labels. */
export function Eyebrow({ children, className, style }: TextProps) {
  return <div className={cx(styles.eyebrow, className)} style={style}>{children}</div>
}

/** Screen heading: Cormorant 40px light (size overridable). */
export function Title({ children, className, style, size = 40 }: TextProps & { size?: number }) {
  return <h1 className={cx(styles.title, className)} style={{ fontSize: size, ...style }}>{children}</h1>
}

/** 13px muted explanation under a title. */
export function Lead({ children, className, style }: TextProps) {
  return <p className={cx(styles.lead, className)} style={style}>{children}</p>
}

/** Serif italic reflection line ("Most practices use both..."). */
export function Quote({ children, className, style, size = 17 }: TextProps & { size?: number }) {
  return <p className={cx(styles.quote, className)} style={{ fontSize: size, ...style }}>{children}</p>
}

/** 10px spaced uppercase section header inside long pages ("Where attention went"). */
export function SectionLabel({ children, className, style }: TextProps) {
  return <h2 className={cx(styles.section, className)} style={style}>{children}</h2>
}
