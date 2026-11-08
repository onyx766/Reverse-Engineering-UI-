import { useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUp, ArrowUpRight, Github, Link2, Mail } from 'lucide-react'
import { HoloLogo } from '@/components/ui/HoloLogo'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { FOOTER } from '@/data/site'
import { usePageVisible } from '@/components/fx/hooks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER, THEMES, type SectionId } from '@/theme/themes'
import { PROFILE } from '@/data/profile'
import { cn, seeded } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

/** Lets a plain left click route in-app while ctrl/cmd/middle click still open a new tab. */
function routeClick(go: () => void) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go()
  }
}

export function Footer() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -40px 0px' })
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const live = inView && visible && !reduced

  return (
    <footer ref={ref} className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-6 pt-6 sm:px-8 sm:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 46, rotateX: -9, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.9, ease: EASE }}
        style={{ transformPerspective: 1400 }}
        className="glass relative overflow-hidden rounded-2xl"
      >
        <DeckDecor live={live} />

        <div className="relative grid gap-10 px-5 pb-8 pt-9 sm:px-8 sm:pt-10 md:grid-cols-2 md:gap-x-10 xl:grid-cols-[1.1fr_1.4fr_0.95fr_1.05fr] xl:gap-8">
          <Column index={0}>
            <Brand />
          </Column>
          <Column index={1}>
            <Navigate />
          </Column>
          <Column index={2}>
            <Connect />
          </Column>
          <Column index={3}>
            <Telemetry live={live} />
          </Column>
        </div>

        <BottomBar />
      </motion.div>

      {/* floor reflection under the deck */}
      <div
        aria-hidden
        className="pointer-events-none mx-auto -mt-2 h-8 w-[82%] rounded-[50%] bg-accent/15 blur-xl"
      />
    </footer>
  )
}

function Column({ index, children }: { index: number; children: ReactNode }) {
  return (
    <motion.div
      className="min-w-0"
      initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.75, delay: 0.12 + index * 0.08, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function ColumnTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
      <span aria-hidden className="h-px w-5 bg-accent/60" />
      <span>{children}</span>
      {aside && (
        <span className="ml-auto whitespace-nowrap text-[9.5px] tracking-[0.16em] text-muted/80">
          {aside}
        </span>
      )}
    </div>
  )
}

function DeckDecor({ live }: { live: boolean }) {
  const corner = 'pointer-events-none absolute h-4 w-4 border-accent/70'
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-40"
        style={{
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(70% 90% at 85% 100%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(70% 90% at 85% 100%, black, transparent 70%)',
        }}
      />
      {/* animated hairline top border */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <span
          className="block h-px w-1/3 -translate-x-full animate-sweep bg-gradient-to-r from-transparent via-accent3 to-transparent"
          style={{ animationDuration: '5.5s', animationPlayState: live ? 'running' : 'paused' }}
        />
      </span>

      <span aria-hidden className={cn(corner, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(corner, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(corner, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(corner, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}

function Brand() {
  const { setSection } = useTheme()
  return (
    <div className="flex flex-col items-start gap-4">
      <a
        href="#home"
        onClick={routeClick(() => setSection('home'))}
        aria-label="Nox, back to home"
        className="group -m-1.5 flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-300 hover:bg-accent/[0.06]"
      >
        <HoloLogo size={46} />
        <span className="leading-none">
          <span className="block font-display text-[22px] font-black tracking-[0.2em] text-ink transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent">
            NOX
          </span>
          <span className="mt-1.5 block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
            {FOOTER.eyebrow}
          </span>
        </span>
      </a>

      <p className="max-w-sm text-balance text-[15px] leading-relaxed text-muted">{FOOTER.tagline}</p>

      {PROFILE.available && (
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/[0.07] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {FOOTER.availability}
        </span>
      )}
    </div>
  )
}

function Navigate() {
  const { section, setSection } = useTheme()

  return (
    <nav aria-label="Footer">
      <ColumnTitle aside={<span className="hidden [@media(pointer:fine)]:inline">{FOOTER.shortcutHint}</span>}>
        navigate
      </ColumnTitle>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
        {SECTION_ORDER.map((id: SectionId, i) => {
          const active = section === id
          const swatch = THEMES[id].accent
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={routeClick(() => setSection(id))}
                aria-current={active ? 'page' : undefined}
                aria-keyshortcuts={String(i + 1)}
                className={cn(
                  'group relative flex min-h-10 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-300',
                  'hover:bg-accent/[0.07] focus-visible:bg-accent/10',
                  active ? 'text-ink' : 'text-muted hover:text-ink focus-visible:text-ink',
                )}
              >
                <kbd
                  className={cn(
                    'relative grid h-6 w-6 shrink-0 place-items-center rounded-md border bg-deep/60 font-mono text-[10px] transition-all duration-300',
                    active
                      ? 'border-accent/70 text-accent shadow-glow-sm'
                      : 'border-accent/25 text-muted group-hover:border-accent/70 group-hover:text-accent group-hover:shadow-glow-sm',
                  )}
                >
                  {i + 1}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute -right-[3px] -top-[3px] h-[7px] w-[7px] rounded-full border border-deep transition-transform duration-300 group-hover:scale-125',
                      active ? 'scale-110' : 'opacity-80',
                    )}
                    style={{ background: `rgb(${swatch})`, boxShadow: `0 0 8px rgb(${swatch} / 0.85)` }}
                  />
                </kbd>
                <span className="truncate font-sans text-[14px] font-semibold uppercase tracking-[0.12em] transition-transform duration-300 group-hover:translate-x-0.5">
                  {THEMES[id].label}
                </span>
                {active && (
                  <span aria-hidden className="ml-auto h-px w-3 shrink-0 bg-accent shadow-glow-sm" />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  GitHub: Github,
  X: XMark,
  Mail: Mail,
}

function Connect() {
  return (
    <div>
      <ColumnTitle>connect</ColumnTitle>
      <ul className="space-y-2">
        {PROFILE.socials.map((s) => {
          const external = /^https?:/i.test(s.href)
          const Icon = SOCIAL_ICONS[s.label] ?? Link2
          return (
            <li key={s.label}>
              <a
                href={s.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={`${s.label}: ${s.handle}${external ? ' (opens in a new tab)' : ''}`}
                className={cn(
                  'group relative flex min-h-[3rem] items-center gap-3 overflow-hidden rounded-xl border border-accent/15 bg-deep/40 px-3 py-2',
                  'transition-[transform,border-color,background-color,box-shadow] duration-300',
                  'hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/[0.08] hover:shadow-glow-sm',
                  'focus-visible:border-accent/60 focus-visible:bg-accent/[0.08]',
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[11.5px] font-bold uppercase tracking-[0.16em] text-ink">
                    {s.label}
                  </span>
                  <span className="block truncate font-mono text-[10.5px] text-muted transition-colors duration-300 group-hover:text-accent3">
                    {s.handle}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const startedAt = typeof performance !== 'undefined' ? performance.now() : 0

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** Owner's clock, derived from the "UTC+1" style offset in PROFILE.location. */
function ownerClock(now: Date) {
  const m = /UTC\s*([+-]\d{1,2})(?::?(\d{2}))?/i.exec(PROFILE.location)
  if (!m) return null
  const offsetMin = Number(m[1]) * 60 + Math.sign(Number(m[1]) || 1) * Number(m[2] ?? 0)
  const t = new Date(now.getTime() + offsetMin * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC${m[1].startsWith('-') ? '' : '+'}${Number(m[1])}`
}

function useTicker(live: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])
  return now
}

function Telemetry({ live }: { live: boolean }) {
  const { theme } = useTheme()
  const now = useTicker(live)
  const clock = ownerClock(new Date(now))

  return (
    <div>
      <ColumnTitle aside={<span className="text-emerald-300/90">nominal</span>}>{FOOTER.telemetry}</ColumnTitle>
      <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-deep/50 p-3">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <Waveform live={live} />
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em]">
          <Readout label="uptime" value={formatUptime(performance.now() - startedAt)} />
          {clock && <Readout label="local" value={clock} />}
          <Readout
            label="palette"
            value={
              <>
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-glow-sm" />
                {theme.label}
              </>
            }
          />
          <Readout label="build" value={FOOTER.build} />
        </dl>
      </div>
    </div>
  )
}

function Readout({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] tracking-[0.22em] text-muted/80">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 truncate text-ink">{value}</dd>
    </div>
  )
}

/** Scrolling signal trace; two identical halves make the loop seamless. */
function Waveform({ live }: { live: boolean }) {
  const bars = useMemo(() => {
    const rand = seeded(2026)
    return Array.from({ length: 72 }, (_, i) => {
      const envelope = 0.35 + 0.65 * Math.abs(Math.sin((i / 72) * Math.PI * 3))
      return Math.max(0.08, envelope * (0.3 + rand() * 0.7))
    })
  }, [])

  const half = (
    <svg viewBox="0 0 144 32" preserveAspectRatio="none" className="h-full w-1/2" aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 2 + 0.4}
          y={16 - h * 15}
          width="1.1"
          height={h * 30}
          rx="0.4"
          fill={i % 9 === 0 ? 'rgb(var(--accent-3))' : 'rgb(var(--accent) / 0.75)'}
        />
      ))}
    </svg>
  )

  return (
    <div className="relative h-10 overflow-hidden rounded-md border border-accent/10 bg-deep/40">
      <div
        aria-hidden
        className="absolute inset-y-1 left-0 flex w-[200%] animate-[waveScroll_9s_linear_infinite]"
        style={{ animationPlayState: live ? 'running' : 'paused' }}
      >
        {half}
        {half}
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-accent3/60 shadow-glow-sm" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-deep via-transparent to-deep opacity-80" />
    </div>
  )
}

function BottomBar() {
  const { theme } = useTheme()
  const reduced = useReducedMotion()

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  return (
    <div className="relative flex flex-col items-center gap-4 border-t border-accent/15 px-5 py-4 sm:px-8 lg:flex-row lg:justify-between lg:gap-6">
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted lg:text-left">
        <span className="text-ink">{FOOTER.copyright}</span>
        <span aria-hidden className="mx-2 text-accent/50">
          /
        </span>
        {FOOTER.notice}
      </p>

      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span>
          sys: <span className="text-emerald-300">online</span>
        </span>
        <span aria-hidden className="text-accent/50">·</span>
        <span>
          theme: <span className="text-accent">{theme.id}</span>
        </span>
        <span aria-hidden className="text-accent/50">·</span>
        <span>build {FOOTER.build}</span>
      </p>

      <MagneticButton
        onClick={toTop}
        ariaLabel="Back to top"
        strength={0.32}
        className={cn(
          'group relative h-11 gap-2 overflow-hidden rounded-xl border border-accent/40 bg-accent/10 px-4 text-accent',
          'transition-[color,background-color,border-color,box-shadow] duration-300',
          'hover:border-accent hover:bg-accent/20 hover:text-ink hover:shadow-glow',
          'focus-visible:border-accent focus-visible:text-ink',
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
        <span className="relative font-display text-[10.5px] font-bold uppercase tracking-[0.2em]">Top</span>
        <ArrowUp aria-hidden className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
      </MagneticButton>
    </div>
  )
}
