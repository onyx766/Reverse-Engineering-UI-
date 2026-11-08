import { useEffect, useRef, useState, type MouseEvent } from 'react'
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
import { NAV_ITEMS, SECTION_ORDER, THEMES, type SectionId } from '@/theme/themes'
import { HoloLogo } from '@/components/ui/HoloLogo'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { ScrollProgress } from '@/components/fx/ScrollProgress'
import { preloadSection } from '@/sections/registry'
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

const EASE = [0.22, 1, 0.36, 1] as const
const DRAWER_ID = 'mobile-nav'
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const keyOf = (id: SectionId) => String(SECTION_ORDER.indexOf(id) + 1)

/** Plain left clicks route in-app; modified clicks keep native "open in new tab". */
function routeClick(e: MouseEvent<HTMLAnchorElement>, go: () => void) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  go()
}

export function Navbar({ ready = true }: { ready?: boolean }) {
  const { section, setSection } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const drawer = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // a section change from anywhere (back button, number keys) closes the drawer
  useEffect(() => {
    setOpen(false)
  }, [section])

  // drawer: scroll lock, focus trap, Esc, focus back to the menu button on close
  useEffect(() => {
    if (!open) return
    const { body } = document
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    const button = menuButton.current
    const panel = drawer.current
    const initial =
      panel?.querySelector<HTMLElement>('[aria-current="page"]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE)
    initial?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const nodes = [button, ...Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))].filter(
        (n): n is HTMLElement => !!n,
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (!active || !nodes.includes(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    // the drawer is mobile-only; growing past lg would leave focus trapped in a hidden panel
    const mq = window.matchMedia('(min-width: 1024px)')
    const onBreakpoint = () => {
      if (mq.matches) setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onBreakpoint)
    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onBreakpoint)
      body.style.overflow = prevOverflow
      button?.focus({ preventScroll: true })
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
        animate={ready ? { y: 0, opacity: 1 } : { y: -90, opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: ready ? 0.15 : 0 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-5"
      >
        <div
          className={cn(
            'scene pointer-events-auto relative w-full max-w-6xl transition-[max-width] duration-500',
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
            <a
              href="#home"
              onClick={(e) => routeClick(e, () => go('home'))}
              aria-label="Nox, home"
              data-cursor-label="[1] home"
              className="group flex min-h-10 items-center gap-3 rounded-xl px-1.5 py-1 text-left transition-colors duration-300 focus-visible:bg-accent/10"
            >
              <HoloLogo size={38} />
              <span className="hidden leading-none sm:block">
                <span className="block font-display text-[20px] font-black tracking-[0.18em] text-ink transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent">
                  NOX
                </span>
                <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                  Reverse Engineer &amp; Systems Dev
                </span>
              </span>
            </a>

            {/* desktop nav */}
            <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
              {NAV_ITEMS.map((id) => (
                <NavLink
                  key={id}
                  id={id}
                  active={section === id}
                  onSelect={(e) => routeClick(e, () => go(id))}
                />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <MagneticButton
                onClick={() => go('contact')}
                strength={0.3}
                className={cn(
                  'group relative hidden overflow-hidden rounded-xl border px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.16em] transition-[color,border-color,background-color,box-shadow] duration-300 sm:inline-flex',
                  section === 'contact'
                    ? 'border-accent bg-accent/20 text-ink shadow-glow'
                    : 'border-accent/45 bg-accent/10 text-accent hover:border-accent hover:text-ink hover:shadow-glow-sm focus-visible:border-accent focus-visible:text-ink',
                )}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Mail className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
                Contact
              </MagneticButton>

              <button
                ref={menuButton}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls={DRAWER_ID}
                className={cn(
                  'relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl border text-accent transition-[background-color,border-color,box-shadow,color] duration-300 lg:hidden',
                  open
                    ? 'border-accent bg-accent/20 text-ink shadow-glow-sm'
                    : 'border-accent/40 bg-accent/10 hover:border-accent/70 hover:bg-accent/20 hover:shadow-glow-sm focus-visible:border-accent',
                )}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.span
                    key={open ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                    className="grid place-items-center"
                  >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>

            {/* section scroll progress riding the bar's lower edge */}
            <ScrollProgress className="inset-x-7 -bottom-px" />
          </div>

          {/* light spill under the bar */}
          <div className="pointer-events-none mx-auto h-8 w-[88%] rounded-b-[22px] bg-gradient-to-b from-accent/15 to-transparent blur-md" />
        </div>
      </motion.header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-deep/80 backdrop-blur-md lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              ref={drawer}
              id={DRAWER_ID}
              aria-label="Mobile"
              initial={{ y: -24, opacity: 0, rotateX: -14 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: -18, opacity: 0, rotateX: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ transformPerspective: 1200 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong relative mx-3 mt-[5.5rem] overflow-hidden rounded-2xl p-2.5 sm:mx-auto sm:mt-28 sm:max-w-md"
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
              <Bracket className="left-2 top-2" />
              <Bracket className="right-2 top-2 rotate-90" />
              <Bracket className="bottom-2 left-2 -rotate-90" />
              <Bracket className="bottom-2 right-2 rotate-180" />

              <div className="flex items-center justify-between px-3 pb-2 pt-1.5 font-mono text-[9.5px] uppercase tracking-[0.26em] text-muted">
                <span className="text-accent">// navigate</span>
                <span>{String(SECTION_ORDER.length).padStart(2, '0')} nodes</span>
              </div>

              <ul className="grid gap-1">
                {SECTION_ORDER.map((id, i) => {
                  const Icon = ICONS[id]
                  const active = section === id
                  const swatch = THEMES[id].accent
                  return (
                    <motion.li
                      key={id}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 + i * 0.04, ease: EASE }}
                    >
                      <a
                        href={`#${id}`}
                        onClick={(e) => routeClick(e, () => go(id))}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 py-2 font-display text-[13px] uppercase tracking-[0.16em] transition-colors duration-300',
                          active
                            ? 'bg-accent/15 text-ink shadow-glow-sm'
                            : 'text-muted hover:bg-accent/[0.08] hover:text-ink focus-visible:bg-accent/10 focus-visible:text-ink',
                        )}
                      >
                        <span className="w-5 font-mono text-[10px] text-muted/70">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={cn(
                            'grid h-8 w-8 place-items-center rounded-lg border transition-colors duration-300',
                            active
                              ? 'border-accent/60 bg-accent/15 text-accent'
                              : 'border-accent/20 bg-accent/5 text-muted group-hover:border-accent/50 group-hover:text-accent',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {THEMES[id].label}
                        <span
                          aria-hidden
                          className={cn(
                            'ml-auto h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125',
                            active ? 'scale-125' : 'opacity-70',
                          )}
                          style={{ background: `rgb(${swatch})`, boxShadow: `0 0 10px rgb(${swatch} / 0.8)` }}
                        />
                      </a>
                    </motion.li>
                  )
                })}
              </ul>

              <div className="mt-2 flex items-center gap-2 border-t border-accent/15 px-3 pb-1 pt-2.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                sys: online
                <span className="ml-auto">
                  theme: <span className="text-accent">{section}</span>
                </span>
              </div>
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
  onSelect,
}: {
  id: SectionId
  active: boolean
  onSelect: (e: MouseEvent<HTMLAnchorElement>) => void
}) {
  const Icon = ICONS[id]
  const key = keyOf(id)
  return (
    <a
      href={`#${id}`}
      onClick={onSelect}
      onMouseEnter={() => preloadSection(id)}
      onFocus={() => preloadSection(id)}
      aria-current={active ? 'page' : undefined}
      aria-keyshortcuts={key}
      data-cursor-label={`[${key}]`}
      className={cn(
        'group relative whitespace-nowrap rounded-xl px-3 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 xl:px-3.5 xl:text-[12.5px]',
        active ? 'text-ink' : 'text-muted hover:text-ink focus-visible:text-ink',
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
            active
              ? 'text-accent'
              : 'text-muted group-hover:-translate-y-px group-hover:text-accent group-focus-visible:text-accent',
          )}
        />
        {THEMES[id].label}
      </span>

      {/* hover underline sweep */}
      <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100" />

      {active && (
        <motion.span
          layoutId="nav-underline"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-x-2.5 -bottom-1.5 h-[2px] rounded-full bg-accent shadow-glow-sm"
        />
      )}
    </a>
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
