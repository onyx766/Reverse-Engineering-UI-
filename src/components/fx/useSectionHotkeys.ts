import { useEffect } from 'react'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER } from '@/theme/themes'

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const OPEN_DIALOG = '[role="dialog"], [role="alertdialog"], [aria-modal="true"]'

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || el.closest(EDITABLE) !== null
}

/**
 * Number keys 1–7 jump straight to the matching section in SECTION_ORDER —
 * unless the user is typing, holding a modifier, or a dialog is open.
 */
export function useSectionHotkeys() {
  const { setSection } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (!/^[1-9]$/.test(e.key)) return
      const index = Number(e.key) - 1
      if (index >= SECTION_ORDER.length) return
      if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return
      if (document.querySelector(OPEN_DIALOG)) return
      e.preventDefault()
      setSection(SECTION_ORDER[index])
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSection])
}
