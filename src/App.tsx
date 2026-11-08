import { useTheme } from './theme/ThemeProvider'
import { NAV_ITEMS, THEMES } from './theme/themes'

/**
 * Step 1 shell — proves the theme engine end to end.
 * Nav, background, 3D core and sections land in steps 2-10.
 */
export default function App() {
  const { section, theme, setSection } = useTheme()

  return (
    <div className="relative min-h-screen overflow-hidden scene">
      {/* ambient wash that recolours with the active section */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-[background] duration-700"
        style={{
          background: `radial-gradient(90rem 60rem at 50% -10%, rgb(var(--accent) / 0.18), transparent 60%),
                       radial-gradient(60rem 40rem at 10% 110%, rgb(var(--accent-2) / 0.14), transparent 60%),
                       rgb(var(--deep))`,
        }}
      />

      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <nav className="glass flex flex-wrap items-center justify-center gap-2 rounded-2xl p-2">
          {NAV_ITEMS.map((id) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`rounded-xl px-5 py-2 font-display text-sm uppercase tracking-widest transition-all duration-300 ${
                section === id
                  ? 'bg-accent/15 text-accent shadow-glow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {THEMES[id].label}
            </button>
          ))}
          <button
            onClick={() => setSection('contact')}
            className={`rounded-xl px-5 py-2 font-display text-sm uppercase tracking-widest transition-all duration-300 ${
              section === 'contact'
                ? 'bg-accent/15 text-accent shadow-glow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            Contact
          </button>
        </nav>

        <h1 className="font-display text-5xl font-black uppercase tracking-tight text-gradient md:text-7xl">
          {theme.label}
        </h1>
        <p className="max-w-xl font-mono text-sm text-muted">
          Theme engine online — active palette{' '}
          <span className="neon">{theme.id}</span>. Every section repaints the
          entire interface.
        </p>

        <div className="flex gap-4">
          {[theme.accent, theme.accent2, theme.accent3].map((c, i) => (
            <div
              key={i}
              className="h-16 w-16 rounded-xl ring-1 ring-white/10 transition-colors duration-700"
              style={{
                background: `rgb(${c})`,
                boxShadow: `0 0 28px rgb(${c} / 0.55)`,
              }}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
