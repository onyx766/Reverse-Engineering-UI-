import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MagneticButton } from './MagneticButton'

interface Props {
  children: ReactNode
  onClick?: () => void
  href?: string
  icon?: LucideIcon
  iconRight?: LucideIcon
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  magnetic?: boolean
}

const SIZES = {
  sm: 'px-3.5 py-2 text-[14px]',
  md: 'px-5 py-2.5 text-[15.5px]',
  lg: 'px-7 py-3 text-[17px]',
}

export function HoloButton({
  children,
  onClick,
  href,
  icon: Icon,
  iconRight: IconRight,
  variant = 'solid',
  size = 'md',
  className,
  magnetic = true,
}: Props) {
  const classes = cn(
    'group relative overflow-hidden rounded-[10px] border-[1.5px] font-ui font-semibold',
    'transition-[color,background-color,border-color,box-shadow] duration-300',
    SIZES[size],
    variant === 'solid' &&
      'border-accent/90 bg-[rgb(4_14_20/0.6)] text-ink shadow-[0_0_10px_rgb(var(--accent)/0.6),inset_0_0_12px_rgb(var(--accent)/0.22)] hover:bg-accent/15 hover:shadow-glow',
    variant === 'outline' &&
      'border-accent/40 bg-transparent text-accent hover:border-accent hover:bg-accent/10 hover:text-ink hover:shadow-glow-sm',
    variant === 'ghost' &&
      'border-transparent bg-white/[0.03] text-muted hover:border-accent/30 hover:text-ink',
    className,
  )

  const inner = (
    <>
      {/* light sweep */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {/* bottom edge glow */}
      <span className="pointer-events-none absolute inset-x-3 bottom-0 h-px origin-center scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
      <span className="relative flex items-center justify-center gap-2">
        {Icon && <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />}
        {children}
        {IconRight && (
          <IconRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </span>
    </>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cn(classes, 'inline-flex')}>
        {inner}
      </a>
    )
  }

  if (!magnetic) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'inline-flex')}>
        {inner}
      </button>
    )
  }

  return (
    <MagneticButton onClick={onClick} strength={0.28} className={classes}>
      {inner}
    </MagneticButton>
  )
}
