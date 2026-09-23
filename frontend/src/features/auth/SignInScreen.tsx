import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { Screen, Spacer } from '@/ui/Screen'
import { Quote } from '@/ui/Text'
import styles from './SignInScreen.module.css'

type Mode = 'sign-in' | 'sign-up'

export function SignInScreen() {
  const { session } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<Mode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  if (session) return <Navigate to={from} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } })
    setPending(false)
    if (result.error) {
      setError(result.error.message)
    } else if (mode === 'sign-up' && !result.data.session) {
      // Project requires email confirmation before a session exists.
      setCheckEmail(true)
    }
  }

  const signUp = mode === 'sign-up'

  return (
    <Screen>
      <div className={styles.wordmark}>Stay</div>
      <div className={styles.intro}>
        <h1 className={styles.title}>{signUp ? 'Begin a practice.' : 'Welcome back.'}</h1>
        <Quote size={19}>{signUp ? 'One object, chosen once.' : 'The object is where you left it.'}</Quote>
      </div>

      {checkEmail ? (
        <p className={styles.notice} role="status">
          Check {email} for a confirmation link, then sign in.
        </p>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate={false}>
          {signUp && (
            <Field label="Name" autoComplete="nickname" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} hint="How the circle will see you." />
          )}
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            label="Password"
            type="password"
            autoComplete={signUp ? 'new-password' : 'current-password'}
            required
            minLength={signUp ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Spacer />
          <Button type="submit" disabled={pending}>
            {pending ? 'One moment' : signUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      )}

      <button
        type="button"
        className={styles.switch}
        onClick={() => {
          setMode(signUp ? 'sign-in' : 'sign-up')
          setError(null)
          setCheckEmail(false)
        }}
      >
        {signUp ? 'I already practise here' : 'New here? Create an account'}
      </button>
    </Screen>
  )
}
