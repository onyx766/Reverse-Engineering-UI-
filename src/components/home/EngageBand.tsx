import { useId, useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, CalendarCheck, Clock3, Globe2, Mail, PhoneCall, ShieldCheck } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { PROFILE } from '@/data/profile'
import { AVAILABILITY, CONTACT, ENGAGEMENT_STEPS, OWNER_TZ, RULES } from '@/data/contact'
import { HOME_BLOCKS } from '@/data/home'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { EASE, reveal } from './shared'

const COPY = HOME_BLOCKS.engage
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')
/** U+2060 WORD JOINER: forbids a line break next to the character it touches */
const WJ = String.fromCharCode(0x2060)

/** "< 24h" -> "24 hours", for use inside a sentence. */
function spellResponse(t: string) {
  const m = /(\d+)\s*h\b/i.exec(t)
  return m ? `${m[1]} hours` : t
}

/** First Monday at least `weeks` out — the same rule the Contact availability panel uses. */
function nextStart(weeks: number) {
  const d = new Date(Date.now() + weeks * 7 * 864e5)
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7))
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** Closing call to action: availability, the terms that matter, and the way in. */
export function EngageBand() {
  const { setSection } = useTheme()
  const headingId = useId()
  const still = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  const open = PROFILE.available
  const intro = ENGAGEMENT_STEPS[0]
  const start = useMemo(() => nextStart(CONTACT.bookingLeadWeeks), [])

  // "30 min · free" -> value "30 min", the rest joins the note
  const [introLength, ...introTerms] = intro ? intro.duration.split(' · ') : []

  const facts = [
    { icon: Clock3, label: COPY.facts.response, value: CONTACT.responseTime, note: CONTACT.responseNote },
    ...(intro
      ? [
          {
            icon: PhoneCall,
            label: COPY.facts.intro,
            value: introLength,
            note: [...introTerms, intro.deliverable].join(' · '),
          },
        ]
      : []),
    {
      icon: CalendarCheck,
      label: COPY.facts.start,
      value: open ? start : AVAILABILITY.bookedStatus,
      note: open ? `${CONTACT.bookingLeadWeeks}-week booking lead` : COPY.bookedNote,
    },
    {
      icon: Globe2,
      label: COPY.facts.timezone,
      value: OWNER_TZ.label,
      // word joiners keep "09:00–18:00" on one line in the narrow phone tile
      note: `Office hours ${pad(CONTACT.hours.start)}:00${WJ}–${WJ}${pad(CONTACT.hours.end)}:00`,
    },
  ]

  return (
    // data-fx-paused parks the status LED's ping while the band is off-screen
    <section ref={ref} aria-labelledby={headingId} data-fx-paused={!inView}>
      <motion.div
        {...reveal(0, 34, still)}
        className="relative overflow-hidden rounded-[1.6rem] border border-accent/30 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
        style={{
          background:
            'radial-gradient(70% 90% at 0% 0%, rgb(var(--accent) / 0.2), transparent 60%), radial-gradient(60% 80% at 100% 100%, rgb(var(--accent-2) / 0.14), transparent 60%), linear-gradient(160deg, rgb(var(--surface) / 0.92), rgb(var(--deep) / 0.9))',
          boxShadow:
            '0 0 0 1px rgb(var(--accent) / 0.08) inset, 0 0 70px -24px rgb(var(--accent) / 0.55), 0 40px 80px -40px rgb(0 0 0 / 0.95)',
        }}
      >
        <Decor />

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
          {/* pitch */}
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.3em] text-accent">
              <span className="grid h-7 min-w-7 place-items-center rounded-md border border-accent/40 bg-accent/10 px-1 text-[10px] tracking-[0.04em] shadow-glow-sm">
                05
              </span>
              {COPY.eyebrow}
            </p>

            <h2
              id={headingId}
              tabIndex={-1}
              data-block-heading
              className="mt-4 text-balance font-display text-[clamp(1.7rem,4.2vw,3rem)] font-black uppercase leading-[1.04] tracking-tight text-gradient outline-none"
            >
              {COPY.title}
            </h2>

            <p className="mt-4 max-w-xl text-pretty text-[15.5px] leading-relaxed text-muted">
              {COPY.body.replace('{response}', spellResponse(CONTACT.responseTime))}
            </p>

            <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-deep/50 py-1.5 pl-2.5 pr-3.5">
              <span aria-hidden className="relative flex h-2 w-2">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping',
                    open ? 'bg-emerald-400' : 'bg-amber-400',
                  )}
                />
                <span className={cn('relative inline-flex h-2 w-2 rounded-full', open ? 'bg-emerald-400' : 'bg-amber-400')} />
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink">
                {open ? AVAILABILITY.status : AVAILABILITY.bookedStatus}
              </span>
              <span className="hidden font-mono text-[10.5px] text-muted sm:inline">
                · {open ? AVAILABILITY.detail : AVAILABILITY.bookedDetail}
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <MagneticButton
                onClick={() => setSection('contact')}
                strength={0.25}
                className="group relative min-h-12 w-full gap-2.5 overflow-hidden rounded-xl border border-accent/70 bg-accent/20 px-5 py-3.5 font-display text-[12px] font-bold sm:px-7 sm:text-[13px] uppercase tracking-[0.16em] text-ink shadow-glow-sm transition-[background-color,border-color,box-shadow] duration-300 hover:border-accent hover:bg-accent/30 hover:shadow-glow sm:w-auto"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span className="relative">{open ? COPY.primary : COPY.primaryBooked}</span>
                <ArrowRight aria-hidden className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </MagneticButton>
              <a
                href={`mailto:${PROFILE.email}`}
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-transparent px-4 font-mono text-[12px] text-muted transition-colors duration-300 hover:border-accent/30 hover:bg-accent/[0.06] hover:text-ink sm:justify-start"
              >
                <Mail aria-hidden className="h-4 w-4 text-accent transition-transform duration-300 group-hover:-rotate-12" />
                <span>
                  <span className="sr-only">{COPY.secondary}: </span>
                  {PROFILE.email}
                </span>
              </a>
            </div>
          </div>

          {/* facts + rules */}
          <div className="min-w-0">
            <ul className="grid grid-cols-2 gap-3">
              {facts.map((f, i) => (
                <motion.li
                  key={f.label}
                  initial={still ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -6% 0px' }}
                  transition={{ duration: 0.6, delay: 0.12 + i * 0.07, ease: EASE }}
                  className="group/fact relative min-w-0 overflow-hidden rounded-xl border border-accent/20 bg-deep/45 p-3.5 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/[0.07] sm:p-4"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
                    <f.icon aria-hidden className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover/fact:scale-110" />
                    {f.label}
                  </span>
                  <span className="mt-1.5 block break-words font-display text-[17px] font-bold leading-tight text-ink sm:text-[20px]">
                    {f.value}
                  </span>
                  <span className="mt-1 block text-[13px] leading-snug text-muted">{f.note}</span>
                </motion.li>
              ))}
            </ul>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-accent/15 pt-5">
              {RULES.slice(0, 3).map((r) => (
                <li key={r.id} className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink/90">
                  <ShieldCheck aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                  {r.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function Decor() {
  const corner = 'pointer-events-none absolute h-4 w-4 border-accent/70'
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-30"
        style={{
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(60% 80% at 85% 90%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(60% 80% at 85% 90%, black, transparent 70%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)' }}
      />
      <span aria-hidden className={cn(corner, 'left-3 top-3 border-l border-t')} />
      <span aria-hidden className={cn(corner, 'right-3 top-3 border-r border-t')} />
      <span aria-hidden className={cn(corner, 'bottom-3 left-3 border-b border-l')} />
      <span aria-hidden className={cn(corner, 'bottom-3 right-3 border-b border-r')} />
    </>
  )
}
