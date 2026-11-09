import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
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

// the inline transition replaces any transition utility in className, so it
// carries the hover paint properties too (same 300 ms as `duration-300`)
const PAINT = ['color', 'background-color', 'border-color', 'box-shadow']
  .map((p) => `${p} .3s cubic-bezier(.4,0,.2,1)`)
  .join(', ')
const SETTLE = `transform .5s var(--ease-holo), ${PAINT}`
const FOLLOW = `transform .08s linear, ${PAINT}`
const REST: CSSProperties = { transition: SETTLE }

/**
 * Pulls itself toward the cursor — the classic "magnetic" HUD control.
 * The offset is written straight to the element (no React render per
 * pointer move), only for a mouse: a finger has no hover, and pulling toward
 * a tap would leave the button stuck off-centre. Plain button when the user
 * prefers reduced motion.
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
  const reduced = useReducedMotion()

  const place = (x: number, y: number, follow: boolean) => {
    const el = ref.current
    if (!el) return
    el.style.transition = follow ? FOLLOW : SETTLE
    el.style.transform = follow ? `translate3d(${x}px, ${y}px, 0)` : ''
  }

  const handleMove = (e: PointerEvent) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    place((e.clientX - (r.left + r.width / 2)) * strength, (e.clientY - (r.top + r.height / 2)) * strength, true)
  }

  const reset = () => place(0, 0, false)

  const shared = {
    className: cn('inline-flex select-none items-center justify-center', className),
    onPointerMove: handleMove,
    onPointerLeave: reset,
    onPointerCancel: reset,
    style: REST,
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
