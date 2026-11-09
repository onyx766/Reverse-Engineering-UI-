import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useSpring, useTransform } from 'framer-motion'
import { Chip } from '@/components/ui/Chip'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { clamp, cn } from '@/lib/utils'
import { CAREER_NOW, type CareerEntry } from '@/data/about'
import { useScrollProgress } from './useScrollProgress'
import { EASE, GLOW_HOVER, SWEEP, entrance } from './fx'

/** distance from the top of a row to the centre of its node, in px */
const NODE_Y = 28
/** half the node size where the readout shows (lg: h-11) */
const NODE_R = 22
/** the year readout hangs this far below the playhead, and is this tall */
const CHIP_TOP = 12
const CHIP_H = 19
/** the readout fades over this many px as it closes in on a node */
const CHIP_FADE = 12

/** 2021.27 → "2021.04", the same year.month stamp the ID card uses */
const stamp = (y: number) => {
  const year = Math.floor(y + 1e-6)
  const month = Math.min(12, Math.floor((y - year) * 12) + 1)
  return `${year}.${String(month).padStart(2, '0')}`
}

/**
 * Vertical career log. The spine fills with light as the reader scrolls, a
 * playhead reads out the year it has reached, and each node ignites when the
 * light gets to it.
 */
export function CareerTimeline({
  entries,
  className,
}: {
  entries: CareerEntry[]
  className?: string
}) {
  const listRef = useRef<HTMLOListElement>(null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const reduced = useReducedMotion()
  const { progress: raw, height } = useScrollProgress(listRef, 0.62)
  const smooth = useSpring(raw, { stiffness: 140, damping: 26, mass: 0.35 })
  const progress = reduced ? raw : smooth

  const [stops, setStops] = useState<number[]>([])
  const [reached, setReached] = useState(0)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const h = Math.max(1, list.offsetHeight)
      setStops(
        rowRefs.current
          .slice(0, entries.length)
          .map((row) => (row ? (row.offsetTop + NODE_Y) / h : 1)),
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [entries.length])

  const sync = useCallback(
    (v: number) => {
      const n = stops.reduce((acc, s) => (v >= s - 0.004 ? acc + 1 : acc), 0)
      setReached((prev) => (prev === n ? prev : n))
    },
    [stops],
  )
  useMotionValueEvent(progress, 'change', sync)
  useEffect(() => sync(progress.get()), [sync, progress])

  const headY = useTransform(progress, (v) => v * height)
  const year = useTransform(progress, (v) => {
    const last = entries[entries.length - 1]
    if (!stops.length || !last) return ''
    // the light has reached the end of an open-ended chapter: that is today
    if (v >= 0.995 && last.end === null) return 'now'
    const xs = [...stops, 1]
    const ys = [...entries.map((e) => e.start), last.end ?? CAREER_NOW]
    if (v <= xs[0]) return stamp(ys[0])
    for (let i = 0; i < xs.length - 1; i++) {
      if (v <= xs[i + 1]) {
        const t = (v - xs[i]) / Math.max(1e-6, xs[i + 1] - xs[i])
        return stamp(ys[i] + (ys[i + 1] - ys[i]) * t)
      }
    }
    return stamp(ys[ys.length - 1])
  })
  // the readout never slides under a node: it dissolves just before touching one
  // and reappears once the playhead has carried it past
  const chipOpacity = useTransform(progress, (v) => {
    const top = v * height + CHIP_TOP
    let gap = Infinity
    for (const s of stops) {
      const node = s * height
      gap = Math.min(gap, Math.max(node - NODE_R - (top + CHIP_H), top - (node + NODE_R)))
    }
    return clamp(gap / CHIP_FADE, 0, 1)
  })

  return (
    <ol ref={listRef} className={cn('relative', className)}>
      {/* spine: dim track, light fill, blurred bloom and the playhead */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-5 w-px -translate-x-1/2 lg:left-1/2"
      >
        <div className="absolute inset-0 bg-accent/15" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgb(var(--accent) / 0.5) 0 2px, transparent 2px 14px)',
          }}
        />
        <motion.div
          className="absolute inset-0 origin-top bg-gradient-to-b from-accent3 via-accent to-accent2"
          style={{ scaleY: progress }}
        />
        <motion.div
          className="absolute inset-y-0 -left-[3px] w-[7px] origin-top rounded-full bg-accent/50 blur-[5px]"
          style={{ scaleY: progress }}
        />
        <motion.div className="absolute left-0 top-0" style={{ y: headY }}>
          <span className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent3 shadow-glow" />
          {!reduced && (
            <span className="absolute -left-3 -top-3 h-6 w-6 animate-pulse-ring rounded-full border border-accent3/80" />
          )}
        </motion.div>
      </div>

      {/* year readout (desktop): rides the playhead on a layer above the nodes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-px -translate-x-1/2 lg:block"
      >
        <motion.div className="absolute left-0 top-0" style={{ y: headY, opacity: chipOpacity }}>
          <motion.span
            className="absolute left-0 -translate-x-1/2 whitespace-nowrap rounded border border-accent/50 bg-deep/90 px-1.5 py-px font-mono text-[9.5px] uppercase leading-[15px] tracking-[0.12em] text-accent3 shadow-glow-sm"
            style={{ top: CHIP_TOP }}
          >
            {year}
          </motion.span>
        </motion.div>
      </div>

      {entries.map((entry, i) => (
        <Row
          key={`${entry.start}-${entry.role}`}
          entry={entry}
          index={i}
          on={i < reached}
          current={i === reached - 1}
          reduced={reduced}
          rowRef={(el) => {
            rowRefs.current[i] = el
          }}
        />
      ))}
    </ol>
  )
}

function Row({
  entry,
  index,
  on,
  current,
  reduced,
  rowRef,
}: {
  entry: CareerEntry
  index: number
  on: boolean
  current: boolean
  reduced: boolean
  rowRef: (el: HTMLLIElement | null) => void
}) {
  const even = index % 2 === 0
  const Icon = entry.icon
  const OrgIcon = entry.orgIcon
  const span = (entry.end ?? CAREER_NOW) - entry.start

  return (
    <li
      ref={rowRef}
      className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 lg:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] lg:gap-x-0 lg:pb-12"
    >
      {/* node */}
      <div className="relative z-10 col-start-1 row-start-1 flex justify-center pt-2 lg:col-start-2 lg:pt-1.5">
        <span
          className={cn(
            'relative grid h-10 w-10 place-items-center rounded-full border bg-deep transition-all duration-500 lg:h-11 lg:w-11',
            on ? 'border-accent text-accent shadow-glow' : 'border-accent/25 text-muted',
          )}
        >
          <span
            className={cn(
              'absolute inset-0 rounded-full bg-accent/20 transition-opacity duration-500',
              on ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon aria-hidden className="relative h-[18px] w-[18px]" />
          {current && !reduced && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full border border-accent" />
          )}
        </span>
      </div>

      {/* entry card */}
      <div
        className={cn(
          'relative col-start-2 row-start-1 min-w-0',
          even ? 'lg:col-start-1' : 'lg:col-start-3',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute right-full top-[27.5px] h-px w-4 transition-all duration-500 lg:w-[22px]',
            even && 'lg:left-full lg:right-auto',
            on ? 'bg-accent shadow-glow-sm' : 'bg-accent/20',
          )}
        />
        <motion.article
          initial={entrance(reduced, { opacity: 0, x: even ? -40 : 40, rotateY: even ? 10 : -10, filter: 'blur(10px)' })}
          whileInView={{ opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: EASE }}
          whileHover={reduced ? undefined : { y: -6 }}
          style={{ transformPerspective: 1200 }}
          className={cn(
            'glass group relative rounded-2xl p-5 sm:p-6',
            GLOW_HOVER,
            on && 'border-accent/45',
          )}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <span className={SWEEP} />
          </span>
          <Brackets />

          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent transition-colors duration-500 group-hover:text-accent3">
              {entry.start} — {entry.end ?? 'now'}
            </span>
            {entry.end === null ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/45 bg-accent/15 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Current
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {span} {span === 1 ? 'yr' : 'yrs'}
              </span>
            )}
          </div>

          <h3 className="relative mt-2 font-display text-[16.5px] font-bold leading-snug tracking-wide text-ink sm:text-[18px]">
            {entry.role}
          </h3>
          <p className="relative mt-1.5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
            <OrgIcon aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent/80 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-125" />
            {entry.org}
          </p>
          <p className="relative mt-3 text-[15px] leading-relaxed text-muted">{entry.summary}</p>
          <div className="relative mt-4 flex flex-wrap gap-1.5">
            {entry.highlights.map((h) => (
              <Chip key={h} size="xs">
                {h}
              </Chip>
            ))}
          </div>
        </motion.article>
      </div>

      {/* oversized year on the free side (desktop) */}
      <div
        aria-hidden
        className={cn(
          'hidden lg:row-start-1 lg:flex lg:flex-col',
          even ? 'lg:col-start-3 lg:items-start lg:pl-8' : 'lg:col-start-1 lg:items-end lg:pr-8',
        )}
      >
        <motion.span
          initial={entrance(reduced, { opacity: 0, y: 24 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="relative font-display text-[64px] font-black leading-none tracking-tight"
        >
          <span className="text-transparent [-webkit-text-stroke:1px_rgb(var(--accent)/0.35)]">
            {entry.start}
          </span>
          <span
            className={cn(
              'absolute inset-0 text-gradient transition-opacity duration-700',
              on ? 'opacity-100' : 'opacity-0',
            )}
          >
            {entry.start}
          </span>
        </motion.span>
        <span
          className={cn(
            'mt-2 font-mono text-[10px] uppercase tracking-[0.26em] transition-colors duration-500',
            on ? 'text-accent' : 'text-muted/60',
          )}
        >
          chapter 0{index + 1}
        </span>
      </div>
    </li>
  )
}

function Brackets() {
  const base =
    'pointer-events-none absolute h-3 w-3 border-accent/60 transition-all duration-500 group-hover:h-4 group-hover:w-4 group-hover:border-accent'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
