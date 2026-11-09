import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Section } from '@/components/layout/Section'
import { LazyMount } from '@/components/ui/LazyMount'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { clamp, cn } from '@/lib/utils'
import { clearIntent, peekIntent } from '@/lib/intent'
import {
  INITIAL_PROJECT_ID,
  PROJECTS,
  PROJECTS_COPY,
  SHARDS_FOR_KIND,
  type Project,
  type ShardId,
} from '@/data/projects'
import { ProjectsKeyframes } from '@/components/projects/ProjectsKeyframes'
import { FilterChips, FilterPanel, type FilterId } from '@/components/projects/FilterPanel'
import { AnalysisPanel } from '@/components/projects/AnalysisPanel'
import { CompactStage, DesktopStage } from '@/components/projects/CoreStage'
import { Carousel, offsetFor } from '@/components/projects/Carousel'
import { ExplorePedestal } from '@/components/projects/ExplorePedestal'
import { CaseIndex } from '@/components/projects/CaseIndex'
import { CaseStudyModal } from '@/components/projects/CaseStudyModal'
import { useElementSize, useMediaQuery } from '@/components/projects/hooks'

const INDEX_ID = 'case-index'
const EASE = [0.22, 1, 0.36, 1] as const

/** Reserved height of the case index before it mounts (measured per breakpoint, px). */
function useIndexMinHeight() {
  const xl = useMediaQuery('(min-width: 1280px)')
  const lg = useMediaQuery('(min-width: 1024px)')
  const md = useMediaQuery('(min-width: 768px)')
  const sm = useMediaQuery('(min-width: 640px)')
  return xl ? 1500 : lg ? 1810 : md ? 2000 : sm ? 3300 : 3550
}

const COUNTS = PROJECTS.reduce(
  (acc, p) => {
    acc[p.category] += 1
    return acc
  },
  { all: PROJECTS.length, api: 0, binary: 0, format: 0, reimpl: 0, tooling: 0 } as Record<FilterId, number>,
)

export function Projects() {
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const indexMinHeight = useIndexMinHeight()

  // arriving from a Home card: centre that study and open it
  const [entry] = useState(() => {
    const id = peekIntent('projects')
    return id && PROJECTS.some((p) => p.id === id) ? id : null
  })
  useEffect(() => clearIntent('projects'), [])

  const [filter, setFilter] = useState<FilterId>('all')
  const [nav, setNav] = useState<{ id: string; shift: number | null }>({ id: entry ?? INITIAL_PROJECT_ID, shift: null })
  const [openId, setOpenId] = useState<string | null>(entry)

  const visible = useMemo(
    () => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter],
  )
  const focusIndex = Math.max(0, visible.findIndex((p) => p.id === nav.id))
  const focused = visible[focusIndex] ?? PROJECTS[0]
  const hot = SHARDS_FOR_KIND[focused.kind]

  const step = useCallback(
    (delta: number) => {
      const n = visible.length
      if (n <= 1 || !delta) return
      const next = (((focusIndex + delta) % n) + n) % n
      if (next === focusIndex) return
      setNav({ id: visible[next].id, shift: n <= 2 ? focusIndex - next : -delta })
    },
    [visible, focusIndex],
  )

  const changeFilter = (f: FilterId) => {
    if (f === filter) return
    const list = f === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === f)
    setFilter(f)
    setNav((cur) => ({ id: list.some((p) => p.id === cur.id) ? cur.id : list[0].id, shift: null }))
  }

  /* ── modal ─────────────────────────────────────────────────────── */
  const openIdx = openId ? PROJECTS.findIndex((p) => p.id === openId) : -1
  const lastIdx = useRef(0)
  if (openIdx >= 0) lastIdx.current = openIdx
  const N = PROJECTS.length

  const closeModal = () => {
    const id = openId
    setOpenId(null)
    // leave the carousel on whatever study was being read
    const i = visible.findIndex((p) => p.id === id)
    if (i >= 0 && i !== focusIndex) step(offsetFor(i, focusIndex, visible.length))
  }

  /* ── stage visibility + keyboard ───────────────────────────────── */
  const stageRef = useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { margin: '0px 0px -8% 0px' })
  const stageVisible = inView && !openId
  const running = stageVisible && !reduced
  const pointerInStage = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openId || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return
      const within = !!stageRef.current?.contains(document.activeElement)
      if (!pointerInStage.current && !within) return
      e.preventDefault()
      step(e.key === 'ArrowRight' ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId, step])

  const scrollToIndex = () => {
    document.getElementById(INDEX_ID)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  const stageProps = {
    visible,
    focused,
    focusIndex,
    shift: nav.shift,
    filter,
    hot,
    running,
    stageVisible,
    onFilter: changeFilter,
    onStep: step,
    onOpen: setOpenId,
    onExplore: scrollToIndex,
  }

  return (
    <Section id="projects" className="max-w-[1760px] pb-24 pt-32 sm:pb-32 lg:pt-[100px]">
      <ProjectsKeyframes />

      <div
        ref={stageRef}
        data-pj-paused={!running}
        onPointerEnter={() => {
          pointerInStage.current = true
        }}
        onPointerLeave={() => {
          pointerInStage.current = false
        }}
      >
        {desktop ? <DesktopLayout {...stageProps} /> : <MobileLayout {...stageProps} />}
      </div>

      {/* below the fold: mounts once the switch settles or as it nears the viewport;
          the wrapper carries the id so "Explore My Portfolio" can scroll to it before then */}
      <LazyMount
        id={INDEX_ID}
        minHeight={indexMinHeight}
        margin="0px 0px 60px 0px"
        className="mt-24 sm:mt-28"
      >
        <CaseIndex id={`${INDEX_ID}-list`} projects={PROJECTS} onOpen={setOpenId} className="mx-auto max-w-[1400px]" />
      </LazyMount>

      <CaseStudyModal
        project={openIdx >= 0 ? PROJECTS[openIdx] : null}
        index={lastIdx.current}
        total={N}
        prev={PROJECTS[(lastIdx.current - 1 + N) % N]}
        next={PROJECTS[(lastIdx.current + 1) % N]}
        onClose={closeModal}
        onPage={(d) => setOpenId(PROJECTS[(lastIdx.current + d + N) % N].id)}
      />
    </Section>
  )
}

interface LayoutProps {
  visible: Project[]
  focused: Project
  focusIndex: number
  shift: number | null
  filter: FilterId
  hot: ShardId[]
  running: boolean
  stageVisible: boolean
  onFilter: (f: FilterId) => void
  onStep: (delta: number) => void
  onOpen: (id: string) => void
  onExplore: () => void
}

function DesktopLayout(p: LayoutProps) {
  const short = useMediaQuery('(max-height: 859px)')
  const veryShort = useMediaQuery('(max-height: 780px)')
  const density: 0 | 1 | 2 = veryShort ? 2 : short ? 1 : 0
  const rowRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(rowRef)
  const rowW = width || 1200
  const full = rowW >= 1180
  const lp = Math.round(clamp(rowW * 0.2, 240, 292))
  const rp = Math.round(clamp(rowW * 0.215, 258, 306))
  const middle = rowW - lp - rp - 24
  // Reserved row height. Full: exactly the stage design (880×440). Compact: deliberately a little
  // shorter than the compact stage (540×392 design), so the hologram's lower orbit rings spill
  // 30–45px into the carousel's top margin (behind the cards) and 1024×768 stays on one screen;
  // the compact shards always end inside the row.
  const designW = full ? 880 : 660
  const designH = full ? 440 : 430
  const k = clamp(middle / designW, 0.62, 1.2)
  // the analysis panel's header chrome (padding, icon, gaps, status chip) takes 142px and
  // "System Analysis" 147px: below 290px the chip would ellipsise the title (e.g. 1366px)
  const analysisBadge = rp >= 290

  return (
    <div className="relative">
      <h2 className="sr-only">
        {PROJECTS_COPY.eyebrow}: {p.visible.length} {p.visible.length === 1 ? 'case study' : 'case studies'}
      </h2>

      <div ref={rowRef} className="relative" style={{ height: designH * k }}>
        <DesktopStage hot={p.hot} running={p.running} visible={p.stageVisible} width={middle} compact={!full} />

        <div className="absolute left-0 top-1 z-10" style={{ width: lp, perspective: 1100 }}>
          <div className="preserve-3d" style={{ transform: 'rotateY(16deg)', transformOrigin: '30% 50%' }}>
            <FilterPanel value={p.filter} onChange={p.onFilter} counts={COUNTS} density={density} />
          </div>
        </div>

        <div className="absolute right-0 top-4 z-10" style={{ width: rp, perspective: 1100 }}>
          <div className="preserve-3d" style={{ transform: 'rotateY(-16deg)', transformOrigin: '70% 50%' }}>
            <AnalysisPanel project={p.focused} badge={analysisBadge} density={density} />
          </div>
        </div>
      </div>

      <Carousel
        projects={p.visible}
        focusIndex={p.focusIndex}
        shift={p.shift}
        mode="arc"
        live={p.running}
        onStep={p.onStep}
        onOpen={p.onOpen}
        className={cn('relative z-20', ['-mt-10', '-mt-8', 'mt-0'][density])}
      />

      <ExplorePedestal onClick={p.onExplore} className="relative z-10 -mt-12" />
    </div>
  )
}

function MobileLayout(p: LayoutProps) {
  return (
    <div className="flex flex-col">
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.36em] text-accent">
          <span aria-hidden className="h-px w-5 bg-accent/70" />
          {PROJECTS_COPY.eyebrow}
          <span aria-hidden className="h-px w-5 bg-accent/70" />
        </span>
        <h2 className="font-display text-[22px] font-black uppercase tracking-tight text-gradient sm:text-[28px]">
          {PROJECTS_COPY.title}
        </h2>
        <p className="max-w-md text-[14.5px] leading-relaxed text-muted">{PROJECTS_COPY.intro}</p>
      </motion.div>

      <div className="mt-5">
        <FilterChips value={p.filter} onChange={p.onFilter} counts={COUNTS} />
      </div>

      <div className="mt-2">
        <CompactStage hot={p.hot} running={p.running} visible={p.stageVisible} />
      </div>

      <Carousel
        projects={p.visible}
        focusIndex={p.focusIndex}
        shift={p.shift}
        mode="slider"
        live={p.running}
        onStep={p.onStep}
        onOpen={p.onOpen}
        className="mt-6"
      />

      <div className="mx-auto mt-6 w-full max-w-xl">
        <AnalysisPanel project={p.focused} />
      </div>

      <ExplorePedestal onClick={p.onExplore} className="mt-4" />
    </div>
  )
}
