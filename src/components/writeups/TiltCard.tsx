import { useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  onClick: () => void
  ariaLabel: string
  className?: string
  bodyClassName?: string
  delay?: number
  tilt?: number
  from?: 'bottom' | 'left' | 'right'
}

/**
 * A clickable holographic glass surface with pointer tilt, pointer-tracked
 * glare, corner brackets and a hover sweep — the same vocabulary as HoloPanel
 * but rendered as a real <button> so the whole card is keyboard-operable, and
 * with no header so cover art can bleed to the edges.
 */
export function TiltCard({
  children,
  onClick,
  ariaLabel,
  className,
  bodyClassName,
  delay = 0,
  tilt = 6,
  from = 'bottom',
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState(false)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)

  const spring = { stiffness: 220, damping: 26, mass: 0.5 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [tilt, -tilt]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-tilt, tilt]), spring)
  const glare = useTransform(
    [gx, gy],
    ([x, y]: number[]) =>
      `radial-gradient(38rem 26rem at ${x}% ${y}%, rgb(var(--accent) / 0.16), transparent 56%)`,
  )

  const move = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced || tilt === 0 || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    mx.set(px - 0.5)
    my.set(py - 0.5)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const leave = () => {
    mx.set(0)
    my.set(0)
    gx.set(50)
    gy.set(50)
    setHovered(false)
  }

  const offset =
    from === 'left' ? { x: -48, y: 0 } : from === 'right' ? { x: 48, y: 0 } : { x: 0, y: 46 }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseMove={move}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={leave}
      // reduced motion: a plain fade, no slide / tilt / blur
      initial={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, ...offset, rotateX: from === 'bottom' ? -10 : 0, scale: 0.97, filter: 'blur(10px)' }
      }
      whileInView={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, x: 0, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }
      }
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1300, rotateX, rotateY }}
      className={cn(
        'group preserve-3d relative block w-full cursor-pointer rounded-2xl text-left',
        className,
      )}
    >
      <div
        className="glass preserve-3d relative h-full overflow-hidden rounded-2xl transition-[box-shadow,border-color,transform] duration-500 group-hover:-translate-y-1.5 group-hover:border-accent/60"
        style={{
          boxShadow: hovered
            ? '0 0 0 1px rgb(var(--accent) / 0.18) inset, 0 1px 0 rgb(255 255 255 / 0.1) inset, 0 34px 80px -28px rgb(0 0 0 / 0.95), 0 0 54px -10px rgb(var(--accent) / 0.6)'
            : undefined,
        }}
      >
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: glare }}
          />
        )}

        {/* top hairline + hover sweep */}
        <span className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px hairline" />
        <span className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px overflow-hidden">
          <span className="block h-px w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-[320%]" />
        </span>

        <Corners />

        <div className={cn('preserve-3d relative z-[1]', bodyClassName)}>{children}</div>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -bottom-4 h-10 rounded-[50%] bg-accent/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
      />
    </motion.button>
  )
}

function Corners() {
  const base =
    'pointer-events-none absolute z-[3] h-3.5 w-3.5 border-accent/70 transition-all duration-500 group-hover:h-5 group-hover:w-5 group-hover:border-accent'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
