import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const matches = () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches

/**
 * Live `prefers-reduced-motion` flag. It is read synchronously on the first
 * render, so a component never starts an entrance animation (or a rAF loop)
 * for one frame before learning that motion is reduced.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(matches)

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY)
    if (!mq) return
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}
