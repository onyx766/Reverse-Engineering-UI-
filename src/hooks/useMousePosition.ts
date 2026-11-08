import { useEffect, useRef, useState } from 'react'

/** Normalised pointer position in [-1, 1] on both axes, with rAF smoothing. */
export function useMousePosition(smooth = 0.12) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * smooth
      current.current.y += (target.current.y - current.current.y) * smooth
      setPos({ x: current.current.x, y: current.current.y })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [smooth])

  return pos
}
