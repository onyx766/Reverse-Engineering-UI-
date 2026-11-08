import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  className?: string
  align?: 'center' | 'left'
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  align = 'center',
}: Props) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <motion.span
        initial={{ opacity: 0, y: 14, letterSpacing: '0.8em' }}
        whileInView={{ opacity: 1, y: 0, letterSpacing: '0.42em' }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase text-accent"
      >
        <span className="h-px w-6 bg-accent/70" />
        {eyebrow}
        <span className="h-px w-6 bg-accent/70" />
      </motion.span>

      <motion.h2
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="text-balance font-display text-3xl font-black uppercase tracking-tight text-gradient sm:text-[42px]"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-balance text-[15px] leading-relaxed text-muted"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'mt-1 h-px w-44 bg-gradient-to-r from-transparent via-accent to-transparent',
          align === 'left' && 'origin-left bg-gradient-to-r from-accent to-transparent',
        )}
      />
    </div>
  )
}
