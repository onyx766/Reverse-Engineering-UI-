import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { Activity, Check, LoaderCircle } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { KIND_LABEL, STAGES, type Project } from '@/data/projects'
import { cn } from '@/lib/utils'
import { STAGE_ICON } from './icons'

const RUN_MS = 2600

/**
 * Right stage panel. Every time the focused project changes the analysis
 * re-runs: the bar sweeps 0 → 100 %, the percentage counts with it and each
 * applicable stage ticks from spinner to check in turn. Runs only while visible.
 * The bar and the percentage are motion values written straight to the DOM;
 * React re-renders only when a stage ticks over (a handful of times per run).
 */
export function AnalysisPanel({
  project,
  className,
  badge = true,
  density = 0,
}: {
  project: Project
  className?: string
  /** status chip in the header (dropped when the panel is narrow) */
  badge?: boolean
  /** 0 = roomy, 1 = short viewport, 2 = very short viewport (drops the footer) */
  density?: 0 | 1 | 2
}) {
  const dense = density > 0
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const meterRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { margin: '-30px' })

  const applicable = STAGES.filter((s) => project.stages[s.id])
  const m = Math.max(1, applicable.length)

  /** linear stage clock, 0..1 */
  const progress = useRef(0)
  /** eased bar position, 0..1 */
  const bar = useMotionValue(0)
  const pctText = useTransform(bar, (v) => Math.round(v * 100))
  /** stages completed so far (m = finished) */
  const [done, setDone] = useState(0)

  useEffect(() => {
    const write = (v: number) => meterRef.current?.setAttribute('aria-valuenow', String(Math.round(v * 100)))
    write(bar.get())
    return bar.on('change', write)
  }, [bar])

  // new project → start over
  useEffect(() => {
    progress.current = 0
    bar.set(0)
    setDone(0)
  }, [project.id, bar])

  useEffect(() => {
    if (reduced) {
      progress.current = 1
      bar.set(1)
      setDone(m)
      return
    }
    if (!inView || progress.current >= 1) return

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      progress.current = Math.min(1, progress.current + dt / RUN_MS)
      // ease the visual bar, keep the stage clock linear
      const p = progress.current
      const eased = 1 - Math.pow(1 - p, 2.2)
      bar.set(eased)
      // same value → React bails out, so this renders only when a stage ticks over
      setDone(p >= 1 ? m : Math.min(m - 1, Math.floor(eased * m)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [project.id, inView, reduced, bar, m])

  const complete = done >= m
  const doneCount = Math.min(applicable.length, done)

  return (
    <div ref={rootRef} className={className}>
      <HoloPanel
        title="System Analysis"
        icon={Activity}
        badge={badge ? (complete ? 'done' : 'live') : undefined}
        from="right"
        tilt={5}
        bodyClassName="p-3.5 sm:p-4"
      >
        <div className="flex items-end justify-between gap-3">
          <span className="font-sans text-[15px] font-semibold tracking-wide text-ink">Analysis Progress</span>
          <span className="font-display text-[19px] font-bold tabular-nums leading-none text-ink">
            <motion.span className="neon">{pctText}</motion.span>
            <span className="text-[13px] text-accent">%</span>
          </span>
        </div>

        {/* aria-valuenow is written by the bar's change listener above */}
        <div
          ref={meterRef}
          className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-accent/[0.12]"
          role="progressbar"
          aria-label={`Analysis of ${project.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.span
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-accent2 via-accent to-accent3"
            style={{ scaleX: bar, boxShadow: '0 0 12px rgb(var(--accent) / 0.8)' }}
          />
          {!complete && !reduced && (
            <span className="absolute inset-y-0 left-0 w-1/4 animate-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          )}
        </div>

        <ul className={cn('flex flex-col', dense ? 'mt-2.5 gap-[3px]' : 'mt-3 gap-1')}>
          {STAGES.map((s) => {
            const on = project.stages[s.id]
            const k = applicable.findIndex((a) => a.id === s.id)
            const state: 'na' | 'pending' | 'running' | 'done' = !on
              ? 'na'
              : k < doneCount
                ? 'done'
                : k === doneCount && !complete
                  ? 'running'
                  : 'pending'
            const Icon = STAGE_ICON[s.id]
            return (
              <li
                key={s.id}
                className={cn(
                  'relative flex items-center gap-2.5 overflow-hidden rounded-lg border px-2.5 transition-colors duration-500',
                  dense ? 'h-[29px]' : 'h-[32px]',
                  state === 'done' && 'border-accent/25 bg-accent/[0.07]',
                  state === 'running' && 'border-accent/45 bg-accent/[0.12]',
                  (state === 'pending' || state === 'na') && 'border-transparent',
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors duration-500',
                    state === 'na' ? 'text-muted/40' : state === 'pending' ? 'text-muted' : 'text-accent',
                  )}
                />
                <span
                  className={cn(
                    'flex-1 truncate font-sans text-[14.5px] font-medium tracking-wide transition-colors duration-500',
                    state === 'na' ? 'text-muted/45' : state === 'pending' ? 'text-muted' : 'text-ink',
                  )}
                >
                  {s.label}
                  <span className="sr-only">
                    {state === 'na' ? ' (not applicable)' : state === 'done' ? ' (complete)' : state === 'running' ? ' (running)' : ' (pending)'}
                  </span>
                </span>
                {/* keyed mounts, no exit phase: rapid state changes can never strand an icon */}
                <span className="grid h-5 w-8 shrink-0 place-items-center" aria-hidden>
                  {state === 'done' && (
                    <motion.span
                      key={`done-${project.id}`}
                      initial={{ scale: 0.3, opacity: 0, rotate: -40 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                      className="text-accent drop-shadow-[0_0_6px_rgb(var(--accent)/0.95)]"
                    >
                      <Check className="h-[18px] w-[18px]" strokeWidth={3} />
                    </motion.span>
                  )}
                  {state === 'running' && <LoaderCircle className="h-4 w-4 animate-spin text-accent3" />}
                  {state === 'pending' && <span className="h-2 w-2 rounded-full border border-muted/50" />}
                  {state === 'na' && (
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted/50">n/a</span>
                  )}
                </span>
                {state === 'running' && !reduced && (
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                )}
              </li>
            )
          })}
        </ul>

        <div
          className={cn(
            'flex items-center justify-between gap-2 border-t border-accent/15 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted',
            dense ? 'mt-2 pt-2' : 'mt-3 pt-2.5',
            density === 2 && 'hidden',
          )}
        >
          <span className="truncate">
            <span className="text-accent">●</span> {KIND_LABEL[project.kind]}
          </span>
          <span className="shrink-0 tabular-nums">
            {doneCount}/{applicable.length} stages
          </span>
        </div>
        <span className="sr-only" aria-live="polite">
          {complete ? `Analysis of ${project.title} complete: ${applicable.length} of ${STAGES.length} stages applied.` : ''}
        </span>
      </HoloPanel>
    </div>
  )
}
