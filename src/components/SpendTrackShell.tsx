import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  IconCalendarMonth,
  IconChartBar,
  IconLogout,
  IconUser,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { ensureProfileFromAuth } from '../data/profileDb'
import { supabase } from '../lib/supabase'
import {
  mountSpendTrack,
  setAppView,
  unmountSpendTrack,
  type AppView,
} from '../main'
import type { Profile } from '../types'
import { errorToMessage } from '../utils'
import { ProfileView } from './ProfileView'
import {
  DesktopSidebar,
  MobileSidebar,
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarStoryTrigger,
  useSidebar,
} from './ui/sidebar'
import { cn } from '@/lib/utils'

type Props = {
  appLoading: boolean
  setAppLoading: (v: boolean) => void
}

function ProfileAvatar({
  profile,
  size = 'md',
}: {
  profile: Profile | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    'ST'
  const sizeClass =
    size === 'lg' ? 'h-9 w-9 text-xs' : size === 'sm' ? 'h-7 w-7 text-[9px]' : 'h-8 w-8 text-[10px]'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-neutral-600 font-semibold text-neutral-100 shadow-lg',
        sizeClass,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

function SidebarNav({
  view,
  onNavigate,
  profile,
  onSignOut,
}: {
  view: AppView
  onNavigate: (v: AppView) => void
  profile: Profile | null
  onSignOut: () => void
}) {
  const { open, animate } = useSidebar()
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Account'

  const iconClass = cn(
    'shrink-0 text-white/85',
    open ? 'h-4 w-4' : 'h-[18px] w-[18px]',
  )

  return (
    <SidebarBody className="justify-between gap-4 px-1 py-2">
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <button
          type="button"
          className={cn(
            'mb-3 flex w-full items-center rounded-lg text-left transition-colors hover:bg-white/5',
            open ? 'gap-2 px-1 pt-0.5' : 'justify-center px-0',
          )}
          onClick={() => onNavigate('profile')}
          aria-label="Open profile"
        >
          <ProfileAvatar profile={profile} size={open ? 'md' : 'sm'} />
          <motion.div
            animate={{
              display: animate ? (open ? 'block' : 'none') : 'block',
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="min-w-0 flex-1"
          >
            <p className="truncate text-sm font-semibold text-white">SpendTrack</p>
            <p className="truncate text-xs text-white/55">{displayName}</p>
          </motion.div>
        </button>

        <nav className={cn('flex flex-col', open ? 'gap-1' : 'gap-0.5')} aria-label="Main">
          <SidebarLink
            active={view === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
            link={{
              label: 'This month',
              icon: <IconChartBar className={iconClass} />,
            }}
          />
          <SidebarLink
            active={view === 'lastMonth'}
            onClick={() => onNavigate('lastMonth')}
            link={{
              label: 'Last month',
              icon: <IconCalendarMonth className={iconClass} />,
            }}
          />
          <SidebarLink
            active={view === 'profile'}
            onClick={() => onNavigate('profile')}
            link={{
              label: 'Profile',
              icon: <IconUser className={iconClass} />,
            }}
          />
        </nav>
      </div>

      <div className={cn('flex flex-col border-t border-white/10', open ? 'gap-1 pt-2' : 'gap-0.5 pt-1.5')}>
        <SidebarLink
          onClick={onSignOut}
          link={{
            label: 'Sign out',
            icon: <IconLogout className={iconClass} />,
          }}
        />
      </div>
    </SidebarBody>
  )
}

export function SpendTrackShell({ appLoading, setAppLoading }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AppView>('dashboard')
  const [profile, setProfile] = useState<Profile | null>(null)
  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void ensureProfileFromAuth().then(setProfile).catch(console.error)
  }, [])

  useLayoutEffect(() => {
    if (view === 'profile') {
      unmountSpendTrack()
      setAppLoading(false)
      return
    }

    const root = appRef.current
    if (!root) return

    let active = true
    setAppLoading(true)

    void (async () => {
      try {
        await mountSpendTrack(root)
        setAppView(view)
      } catch (err) {
        console.error(err)
        root.innerHTML = `<div class="db-banner" role="alert"><p>${errorToMessage(err)}</p></div>`
      }
    })().finally(() => {
      if (active) setAppLoading(false)
    })

    return () => {
      active = false
      unmountSpendTrack()
    }
  }, [view, setAppLoading])

  function handleNavigate(next: AppView) {
    setView(next)
    setOpen(false)
    if (next !== 'profile') {
      setAppView(next)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const profileInitials =
    [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    'ST'

  return (
    <div className="app-shell">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarStoryTrigger initials={profileInitials} />
        <div className="flex h-dvh w-full overflow-hidden">
          <DesktopSidebar>
            <SidebarNav
              view={view}
              onNavigate={handleNavigate}
              profile={profile}
              onSignOut={handleSignOut}
            />
          </DesktopSidebar>
          <MobileSidebar>
            <SidebarNav
              view={view}
              onNavigate={handleNavigate}
              profile={profile}
              onSignOut={handleSignOut}
            />
          </MobileSidebar>

          <main className="app-shell-main relative flex min-w-0 flex-1 flex-col pt-[max(3.25rem,env(safe-area-inset-top))] md:pt-0">
            {appLoading && view !== 'profile' ? (
              <div className="app-loading" aria-live="polite">
                Loading your data…
              </div>
            ) : null}

            {view === 'profile' ? (
              <ProfileView />
            ) : (
              <div
                ref={appRef}
                id="spendtrack-app"
                className="relative z-10 w-full flex-1"
              />
            )}
          </main>
        </div>
      </Sidebar>
    </div>
  )
}
