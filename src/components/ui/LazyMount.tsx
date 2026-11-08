import { startTransition, useEffect, useRef, useState, type ReactNode } from 'react'

export interface LazyMountProps {
  children: ReactNode
  /** reserve roughly the final height (px or any CSS length) so the page length stays stable */
  minHeight?: number | string
  /** ms after mount before idle-time mounting kicks in (lets the section-switch animation finish) */
  delay?: number
  /** IntersectionObserver rootMargin: mount early when the block gets this close to the viewport */
  margin?: string
  className?: string
  /** forwarded so scroll targets (e.g. "jump to index") still resolve before the content mounts */
  id?: string
}

/**
 * Defers heavy, below-the-fold content so a section switch only pays for what
 * is on screen. Mounts on whichever comes first:
 *   - the block scrolls within `margin` of the viewport, or
 *   - the browser is idle once `delay` ms have passed.
 * The mount runs in a transition, so React time-slices the render instead of
 * blocking a frame.
 */
export function LazyMount({
  children,
  minHeight,
  delay = 1200,
  margin = '900px 0px',
  className,
  id,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const show = () => startTransition(() => setReady(true))

    let io: IntersectionObserver | undefined
    if (ref.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && show(), {
        rootMargin: margin,
      })
      io.observe(ref.current)
    }

    let idle = 0
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(show, { timeout: 1500 })
      else show()
    }, delay)

    return () => {
      io?.disconnect()
      clearTimeout(timer)
      if (idle) window.cancelIdleCallback(idle)
    }
  }, [ready, delay, margin])

  return (
    <div ref={ref} id={id} className={className} style={ready ? undefined : { minHeight }}>
      {ready ? children : null}
    </div>
  )
}
