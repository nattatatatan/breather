import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

// The design has one button: a 56px outlined, letter-spaced label. It is used as a <button> and as a link.

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; tone?: 'ink' | 'night' }

export function Button({ className, tone = 'ink', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={[styles.button, styles[tone], className].filter(Boolean).join(' ')} {...rest} />
}

type ButtonLinkProps = LinkProps & { tone?: 'ink' | 'night' }

export function ButtonLink({ className, tone = 'ink', ...rest }: ButtonLinkProps) {
  return <Link className={[styles.button, styles[tone], className].filter(Boolean).join(' ')} {...rest} />
}
