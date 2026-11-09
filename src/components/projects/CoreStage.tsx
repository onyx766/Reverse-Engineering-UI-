import { Suspense, lazy, startTransition, useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { ShardId } from '@/data/projects'
import { CfgBody, DisasmBody, HexBody, HttpBody, ShardFrame, WaveBody } from './shards'

const HoloCore = lazy(() =>
  import('@/components/three/HoloCore').then((m) => ({ default: m.HoloCore })),
)

const EASE = [0.22, 1, 0.36, 1] as const

interface ShardSpot {
  id: ShardId
  left: number
  top: number
  width: number
  turn: number
  bob: { dur: number; delay: number }
}

interface Trace {
  id: string
  /** shard this trace feeds; decorative traces have none */
  shard?: ShardId
  d: string
  nodes: { x: number; y: number; tone?: 'rose' | 'end' }[]
}

interface StageDesign {
  w: number
  h: number
  /** hologram centre in design units */
  cx: number
  cy: number
  /** hologram canvas edge as a share of the space between the side panels, clamped in px */
  core: { share: number; min: number; max: number }
  /** shards clip long lines with a fade (narrow composition) */
  clip?: boolean
  shards: ShardSpot[]
  traces: Trace[]
}

/** Full composition (≥1280px), in design pixels — scaled as one unit. */
const FULL: StageDesign = {
  w: 880,
  h: 440,
  cx: 440,
  cy: 214,
  core: { share: 0.78, min: 420, max: 640 },
  shards: [
    { id: 'disasm', left: 0, top: 26, width: 258, turn: 14, bob: { dur: 7.5, delay: -1 } },
    { id: 'hex', left: 2, top: 250, width: 290, turn: 14, bob: { dur: 8.5, delay: -4 } },
    { id: 'cfg', left: 650, top: 0, width: 212, turn: -14, bob: { dur: 8, delay: -2.5 } },
    { id: 'http', left: 636, top: 150, width: 244, turn: -14, bob: { dur: 7, delay: -5 } },
    { id: 'wave', left: 646, top: 322, width: 234, turn: -14, bob: { dur: 9, delay: -3 } },
  ],
  traces: [
    { id: 't-disasm', shard: 'disasm', d: 'M258 118 H298 L328 148 H352', nodes: [{ x: 298, y: 118 }, { x: 352, y: 148, tone: 'end' }] },
    { id: 't-hex', shard: 'hex', d: 'M292 300 H310 L338 272 H358', nodes: [{ x: 310, y: 300 }, { x: 358, y: 272, tone: 'end' }] },
    { id: 't-cfg', shard: 'cfg', d: 'M650 78 H612 L578 112 H530', nodes: [{ x: 612, y: 78 }, { x: 530, y: 112, tone: 'end' }] },
    { id: 't-http', shard: 'http', d: 'M636 224 H602 L584 206 H532', nodes: [{ x: 602, y: 224 }, { x: 532, y: 206, tone: 'end' }] },
    { id: 't-wave', shard: 'wave', d: 'M646 358 H610 L572 320 H530', nodes: [{ x: 610, y: 358 }, { x: 530, y: 320, tone: 'end' }] },
    { id: 'd-top-r', d: 'M462 92 V46 L492 16 H566', nodes: [{ x: 462, y: 46 }, { x: 566, y: 16, tone: 'rose' }] },
    { id: 'd-top-l', d: 'M416 92 V58 L386 28 H316', nodes: [{ x: 386, y: 28 }, { x: 316, y: 28, tone: 'rose' }] },
    { id: 'd-left', d: 'M0 112 H-34 V176', nodes: [{ x: -34, y: 176 }] },
    { id: 'd-right', d: 'M880 238 H912 V290', nodes: [{ x: 912, y: 290, tone: 'rose' }] },
    { id: 'd-bl', d: 'M150 236 V214 L176 188', nodes: [{ x: 176, y: 188 }] },
    { id: 'd-low', d: 'M352 336 L322 366 H286', nodes: [{ x: 286, y: 366, tone: 'rose' }] },
  ],
}

/**
 * Narrow desktop (1024–1243px): three shards hug a smaller hologram so the
 * readouts stay legible (≈9–11px) instead of shrinking with the full layout.
 */
const COMPACT: StageDesign = {
  w: 540,
  h: 392,
  cx: 270,
  cy: 192,
  core: { share: 0.76, min: 320, max: 470 },
  clip: true,
  shards: [
    { id: 'disasm', left: 0, top: 26, width: 212, turn: 14, bob: { dur: 7.5, delay: -1 } },
    { id: 'http', left: 328, top: 10, width: 212, turn: -14, bob: { dur: 7, delay: -5 } },
    { id: 'wave', left: 318, top: 214, width: 222, turn: -14, bob: { dur: 9, delay: -3 } },
  ],
  traces: [
    { id: 't-disasm', shard: 'disasm', d: 'M212 118 H226 L244 136 H256', nodes: [{ x: 226, y: 118 }, { x: 256, y: 136, tone: 'end' }] },
    { id: 't-http', shard: 'http', d: 'M328 92 H314 L296 110 H286', nodes: [{ x: 314, y: 92 }, { x: 286, y: 110, tone: 'end' }] },
    { id: 't-wave', shard: 'wave', d: 'M318 252 H302 L284 234 H276', nodes: [{ x: 302, y: 252 }, { x: 276, y: 234, tone: 'end' }] },
    { id: 'd-top-r', d: 'M284 78 V48 L300 32', nodes: [{ x: 300, y: 32, tone: 'rose' }] },
    { id: 'd-top-l', d: 'M256 78 V42 L238 24 H222', nodes: [{ x: 222, y: 24, tone: 'rose' }] },
    { id: 'd-low', d: 'M40 214 V250 L64 274 H112', nodes: [{ x: 40, y: 214 }, { x: 112, y: 274, tone: 'rose' }] },
  ],
}

interface StageProps {
  hot: ShardId[]
  /** stage visible and motion allowed */
  running: boolean
  /** stage visible (render loop of the hologram) */
  visible: boolean
}

function shardBody(id: ShardId, running: boolean, compact = false, clip = compact): ReactNode {
  switch (id) {
    case 'disasm':
      return <DisasmBody running={running} compact={compact} clip={clip} />
    case 'hex':
      return <HexBody running={running} compact={compact} />
    case 'cfg':
      return <CfgBody running={running} />
    case 'http':
      return <HttpBody running={running} compact={compact} clip={clip} />
    case 'wave':
      return <WaveBody compact={compact} />
  }
}

/**
 * The stage builds its own WebGL context. Creating it (and compiling its shaders)
 * waits until the section's enter animation has played and the main thread is
 * idle, so it never stacks onto the section-switch frame. HoloCore stays
 * invisible until warm and then fades in, so the wait does not show.
 */
function useCoreReady(delay = 450) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let idle = 0
    const go = () => startTransition(() => setReady(true))
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(go, { timeout: 700 })
      else go()
    }, delay)
    return () => {
      clearTimeout(timer)
      if (idle) window.cancelIdleCallback(idle)
    }
  }, [delay])
  return ready
}

function StageCore({ paused }: { paused: boolean }) {
  const ready = useCoreReady()
  if (!ready) return <CoreFallback />
  return (
    <Suspense fallback={<CoreFallback />}>
      <HoloCore className="absolute inset-0" paused={paused} />
    </Suspense>
  )
}

function CoreFallback() {
  return (
    <div className="absolute inset-[22%] grid place-items-center">
      <span className="absolute inset-0 animate-pulse rounded-3xl border border-accent/30 bg-accent/5 blur-xl" />
      <span className="h-1/2 w-1/2 rotate-45 rounded-xl border border-accent/40" />
    </div>
  )
}

/**
 * Desktop hologram stage: the WebGL core with five data shards floating
 * around it, wired to it by animated circuit traces. `width` is the space
 * between the two side panels; the composition scales as one piece.
 */
export function DesktopStage({ hot, running, visible, width, compact }: StageProps & { width: number; compact: boolean }) {
  const design = compact ? COMPACT : FULL
  const k = Math.min(1.2, Math.max(0.62, width / design.w))
  const allHot = hot.length > 1
  // the hologram scales with the free space, so 1280 reads as a smaller 1440, not a crowded one
  const core = Math.round(Math.min(design.core.max, Math.max(design.core.min, width * design.core.share)))

  return (
    <div className="pointer-events-none relative w-full" style={{ height: design.h * k }}>
      <motion.div
        className="absolute left-1/2"
        style={{ width: core, height: core, top: design.cy * k + 20, x: '-50%', y: '-50%' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
      >
        <span
          aria-hidden
          className="absolute inset-[18%] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--accent) / 0.22), transparent 70%)' }}
        />
        <StageCore paused={!visible} />
      </motion.div>

      {/* shards + traces, laid out in design pixels */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0"
        style={{
          width: design.w,
          height: design.h,
          transform: `translateX(-50%) scale(${k})`,
          transformOrigin: 'top center',
          perspective: 1200,
        }}
      >
        <Traces design={design} hot={hot} running={running} />
        {design.shards.map((s, i) => {
          const isHot = hot.includes(s.id)
          return (
            <motion.div
              key={s.id}
              className="absolute"
              style={{ left: s.left, top: s.top, width: s.width }}
              initial={{ opacity: 0, x: s.turn > 0 ? -40 : 40, rotateY: s.turn > 0 ? 30 : -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.35 + i * 0.09, ease: EASE }}
            >
              <ShardFrame
                id={s.id}
                hot={isHot}
                dim={!isHot && !allHot}
                turn={s.turn}
                bob={running ? s.bob : undefined}
                clip={design.clip}
              >
                {shardBody(s.id, running, false, design.clip)}
              </ShardFrame>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

const TRACE_SVG = 'absolute inset-0 h-full w-full overflow-visible'

/**
 * Circuit traces in three stacked SVGs, so the glows are not re-filtered every frame:
 * rails (static) → everything that moves (flowing dashes, pulses, rings, rose beacons) on
 * its own compositor layer → the static glowing nodes on top. The moving layer is the
 * only one that repaints while idle, and it holds just the few glows that animate.
 */
function Traces({ design, hot, running }: { design: StageDesign; hot: ShardId[]; running: boolean }) {
  const viewBox = `0 0 ${design.w} ${design.h}`
  const traces = design.traces.map((t) => ({ ...t, isHot: !!t.shard && hot.includes(t.shard), deco: !t.shard }))
  return (
    <>
      <svg aria-hidden className={TRACE_SVG} viewBox={viewBox} fill="none">
        <defs>
          <filter id="pjTraceGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {traces.map((t, i) => (
          <motion.path
            key={t.id}
            d={t.d}
            stroke={t.isHot ? 'rgb(var(--accent) / 0.6)' : 'rgb(var(--accent) / 0.3)'}
            strokeWidth={t.isHot ? 2.4 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.5 + i * 0.06, ease: 'easeOut' }}
            style={{ transition: 'stroke 0.6s, stroke-width 0.6s' }}
          />
        ))}
      </svg>

      <svg aria-hidden className={TRACE_SVG} viewBox={viewBox} fill="none" style={{ willChange: 'transform' }}>
        {traces.map((t, i) => (
          <g key={t.id}>
            <motion.path
              d={t.d}
              stroke={t.isHot ? 'rgb(var(--accent-3))' : t.deco ? 'rgb(var(--accent) / 0.6)' : 'rgb(var(--accent-3) / 0.75)'}
              strokeWidth={t.isHot ? 2 : 1.3}
              strokeLinecap="round"
              strokeDasharray="6 10"
              filter={t.isHot ? 'url(#pjTraceGlow)' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 + i * 0.05 }}
              style={{ animation: `pj-dash ${t.isHot ? 0.9 : t.deco ? 3.2 : 2.2}s linear infinite` }}
            />
            {t.isHot && running && (
              <circle r="3.2" fill="rgb(var(--ink))" filter="url(#pjTraceGlow)">
                <animateMotion dur="1.4s" repeatCount="indefinite" path={t.d} keyPoints="0;1" keyTimes="0;1" />
              </circle>
            )}
            {t.nodes.map((n, k) =>
              n.tone === 'end' && t.isHot ? (
                <circle
                  key={k}
                  cx={n.x}
                  cy={n.y}
                  r="9"
                  fill="none"
                  stroke="rgb(var(--accent) / 0.7)"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'pj-ring 1.8s ease-out infinite' }}
                />
              ) : n.tone === 'rose' ? (
                <circle
                  key={k}
                  cx={n.x}
                  cy={n.y}
                  r="3.2"
                  fill="rgb(244 63 94)"
                  filter="url(#pjTraceGlow)"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `pj-node ${2.2 + k * 0.4}s ease-in-out infinite` }}
                />
              ) : null,
            )}
          </g>
        ))}
      </svg>

      <svg aria-hidden className={TRACE_SVG} viewBox={viewBox} fill="none">
        {traces.map((t) =>
          t.nodes.map((n, k) =>
            n.tone === 'rose' ? null : (
              <circle
                key={`${t.id}${k}`}
                cx={n.x}
                cy={n.y}
                r={n.tone === 'end' ? 3.6 : 2.4}
                fill={n.tone === 'end' ? 'rgb(var(--accent-3))' : 'rgb(var(--accent))'}
                filter="url(#pjTraceGlow)"
              />
            ),
          ),
        )}
      </svg>
    </>
  )
}

/** Phones / tablets: smaller hologram with a strip of shards across its base. */
export function CompactStage({ hot, running, visible }: StageProps) {
  const allHot = hot.length > 1
  const shard = (id: ShardId, className?: string) => {
    const isHot = hot.includes(id)
    return (
      <ShardFrame key={id} id={id} hot={isHot} dim={!isHot && !allHot} className={className} clip>
        {shardBody(id, running, true)}
      </ShardFrame>
    )
  }

  return (
    <div className="relative">
      <motion.div
        className="relative mx-auto aspect-square w-[min(420px,86vw)]"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: EASE }}
      >
        <span
          aria-hidden
          className="absolute inset-[18%] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--accent) / 0.22), transparent 70%)' }}
        />
        <StageCore paused={!visible} />
      </motion.div>

      <motion.div
        aria-hidden
        className="relative -mt-[22%] grid grid-cols-2 gap-2.5 sm:-mt-[14%] sm:grid-cols-3"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      >
        {shard('disasm')}
        {shard('http')}
        {shard('hex', 'hidden sm:block')}
        {shard('wave', 'col-span-2 sm:col-span-3')}
      </motion.div>
    </div>
  )
}
