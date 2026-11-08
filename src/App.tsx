import { Suspense, lazy, useEffect, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionBoundary, SilentBoundary } from '@/components/layout/SectionBoundary'
import { BootSequence, shouldRunBoot } from '@/components/fx/BootSequence'
import { SectionTransition } from '@/components/fx/SectionTransition'
import { CursorAura } from '@/components/fx/CursorAura'
import { useSectionHotkeys } from '@/components/fx/useSectionHotkeys'
import { SECTIONS, preloadSection } from '@/sections/registry'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER, type SectionId } from '@/theme/themes'
import { cn } from '@/lib/utils'

const HoloCore = lazy(() =>
  import('@/components/three/HoloCore').then((m) => ({ default: m.HoloCore })),
)

/**
 * Where the background hologram sits per section. Projects and Tools are
 * absent on purpose: each builds its own centrepiece on its stage (WebGL core
 * / orbital toolkit), so this one fades out and stops rendering there.
 * Size changes use scale (cheap) rather than width/height (canvas resize).
 */
const CORE_PLACEMENT: Partial<Record<SectionId, string>> = {
  // phones stack the hero copy over the core, so it steps back there
  home: 'scale-[0.82] opacity-25 md:opacity-45',
  // content-dense sections: keep the core as ambience, never competing with text
  expertise: 'scale-100 opacity-35',
  writeups: 'scale-[0.88] opacity-20',
  about: 'scale-90 opacity-30',
  contact: 'scale-95 opacity-30',
}

const MAIN_ID = 'main-content'

/*
 * Stacking order: Background -z-10 < HoloCore -z-[5] < main / footer <
 * drawer z-40 < navbar z-50 < section-switch FX z-[70] < HoloModal z-[80] <
 * cursor aura z-[90] < boot overlay z-[100].
 */
export default function App() {
  const { section, epoch } = useTheme()
  const placement = CORE_PLACEMENT[section]
  const Current = SECTIONS[section]
  const [booting, setBooting] = useState(shouldRunBoot)
  const [revealed, setRevealed] = useState(() => !booting)

  useSectionHotkeys()

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

  const skipToContent = (e: MouseEvent<HTMLAnchorElement>) => {
    // hash routing would read "#main-content" as a section, so focus manually
    e.preventDefault()
    document.getElementById(MAIN_ID)?.focus()
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <a
        href={`#${MAIN_ID}`}
        onClick={skipToContent}
        className="sr-only rounded-xl border border-accent bg-deep px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent shadow-glow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[95]"
      >
        Skip to content
      </a>

      <Background />
      <Navbar ready={revealed} />

      <SilentBoundary>
        <Suspense fallback={<CorePlaceholder />}>
          <HoloCore
            paused={!placement}
            className={cn(
              // square on every screen: a tall portrait canvas narrows the camera's view and clips the cube
              'pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-[min(70vh,86vw,640px)] w-[min(70vh,86vw,640px)] -translate-x-1/2 -translate-y-1/2',
              'transition-[opacity,transform] duration-700 ease-out',
              placement ?? 'scale-75 opacity-0',
            )}
          />
        </Suspense>
      </SilentBoundary>

      <motion.main
        id={MAIN_ID}
        tabIndex={-1}
        className="relative flex-1 outline-none"
        initial={false}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.main>

      <Footer />

      <SectionTransition />
      <CursorAura />
      {booting && (
        <BootSequence onReveal={() => setRevealed(true)} onDone={() => setBooting(false)} />
      )}
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
