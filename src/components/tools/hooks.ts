import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'

/** Tracks an element's content width with a ResizeObserver. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w !== undefined) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, width] as const
}

type Focusable = HTMLElement | SVGElement

/**
 * Roving tabindex: the group is a single tab stop and the arrow keys move
 * focus between its items (Home / End jump to the ends).
 */
export function useRoving(count: number, onMove?: (index: number) => void) {
  const [index, setIndex] = useState(0)
  const refs = useRef<(Focusable | null)[]>([])
  const moveRef = useRef(onMove)
  moveRef.current = onMove

  const focusAt = useCallback(
    (i: number) => {
      if (count === 0) return
      const next = ((i % count) + count) % count
      setIndex(next)
      refs.current[next]?.focus()
      moveRef.current?.(next)
    },
    [count],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keys: Record<string, number> = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: count - 1,
      }
      if (!(e.key in keys)) return
      e.preventDefault()
      focusAt(keys[e.key])
    },
    [count, focusAt, index],
  )

  const itemProps = (i: number) => ({
    ref: (el: Focusable | null) => {
      refs.current[i] = el
    },
    tabIndex: i === index ? 0 : -1,
    onKeyDown,
  })

  return { index, setIndex, itemProps }
}
