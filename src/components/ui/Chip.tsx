import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  icon?: LucideIcon
  active?: boolean
  onClick?: () => void
  className?: string
  size?: 'xs' | 'sm'
}

/** Tag / filter pill. Interactive when `onClick` is supplied. */
export function Chip({ children, icon: Icon, active, onClick, className, size = 'sm' }: Props) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'group relative inline-flex items-center gap-1.5 overflow-hidden rounded-[7px] border font-ui normal-case tracking-normal transition-all duration-300',
        size === 'xs' ? 'px-2 py-[2px] text-[11.5px]' : 'px-2.5 py-[3px] text-[12.5px]',
        active
          ? 'border-accent/70 bg-accent/15 text-ink shadow-glow-sm'
          : 'border-white/[0.16] bg-white/[0.05] text-ink/90',
        onClick && !active && 'hover:border-accent/60 hover:bg-accent/15 hover:text-ink',
        className,
      )}
    >
      {onClick && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
      {Icon && <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
      <span className="relative">{children}</span>
    </Tag>
  )
}
