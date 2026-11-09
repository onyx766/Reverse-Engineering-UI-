import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { HERO } from '@/data/home'
import { scrollToBlock } from './shared'

/**
 * "Scroll" affordance at the foot of the hero. It is a real button: it
 * scrolls the first story block under the navbar (instantly under reduced
 * motion) and hands keyboard focus to that block's heading. The bob is a CSS
 * loop that parks itself while the cue is off-screen.
 */
export function ScrollCue({ target }: { target: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const inView = useInView(ref)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="relative z-10 mt-10 flex justify-center sm:mt-12"
    >
      <button
        ref={ref}
        type="button"
        onClick={() => scrollToBlock(target)}
        aria-label={HERO.scrollCueLabel}
        className="group flex min-h-11 min-w-[5.5rem] flex-col items-center gap-1.5 rounded-xl px-4 py-2 text-muted transition-colors duration-300 hover:text-ink focus-visible:text-ink"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] transition-[letter-spacing] duration-500 group-hover:tracking-[0.42em]">
          {HERO.scrollCue}
        </span>
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-full border border-accent/30 bg-accent/[0.06] text-accent transition-[border-color,background-color,box-shadow] duration-300 group-hover:border-accent/70 group-hover:bg-accent/15 group-hover:shadow-glow-sm motion-safe:animate-bounce"
          style={{ animationPlayState: inView ? 'running' : 'paused', animationDuration: '1.8s' }}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
    </motion.div>
  )
}
