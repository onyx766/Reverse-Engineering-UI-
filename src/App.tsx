import { Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout/Navbar'
import { useTheme } from '@/theme/ThemeProvider'
import { THEMES } from '@/theme/themes'

// The WebGL bundle is heavy — keep it out of the critical path.
const HoloCore = lazy(() =>
  import('@/components/three/HoloCore').then((m) => ({ default: m.HoloCore })),
)

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
      <Background />
      <Navbar />

      {/* 3D hologram centrepiece — sits between the background and the panels */}
      <Suspense fallback={<CorePlaceholder />}>
        <HoloCore className="pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-[min(78vh,760px)] w-[min(78vw,760px)] -translate-x-1/2 -translate-y-1/2" />
      </Suspense>

      <main className="relative mx-auto flex min-h-[180vh] max-w-6xl flex-col items-center px-6 pt-44 text-center">
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

        <p className="mt-[60vh] font-mono text-xs uppercase tracking-[0.3em] text-muted/60">
          glass panels · sections — steps 5 to 10
        </p>
      </main>
    </div>
  )
}

/** Shown while the WebGL chunk streams in — same silhouette, zero JS cost. */
function CorePlaceholder() {
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-64 w-64 -translate-x-1/2 -translate-y-1/2">
      <div className="absolute inset-0 animate-pulse rounded-3xl border border-accent/30 bg-accent/5 blur-xl" />
      <div className="absolute inset-8 rounded-2xl border border-accent/40" />
    </div>
  )
}
