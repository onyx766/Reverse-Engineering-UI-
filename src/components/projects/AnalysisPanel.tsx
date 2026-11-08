import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useMotionValue } from 'framer-motion'
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
 */
export function AnalysisPanel({ project, className }: { project: Project; className?: string }) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { margin: '-30px' })

  const progress = useRef(0)
  const bar = useMotionValue(0)
  const [pct, setPct] = useState(0)

  const applicable = STAGES.filter((s) => project.stages[s.id])
  const m = Math.max(1, applicable.length)

  // new project → start over
  useEffect(() => {
    progress.current = 0
    bar.set(0)
    setPct(0)
  }, [project.id, bar])

  useEffect(() => {
    if (reduced) {
      progress.current = 1
      bar.set(1)
      setPct(100)
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
      setPct(Math.round(eased * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [project.id, inView, reduced, bar])

  const p = pct / 100
  const complete = pct >= 100
  const doneCount = complete ? applicable.length : Math.min(applicable.length, Math.floor(p * m))

  return (
    <div ref={rootRef} className={className}>
      <HoloPanel
        title="System Analysis"
        icon={Activity}
        badge={complete ? 'done' : 'live'}
        from="right"
        tilt={5}
        bodyClassName="p-3.5 sm:p-4"
      >
        <div className="flex items-end justify-between gap-3">
          <span className="font-sans text-[15px] font-semibold tracking-wide text-ink">Analysis Progress</span>
          <span className="font-display text-[19px] font-bold tabular-nums leading-none text-ink">
            <span className="neon">{pct}</span>
            <span className="text-[13px] text-accent">%</span>
          </span>
        </div>

        {/* glowing progress bar */}
        <div
          className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-accent/[0.12]"
          role="progressbar"
          aria-label={`Analysis of ${project.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <motion.span
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-accent2 via-accent to-accent3"
            style={{ scaleX: bar, boxShadow: '0 0 12px rgb(var(--accent) / 0.8)' }}
          />
          {!complete && !reduced && (
            <span className="absolute inset-y-0 left-0 w-1/4 animate-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          )}
        </div>

        {/* stage checklist */}
        <ul className="mt-3.5 flex flex-col gap-1">
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
                  'relative flex h-[34px] items-center gap-2.5 overflow-hidden rounded-lg border px-2.5 transition-colors duration-500',
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
                <span className="grid h-5 w-8 shrink-0 place-items-center">
                  <AnimatePresence mode="wait" initial={false}>
                    {state === 'done' && (
                      <motion.span
                        key="done"
                        initial={{ scale: 0.3, opacity: 0, rotate: -40 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.3, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                        className="text-accent drop-shadow-[0_0_6px_rgb(var(--accent)/0.95)]"
                      >
                        <Check aria-hidden className="h-[18px] w-[18px]" strokeWidth={3} />
                      </motion.span>
                    )}
                    {state === 'running' && (
                      <motion.span key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin text-accent3" />
                      </motion.span>
                    )}
                    {state === 'pending' && (
                      <motion.span
                        key="pending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        aria-hidden
                        className="h-2 w-2 rounded-full border border-muted/50"
                      />
                    )}
                    {state === 'na' && (
                      <motion.span
                        key="na"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        aria-hidden
                        className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted/50"
                      >
                        n/a
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                {state === 'running' && !reduced && (
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-accent/15 pt-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
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
