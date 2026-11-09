import { useEffect, useState } from 'react'

/**
 * Small helpers shared by the hero (entry chunk) and the lazily loaded story
 * blocks. Keep this module free of data imports so it stays tiny.
 */

export const EASE = [0.22, 1, 0.36, 1] as const

/** DOM ids of the story blocks: scroll targets for the hero's scroll cue. */
export const HOME_BLOCK_IDS = {
  capabilities: 'home-what-i-do',
  work: 'home-selected-work',
  writeups: 'home-latest-writeups',
  toolchain: 'home-toolchain',
  engage: 'home-engage',
} as const

export type HomeBlock = keyof typeof HOME_BLOCK_IDS

/**
 * Fade-and-rise reveal used by every story block (transform + opacity only).
 * With `still` (prefers-reduced-motion) the element simply renders in place:
 * reduced motion is handled here rather than through framer-motion's
 * MotionConfig, which logs a console warning for every such visitor in dev.
 */
export function reveal(delay = 0, y = 22, still = false) {
  return {
    initial: still ? (false as const) : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '0px 0px -10% 0px' },
    transition: { duration: 0.7, delay, ease: EASE },
  }
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const QUERIES: [Exclude<Breakpoint, 'xs'>, string][] = [
  ['xl', '(min-width: 1280px)'],
  ['lg', '(min-width: 1024px)'],
  ['md', '(min-width: 768px)'],
  ['sm', '(min-width: 640px)'],
]

function readBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'lg'
  return QUERIES.find(([, q]) => window.matchMedia(q).matches)?.[0] ?? 'xs'
}

/** Current Tailwind breakpoint, read synchronously so the first render is right. */
export function useBreakpoint() {
  const [bp, setBp] = useState<Breakpoint>(readBreakpoint)

  useEffect(() => {
    const lists = QUERIES.map(([, q]) => window.matchMedia(q))
    const update = () => setBp(readBreakpoint())
    lists.forEach((l) => l.addEventListener('change', update))
    update()
    return () => lists.forEach((l) => l.removeEventListener('change', update))
  }, [])

  return bp
}

/**
 * Height each block reserves before it mounts, per breakpoint (measured from
 * the rendered blocks, rounded down so a mounted block never leaves a gap).
 */
export const BLOCK_MIN_HEIGHT: Record<HomeBlock, Record<Breakpoint, number>> = {
  capabilities: { xs: 840, sm: 900, md: 700, lg: 630, xl: 480 },
  work: { xs: 700, sm: 980, md: 860, lg: 650, xl: 600 },
  writeups: { xs: 750, sm: 860, md: 780, lg: 680, xl: 660 },
  toolchain: { xs: 660, sm: 560, md: 500, lg: 460, xl: 460 },
  engage: { xs: 840, sm: 690, md: 680, lg: 550, xl: 420 },
}

/** Clearance for the fixed navbar when scrolling a block into view. */
const NAV_CLEARANCE = 104

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Scrolls a story block to just below the navbar: smooth, or instant under
 * reduced motion. Focus moves to the block's heading (without a second
 * scroll) so keyboard users continue from there.
 */
export function scrollToBlock(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_CLEARANCE
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced() ? 'instant' : 'smooth' })
  const heading = el.querySelector<HTMLElement>('[data-block-heading]')
  heading?.focus({ preventScroll: true })
}
