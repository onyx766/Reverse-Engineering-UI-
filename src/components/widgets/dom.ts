import { useEffect, useRef, type RefObject } from 'react'

/**
 * Layout offset of `el` inside `container`. Unlike getBoundingClientRect this
 * ignores CSS transforms, so popovers stay glued to their anchor while the
 * surrounding HoloPanel tilts in 3D. `container` must be positioned.
 */
export function offsetWithin(el: HTMLElement, container: HTMLElement) {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== container) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y }
}

/** True for keyboard focus; false when focus came from a mouse click or a tap. */
export function isFocusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

/** Hover affordances are mouse-only; touch uses tap-to-pin instead. */
export const isMouse = (e: { pointerType: string }) => e.pointerType === 'mouse'

/** While `active`, a tap outside `ref` or the Escape key calls `onDismiss` (closes pinned popovers). */
export function useDismiss(ref: RefObject<HTMLElement>, active: boolean, onDismiss: () => void) {
  const cb = useRef(onDismiss)
  cb.current = onDismiss
  useEffect(() => {
    if (!active) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb.current()
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, ref])
}
