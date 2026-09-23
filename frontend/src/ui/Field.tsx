import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

// Underlined, label-above fields that match the design's quiet form language.

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }

export function Field({ label, hint, id, className, ...rest }: FieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <input id={inputId} className={styles.input} {...rest} />
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }

export function TextArea({ label, hint, id, className, ...rest }: TextAreaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <textarea id={inputId} className={`${styles.input} ${styles.area}`} {...rest} />
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}
