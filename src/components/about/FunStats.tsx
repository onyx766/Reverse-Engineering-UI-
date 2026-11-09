import { Fragment, useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { FunStat } from '@/data/about'
import { EASE, GLOW_HOVER, SWEEP, entrance } from './fx'

type CountStat = Extract<FunStat, { kind: 'count' }>
type RatioStat = Extract<FunStat, { kind: 'ratio' }>
type Vars = Record<string, string | number>

const tileMotion = (index: number, reduced: boolean) => ({
  initial: entrance(reduced, { opacity: 0, y: 30, rotateX: -14, filter: 'blur(8px)' }),
  whileInView: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.75, delay: index * 0.08, ease: EASE },
  whileHover: reduced ? undefined : { y: -6 },
  style: { transformPerspective: 1000 },
})

/** "{writeups} public write-ups" → "6 public write-ups" */
const fill = (text: string, vars: Vars) => text.replace(/\{(\w+)\}/g, (m, k: string) => String(vars[k] ?? m))

/** Count-up stat tiles: label, number, one line of context. */
export function FunStats({
  stats,
  vars = {},
  className,
}: {
  stats: FunStat[]
  /** values for "{token}" placeholders in the notes */
  vars?: Vars
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5', className)}>
      {stats.map((s, i) =>
        s.kind === 'count' ? (
          <CountTile key={s.label} stat={s} note={fill(s.note, vars)} index={i} reduced={reduced} />
        ) : (
          <RatioTile key={s.label} stat={s} note={fill(s.note, vars)} index={i} reduced={reduced} />
        ),
      )}
    </div>
  )
}

/**
 * Animates 0 → `to` the first time it scrolls into view. The digits are written
 * straight from a motion value, so the count never re-renders React; screen
 * readers get the final figure from a hidden twin.
 */
function CountUp({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const value = useMotionValue(reduced ? to : 0)
  const text = useTransform(value, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      value.set(to)
      return
    }
    const controls = animate(value, to, { duration, ease: [0.33, 1, 0.68, 1] })
    return () => controls.stop()
  }, [inView, reduced, to, duration, value])

  return (
    <>
      <motion.span ref={ref} aria-hidden>
        {text}
      </motion.span>
      <span className="sr-only">{to.toLocaleString()}</span>
    </>
  )
}

function TileChrome() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span aria-hidden className={SWEEP} />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/10 blur-2xl transition-colors duration-500 group-hover:bg-accent/30"
      />
    </>
  )
}

/** Labels reserve two lines, so the figures line up across a row whatever wraps. */
const LABEL = 'min-h-[2.75em] font-mono text-[9.5px] uppercase leading-snug tracking-[0.18em] text-muted'
const FIGURE = 'relative mt-3 font-display text-[clamp(2rem,3.4vw,2.6rem)] font-black leading-none tabular-nums text-ink'
const NOTE = 'relative mt-2.5 text-pretty text-[13px] leading-snug text-muted'

/**
 * One line of context. Each "·"-separated phrase stays in one piece while it
 * fits, so a narrow tile breaks at the dot rather than inside "write-ups"
 * (a hyphen is a break opportunity, and the UI font has no non-breaking hyphen).
 */
function Note({ text }: { text: string }) {
  return (
    <p className={NOTE}>
      {text.split(' · ').map((phrase, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          <span className="inline-block">{phrase}</span>
        </Fragment>
      ))}
    </p>
  )
}

function CountTile({
  stat,
  note,
  index,
  reduced,
}: {
  stat: CountStat
  note: string
  index: number
  reduced: boolean
}) {
  const Icon = stat.icon
  return (
    <motion.div
      {...tileMotion(index, reduced)}
      className={cn('glass group relative flex flex-col overflow-hidden rounded-xl p-4 sm:p-5', GLOW_HOVER)}
    >
      <TileChrome />
      <div className="relative flex items-start justify-between gap-2">
        <span className={LABEL}>{stat.label}</span>
        <Icon
          aria-hidden
          className="h-4 w-4 shrink-0 text-accent/80 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-125"
        />
      </div>
      <p className={FIGURE}>
        <CountUp to={stat.value} />
        {stat.suffix && <span className="neon">{stat.suffix}</span>}
      </p>
      <Note text={note} />
    </motion.div>
  )
}

function RatioTile({
  stat,
  note,
  index,
  reduced,
}: {
  stat: RatioStat
  note: string
  index: number
  reduced: boolean
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef, { margin: '-40px' })
  const Icon = stat.icon
  const RightIcon = stat.rightIcon

  return (
    <motion.div
      ref={boxRef}
      {...tileMotion(index, reduced)}
      className={cn(
        'glass group relative col-span-2 flex flex-col overflow-hidden rounded-xl p-4 sm:p-5 lg:col-span-1',
        GLOW_HOVER,
      )}
    >
      <TileChrome />
      <div className="relative flex items-start justify-between gap-2">
        <span className={LABEL}>{stat.label}</span>
        <span aria-hidden className="flex shrink-0 items-center gap-1 text-accent/80">
          <span className="relative">
            <Icon className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12" />
            {inView && !reduced && <Steam />}
          </span>
          <span className="font-mono text-[10px]">:</span>
          <RightIcon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-12" />
        </span>
      </div>
      <p className={cn(FIGURE, 'flex items-baseline gap-2')}>
        <span>{stat.left}</span>
        <span aria-hidden className="neon text-[0.8em]">
          :
        </span>
        <span className="sr-only">to</span>
        <CountUp to={stat.right} duration={1.9} />
      </p>
      <Note text={note} />
    </motion.div>
  )
}

function Steam() {
  return (
    <span className="pointer-events-none absolute -top-3 left-[3px] flex gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-px rounded-full bg-accent3"
          initial={{ y: 2, opacity: 0 }}
          animate={{ y: [2, -5], opacity: [0, 0.9, 0], scaleY: [0.6, 1.2, 0.8] }}
          transition={{ duration: 1.6, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </span>
  )
}
