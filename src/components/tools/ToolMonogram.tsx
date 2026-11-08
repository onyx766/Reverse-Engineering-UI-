import type { Tool } from '@/data/tools'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON } from './meta'

const SIZE = {
  xs: 'h-7 w-7 rounded-lg text-[9px]',
  sm: 'h-9 w-9 rounded-lg text-[10.5px]',
  md: 'h-12 w-12 rounded-xl text-[13px]',
  lg: 'h-16 w-16 rounded-2xl text-[17px]',
}

const ICON = {
  xs: 'hidden',
  sm: 'bottom-0.5 right-0.5 h-2 w-2',
  md: 'bottom-1 right-1 h-2.5 w-2.5',
  lg: 'bottom-1.5 right-1.5 h-3 w-3',
}

/** Glass monogram tile with a grid texture and the category glyph tucked in a corner. */
export function ToolMonogram({
  tool,
  size = 'md',
  className,
}: {
  tool: Tool
  size?: keyof typeof SIZE
  className?: string
}) {
  const Icon = CATEGORY_ICON[tool.category]
  return (
    <span
      aria-hidden
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden border border-accent/45 font-display font-black leading-none tracking-tight text-ink shadow-glow-sm',
        SIZE[size],
        className,
      )}
      style={{
        background:
          'linear-gradient(140deg, rgb(var(--accent) / 0.34), rgb(var(--accent-2) / 0.1) 52%, rgb(var(--deep) / 0.75))',
      }}
    >
      <span
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--accent) / 0.4) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--accent) / 0.4) 1px, transparent 1px)',
          backgroundSize: '7px 7px',
          maskImage: 'radial-gradient(circle at 30% 20%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 30% 20%, black, transparent 75%)',
        }}
      />
      <span className="absolute inset-x-1 top-0 h-px bg-gradient-to-r from-transparent via-accent3/80 to-transparent" />
      <span className="relative">{tool.mono}</span>
      <Icon className={cn('absolute text-accent3/80', ICON[size])} />
    </span>
  )
}
