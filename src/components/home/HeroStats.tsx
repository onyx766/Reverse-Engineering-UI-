import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { STATS } from '@/data/profile'
import { STAT_NOTES } from '@/data/home'
import { EASE } from './shared'

const fmt = new Intl.NumberFormat('en-US')

/** The four headline numbers under the hero; each counts up once on first view. */
export function HeroStats() {
  return (
    <ul className="relative z-10 mt-14 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-5 lg:grid-cols-4">
      {STATS.map((s, i) => (
        <StatTile key={s.label} {...s} index={i} />
      ))}
    </ul>
  )
}

function StatTile({
  label,
  value,
  suffix,
  index,
}: {
  label: string
  value: number
  suffix: string
  index: number
}) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  // the motion value writes the number straight into the DOM: no React render per frame
  const count = useMotionValue(reduced ? value : 0)
  const text = useTransform(count, (v) => fmt.format(Math.round(v)))
  const note = STAT_NOTES[label]

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      count.set(value)
      return
    }
    const controls = animate(count, value, {
      duration: 1.6,
      delay: 0.1 + index * 0.08,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
  }, [inView, reduced, value, index, count])

  return (
    <motion.li
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 30, rotateX: -14 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: EASE }}
      style={{ transformPerspective: 900 }}
      className="group relative"
    >
      <div className="glass relative flex h-full flex-col items-center overflow-hidden rounded-xl px-3 py-5 text-center transition-[transform,border-color] duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-accent/55 sm:px-4">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-500 group-hover:bg-accent/[0.06]"
        />
        <p className="relative font-display text-[clamp(1.7rem,4vw,2.4rem)] font-black leading-none text-ink">
          <span className="sr-only">
            {fmt.format(value)}
            {suffix}{' '}
          </span>
          <span aria-hidden className="tabular-nums">
            <motion.span>{text}</motion.span>
            <span className="neon">{suffix}</span>
          </span>
        </p>
        <p className="relative mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </p>
        {note && (
          <p className="relative mt-1.5 font-mono text-[10.5px] tracking-[0.02em] text-muted/80 transition-colors duration-300 group-hover:text-accent3">
            {note}
          </p>
        )}
      </div>
    </motion.li>
  )
}
