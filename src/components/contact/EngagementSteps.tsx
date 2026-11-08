import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { FileCheck2, Microscope, PhoneCall, Route, ScrollText, type LucideIcon } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ENGAGEMENT_STEPS } from '@/data/contact'
import { EASE } from './fields'

const ICONS: Record<string, LucideIcon> = {
  intro: PhoneCall,
  scope: ScrollText,
  analysis: Microscope,
  handoff: FileCheck2,
}

const CYCLE_MS = 3400

/**
 * Four-step engagement rail. Auto-advances while visible, pauses on hover or
 * focus, and hands control to the visitor for good once they pick a step.
 */
export function EngagementSteps() {
  const steps = ENGAGEMENT_STEPS
  const n = steps.length
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  const [hold, setHold] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const inView = useInView(rootRef, { margin: '-60px' })
  const reduced = useReducedMotion()
  const uid = useId()
  const cycling = auto && !hold && inView && !reduced

  useEffect(() => {
    if (!cycling) return
    const id = setInterval(() => setActive((a) => (a + 1) % n), CYCLE_MS)
    return () => clearInterval(id)
  }, [cycling, n])

  const select = (i: number, focus = false) => {
    setActive(i)
    setAuto(false)
    if (focus) tabs.current[i]?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = {
      ArrowRight: (i + 1) % n,
      ArrowDown: (i + 1) % n,
      ArrowLeft: (i - 1 + n) % n,
      ArrowUp: (i - 1 + n) % n,
      Home: 0,
      End: n - 1,
    }
    if (!(e.key in map)) return
    e.preventDefault()
    select(map[e.key], true)
  }

  const step = steps[active]

  return (
    <HoloPanel
      title="How an engagement works"
      icon={Route}
      badge={`${n} steps`}
      from="right"
      delay={0.2}
      tilt={6}
    >
      <div
        ref={rootRef}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false)
        }}
      >
        <div role="tablist" aria-label="Engagement steps" className="relative grid grid-cols-4 gap-1.5">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[22px] h-px overflow-hidden bg-accent/20"
          >
            <motion.span
              className="absolute inset-0 origin-left bg-gradient-to-r from-accent via-accent2 to-accent3"
              initial={false}
              animate={{ scaleX: active / (n - 1) }}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
            />
            {inView && !reduced && (
              <span className="absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-accent3 to-transparent" />
            )}
          </div>

          {steps.map((s, i) => {
            const Icon = ICONS[s.id] ?? Route
            const on = i === active
            const done = i < active
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                id={`${uid}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${uid}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKey(e, i)}
                className="group/step relative flex min-h-[92px] flex-col items-center gap-1.5 rounded-xl px-1 pb-1.5 pt-0.5 text-center"
              >
                <span
                  className={cn(
                    'relative z-10 grid h-11 w-11 place-items-center rounded-xl border bg-surface transition-all duration-300',
                    on
                      ? 'scale-110 border-accent text-ink shadow-glow'
                      : done
                        ? 'border-accent/60 text-accent group-hover/step:-translate-y-0.5'
                        : 'border-accent/25 text-muted group-hover/step:-translate-y-0.5 group-hover/step:border-accent/60 group-hover/step:text-accent',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-0 rounded-xl transition-colors duration-300',
                      on ? 'bg-accent/25' : 'bg-transparent group-hover/step:bg-accent/10',
                    )}
                  />
                  <Icon
                    aria-hidden
                    className="relative h-[18px] w-[18px] transition-transform duration-300 group-hover/step:scale-110"
                  />
                  {on && !reduced && (
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-pulse-ring rounded-xl border border-accent/70"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'font-mono text-[9.5px] tracking-[0.14em] transition-colors duration-300',
                    on ? 'text-accent' : 'text-muted/70',
                  )}
                >
                  0{i + 1}
                </span>
                <span
                  className={cn(
                    'text-[12.5px] font-semibold leading-tight transition-colors duration-300 sm:text-[13px]',
                    on ? 'text-ink' : 'text-muted group-hover/step:text-ink',
                  )}
                >
                  {s.short}
                </span>
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`${uid}-panel`}
          aria-labelledby={`${uid}-tab-${active}`}
          className="relative mt-3 min-h-[150px] overflow-hidden rounded-xl border border-accent/20 bg-deep/45 p-3.5"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: reduced ? 0 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -16 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-[14px] font-bold tracking-wide text-ink">{step.title}</h4>
                <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {step.duration}
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.body}</p>
              <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent">
                <span aria-hidden>›</span>
                {step.deliverable}
              </p>
            </motion.div>
          </AnimatePresence>
          {cycling && (
            <motion.span
              key={`tick-${active}`}
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-accent to-accent2"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: CYCLE_MS / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </div>
    </HoloPanel>
  )
}
