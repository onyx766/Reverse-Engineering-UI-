import { Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout/Navbar'
import { Home } from '@/sections/Home'
import { Expertise } from '@/sections/Expertise'
import { Placeholder } from '@/sections/Placeholder'
import { useTheme } from '@/theme/ThemeProvider'
import type { SectionId } from '@/theme/themes'
import { cn } from '@/lib/utils'

const HoloCore = lazy(() =>
  import('@/components/three/HoloCore').then((m) => ({ default: m.HoloCore })),
)

const PENDING: Record<string, { eyebrow: string; title: string; sub: string; step: string }> = {
  projects: {
    eyebrow: 'Selected Work',
    title: 'Explore My Portfolio',
    sub: 'Real reverse engineering projects, deep technical analysis, and detailed write-ups.',
    step: 'Step 8',
  },
  tools: {
    eyebrow: 'Daily Driver',
    title: 'Tools & Environment',
    sub: 'The disassemblers, debuggers, tracers and runtimes I live inside every day.',
    step: 'Step 9',
  },
  writeups: {
    eyebrow: 'Long Form',
    title: 'Technical Write-ups',
    sub: 'Case studies from real teardowns — methodology, dead ends and all.',
    step: 'Step 9',
  },
  about: {
    eyebrow: 'Background',
    title: 'About Me',
    sub: 'Eight years, a few thousand hours in a disassembler, one enduring obsession.',
    step: 'Step 9',
  },
  contact: {
    eyebrow: 'Open For Work',
    title: 'Get In Touch',
    sub: 'Available for reverse engineering, tooling and low-level systems work.',
    step: 'Step 10',
  },
}

function renderSection(section: SectionId) {
  if (section === 'home') return <Home />
  if (section === 'expertise') return <Expertise />
  const p = PENDING[section]
  return <Placeholder eyebrow={p.eyebrow} title={p.title} subtitle={p.sub} step={p.step} />
}

export default function App() {
  const { section, epoch } = useTheme()

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />

      {/* The hologram recedes on content-dense sections and takes centre
          stage where the layout leaves it room. */}
      <Suspense fallback={<CorePlaceholder />}>
        <HoloCore
          className={cn(
            'pointer-events-none fixed left-1/2 top-1/2 -z-[5] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700',
            section === 'home'
              ? 'h-[min(58vh,520px)] w-[min(58vw,520px)] opacity-45'
              : 'h-[min(70vh,640px)] w-[min(70vw,640px)] opacity-70',
          )}
        />
      </Suspense>

      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${section}-${epoch}`}
            initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -22, filter: 'blur(12px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderSection(section)}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function CorePlaceholder() {
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-64 w-64 -translate-x-1/2 -translate-y-1/2">
      <div className="absolute inset-0 animate-pulse rounded-3xl border border-accent/30 bg-accent/5 blur-xl" />
      <div className="absolute inset-8 rounded-2xl border border-accent/40" />
    </div>
  )
}
