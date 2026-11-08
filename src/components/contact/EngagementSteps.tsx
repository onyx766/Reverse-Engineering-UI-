import { useEffect, useId, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { FileCheck2, Microscope, PhoneCall, Route, ScrollText, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ENGAGEMENT_STEPS, type EngagementStep } from '@/data/contact'
import { EASE } from './fields'

const ICONS: Record<string, LucideIcon> = {
  intro: PhoneCall,
  scope: ScrollText,
  analysis: Microscope,
  handoff: FileCheck2,
}

const CYCLE_MS = 2800

/**
 * The engagement pipeline: four glass cards on a light rail. While visible the
 * "current" step steps along the rail; hovering a card takes over the highlight.
 */
export function EngagementSteps() {
  const steps = ENGAGEMENT_STEPS
  const n = steps.length
  const listRef = useRef<HTMLOListElement>(null)
  const inView = useInView(listRef, { margin: '-80px' })
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!inView || reduced || hover !== null) return
    const id = setInterval(() => setActive((a) => (a + 1) % n), CYCLE_MS)
    return () => clearInterval(id)
  }, [inView, reduced, hover, n])

  const lit = hover ?? active

  return (
    <section aria-labelledby={titleId} className="mt-16 sm:mt-20">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.32em] text-accent"
          >
            <Route aria-hidden className="h-3.5 w-3.5" />
            Process
          </motion.p>
          <motion.h3
            id={titleId}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
            className="mt-2 font-display text-2xl font-black uppercase tracking-tight text-gradient sm:text-[28px]"
          >
            How an engagement works
          </motion.h3>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-md text-[14.5px] leading-relaxed text-muted lg:max-w-sm lg:text-right"
        >
          Nothing is analysed until scope and authorisation are signed. Typical projects run 3–8 weeks end to
          end.
        </motion.p>
      </div>

      <ol ref={listRef} className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {/* light rail through the step nodes (desktop row only) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[calc((100%-72px)/8)] right-[calc((100%-72px)/8)] top-[28px] hidden h-px lg:block"
        >
          <span className="absolute inset-0 bg-accent/20" />
          <motion.span
            className="absolute inset-0 origin-left bg-gradient-to-r from-accent via-accent2 to-accent3 shadow-glow-sm"
            initial={false}
            animate={{ scaleX: lit / (n - 1) }}
            transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          />
          {inView && !reduced && (
            <span className="absolute -inset-y-px left-0 w-40 animate-sweep bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          )}
        </div>

        {steps.map((s, i) => (
          <StepCard
            key={s.id}
            step={s}
            index={i}
            lit={i === lit}
            done={i < lit}
            reduced={reduced}
            onHover={setHover}
          />
        ))}
      </ol>
    </section>
  )
}

function StepCard({
  step: s,
  index,
  lit,
  done,
  reduced,
  onHover,
}: {
  step: EngagementStep
  index: number
  lit: boolean
  done: boolean
  reduced: boolean
  onHover: (i: number | null) => void
}) {
  const Icon = ICONS[s.id] ?? Route
  return (
    <motion.li
      initial={{ opacity: 0, y: 44, rotateX: -14, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: EASE }}
      style={{ transformPerspective: 1200 }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className="group relative flex flex-col items-center"
    >
      <span
        className={cn(
          'relative z-10 grid h-14 w-14 place-items-center rounded-2xl border bg-surface transition-all duration-500',
          lit
            ? 'scale-110 border-accent text-ink shadow-glow'
            : done
              ? 'border-accent/60 text-accent'
              : 'border-accent/30 text-muted group-hover:border-accent/70 group-hover:text-accent',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-2xl bg-accent/25 transition-opacity duration-500',
            lit ? 'opacity-100' : 'opacity-0',
          )}
        />
        <Icon
          aria-hidden
          className="relative h-6 w-6 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
        />
        {lit && !reduced && (
          <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-2xl border border-accent" />
        )}
        <span className="absolute -right-2.5 -top-2.5 rounded-md border border-accent/45 bg-deep px-1.5 py-px font-mono text-[9.5px] text-accent">
          0{index + 1}
        </span>
      </span>
      <span
        aria-hidden
        className={cn('h-6 w-px transition-colors duration-500', lit ? 'bg-accent shadow-glow-sm' : 'bg-accent/30')}
      />

      <div
        className={cn(
          'glass relative w-full flex-1 overflow-hidden rounded-2xl p-5 transition-[transform,border-color,box-shadow] duration-500',
          'group-hover:-translate-y-1.5 group-hover:border-accent/60 group-hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.18)_inset,0_30px_70px_-28px_rgb(0_0_0/0.95),0_0_50px_-12px_rgb(var(--accent)/0.6)]',
          lit && 'border-accent/55',
        )}
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[420%]"
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-2xl transition-colors duration-500',
            lit ? 'bg-accent/25' : 'bg-accent/[0.08] group-hover:bg-accent/20',
          )}
        />
        <span className="relative inline-block rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
          {s.duration}
        </span>
        <h4 className="relative mt-3 font-display text-[15px] font-bold tracking-wide text-ink">{s.title}</h4>
        <p className="relative mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
        <p className="relative mt-4 flex items-center gap-1.5 border-t border-accent/15 pt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent">
          <span aria-hidden>›</span>
          {s.deliverable}
        </p>
      </div>
    </motion.li>
  )
}
