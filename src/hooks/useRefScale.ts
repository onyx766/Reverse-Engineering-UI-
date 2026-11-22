import { useEffect, useState } from 'react'

/**
 * The Projects stage and the desktop navbar are drawn in the reference
 * render's own pixel space (1672 × 941) and scaled as one piece, so every
 * element keeps its exact place and proportion on any 16:9-ish screen.
 */
export const REF_W = 1672
export const REF_H = 941

function read() {
  if (typeof window === 'undefined') return 1
  const w = document.documentElement.clientWidth || window.innerWidth
  const h = window.innerHeight
  return Math.min(w / REF_W, h / REF_H)
}

/** min(viewport width / 1672, viewport height / 941), live. */
export function useRefScale() {
  const [s, setS] = useState(read)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setS(read()))
    }
    on()
    window.addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', on)
    }
  }, [])
  return s
}

/** Viewport width in px (scrollbar excluded), live. */
export function useViewportWidth() {
  const get = () => (typeof window === 'undefined' ? REF_W : document.documentElement.clientWidth || window.innerWidth)
  const [w, setW] = useState(get)
  useEffect(() => {
    const on = () => setW(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}
