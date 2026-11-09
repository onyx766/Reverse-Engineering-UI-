import { useEffect, useState } from 'react'

/** False while the tab is hidden, so decorative loops can stop entirely. */
export function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)

  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])

  return match
}

/** CSS cubic-bezier as a JS easing function (Newton-Raphson on x). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x
      const d = slopeX(t)
      if (Math.abs(err) < 1e-5 || d === 0) break
      t -= err / d
    }
    return sampleY(Math.min(1, Math.max(0, t)))
  }
}

/** Same curve and length as the palette morph declared on :root in index.css (--theme-ms). */
export const THEME_MORPH_MS = 460
export const themeMorphEase = cubicBezier(0.45, 0, 0.2, 1)

/** Section switch: the outgoing section fades for SECTION_EXIT_MS (the palette morph runs alongside), then the next one enters. */
export const SECTION_EXIT_MS = THEME_MORPH_MS
export const SECTION_ENTER_MS = 560
