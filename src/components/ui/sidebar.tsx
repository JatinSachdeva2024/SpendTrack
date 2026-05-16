import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const SIDEBAR_COLLAPSED_PX = 40
export const SIDEBAR_EXPANDED_PX = 200

function BustSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="7.25" r="3.75" />
      <path d="M4.5 20.25c1-3.35 3.75-5.25 7.5-5.25s6.5 1.9 7.5 5.25" />
    </svg>
  )
}

export function SidebarStoryTrigger({
  initials,
  className,
}: {
  initials: string
  className?: string
}) {
  const { open, setOpen } = useSidebar()

  return (
    <button
      type="button"
      className={cn(
        'fixed z-40 flex h-11 w-11 items-center justify-center md:hidden',
        'left-[max(0.65rem,env(safe-area-inset-left))] top-[max(0.65rem,env(safe-area-inset-top))]',
        className,
      )}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-label="Open menu"
    >
      <span
        className="absolute inset-0 rounded-full motion-safe:animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,rgba(255,255,255,0.5),rgba(255,255,255,0.1),rgba(255,255,255,0.38),rgba(255,255,255,0.08),rgba(255,255,255,0.5))]"
        aria-hidden
      />
      <span className="absolute inset-[3px] rounded-full bg-neutral-950" aria-hidden />
      <span className="relative flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border border-white/15 bg-neutral-600 text-neutral-100 shadow-inner">
        {initials.length >= 1 ? (
          <span className="text-[10px] font-semibold tracking-tight">{initials.slice(0, 2)}</span>
        ) : (
          <BustSilhouette className="h-5 w-5 text-white/90" />
        )}
      </span>
    </button>
  )
}

interface SidebarContextValue {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode
  open?: boolean
  setOpen?: Dispatch<SetStateAction<boolean>>
  animate?: boolean
}) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = setOpenProp ?? setOpenState

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode
  open?: boolean
  setOpen?: Dispatch<SetStateAction<boolean>>
  animate?: boolean
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export function SidebarBody({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden border-r border-white/10 bg-black/35 backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DesktopSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn('hidden h-full shrink-0 flex-col md:flex', className)}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      animate={{
        width: animate
          ? open
            ? `${SIDEBAR_EXPANDED_PX}px`
            : `${SIDEBAR_COLLAPSED_PX}px`
          : `${SIDEBAR_EXPANDED_PX}px`,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MobileSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div className={cn('hidden', className)} aria-hidden {...props} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'fixed inset-0 z-50 flex flex-col bg-black/50 p-3 md:hidden',
            )}
          >
            <motion.div
              className="flex h-full w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
            <button
              type="button"
              className="absolute inset-0 -z-10"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function SidebarLink({
  link,
  className,
  active,
  onClick,
  ...props
}: {
  link: { label: string; href?: string; icon: ReactNode }
  className?: string
  active?: boolean
  onClick?: () => void
} & Omit<React.ComponentProps<'button'>, 'onClick'>) {
  const { open, animate } = useSidebar()

  const inner = (
    <>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center',
          open ? 'h-5 w-5' : 'h-8 w-8',
        )}
      >
        {link.icon}
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
          width: animate ? (open ? 'auto' : 0) : 'auto',
        }}
        className="truncate text-sm font-medium text-white/90"
      >
        {link.label}
      </motion.span>
    </>
  )

  const classes = cn(
    'group/sidebar flex w-full items-center rounded-lg transition-colors',
    open ? 'gap-2 px-2 py-2' : 'justify-center gap-0 px-0 py-1.5',
    active
      ? 'bg-white/12 text-white shadow-inner'
      : 'text-white/70 hover:bg-white/8 hover:text-white',
    className,
  )

  if (link.href && !onClick) {
    return (
      <a href={link.href} className={classes}>
        {inner}
      </a>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick} {...props}>
      {inner}
    </button>
  )
}
