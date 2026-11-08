import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { useTheme } from '@/theme/ThemeProvider'
import { THEMES } from '@/theme/themes'

const COPY: Record<string, { title: string; sub: string }> = {
  home: {
    title: 'Reverse Engineer',
    sub: 'Eight years taking software apart — and writing down exactly how it works.',
  },
  expertise: {
    title: 'Core Expertise',
    sub: 'Binary analysis, protocol reversing, file-format reconstruction, debugging.',
  },
  projects: {
    title: 'Explore My Portfolio',
    sub: 'Real reverse engineering projects, deep technical analysis, and detailed write-ups.',
  },
  tools: {
    title: 'Tools & Environment',
    sub: 'The disassemblers, debuggers and runtimes I live in every day.',
  },
  writeups: {
    title: 'Technical Write-ups',
    sub: 'Long-form case studies from real teardowns.',
  },
  about: {
    title: 'About Me',
    sub: 'Eight years, three continents of codebases, one obsession.',
  },
  contact: {
    title: 'Get In Touch',
    sub: 'Available for reverse engineering, tooling and systems work.',
  },
}

export default function App() {
  const { section, epoch } = useTheme()
  const copy = COPY[section]

  return (
    <div className="relative min-h-screen overflow-x-hidden scene">
      {/* ambient wash — recolours with the active section */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-700"
        style={{
          background: `radial-gradient(90rem 60rem at 50% -10%, rgb(var(--accent) / 0.20), transparent 60%),
                       radial-gradient(60rem 40rem at 8% 108%, rgb(var(--accent-2) / 0.16), transparent 60%),
                       radial-gradient(50rem 40rem at 95% 60%, rgb(var(--accent-3) / 0.10), transparent 60%),
                       rgb(var(--deep))`,
        }}
      />

      <Navbar />

      <main className="mx-auto flex min-h-[200vh] max-w-6xl flex-col items-center px-6 pt-48 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${section}-${epoch}`}
            initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.42em] text-accent">
              // {THEMES[section].label}
            </span>
            <h1 className="text-balance font-display text-4xl font-black uppercase tracking-tight text-gradient sm:text-6xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-balance text-lg text-muted">{copy.sub}</p>
          </motion.div>
        </AnimatePresence>

        <p className="mt-24 font-mono text-xs uppercase tracking-[0.3em] text-muted/60">
          background · 3d core · panels — steps 3 to 10
        </p>
      </main>
    </div>
  )
}
