import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home,
  Cpu,
  FolderGit2,
  Wrench,
  FileText,
  User,
  Mail,
  Menu,
  X,
} from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { NAV_ITEMS, THEMES, type SectionId } from '@/theme/themes'
import { HoloLogo } from '@/components/ui/HoloLogo'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { cn } from '@/lib/utils'

const ICONS: Record<SectionId, typeof Home> = {
  home: Home,
  expertise: Cpu,
  projects: FolderGit2,
  tools: Wrench,
  writeups: FileText,
  about: User,
  contact: Mail,
}

export function Navbar() {
  const { section, setSection } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (id: SectionId) => {
    setSection(id)
    setOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5"
      >
        <div
          className={cn(
            'scene relative w-full max-w-6xl transition-all duration-500',
            scrolled && 'max-w-5xl',
          )}
        >
          {/* curved holo bar */}
          <div
            className={cn(
              'glass relative flex items-center justify-between gap-3 rounded-[22px] px-3 py-2.5 sm:px-5',
              'before:pointer-events-none before:absolute before:inset-x-6 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/80 before:to-transparent',
              scrolled && 'py-2 shadow-glow',
            )}
            style={{ transform: 'perspective(1200px) rotateX(1.6deg)' }}
          >
            <Bracket className="left-2 top-2" />
            <Bracket className="right-2 top-2 rotate-90" />
            <Bracket className="bottom-2 left-2 -rotate-90" />
            <Bracket className="bottom-2 right-2 rotate-180" />

            {/* brand */}
            <button
              onClick={() => go('home')}
              className="group flex items-center gap-3 rounded-xl px-1.5 py-1 text-left"
            >
              <HoloLogo size={38} />
              <span className="hidden leading-none sm:block">
                <span className="block font-display text-[20px] font-black tracking-[0.18em] text-ink transition-colors duration-300 group-hover:text-accent">
                  NOX
                </span>
                <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                  Reverse Engineer &amp; Systems Dev
                </span>
              </span>
            </button>

            {/* desktop nav */}
            <nav className="hidden items-center gap-0.5 lg:flex">
              {NAV_ITEMS.map((id) => (
                <NavLink key={id} id={id} active={section === id} onClick={() => go(id)} />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <MagneticButton
                onClick={() => go('contact')}
                strength={0.3}
                className={cn(
                  'group relative hidden overflow-hidden rounded-xl border px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.16em] transition-colors duration-300 sm:inline-flex',
                  section === 'contact'
                    ? 'border-accent bg-accent/20 text-ink shadow-glow'
                    : 'border-accent/45 bg-accent/10 text-accent hover:border-accent hover:text-ink',
                )}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </MagneticButton>

              <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={open}
                className="grid h-10 w-10 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent transition-colors hover:bg-accent/20 lg:hidden"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* light spill under the bar */}
          <div className="pointer-events-none mx-auto h-8 w-[88%] rounded-b-[22px] bg-gradient-to-b from-accent/15 to-transparent blur-md" />
        </div>
      </motion.header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-deep/80 backdrop-blur-md lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong mx-4 mt-28 grid gap-1.5 rounded-2xl p-3"
            >
              {[...NAV_ITEMS, 'contact' as SectionId].map((id, i) => {
                const Icon = ICONS[id]
                const active = section === id
                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.045 }}
                    onClick={() => go(id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 font-display text-sm uppercase tracking-[0.16em] transition-all',
                      active
                        ? 'bg-accent/20 text-accent shadow-glow-sm'
                        : 'text-muted hover:bg-white/5 hover:text-ink',
                    )}
                  >
                    <Icon style={{ width: 18, height: 18 }} />
                    {THEMES[id].label}
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-glow-sm" />
                    )}
                  </motion.button>
                )
              })}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({
  id,
  active,
  onClick,
}: {
  id: SectionId
  active: boolean
  onClick: () => void
}) {
  const Icon = ICONS[id]
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative whitespace-nowrap rounded-xl px-3 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 xl:px-3.5 xl:text-[12.5px]',
        active ? 'text-ink' : 'text-muted hover:text-ink',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-0 -z-10 rounded-xl border border-accent/55 bg-accent/15 shadow-glow-sm"
        />
      )}
      <span className="relative flex items-center gap-2">
        <Icon
          className={cn(
            'h-4 w-4 transition-all duration-300',
            active ? 'text-accent' : 'text-muted group-hover:text-accent',
          )}
        />
        {THEMES[id].label}
      </span>

      {/* hover underline sweep */}
      <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-hover:scale-x-100" />

      {active && (
        <motion.span
          layoutId="nav-underline"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-x-2.5 -bottom-1.5 h-[2px] rounded-full bg-accent shadow-glow-sm"
        />
      )}
    </button>
  )
}

function Bracket({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute h-2.5 w-2.5 border-l border-t border-accent/60 transition-colors duration-700',
        className,
      )}
    />
  )
}
