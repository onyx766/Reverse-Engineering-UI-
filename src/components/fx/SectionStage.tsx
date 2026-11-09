import { startTransition, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { usePresence } from 'framer-motion'
import { paletteVars, type Theme } from '@/theme/themes'
import { ThemeScope } from '@/theme/ThemeProvider'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { SECTION_ENTER_MS, SECTION_EXIT_MS } from './hooks'

const ENTER_FROM = 'translate3d(0, 28px, 0)'
const EXIT_TO = 'translate3d(0, -20px, 0)'
const ENTER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
// same curve as the palette morph, so content and chrome move in lockstep
const EXIT_EASE = 'cubic-bezier(0.45, 0, 0.2, 1)'

const canAnimate = (el: HTMLElement | null): el is HTMLElement => !!el && typeof el.animate === 'function'

/**
 * One section on the stage, as a direct child of <AnimatePresence mode="wait">.
 *
 * Built for a cheap switch on a weak GPU:
 * - enter / exit animate only opacity + transform through WAAPI, so they run
 *   on the compositor even while the main thread is busy, and leave no
 *   transform or filter behind (either would turn the wrapper into the
 *   containing block of every position: fixed element inside the section);
 * - the wrapper pins its own section's palette (paletteVars), so the :root
 *   palette morph never re-styles the section's subtree, and the outgoing
 *   section keeps its colours while it fades;
 * - the subtree reads a theme context pinned to its own section (ThemeScope),
 *   so clicking away does not re-render the outgoing page before it fades;
 * - with `defer`, the section renders inside a transition after the exit,
 *   so React builds it in small slices instead of one long task. A 100vh
 *   placeholder holds the page height meanwhile (the footer stays below the
 *   fold), and the entrance plays once the content has committed.
 */
export function SectionStage({
  theme,
  defer = false,
  children,
}: {
  theme: Theme
  defer?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isPresent, safeToRemove] = usePresence()
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(!defer)
  const enter = useRef<Animation | null>(null)

  // freeze what was on stage when the exit began: a transition that lands
  // during the exit must not mount the section only to fade it out
  const shown = useRef(ready)
  if (isPresent) shown.current = ready

  useEffect(() => {
    if (!ready) startTransition(() => setReady(true))
  }, [ready])

  useLayoutEffect(() => {
    const el = ref.current
    if (!ready || reduced || !canAnimate(el)) return
    const anim = el.animate([{ opacity: 0, transform: ENTER_FROM }, { opacity: 1, transform: 'none' }], {
      duration: SECTION_ENTER_MS,
      easing: ENTER_EASE,
    })
    enter.current = anim
    return () => anim.cancel()
  }, [ready, reduced])

  useEffect(() => {
    if (isPresent) return
    const el = ref.current
    if (!shown.current || reduced || !canAnimate(el)) {
      safeToRemove?.()
      return
    }
    // start from wherever an unfinished entrance left the section
    const now = getComputedStyle(el)
    const from = { opacity: now.opacity, transform: now.transform === 'none' ? 'translate3d(0, 0, 0)' : now.transform }
    enter.current?.cancel()
    const anim = el.animate([from, { opacity: 0, transform: EXIT_TO }], {
      duration: SECTION_EXIT_MS,
      easing: EXIT_EASE,
      fill: 'forwards',
    })
    let removed = false
    const remove = () => {
      if (removed) return
      removed = true
      safeToRemove?.()
    }
    anim.finished.then(remove, remove)
    return () => anim.cancel()
    // runs once, when the section starts leaving
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent])

  const show = isPresent ? ready : shown.current
  return (
    <div ref={ref} style={paletteVars(theme)} className={show ? undefined : 'min-h-screen'}>
      <ThemeScope theme={theme}>{show ? children : null}</ThemeScope>
    </div>
  )
}
