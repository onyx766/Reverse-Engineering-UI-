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
      // reduced motion: a plain fade (MotionConfig skips transforms, but not blur)
      initial={
        reduced
          ? { opacity: 0 }
          : {
              opacity: 0,
              ...offset,
              rotateX: from === 'bottom' ? -12 : 0,
              scale: 0.96,
              filter: 'blur(10px)',
            }
      }
      whileInView={
        reduced
          ? { opacity: 1 }
          : {
              opacity: 1,
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              filter: 'blur(0px)',
            }
      }
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reduced ? 0.4 : 0.85, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
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


          {/* top hairline + hover sweep */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          {sweep && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
              <div className="h-px w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-[1100ms] ease-out group-hover/panel:translate-x-[320%]" />
            </div>
          )}


          {/* header */}
          {(title || badge) && (
            <div className="relative flex items-center gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-5">
              {Icon && (
                <Icon className="h-5 w-5 shrink-0 text-accent drop-shadow-[0_0_6px_rgb(var(--accent)/0.9)] transition-transform duration-500 group-hover/panel:scale-110" />
              )}
              {title && (
                <h3 className="truncate font-display text-[17px] font-semibold text-ink">
                  {title}
                </h3>
              )}
              {badge && (
                <span className="ml-auto shrink-0 rounded-[7px] border border-accent/35 bg-accent/10 px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
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
