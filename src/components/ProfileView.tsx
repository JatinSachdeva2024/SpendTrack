import { useEffect, useState } from 'react'
import { getProfile } from '../data/profileDb'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { errorToMessage } from '../utils'

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        if (active) setEmail(user.email ?? '')
        const row = await getProfile(user.id)
        if (active) setProfile(row)
      } catch (err) {
        if (active) setError(errorToMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    '?'

  return (
    <div className="profile-view">
      <div className="profile-view-surface">
        {loading ? (
          <p className="profile-view-muted">Loading profile…</p>
        ) : error ? (
          <p className="profile-view-error" role="alert">
            {error}
          </p>
        ) : (
          <>
            <div className="profile-view-avatar" aria-hidden>
              {initials}
            </div>
            <h2 className="profile-view-name">
              {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Your profile'}
            </h2>
            <p className="profile-view-email">{email}</p>
            <dl className="profile-view-fields">
              <div>
                <dt>First name</dt>
                <dd>{profile?.firstName || '—'}</dd>
              </div>
              <div>
                <dt>Last name</dt>
                <dd>{profile?.lastName || '—'}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{profile?.phone || '—'}</dd>
              </div>
            </dl>
            <p className="profile-view-hint">Full profile editing coming soon.</p>
          </>
        )}
      </div>
    </div>
  )
}
