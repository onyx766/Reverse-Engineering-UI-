import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion'
import { clamp } from '@/lib/utils'

/**
 * 0 → 1 progress of an element sliding past a line at `anchor` × viewport
 * height. Measured from layout offsets rather than useScroll({ target }), which
 * needs a positioned scroll container and the page scrolls on the window.
 */
export function useScrollProgress(ref: RefObject<HTMLElement>, anchor = 0.6) {
  const { scrollY } = useScroll()
  const progress = useMotionValue(0)
  const box = useRef({ top: 0, height: 1, vh: 1 })
  const [height, setHeight] = useState(0)

  const update = useCallback(() => {
    const { top, height: h, vh } = box.current
    progress.set(clamp((scrollY.get() + vh * anchor - top) / h, 0, 1))
  }, [anchor, progress, scrollY])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      let top = 0
      let node: HTMLElement | null = el
      while (node) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      box.current = { top, height: Math.max(1, el.offsetHeight), vh: window.innerHeight }
      setHeight(el.offsetHeight)
      update()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref, update])

  useMotionValueEvent(scrollY, 'change', update)

  return { progress, height }
}
