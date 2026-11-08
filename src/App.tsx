import { Suspense, lazy, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout/Navbar'
import { SectionBoundary } from '@/components/layout/SectionBoundary'
import { SECTIONS, preloadSection } from '@/sections/registry'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER, type SectionId } from '@/theme/themes'
import { cn } from '@/lib/utils'

const HoloCore = lazy(() =>
  import('@/components/three/HoloCore').then((m) => ({ default: m.HoloCore })),
)

/**
 * Where the background hologram sits per section. Projects is absent on
 * purpose: it mounts its own hologram on its stage, so this one fades out.
 * Size changes use scale (cheap) rather than width/height (canvas resize).
 */
const CORE_PLACEMENT: Partial<Record<SectionId, string>> = {
  home: 'scale-[0.82] opacity-45',
  expertise: 'scale-100 opacity-60',
  tools: 'scale-95 opacity-50',
  writeups: 'scale-[0.88] opacity-30',
  about: 'scale-90 opacity-45',
  contact: 'scale-95 opacity-55',
}

export default function App() {
  const { section, epoch } = useTheme()
  const placement = CORE_PLACEMENT[section]
  const Current = SECTIONS[section]

  // warm every section chunk once the browser is idle so nav switches are instant
  useEffect(() => {
    const warm = () => SECTION_ORDER.forEach(preloadSection)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(warm, 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />

      <Suspense fallback={<CorePlaceholder />}>
        <HoloCore
          paused={!placement}
          className={cn(
            'pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-[min(70vh,640px)] w-[min(70vw,640px)] -translate-x-1/2 -translate-y-1/2',
            'transition-[opacity,transform] duration-700 ease-out',
            placement ?? 'scale-75 opacity-0',
          )}
        />
      </Suspense>

      <main className="relative">
        <AnimatePresence
          mode="wait"
          onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >
          <motion.div
            key={`${section}-${epoch}`}
            initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -22, filter: 'blur(12px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionBoundary>
              <Suspense fallback={<SectionLoader />}>
                <Current />
              </Suspense>
            </SectionBoundary>
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

function SectionLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-24">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        <span className="absolute inset-3 animate-pulse rounded-full bg-accent/20 shadow-glow" />
      </div>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-muted">
        loading segment
      </span>
    </div>
  )
}
