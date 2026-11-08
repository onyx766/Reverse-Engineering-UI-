import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { THEMES, applyTheme, type SectionId, type Theme } from './themes'

interface ThemeCtx {
  section: SectionId
  theme: Theme
  setSection: (id: SectionId) => void
  /** increments on every section change — lets children replay animations */
  epoch: number
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<SectionId>('home')
  const [epoch, setEpoch] = useState(0)

  const theme = THEMES[section]

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setSection = useCallback((id: SectionId) => {
    setSectionState((prev) => {
      if (prev === id) return prev
      setEpoch((e) => e + 1)
      return id
    })
  }, [])

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
