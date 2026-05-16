import { useLayoutEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthScreen } from './components/AuthScreen'
import { SpendTrackShell } from './components/SpendTrackShell'
import { supabase } from './lib/supabase'
import { unmountSpendTrack } from './main'
import { resetStorage } from './storage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [booting, setBooting] = useState(true)
  const [appLoading, setAppLoading] = useState(false)

  useLayoutEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setBooting(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        resetStorage()
        unmountSpendTrack()
        setAppLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (booting) {
    return <div className="auth-boot">Loading</div>
  }

  if (!session) {
    return <AuthScreen onAuthenticated={() => {}} />
  }

  return (
    <>
      <div
        className="app-background"
        style={{ backgroundImage: "url('/background.jpg')" }}
        aria-hidden
      />
      <SpendTrackShell appLoading={appLoading} setAppLoading={setAppLoading} />
    </>
  )
}
