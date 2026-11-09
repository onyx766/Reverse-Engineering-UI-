export const EASE = [0.22, 1, 0.36, 1] as const

/**
 * `initial` for a scroll-in entrance: the full slide / tilt / blur, or only a
 * fade when the visitor prefers reduced motion. Handled per element (as the
 * Home blocks do), so it holds with or without an app-level MotionConfig.
 */
export const entrance = <T extends object>(reduced: boolean, from: T): T | { opacity: number } =>
  reduced ? { opacity: 0 } : from

/** border brightens + accent glow on hover/focus, shared by the About glass tiles */
export const GLOW_HOVER =
  'transition-[border-color,box-shadow] duration-500 hover:border-accent/60 hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.16)_inset,0_26px_60px_-26px_rgb(0_0_0/0.95),0_0_46px_-10px_rgb(var(--accent)/0.6)]'

export const GLOW_ACTIVE =
  'border-accent/60 shadow-[0_0_0_1px_rgb(var(--accent)/0.16)_inset,0_26px_60px_-26px_rgb(0_0_0/0.95),0_0_46px_-10px_rgb(var(--accent)/0.6)]'

/** diagonal light sweep that crosses a `group` on hover */
export const SWEEP =
  'pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full'
