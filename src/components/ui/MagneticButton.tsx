import { useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  children: ReactNode
  className?: string
  strength?: number
  onClick?: () => void
  as?: 'button' | 'a'
  href?: string
  ariaLabel?: string
}

/**
 * Pulls itself toward the cursor — the classic "magnetic" HUD control.
 * Falls back to a plain button when the user prefers reduced motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.35,
  onClick,
  as = 'button',
  href,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const reduced = useReducedMotion()

  const handleMove = (e: MouseEvent) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setOffset({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    })
  }

  const reset = () => setOffset({ x: 0, y: 0 })

  const style = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition: offset.x === 0 && offset.y === 0 ? 'transform .5s var(--ease-holo)' : 'transform .08s linear',
  }

  const shared = {
    className: cn('inline-flex select-none items-center justify-center', className),
    onMouseMove: handleMove,
    onMouseLeave: reset,
    style,
    'aria-label': ariaLabel,
  }

  if (as === 'a') {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} {...shared}>
        {children}
      </a>
    )
  }
  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} type="button" onClick={onClick} {...shared}>
      {children}
    </button>
  )
}
