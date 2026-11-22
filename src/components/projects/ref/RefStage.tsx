import { useState } from 'react'
import type { Project, ShardId } from '@/data/projects'
import { REF_H, REF_W, useRefScale, useViewportWidth } from '@/hooks/useRefScale'
import roomUrl from '@/assets/ref/room.webp'
import type { FilterId } from '../FilterPanel'
import { Carousel } from '../Carousel'
import { RefAnalysisPanel, RefFilterPanel } from './RefPanels'
import { RefExplore } from './RefExplore'
import { PlateFx } from './PlateFx'
import { PLATE } from './assets'

const CSS = `
@keyframes rf-in { from { opacity: 0; transform: translate3d(0, 14px, 0); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { [data-rf-in] { animation: none !important; } }
`

export interface RefStageProps {
  visible: Project[]
  focused: Project
  focusIndex: number
  shift: number | null
  filter: FilterId
  hot: ShardId[]
  running: boolean
  counts: Record<FilterId, number>
  onFilter: (f: FilterId) => void
  onStep: (delta: number) => void
  onOpen: (id: string) => void
  onExplore: () => void
}

const PLATE_MASK = 'linear-gradient(to bottom, black 92%, transparent)'
const PLATE_MASK_SIDES = `linear-gradient(to right, transparent, black 5%, black 95%, transparent), ${PLATE_MASK}`

/**
 * The Projects stage as the reference render: the render itself is the
 * backdrop (minus the parts that are live), and the interactive pieces sit on
 * it at the exact pixels they occupy there. Laid out in the render's own
 * 1672 × 941 space and scaled as one piece; wider screens continue into a
 * soft-focus copy of the room.
 */
export function RefStage(p: RefStageProps) {
  const s = useRefScale()
  const vw = useViewportWidth()
  const offset = (vw - REF_W * s) / 2
  const [ready, setReady] = useState(false)
  // past 16:9 the plate's side edges melt into the soft room behind it
  const sides = offset > 1
  const mask = sides ? PLATE_MASK_SIDES : PLATE_MASK

  return (
    <div
      className="relative overflow-hidden bg-[#04080b]"
      style={{ width: vw, height: REF_H * s, marginLeft: `calc(50% - ${vw / 2}px)` }}
    >
      <style>{CSS}</style>
      {sides && (
        <img
          aria-hidden
          alt=""
          src={roomUrl}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
          draggable={false}
        />
      )}
      <div
        className="absolute left-0 top-0"
        style={{ width: REF_W, height: REF_H, transformOrigin: '0 0', transform: `translate3d(${offset}px, 0, 0) scale(${s})` }}
      >
        <img
          aria-hidden
          alt=""
          src={PLATE}
          width={REF_W}
          height={REF_H}
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
          className="pointer-events-none absolute inset-0 h-full w-full select-none transition-opacity duration-700"
          style={{
            opacity: ready ? 1 : 0,
            maskImage: mask,
            WebkitMaskImage: mask,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
        <PlateFx live={p.running} hot={p.hot} />

        <div data-rf-in className="absolute left-0 top-0" style={{ animation: 'rf-in 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
          <RefFilterPanel value={p.filter} onChange={p.onFilter} counts={p.counts} />
        </div>
        <div data-rf-in className="absolute left-0 top-0" style={{ animation: 'rf-in 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both' }}>
          <RefAnalysisPanel project={p.focused} />
        </div>

        <RefExplore onClick={p.onExplore} />

        <div className="pointer-events-none absolute inset-0">
          <Carousel
            projects={p.visible}
            focusIndex={p.focusIndex}
            shift={p.shift}
            mode="ref"
            live={p.running}
            onStep={p.onStep}
            onOpen={p.onOpen}
            scale={s}
            className="pointer-events-none h-full"
          />
        </div>
      </div>
    </div>
  )
}
