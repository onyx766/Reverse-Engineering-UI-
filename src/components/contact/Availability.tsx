import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Activity, CalendarCheck, FileLock2, MoonStar, Sun, Timer } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { AVAILABILITY, CONTACT, OWNER_TZ } from '@/data/contact'
import { PROFILE } from '@/data/profile'
import { EASE } from './fields'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')
const mod = (a: number, n: number) => ((a % n) + n) % n
const tzSuffix = `${OWNER_TZ.minutes < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(OWNER_TZ.minutes) / 60))}:${pad(Math.abs(OWNER_TZ.minutes) % 60)}`

/** Wall clock that ticks on second boundaries, only while `active`. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const t = Date.now()
      setNow(t)
      timer = setTimeout(tick, 1000 - (t % 1000) + 8)
    }
    tick()
    return () => clearTimeout(timer)
  }, [active])
  return now
}

function fmtHour(h: number) {
  const whole = Math.floor(mod(h, 24))
  const min = Math.round((mod(h, 24) - whole) * 60)
  return `${pad(whole)}:${pad(min)}`
}

function relative(diffMin: number) {
  if (diffMin === 0) return 'same time as you'
  const abs = Math.abs(diffMin)
  const span = abs % 60 ? `${Math.floor(abs / 60)} h ${abs % 60} min` : `${abs / 60} h`
  return diffMin > 0 ? `${span} ahead of you` : `${span} behind you`
}

/** The visitor's 09:00–18:00 projected onto the owner's 24 h axis (may wrap midnight). */
function visitorBand(shiftH: number): [number, number][] {
  const a = mod(9 + shiftH, 24)
  const b = a + 9
  return b <= 24 ? [[a, b]] : [[a, 24], [0, b - 24]]
}

function nextSlot(now: number, weeks: number) {
  const d = new Date(now + weeks * 7 * 864e5)
  d.setDate(d.getDate() + mod(8 - d.getDay(), 7))
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

const Digit = memo(function Digit({ d, reduced }: { d: string; reduced: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.84em] overflow-hidden text-center">
      <AnimatePresence initial={false}>
        <motion.span
          key={d}
          initial={reduced ? false : { y: '-90%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { y: '90%', opacity: 0 }}
          transition={{ duration: 0.38, ease: EASE }}
          className="absolute inset-0"
        >
          {d}
        </motion.span>
      </AnimatePresence>
    </span>
  )
})

export function Availability() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const now = useNow(inView)

  const o = new Date(now + OWNER_TZ.minutes * 60000)
  const h = o.getUTCHours()
  const m = o.getUTCMinutes()
  const s = o.getUTCSeconds()
  const day = o.getUTCDay()
  const { start, end, days } = CONTACT.hours

  const workday = days.includes(day)
  const working = workday && h >= start && h < end
  const nextOpenDay = (() => {
    for (let i = 1; i <= 7; i++) if (days.includes((day + i) % 7)) return i
    return 1
  })()
  const status = working
    ? { tone: 'ok', text: 'In office hours · replies today' }
    : workday && h < start
      ? { tone: 'warn', text: `Before hours · back at ${pad(start)}:00` }
      : {
          tone: 'warn',
          text: `Off hours · back ${nextOpenDay === 1 ? 'tomorrow' : DAYS[(day + nextOpenDay) % 7]} ${pad(start)}:00`,
        }

  const visitorMin = -new Date(now).getTimezoneOffset()
  const diff = OWNER_TZ.minutes - visitorMin
  const band = visitorBand(diff / 60)
  const overlaps = band
    .map(([a, b]) => [Math.max(a, start), Math.min(b, end)] as [number, number])
    .filter(([a, b]) => b > a)
  const overlapH = overlaps.reduce((acc, [a, b]) => acc + b - a, 0)

  const hh = pad(h)
  const mm = pad(m)
  const ss = pad(s)
  const pos = ((h + m / 60 + s / 3600) / 24) * 100
  const isDay = h >= 7 && h < 19
  const live = inView && !reduced
  const open = PROFILE.available

  return (
    <HoloPanel
      title="Availability"
      icon={Activity}
      badge="Live"
      from="right"
      delay={0.12}
      tilt={5}
      className="h-full"
      bodyClassName="flex flex-col lg:min-h-[calc(100%-58px)]"
    >
      <div ref={ref} className="flex flex-1 flex-col gap-4">
        <div className="flex items-start gap-3">
          <span aria-hidden className="relative mt-1 flex h-3 w-3 shrink-0">
            {live && (
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full',
                  open ? 'bg-emerald-400/70' : 'bg-amber-400/70',
                )}
              />
            )}
            <span
              className={cn(
                'relative inline-flex h-3 w-3 rounded-full',
                open
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgb(52_211_153/0.85)]'
                  : 'bg-amber-400 shadow-[0_0_12px_rgb(251_191_36/0.85)]',
              )}
            />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[13.5px] font-bold uppercase tracking-[0.12em] text-ink">
              {open ? AVAILABILITY.status : AVAILABILITY.bookedStatus}
            </p>
            <p className="mt-0.5 text-[14px] text-muted">
              {open ? AVAILABILITY.detail : AVAILABILITY.bookedDetail}
            </p>
          </div>
        </div>

        {/* owner clock */}
        <div className="group/clock relative overflow-hidden rounded-xl border border-accent/20 bg-deep/45 px-4 py-3.5 transition-colors duration-300 hover:border-accent/45">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Onyx local time · <span className="text-accent">{OWNER_TZ.label}</span>
              </p>
              <time
                dateTime={`${o.toISOString().slice(0, 19)}${tzSuffix}`}
                className="mt-1.5 flex items-baseline font-display text-[30px] font-bold leading-none text-ink sm:text-[34px]"
              >
                <span className="sr-only">
                  {hh}:{mm} {OWNER_TZ.label}
                </span>
                <span aria-hidden className="flex">
                  <Digit d={hh[0]} reduced={reduced} />
                  <Digit d={hh[1]} reduced={reduced} />
                  <span className={cn('w-[0.4em] text-center text-accent', live && 'animate-pulse')}>:</span>
                  <Digit d={mm[0]} reduced={reduced} />
                  <Digit d={mm[1]} reduced={reduced} />
                  <span className="w-[0.4em] text-center text-accent/60">:</span>
                  <span className="flex text-accent">
                    <Digit d={ss[0]} reduced={reduced} />
                    <Digit d={ss[1]} reduced={reduced} />
                  </span>
                </span>
              </time>
              <p className="mt-2 font-mono text-[10.5px] text-muted">
                {DAYS[day]} {pad(o.getUTCDate())} {MONTHS[o.getUTCMonth()]} ·{' '}
                <span className="text-ink/80">{relative(diff)}</span>
              </p>
            </div>
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-transform duration-500 group-hover/clock:rotate-12"
            >
              {isDay ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
            </span>
          </div>

          <p
            className={cn(
              'mt-3 inline-flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
              status.tone === 'ok'
                ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
                : 'border-amber-400/35 bg-amber-400/10 text-amber-300',
            )}
          >
            <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', status.tone === 'ok' ? 'bg-emerald-400' : 'bg-amber-400')} />
            {status.text}
          </p>

          {/* 24 h track: my hours, your hours, now */}
          <div aria-hidden className="mt-4">
            <div className="relative h-8">
              <div className="absolute inset-x-0 top-2 h-2.5 overflow-hidden rounded-full bg-accent/[0.07] ring-1 ring-inset ring-accent/15">
                <span
                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-accent/60 to-accent2/60"
                  style={{ left: `${(start / 24) * 100}%`, width: `${((end - start) / 24) * 100}%` }}
                />
              </div>
              {band.map(([a, b]) => (
                <span
                  key={a}
                  className="absolute top-[22px] h-1 rounded-full bg-accent3/70"
                  style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }}
                />
              ))}
              {/* full-width carrier: translateX(%) is relative to the track, so the marker
                  glides on the compositor instead of re-laying out every second */}
              <span
                className="absolute inset-x-0 top-0 h-[30px] transition-transform duration-700 ease-linear"
                style={{ transform: `translateX(${pos}%)` }}
              >
                <span className="absolute left-0 top-0 h-full w-px bg-ink shadow-[0_0_10px_rgb(var(--accent))]">
                  <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-accent shadow-glow-sm" />
                </span>
              </span>
            </div>
            <div className="mt-0.5 flex justify-between font-mono text-[9px] text-muted/70">
              {['00', '06', '12', '18', '24'].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-1.5 w-3 rounded-full bg-gradient-to-r from-accent to-accent2" />
              my hours {pad(start)}–{pad(end)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-1 w-3 rounded-full bg-accent3/80" />
              your 09–18
            </span>
          </div>
          <p className="mt-2 text-[13.5px] leading-snug text-muted">
            {diff === 0 ? (
              <>Same timezone: our working days line up completely.</>
            ) : overlapH > 0 ? (
              <>
                {overlapH >= 9 ? 'Full' : `${Math.round(overlapH * 10) / 10} h`} overlap with your working day:{' '}
                <span className="text-ink">
                  {fmtHour(overlaps[0][0])}–{fmtHour(overlaps[0][1])} {OWNER_TZ.label}
                </span>
                .
              </>
            ) : (
              <>No overlap with your working day; async by email works best.</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Timer} label="Response" value={CONTACT.responseTime} note={CONTACT.responseNote} />
          <Stat
            icon={CalendarCheck}
            label="Next start"
            value={nextSlot(now, CONTACT.bookingLeadWeeks)}
            note={`${CONTACT.bookingLeadWeeks}-week booking lead`}
          />
        </div>

        <p className="mt-auto flex gap-2.5 border-t border-accent/15 pt-4 text-[14px] leading-relaxed text-muted">
          <FileLock2 aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
          {CONTACT.bookingNote}
        </p>
      </div>
    </HoloPanel>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Timer
  label: string
  value: string
  note: string
}) {
  return (
    <div className="group/stat relative overflow-hidden rounded-xl border border-accent/20 bg-accent/[0.04] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/[0.08]">
      <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
        <Icon
          aria-hidden
          className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover/stat:scale-110"
        />
        {label}
      </span>
      <span className="mt-1.5 block font-display text-[19px] font-bold leading-tight text-ink">{value}</span>
      <span className="mt-1 block text-[12.5px] leading-snug text-muted">{note}</span>
    </div>
  )
}
