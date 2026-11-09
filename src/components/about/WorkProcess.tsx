import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useInView } from 'framer-motion'
import { PackageCheck } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { ProcessStep } from '@/data/about'
import { EASE, GLOW_ACTIVE, SWEEP, entrance } from './fx'

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return match
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Five connected phase cards. An idle run steps through the pipeline while
 * the block is on screen; hovering or focusing a card takes over and, on wide
 * screens, swaps its summary for the detailed checklist.
 */
export function WorkProcess({ steps, className }: { steps: ProcessStep[]; className?: string }) {
  const listRef = useRef<HTMLOListElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const inView = useInView(listRef, { margin: '-80px' })
  const reduced = useReducedMotion()
  const wide = useMedia('(min-width: 1280px)')
  const [active, setActive] = useState(0)
  const [engaged, setEngaged] = useState(false)
  const live = inView && !reduced

  useEffect(() => {
    if (!live || engaged) return
    const t = setInterval(() => setActive((a) => (a + 1) % steps.length), 2800)
    return () => clearInterval(t)
  }, [live, engaged, steps.length])

  const focusStep = (i: number) => cardRefs.current[(i + steps.length) % steps.length]?.focus()

  const onKey = (e: KeyboardEvent<HTMLElement>, i: number) => {
    const moves: Partial<Record<string, number>> = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: steps.length - 1,
    }
    const next = moves[e.key]
    if (next === undefined) return
    e.preventDefault()
    focusStep(next)
  }

  return (
    <ol
      ref={listRef}
      onMouseLeave={() => setEngaged(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false)
      }}
      className={cn('relative grid gap-4 xl:grid-cols-5 xl:gap-5', className)}
    >
      {steps.map((step, i) => {
        const Icon = step.icon
        const on = i === active
        const passed = i < active
        return (
          <motion.li
            key={step.title}
            initial={entrance(reduced, { opacity: 0, y: 34, rotateX: -12, filter: 'blur(10px)' })}
            whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75, delay: i * 0.08, ease: EASE }}
            style={{ transformPerspective: 1200 }}
            className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 xl:grid-cols-1 xl:grid-rows-[auto_1fr] xl:gap-x-0"
          >
            {i < steps.length - 1 && (
              <Connector lit={passed} flowing={on && live} horizontal={wide} />
            )}

            {/* phase node */}
            <div aria-hidden className="relative z-10 flex justify-center xl:mb-4">
              <span
                className={cn(
                  'relative grid h-11 w-11 place-items-center rounded-full border bg-deep font-mono text-[11px] font-bold transition-all duration-500',
                  on
                    ? 'border-accent text-ink shadow-glow'
                    : passed
                      ? 'border-accent/70 text-accent'
                      : 'border-accent/25 text-muted',
                )}
              >
                <span
                  className={cn(
                    'absolute inset-0 rounded-full bg-accent/25 transition-opacity duration-500',
                    on ? 'opacity-100' : passed ? 'opacity-40' : 'opacity-0',
                  )}
                />
                <span className="relative">{pad(i + 1)}</span>
                {on && live && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full border border-accent" />
                )}
              </span>
            </div>

            {/* card */}
            <article
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              tabIndex={0}
              aria-label={`Phase ${i + 1} of ${steps.length}: ${step.title}`}
              onMouseEnter={() => {
                setActive(i)
                setEngaged(true)
              }}
              onFocus={() => {
                setActive(i)
                setEngaged(true)
              }}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                // a focused card stops clear of the screen's bottom edge (html scroll-padding-top clears the navbar)
                'glass group relative flex h-full scroll-mb-6 flex-col overflow-hidden rounded-2xl p-5 transition-[transform,border-color,box-shadow] duration-500',
                on ? cn(GLOW_ACTIVE, 'motion-safe:xl:-translate-y-2') : 'hover:border-accent/50',
              )}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
              <span aria-hidden className={SWEEP} />
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 transition-opacity duration-500',
                  on ? 'opacity-100' : 'opacity-0',
                )}
                style={{
                  background:
                    'radial-gradient(20rem 12rem at 50% 0%, rgb(var(--accent) / 0.14), transparent 70%)',
                }}
              />

              <div className="relative flex items-center gap-3 xl:items-start">
                <span
                  aria-hidden
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-500',
                    on
                      ? 'border-accent bg-accent/20 text-accent shadow-glow-sm'
                      : 'border-accent/30 bg-accent/10 text-accent/80 group-hover:border-accent/60',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] transition-transform duration-500',
                      on && '-rotate-6 scale-110',
                    )}
                  />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
                    Phase {pad(i + 1)}
                  </p>
                  <h3 className="text-balance font-display text-[15px] font-bold leading-tight tracking-wide text-ink xl:min-h-[2.5em]">
                    {step.title}
                  </h3>
                </div>
              </div>

              <div className="relative mb-4 mt-3 grid gap-3 md:grid-cols-2 md:gap-6 xl:flex-1 xl:grid-cols-1 xl:gap-0">
                <div
                  className={cn(
                    'flex flex-col transition-all duration-500 xl:[grid-area:1/1]',
                    on && 'motion-safe:xl:-translate-y-2 xl:opacity-0',
                  )}
                >
                  <p className="text-[14.5px] leading-relaxed text-muted">{step.summary}</p>
                  <span
                    aria-hidden
                    className="mt-auto hidden items-center gap-1.5 pt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent/70 xl:inline-flex"
                  >
                    <span className="h-px w-4 bg-accent/50" />
                    <span>
                      {step.details.length} checks ·{' '}
                      <span className="[@media(hover:none)]:hidden">hover</span>
                      <span className="hidden [@media(hover:none)]:inline">tap</span>
                    </span>
                  </span>
                </div>
                <ul
                  className={cn(
                    'space-y-1.5 transition-all duration-500 xl:[grid-area:1/1]',
                    on ? 'xl:translate-y-0 xl:opacity-100 xl:delay-100' : 'motion-safe:xl:translate-y-3 xl:opacity-0',
                  )}
                >
                  {step.details.map((d) => (
                    <li key={d} className="flex gap-2 font-mono text-[11px] leading-snug text-ink/85">
                      <span aria-hidden className="text-accent">
                        ▸
                      </span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="relative mt-auto flex items-center gap-2 border-t border-accent/15 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                <PackageCheck aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="sr-only">Deliverable: </span>
                <span className="min-w-0">{step.artefact}</span>
              </p>
            </article>
          </motion.li>
        )
      })}
    </ol>
  )
}

function Connector({
  lit,
  flowing,
  horizontal,
}: {
  lit: boolean
  flowing: boolean
  horizontal: boolean
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-[21px] top-[48px] h-[calc(100%-52px+1rem)] w-0.5 xl:left-[calc(50%+26px)] xl:top-[21px] xl:h-0.5 xl:w-[calc(100%-52px+1.25rem)]"
    >
      <span
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: horizontal
            ? 'repeating-linear-gradient(90deg, rgb(var(--accent) / 0.55) 0 6px, transparent 6px 11px)'
            : 'repeating-linear-gradient(180deg, rgb(var(--accent) / 0.55) 0 6px, transparent 6px 11px)',
        }}
      />
      <span
        className={cn(
          'absolute inset-0 origin-top rounded-full bg-gradient-to-b from-accent to-accent2 shadow-glow-sm transition-transform duration-700 xl:origin-left xl:bg-gradient-to-r',
          lit ? 'scale-100' : 'scale-y-0 xl:scale-x-0 xl:scale-y-100',
        )}
      />
      {flowing && (
        <span className="absolute -inset-1 overflow-hidden">
          <motion.span
            key={horizontal ? 'h' : 'v'}
            className="absolute inset-1"
            style={{
              background: horizontal
                ? 'linear-gradient(90deg, transparent 30%, rgb(var(--accent-3)) 50%, transparent 70%)'
                : 'linear-gradient(180deg, transparent 30%, rgb(var(--accent-3)) 50%, transparent 70%)',
              boxShadow: '0 0 12px rgb(var(--accent-3) / 0.7)',
            }}
            initial={horizontal ? { x: '-100%' } : { y: '-100%' }}
            animate={horizontal ? { x: '100%' } : { y: '100%' }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      )}
    </span>
  )
}
