import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE } from './meta'

/** Numbered block heading used between the parts of the Tools section. */
export function SubHeading({
  index,
  title,
  kicker,
  right,
  className,
  id,
}: {
  index: string
  title: string
  kicker?: string
  right?: ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref} className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <motion.div
        initial={{ opacity: 0, x: -24, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex min-w-0 items-center gap-3.5"
      >
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 font-mono text-[12px] font-bold text-accent shadow-glow-sm">
          <span aria-hidden className="absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-accent" />
          <span aria-hidden className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-accent" />
          {index}
        </span>
        <div className="min-w-0">
          <h3
            id={id}
            className="font-display text-[19px] font-bold uppercase tracking-[0.08em] text-ink sm:text-[22px]"
          >
            {title}
          </h3>
          {kicker && (
            <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
              {kicker}
            </p>
          )}
        </div>
      </motion.div>
      {right && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        >
          {right}
        </motion.div>
      )}
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.15, ease: EASE }}
        className="h-px w-full origin-left bg-gradient-to-r from-accent/70 via-accent/20 to-transparent"
      />
    </div>
  )
}
