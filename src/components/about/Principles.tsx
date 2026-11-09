import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { Principle } from '@/data/about'
import { EASE, entrance } from './fx'

const cellBorder = (i: number) =>
  cn(
    i > 0 && 'border-t border-accent/15',
    i === 1 && 'sm:border-t-0',
    i % 2 === 1 && 'sm:border-l',
    'lg:border-t-0',
    i > 0 && 'lg:border-l',
  )

/** One glass strip, four rules; each cell lights up on hover. */
export function Principles({
  items,
  eyebrow,
  title,
  since = 2018,
  className,
}: {
  items: Principle[]
  eyebrow: string
  title: string
  /** year shown in "n rules · enforced since …" (the first career chapter) */
  since?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.section
      aria-labelledby="about-principles"
      initial={entrance(reduced, { opacity: 0, y: 40, rotateX: -10, filter: 'blur(10px)' })}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, ease: EASE }}
      style={{ transformPerspective: 1300 }}
      className={cn('glass relative overflow-hidden rounded-2xl', className)}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <Brackets />

      <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-accent/15 px-5 py-4 sm:px-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent">{eyebrow}</p>
          <h2
            id="about-principles"
            className="mt-1 font-display text-[19px] font-black uppercase tracking-wide text-ink sm:text-[22px]"
          >
            {title}
          </h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {items.length} rules · enforced since {since}
        </p>
      </div>

      <ul className="relative grid sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.li
              key={p.title}
              initial={entrance(reduced, { opacity: 0, y: 20 })}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: EASE }}
              className={cn('group relative flex flex-col overflow-hidden p-5 sm:p-6', cellBorder(i))}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(22rem 14rem at 50% 0%, rgb(var(--accent) / 0.16), transparent 70%)',
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-hover:scale-x-100"
              />

              <div className="relative flex items-center justify-between">
                <span className="relative grid h-11 w-11 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-accent transition-all duration-500 group-hover:border-accent group-hover:bg-accent/20 group-hover:shadow-glow">
                  <Icon
                    aria-hidden
                    className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl border border-accent opacity-0 group-hover:animate-pulse-ring group-hover:opacity-100"
                  />
                </span>
                <span aria-hidden className="font-mono text-[10px] tracking-[0.2em] text-accent/60">
                  R-0{i + 1}
                </span>
              </div>

              <h3 className="relative mt-4 font-display text-[15.5px] font-bold tracking-wide text-ink">
                {p.title}
              </h3>
              <p className="relative mb-4 mt-2 text-[14.5px] leading-relaxed text-muted">{p.body}</p>
              {/* bottom-aligned across the row; wraps rather than truncating in narrow cells */}
              <code className="relative mt-auto block whitespace-pre-wrap rounded-md border border-accent/20 bg-deep/60 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-accent/90 transition-colors duration-500 [overflow-wrap:anywhere] group-hover:border-accent/50 group-hover:text-accent3">
                {p.code}
              </code>
            </motion.li>
          )
        })}
      </ul>
    </motion.section>
  )
}

function Brackets() {
  const base = 'pointer-events-none absolute h-3.5 w-3.5 border-accent/70'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
