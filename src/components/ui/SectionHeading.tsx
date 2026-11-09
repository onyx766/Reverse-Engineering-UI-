import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  className?: string
  align?: 'center' | 'left'
}

const EASE = [0.22, 1, 0.36, 1] as const

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  align = 'center',
}: Props) {
  // reduced motion: plain fades (MotionConfig skips transforms, but not blur or letter-spacing)
  const reduced = useReducedMotion()
  const fade = { duration: 0.4, ease: EASE }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <motion.span
        // 0.5em, not wider: a long eyebrow must not wrap mid-entrance on a 360px phone
        initial={reduced ? { opacity: 0, letterSpacing: '0.42em' } : { opacity: 0, y: 14, letterSpacing: '0.5em' }}
        whileInView={reduced ? { opacity: 1, letterSpacing: '0.42em' } : { opacity: 1, y: 0, letterSpacing: '0.42em' }}
        viewport={{ once: true }}
        transition={reduced ? fade : { duration: 0.7, ease: EASE }}
        className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase text-accent"
      >
        <span className="h-px w-6 bg-accent/70" />
        {eyebrow}
        <span className="h-px w-6 bg-accent/70" />
      </motion.span>

      <motion.h2
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={reduced ? fade : { duration: 0.8, delay: 0.08, ease: EASE }}
        className="text-balance font-display text-3xl font-black uppercase tracking-tight text-gradient sm:text-[42px]"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduced ? fade : { duration: 0.8, delay: 0.16, ease: EASE }}
          className="max-w-2xl text-balance text-[15px] leading-relaxed text-muted"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.span
        initial={reduced ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
        className={cn(
          'mt-1 h-px w-44 bg-gradient-to-r from-transparent via-accent to-transparent',
          align === 'left' && 'origin-left bg-gradient-to-r from-accent to-transparent',
        )}
      />
    </div>
  )
}
