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
import { SECTION_ORDER, THEMES, applyTheme, type SectionId, type Theme } from './themes'

interface ThemeCtx {
  section: SectionId
  theme: Theme
  setSection: (id: SectionId) => void
  /** increments on every section change — lets children replay animations */
  epoch: number
}

const Ctx = createContext<ThemeCtx | null>(null)

function sectionFromHash(): SectionId {
  const id = window.location.hash.replace(/^#/, '')
  return (SECTION_ORDER as string[]).includes(id) ? (id as SectionId) : 'home'
}

/**
 * Owns the active section and keeps it in the URL hash, so every section is
 * deep-linkable and the browser's back/forward buttons walk the history.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<SectionId>(sectionFromHash)
  const [epoch, setEpoch] = useState(0)
  const current = useRef(section)

  const theme = THEMES[section]

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

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

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
