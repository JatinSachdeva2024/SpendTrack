import { useState, type FormEvent } from 'react'
import { ensureProfileFromAuth, upsertProfile } from '../data/profileDb'
import { getAuthRedirectUrl } from '../lib/siteUrl'
import { supabase } from '../lib/supabase'
import type { SignupProfileInput } from '../types'
import { errorToMessage } from '../utils'
import '../auth.css'

type Tab = 'login' | 'signup'

type Props = {
  onAuthenticated: () => void
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

function friendlyAuthError(err: unknown): string {
  const msg = errorToMessage(err)
  if (/security purposes/i.test(msg) || /only request this after/i.test(msg)) {
    const match = msg.match(/(\d+)\s*seconds?/i)
    const secs = match?.[1] ?? '60'
    return `Too many sign-up attempts. Wait ${secs} seconds, then try again.`
  }
  return msg
}

function validateSignupProfile(input: SignupProfileInput): string | null {
  if (!input.firstName.trim()) return 'First name is required.'
  if (!input.lastName.trim()) return 'Last name is required.'
  const digits = normalizePhone(input.phone)
  if (digits.length < 7) return 'Enter a valid phone number (at least 7 digits).'
  return null
}

export function AuthScreen({ onAuthenticated }: Props) {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function saveProfileForUser(
    userId: string,
    profile: SignupProfileInput,
  ): Promise<void> {
    try {
      await upsertProfile(userId, profile)
    } catch (err) {
      console.error('Profile save failed:', err)
      throw err
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || password.length < 6) {
      setError('Enter a valid email and password (min 6 characters).')
      setLoading(false)
      return
    }

    try {
      if (tab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })
        if (signInError) throw signInError
        await ensureProfileFromAuth()
        onAuthenticated()
      } else {
        const profile: SignupProfileInput = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }
        const profileError = validateSignupProfile(profile)
        if (profileError) {
          setError(profileError)
          setLoading(false)
          return
        }

        const emailRedirectTo = getAuthRedirectUrl()
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: emailRedirectTo || undefined,
            data: {
              first_name: profile.firstName,
              last_name: profile.lastName,
              phone: profile.phone,
            },
          },
        })
        if (signUpError) throw signUpError

        if (data.user) {
          await saveProfileForUser(data.user.id, profile)
        }

        if (data.session) {
          onAuthenticated()
        } else {
          setMessage('Account created. Check your email to confirm, then sign in.')
          setTab('login')
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root" aria-label="Sign in to SpendTrack">
      <div className="auth-root__bg" aria-hidden />
      <div className="auth-root__vignette" aria-hidden />
      <div className="auth-root__glow" aria-hidden />
      <div className="auth-panel">
        <div className="auth-panel__inner">
          <p className="auth-brand">SpendTrack</p>
          <h1 className="auth-title">{tab === 'login' ? 'Welcome back' : 'Create account'}</h1>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`}
              onClick={() => {
                setTab('login')
                setError(null)
                setMessage(null)
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`}
              onClick={() => {
                setTab('signup')
                setError(null)
                setMessage(null)
              }}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {tab === 'signup' ? (
              <>
                <div className="auth-field-row">
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="auth-first-name">
                      First name
                    </label>
                    <input
                      id="auth-first-name"
                      className="auth-input"
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="auth-last-name">
                      Last name
                    </label>
                    <input
                      id="auth-last-name"
                      className="auth-input"
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-phone">
                    Phone
                  </label>
                  <input
                    id="auth-phone"
                    className="auth-input"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+1 555 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : null}

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                name="password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? <p className="auth-message">{message}</p> : null}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
