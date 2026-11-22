import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home,
  House,
  Box,
  Cpu,
  FolderGit2,
  Wrench,
  FileText,
  User,
  Mail,
  Menu,
  X,
  Codesandbox,
} from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { NAV_ITEMS, SECTION_ORDER, THEMES, morphVars, type SectionId } from '@/theme/themes'
import { HoloLogo } from '@/components/ui/HoloLogo'
import NAV_SLAB from '@/assets/ref/nav.webp'
import { useRefScale } from '@/hooks/useRefScale'
import { PROFILE } from '@/data/profile'
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
  const { section, theme, setSection } = useTheme()
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
    // palette scope for the bar and the drawer: both are fixed, so this wrapper has no box of its own
    <div className="palette-morph" style={morphVars(theme)}>
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : { y: -90, opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: ready ? 0.15 : 0 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-5"
      >
        {/* once scrolled, content fades out under the floating bar instead of showing cut lines above it */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-0 top-0 -z-10 h-20 bg-gradient-to-b from-deep via-deep/70 to-transparent transition-opacity duration-500 sm:h-24',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
        />
        <DesktopBar section={section} go={go} />

        {/* phones and tablets: the compact bar */}
        <div
          className={cn(
            'scene pointer-events-auto relative w-full max-w-6xl lg:hidden transition-[max-width] duration-500 2xl:max-w-[84rem]',
            scrolled && 'max-w-5xl xl:max-w-[68rem] 2xl:max-w-[76rem]',
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
              aria-label="Onyx, home"
              data-cursor-label="[1] home"
              className="group flex min-h-10 items-center gap-3 rounded-xl px-1.5 py-1 text-left transition-colors duration-300 focus-visible:bg-accent/10"
            >
              <HoloLogo size={38} />
              {/* phones keep the wordmark (the bar has room for it); the subtitle joins from sm */}
              <span className="block min-w-[4.75rem] leading-none">
                <span className="block font-display text-[18px] font-bold tracking-[-0.005em] text-ink transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent sm:text-[20px]">
                  ONYX
                </span>
                <span
                  className={cn(
                    'mt-1 hidden font-ui font-semibold text-[10.5px] uppercase leading-[1.35] tracking-[0.08em] text-muted sm:block lg:hidden xl:block',
                    scrolled && 'xl:hidden',
                  )}
                >
                  <span className="block truncate">Reverse Engineering</span>
                  <span className="block truncate">&amp; Systems Development</span>
                </span>
              </span>
            </a>

            {/* desktop nav */}
            <nav aria-label="Primary" className="hidden shrink-0 items-center gap-0.5 lg:flex">
              {NAV_ITEMS.map((id) => (
                <NavLink
                  key={id}
                  id={id}
                  active={section === id}
                  compact={scrolled}
                  onSelect={(e) => routeClick(e, () => go(id))}
                />
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <MagneticButton
                onClick={() => go('contact')}
                strength={0.3}
                className={cn(
                  'group relative hidden min-h-10 overflow-hidden rounded-xl border px-3 py-2.5 font-ui text-[11px] font-bold uppercase tracking-[0.08em] transition-[color,border-color,background-color,box-shadow] duration-300 sm:inline-flex xl:px-4 xl:text-[12px] xl:tracking-[0.08em]',
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

              <div className="flex items-center justify-between px-3 pb-2 pt-1.5 font-ui font-semibold text-[10.75px] uppercase tracking-[0.08em] text-muted">
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
                          'group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 py-2 font-ui font-semibold text-[13px] uppercase tracking-[0.08em] transition-colors duration-300',
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

              <div className="mt-2 flex items-center gap-2 border-t border-accent/15 px-3 pb-1 pt-2.5 font-ui font-semibold text-[10.75px] uppercase tracking-[0.08em] text-muted">
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
    </div>
  )
}

function NavLink({
  id,
  active,
  compact,
  onSelect,
}: {
  id: SectionId
  active: boolean
  /** condensed bar after scrolling: labels only */
  compact: boolean
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
        'group relative whitespace-nowrap rounded-xl px-1.5 py-2.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 xl:px-2.5 xl:text-[12px] xl:tracking-[0.08em] 2xl:px-3',
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
            'hidden h-4 w-4 transition-all duration-300 2xl:block',
            compact && '2xl:hidden',
            active
              ? 'text-accent'
              : 'text-muted group-hover:-translate-y-px group-hover:text-accent group-focus-visible:text-accent',
          )}
        />
        {THEMES[id].label}
      </span>

      {/* hover underline sweep */}
      <span className="pointer-events-none absolute inset-x-1.5 -bottom-0.5 xl:inset-x-2.5 2xl:inset-x-3 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100" />

      {active && (
        <motion.span
          layoutId="nav-underline"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-x-1 -bottom-1.5 xl:inset-x-2 2xl:inset-x-2.5 h-[2px] rounded-full bg-accent shadow-glow-sm"
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

/* ── desktop bar: the reference render's navbar, drawn in its own pixel space ── */

/** design box of the bar: x 228…1456, y 0…118 of the 1672 × 941 reference */
const BAR_W = 1228
const BAR_H = 118
const REF_ICONS: Record<SectionId, (p: { className?: string }) => JSX.Element> = {
  home: (p) => <House strokeWidth={1.6} {...p} />,
  expertise: (p) => <Codesandbox strokeWidth={1.6} {...p} />,
  projects: (p) => <Box strokeWidth={1.6} {...p} />,
  tools: (p) => <Wrench strokeWidth={1.6} {...p} />,
  writeups: (p) => <FileText strokeWidth={1.6} {...p} />,
  about: AboutGlyph,
  contact: (p) => <Mail strokeWidth={1.6} {...p} />,
}

function DesktopBar({ section, go }: { section: SectionId; go: (id: SectionId) => void }) {
  // never smaller than 0.8: at 1024–1280px the bar stays readable and still fits
  const s = Math.max(0.8, useRefScale())
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 hidden lg:block"
      style={{
        width: BAR_W,
        height: BAR_H,
        // the bar's centre sits 6px right of the page centre in the reference
        transform: `translateX(calc(-50% + ${6 * s}px)) scale(${s})`,
        transformOrigin: 'top center',
      }}
    >
      {/* the render's own glass slab (name and links removed, logo and Contact kept) */}
      <img
        aria-hidden
        alt=""
        src={NAV_SLAB}
        width={BAR_W}
        height={BAR_H}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ filter: 'drop-shadow(0 10px 18px rgb(0 0 0 / 0.6))' }}
      />

      {/* brand */}
      <a
        href="#home"
        onClick={(e) => routeClick(e, () => go('home'))}
        aria-label={`${PROFILE.name}, home`}
        data-cursor-label="[1] home"
        className="group pointer-events-auto absolute left-[37px] top-[23px] flex items-center gap-[17px] rounded-xl font-ui outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* the logo is part of the slab: hover adds light over it */}
        <span
          aria-hidden
          className="relative h-[66px] w-[60px] shrink-0 rounded-[14px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ mixBlendMode: 'screen', background: 'radial-gradient(closest-side, rgb(60 220 250 / 0.55), transparent)' }}
        />
        <span className="block leading-none text-ink">
          <span className="block text-[41px] font-bold leading-[40px] tracking-[-0.01em] transition-[text-shadow] duration-300 group-hover:[text-shadow:0_0_18px_rgb(var(--accent)/0.8)]">
            {PROFILE.name}
          </span>
          <span className="mt-[3px] block text-[15.5px] leading-[17.5px] text-ink/90">
            Reverse Engineer
            <br />
            &amp; Automation Engineer
          </span>
        </span>
      </a>

      <ScrollProgress className="left-[300px] top-[97px] w-[700px]" />

      <nav aria-label="Primary" className="pointer-events-auto absolute left-[343px] top-[46px] flex h-[44px] items-center gap-[30px] font-ui">
        {NAV_ITEMS.map((id) => (
          <RefNavLink key={id} id={id} active={section === id} onSelect={(e) => routeClick(e, () => go(id))} />
        ))}
      </nav>

      {/* Contact is drawn on the slab; this is the live control over it */}
      <button
        type="button"
        onClick={() => go('contact')}
        aria-current={section === 'contact' ? 'page' : undefined}
        aria-label="Contact"
        className="group pointer-events-auto absolute left-[1057px] top-[31px] h-[51px] w-[136px] rounded-[11px] outline-none focus-visible:ring-2 focus-visible:ring-accent3"
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[11px] transition-opacity duration-300',
            section === 'contact' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          style={{
            mixBlendMode: 'screen',
            boxShadow: 'inset 0 0 0 2px rgb(110 235 255 / 0.9), inset 0 0 16px rgb(60 215 250 / 0.55), 0 0 18px rgb(60 215 250 / 0.7)',
          }}
        />
      </button>
    </div>
  )
}

function RefNavLink({
  id,
  active,
  onSelect,
}: {
  id: SectionId
  active: boolean
  onSelect: (e: MouseEvent<HTMLAnchorElement>) => void
}) {
  const Icon = REF_ICONS[id]
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
        'group relative flex h-full items-center gap-[9px] whitespace-nowrap rounded-md text-[15.5px] outline-none transition-[color,text-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-accent',
        active ? 'font-semibold text-ink' : 'text-ink/[0.92] hover:text-ink hover:[text-shadow:0_0_12px_rgb(var(--accent)/0.85)]',
      )}
    >
      <Icon
        className={cn(
          'h-[21px] w-[21px] shrink-0 transition-[color,transform] duration-300',
          active ? 'text-ink' : 'text-ink/90 group-hover:-translate-y-px group-hover:text-accent3',
        )}
      />
      {THEMES[id].label}
      {/* hover: a thin sweep along the bottom lip */}
      <span className="pointer-events-none absolute -inset-x-3 top-[46px] h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-hover:scale-x-100" />
      {active && (
        <motion.span
          layoutId="ref-nav-underline"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute -inset-x-[15px] top-[45px] h-[3px] rounded-full bg-accent3"
          style={{ boxShadow: '0 0 6px rgb(var(--accent)), 0 0 16px rgb(var(--accent) / 0.8), 0 0 30px rgb(var(--accent) / 0.45)' }}
        />
      )}
    </a>
  )
}

/** About: a person inside a rounded hexagon (the reference's glyph). */
function AboutGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2.6 19.9 7.2v9.6L12 21.4 4.1 16.8V7.2z" />
      <circle cx="12" cy="10" r="2.8" />
      <path d="M7.6 16.6c.9-2 2.5-3 4.4-3s3.5 1 4.4 3" />
    </svg>
  )
}
