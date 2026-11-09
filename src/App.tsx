import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionBoundary, SilentBoundary } from '@/components/layout/SectionBoundary'
import { BootSequence, shouldRunBoot } from '@/components/fx/BootSequence'
import { SectionTransition } from '@/components/fx/SectionTransition'
import { SectionStage } from '@/components/fx/SectionStage'
import { CursorAura } from '@/components/fx/CursorAura'
import { useSectionHotkeys } from '@/components/fx/useSectionHotkeys'
import { SECTIONS, preloadSection } from '@/sections/registry'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER, THEMES, applyTheme, type SectionId } from '@/theme/themes'
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
  // below lg the hero is one column with the copy over the core, so it steps back there
  home: 'scale-[0.82] opacity-25 lg:opacity-45',
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
  const Current = SECTIONS[section]
  const [booting, setBooting] = useState(shouldRunBoot)
  const [revealed, setRevealed] = useState(() => !booting)

  // :root (and with it the footer, portals, scrollbar) wears the palette of
  // the section actually on stage. It snaps at the swap, in the commit that
  // removes the outgoing section and before the incoming one renders, so the
  // one document-wide restyle it costs touches only a few hundred nodes.
  const [staged, setStaged] = useState(section)
  const latest = useRef(section)
  latest.current = section
  const swapped = useRef(false)
  useLayoutEffect(() => {
    applyTheme(THEMES[staged])
    if (!swapped.current) return
    // focus that lived in the outgoing section went with it: park it on <main>
    // so the next Tab starts at the new content instead of the top of the page
    const active = document.activeElement
    if (!active || active === document.body || !active.isConnected) {
      document.getElementById(MAIN_ID)?.focus({ preventScroll: true })
    }
  }, [staged])
  const onSwapped = () => {
    swapped.current = true
    window.scrollTo({ top: 0, behavior: 'instant' })
    setStaged(latest.current)
  }

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
        // not-sr-only resets padding to 0, so the padding has to be focus-scoped too
        className="sr-only rounded-xl border border-accent bg-deep font-mono text-[11px] uppercase tracking-[0.2em] text-accent shadow-glow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[95] focus:px-4 focus:py-2.5"
      >
        Skip to content
      </a>

      <Background />
      <Navbar ready={revealed} />
      <BackdropCore section={section} />

      <motion.main
        id={MAIN_ID}
        tabIndex={-1}
        className="relative flex-1 outline-none"
        initial={false}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" onExitComplete={onSwapped}>
          <SectionStage key={`${section}-${epoch}`} theme={THEMES[section]} defer={epoch > 0}>
            <SectionBoundary>
              <Suspense fallback={<SectionLoader />}>
                <Current />
              </Suspense>
            </SectionBoundary>
          </SectionStage>
        </AnimatePresence>
      </motion.main>

      <Footer />

      {/* screen readers hear the switch; sighted users get the sweep */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {swapped.current ? `${THEMES[staged].label} section` : ''}
      </p>

      <SectionTransition />
      <CursorAura />
      {booting && (
        <BootSequence onReveal={() => setRevealed(true)} onDone={() => setBooting(false)} />
      )}
    </div>
  )
}

/**
 * The app-level hologram. On Home it belongs to the hero only: once the
 * visitor scrolls into the story blocks it fades out and stops rendering,
 * so it never sits behind their headings. Kept in its own component so the
 * threshold flip re-renders only this, not the section on stage.
 */
function BackdropCore({ section }: { section: SectionId }) {
  const pastHero = useScrolledPast(section === 'home')
  const placement = pastHero ? undefined : CORE_PLACEMENT[section]
  return (
    <SilentBoundary>
      <Suspense fallback={placement ? <CorePlaceholder /> : null}>
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
  )
}

/** true while `active` and the page is scrolled past `fraction` of the viewport; state flips only at the threshold */
function useScrolledPast(active: boolean, fraction = 0.75) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const check = () => {
      raf = 0
      setPast(window.scrollY > window.innerHeight * fraction)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active, fraction])
  return active && past
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
