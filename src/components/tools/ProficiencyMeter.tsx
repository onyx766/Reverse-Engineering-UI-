import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PROFICIENCY_LABEL, type Proficiency } from '@/data/tools'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { EASE } from './meta'

const HEIGHT = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' }

/**
 * Five-segment proficiency meter. Filled segments grow in one after another
 * the first time the meter scrolls into view; `shimmer` runs a light sweep
 * across the filled part (on card hover, or permanently).
 */
export function ProficiencyMeter({
  level,
  size = 'md',
  delay = 0,
  shimmer = 'none',
  className,
}: {
  level: Proficiency
  size?: keyof typeof HEIGHT
  delay?: number
  shimmer?: 'none' | 'card' | 'always'
  className?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  // observe the meter itself: a scaleX(0) fill has no area and may never report as visible
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const filled = reduced || inView

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Proficiency ${level} of 5, ${PROFICIENCY_LABEL[level]}`}
      className={cn('relative flex items-center gap-[3px]', className)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            'relative flex-1 overflow-hidden rounded-[2px] bg-accent/[0.12] ring-1 ring-inset ring-accent/15',
            HEIGHT[size],
          )}
        >
          {i <= level && (
            <motion.span
              className="absolute inset-0 origin-left bg-gradient-to-r from-accent to-accent2 shadow-glow-sm"
              initial={reduced ? false : { scaleX: 0, opacity: 0.4 }}
              animate={filled ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0.4 }}
              transition={{ duration: 0.45, delay: delay + i * 0.09, ease: EASE }}
            />
          )}
        </span>
      ))}

      {shimmer !== 'none' && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-[2px]"
          style={{ width: `calc(${level * 20}% - 3px)` }}
        >
          <span
            className={cn(
              'absolute inset-y-0 left-0 w-1/2 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/60 to-transparent mix-blend-overlay',
              shimmer === 'card' ? 'group-hover/card:animate-sweep' : 'animate-sweep',
            )}
          />
        </span>
      )}
    </div>
  )
}
