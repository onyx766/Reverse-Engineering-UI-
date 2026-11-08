import { useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface HoloPanelProps {
  children: ReactNode
  title?: string
  icon?: LucideIcon
  /** right-aligned status text in the header */
  badge?: string
  className?: string
  bodyClassName?: string
  /** max tilt in degrees; 0 disables the 3D hover */
  tilt?: number
  /** entrance delay in seconds */
  delay?: number
  /** slide-in direction for the scroll reveal */
  from?: 'left' | 'right' | 'bottom' | 'center'
  /** idle floating bob */
  float?: boolean
  /** render a thin accent bar that sweeps across the top edge on hover */
  sweep?: boolean
  onClick?: () => void
}

/**
 * The building block of the whole portfolio: a holographic glass pane that
 * tilts toward the cursor while a light follows the pointer across it.
 *
 * The pane is deliberately one flat layer: the glass (backdrop-filter +
 * overflow hidden) flattens 3D anyway, and nested preserve-3d / translateZ
 * planes made Chrome drop clicks on transformed children inside the body.
 */
export function HoloPanel({
  children,
  title,
  icon: Icon,
  badge,
  className,
  bodyClassName,
  tilt = 9,
  delay = 0,
  from = 'bottom',
  float = false,
  sweep = true,
  onClick,
}: HoloPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState(false)

  // pointer position normalised to [-0.5, 0.5]
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  // glare position in %
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)

  const spring = { stiffness: 220, damping: 26, mass: 0.5 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [tilt, -tilt]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-tilt, tilt]), spring)

  // hoisted so the hook order never depends on `reduced`
  const glare = useTransform(
    [gx, gy],
    ([x, y]: number[]) =>
      `radial-gradient(42rem 28rem at ${x}% ${y}%, rgb(var(--accent) / 0.16), transparent 58%)`,
  )

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || tilt === 0 || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    mx.set(px - 0.5)
    my.set(py - 0.5)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const handleLeave = () => {
    mx.set(0)
    my.set(0)
    gx.set(50)
    gy.set(50)
    setHovered(false)
  }

  const offset =
    from === 'left'
      ? { x: -64, y: 0, rotateY: 14 }
      : from === 'right'
        ? { x: 64, y: 0, rotateY: -14 }
        : from === 'center'
          ? { x: 0, y: 0, rotateY: 0 }
          : { x: 0, y: 54, rotateY: 0 }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onClick={onClick}
      initial={{
        opacity: 0,
        ...offset,
        rotateX: from === 'bottom' ? -12 : 0,
        scale: 0.96,
        filter: 'blur(10px)',
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1300, rotateX, rotateY }}
      className={cn(
        'group/panel relative rounded-2xl',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* floating bob sits on its own wrapper so it never fights the tilt */}
      <div className={cn('h-full', float && !reduced && 'animate-float-slow')}>
        <div
          className={cn(
            'glass relative h-full overflow-hidden rounded-2xl transition-[box-shadow,border-color] duration-500',
            'group-hover/panel:border-accent/60',
          )}
          style={{
            boxShadow: hovered
              ? '0 0 0 1px rgb(var(--accent) / 0.18) inset, 0 1px 0 rgb(255 255 255 / 0.1) inset, 0 34px 80px -28px rgb(0 0 0 / 0.95), 0 0 54px -10px rgb(var(--accent) / 0.6)'
              : undefined,
          }}
        >
          {/* pointer-tracking glare */}
          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100"
              style={{ background: glare }}
            />
          )}

          {/* inner scanline texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)',
            }}
          />

          {/* top hairline + hover sweep */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          {sweep && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
              <div className="h-px w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-[1100ms] ease-out group-hover/panel:translate-x-[320%]" />
            </div>
          )}

          <Corners />

          {/* header */}
          {(title || badge) && (
            <div className="relative flex items-center gap-2.5 border-b border-accent/15 px-4 py-3 sm:px-5">
              {Icon && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/35 bg-accent/10 text-accent shadow-glow-sm transition-transform duration-500 group-hover/panel:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              {title && (
                <h3 className="truncate font-display text-[15px] font-bold tracking-wide text-ink">
                  {title}
                </h3>
              )}
              {badge && (
                <span className="ml-auto shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                  {badge}
                </span>
              )}
            </div>
          )}

          <div className={cn('relative p-4 sm:p-5', bodyClassName)}>{children}</div>
        </div>

        {/* ground glow beneath the pane */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 -bottom-5 h-10 rounded-[50%] bg-accent/20 opacity-0 blur-xl transition-opacity duration-500 group-hover/panel:opacity-100"
        />
      </div>
    </motion.div>
  )
}

function Corners() {
  const base =
    'pointer-events-none absolute h-3.5 w-3.5 border-accent/70 transition-all duration-500 group-hover/panel:h-5 group-hover/panel:w-5 group-hover/panel:border-accent'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
