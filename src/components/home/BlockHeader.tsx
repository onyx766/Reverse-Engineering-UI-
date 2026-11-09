import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { HoloButton } from '@/components/ui/HoloButton'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { reveal } from './shared'

export interface BlockAction {
  label: string
  onClick: () => void
}

/**
 * Heading row shared by the story blocks: index tag + eyebrow, gradient title,
 * optional subtitle, and the "see all" action on the right (md and up). Phones
 * get the action at the end of the block instead, via <BlockFooterAction>.
 */
export function BlockHeader({
  index,
  eyebrow,
  title,
  subtitle,
  headingId,
  action,
  className,
}: {
  index: number
  eyebrow: string
  title: string
  subtitle?: string
  headingId: string
  action?: BlockAction
  className?: string
}) {
  const still = useReducedMotion()
  return (
    <header className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10', className)}>
      <div className="min-w-0 max-w-2xl">
        <motion.p
          {...reveal(0, 12, still)}
          className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.32em] text-accent"
        >
          <span className="grid h-7 min-w-7 place-items-center rounded-md border border-accent/40 bg-accent/10 px-1 font-mono text-[10px] tracking-[0.04em] text-accent shadow-glow-sm">
            {String(index).padStart(2, '0')}
          </span>
          {eyebrow}
          <span aria-hidden className="h-px w-10 bg-gradient-to-r from-accent/70 to-transparent" />
        </motion.p>
        <motion.h2
          {...reveal(0.06, 22, still)}
          id={headingId}
          tabIndex={-1}
          data-block-heading
          className="mt-3 text-balance font-display text-[clamp(1.55rem,3.6vw,2.45rem)] font-black uppercase leading-[1.06] tracking-tight text-gradient outline-none"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            {...reveal(0.12, 22, still)}
            className="mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-muted"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {action && (
        <motion.div {...reveal(0.16, 22, still)} className="hidden shrink-0 md:block">
          <HoloButton
            size="sm"
            variant="outline"
            iconRight={ArrowUpRight}
            onClick={action.onClick}
            className="min-h-10 px-4"
          >
            {action.label}
          </HoloButton>
        </motion.div>
      )}
    </header>
  )
}

/** Full-width "see all" button closing a block on phones and small tablets. */
export function BlockFooterAction({ action, className }: { action: BlockAction; className?: string }) {
  const still = useReducedMotion()
  return (
    <motion.div {...reveal(0.05, 14, still)} className={cn('mt-6 md:hidden', className)}>
      <HoloButton
        variant="outline"
        iconRight={ArrowUpRight}
        onClick={action.onClick}
        magnetic={false}
        className="w-full"
      >
        {action.label}
      </HoloButton>
    </motion.div>
  )
}
