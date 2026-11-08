import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

/**
 * Hairline progress meter for the current section. It measures the <main>
 * element (not the whole document) so the footer does not count, and hides
 * itself when the section fits on one screen.
 */
export function ScrollProgress({
  targetId = 'main-content',
  className,
}: {
  targetId?: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const raw = useMotionValue(0)
  const smooth = useSpring(raw, { stiffness: 320, damping: 42, mass: 0.35, restDelta: 0.0005 })
  const progress = reduced ? raw : smooth

  const headX = useTransform(progress, (v) => `${v * 100}%`)
  const opacity = useTransform(progress, [0, 0.012], [0, 1])

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const el = document.getElementById(targetId)
      if (!el) return
      const rect = el.getBoundingClientRect()
      const start = rect.top + window.scrollY
      const range = rect.height - window.innerHeight
      raw.set(range > 8 ? Math.min(1, Math.max(0, (window.scrollY - start) / range)) : 0)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const el = document.getElementById(targetId)
    const ro = el ? new ResizeObserver(schedule) : null
    if (el) ro?.observe(el)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
    }
  }, [targetId, raw])

  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className={cn('pointer-events-none absolute h-[2px]', className)}
    >
      <span className="absolute inset-0 rounded-full bg-accent/10" />
      <motion.span
        className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-accent2 via-accent to-accent3"
        style={{ scaleX: progress }}
      />
      <motion.span className="absolute inset-0" style={{ x: headX }}>
        <span className="absolute -left-[3px] top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-accent3 shadow-glow" />
        <span className="absolute -left-6 top-1/2 h-px w-6 -translate-y-1/2 bg-gradient-to-r from-transparent to-accent3" />
      </motion.span>
    </motion.div>
  )
}
