import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'

/** Live media-query match, read synchronously on first render to avoid a layout flash. */
export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
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

/** Content-box size of an element, tracked with a ResizeObserver. */
export function useElementSize<T extends HTMLElement>(ref: RefObject<T>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      setSize((s) =>
        Math.abs(s.width - r.width) < 0.5 && Math.abs(s.height - r.height) < 0.5
          ? s
          : { width: r.width, height: r.height },
      )
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return size
}

/** True only for devices whose primary pointer can hover (mouse / trackpad). */
export function useCanHover() {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}

/** SVG-safe unique id (React ids contain colons, which break url(#id) references). */
export function svgId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}
