import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PROFILE } from '@/data/profile'
import { EASE } from './shared'

const NO_WORDS: string[] = []

/**
 * The typed role under the name. It lives in its own component so each
 * keystroke re-renders this line only, not the whole hero, and it stops
 * typing while scrolled out of view (it starts over when it returns).
 * Decorative: screen readers get the role from the h1.
 */
export function RoleLine() {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { margin: '120px 0px' })
  const still = useReducedMotion()
  const { text } = useTypewriter(inView ? PROFILE.roles : NO_WORDS)

  return (
    <motion.p
      ref={ref}
      aria-hidden
      initial={still ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.26, ease: EASE }}
      // one line at every width (the longest role is sized to fit), so cycling never shifts the layout
      className="flex min-h-[2.4rem] items-center gap-2 overflow-hidden whitespace-nowrap font-display text-[clamp(0.95rem,4.2vw,1.6rem)] font-bold uppercase tracking-[0.08em] text-ink lg:text-[clamp(1.15rem,1.95vw,1.75rem)]"
    >
      <span className="text-accent">/</span>
      <span>{text}</span>
      <span className="inline-block h-[1.1em] w-[3px] shrink-0 animate-blink bg-accent" />
    </motion.p>
  )
}
