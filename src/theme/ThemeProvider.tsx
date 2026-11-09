import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SECTION_ORDER, THEMES, markTheme, type SectionId, type Theme } from './themes'

interface ThemeCtx {
  section: SectionId
  theme: Theme
  setSection: (id: SectionId) => void
  /** increments on every section change — lets children replay animations */
  epoch: number
}

const Ctx = createContext<ThemeCtx | null>(null)

function hashId() {
  const raw = window.location.hash.replace(/^#/, '')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw // malformed escape (#%E0%A4): treat it as an unknown id
  }
}

const isSection = (id: string): id is SectionId => (SECTION_ORDER as string[]).includes(id)

function sectionFromHash(): SectionId {
  const id = hashId()
  return isSection(id) ? id : 'home'
}

/**
 * Owns the active section and keeps it in the URL hash, so every section is
 * deep-linkable and the browser's back/forward buttons walk the history.
 * An unknown hash falls back to home.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<SectionId>(sectionFromHash)
  const [epoch, setEpoch] = useState(0)
  const current = useRef(section)

  const theme = THEMES[section]

  // the :root palette itself is snapped by the app at the section swap (applyTheme)
  useEffect(() => {
    markTheme(theme)
  }, [theme])

  useEffect(() => {
    // every switch starts at the top: the browser restoring an old offset on
    // back/forward would jump the outgoing section mid-fade
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    // a stale or mistyped deep link (#foo) shows home; drop it from the address bar
    const id = hashId()
    if (id && !isSection(id)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  const commit = useCallback((id: SectionId) => {
    current.current = id
    setSectionState(id)
    setEpoch((e) => e + 1)
  }, [])

  const setSection = useCallback(
    (id: SectionId) => {
      if (current.current === id) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const url = id === 'home' ? window.location.pathname + window.location.search : `#${id}`
      window.history.pushState(null, '', url)
      commit(id)
    },
    [commit],
  )

  useEffect(() => {
    const sync = () => {
      const raw = hashId()
      if (raw && !isSection(raw)) {
        // an in-page anchor (an element with that id) is a scroll target, not a route
        if (document.getElementById(raw)) return
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      const id = sectionFromHash()
      if (current.current !== id) commit(id)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [commit])

  const value = useMemo(
    () => ({ section, theme, setSection, epoch }),
    [section, theme, setSection, epoch],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/**
 * Pins the theme context of one section's subtree to that section (the stage
 * wraps every section in one). While the section is on stage it reads exactly
 * what the app reads; once the visitor switches away it keeps its own values
 * while it fades out, so none of its components re-render at the click (the
 * whole outgoing page re-rendering was most of the click-to-feedback delay).
 */
export function ThemeScope({ theme, children }: { theme: Theme; children: ReactNode }) {
  const { setSection, epoch } = useTheme()
  const [born] = useState(epoch)
  const value = useMemo(
    () => ({ section: theme.id, theme, setSection, epoch: born }),
    [theme, setSection, born],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
