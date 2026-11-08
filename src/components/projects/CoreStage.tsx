import { Suspense, lazy, type ReactNode } from 'react'
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
  shards: ShardSpot[]
  traces: Trace[]
}

/** Full composition (≥1280px), in design pixels — scaled as one unit. */
const FULL: StageDesign = {
  w: 880,
  h: 440,
  cx: 440,
  cy: 214,
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

/** Narrow desktop (1024–1279px): three shards, tighter arc. */
const COMPACT: StageDesign = {
  w: 660,
  h: 430,
  cx: 330,
  cy: 214,
  shards: [
    { id: 'disasm', left: 0, top: 36, width: 232, turn: 14, bob: { dur: 7.5, delay: -1 } },
    { id: 'http', left: 430, top: 60, width: 230, turn: -14, bob: { dur: 7, delay: -5 } },
    { id: 'wave', left: 440, top: 252, width: 220, turn: -14, bob: { dur: 9, delay: -3 } },
  ],
  traces: [
    { id: 't-disasm', shard: 'disasm', d: 'M232 120 H252 L274 142 H286', nodes: [{ x: 252, y: 120 }, { x: 286, y: 142, tone: 'end' }] },
    { id: 't-http', shard: 'http', d: 'M430 130 H410 L390 150 H376', nodes: [{ x: 410, y: 130 }, { x: 376, y: 150, tone: 'end' }] },
    { id: 't-wave', shard: 'wave', d: 'M440 290 H414 L392 268 H378', nodes: [{ x: 414, y: 290 }, { x: 378, y: 268, tone: 'end' }] },
    { id: 'd-top-r', d: 'M350 92 V52 L376 26 H430', nodes: [{ x: 430, y: 26, tone: 'rose' }] },
    { id: 'd-top-l', d: 'M310 92 V60 L284 34 H236', nodes: [{ x: 236, y: 34, tone: 'rose' }] },
  ],
}

interface StageProps {
  hot: ShardId[]
  /** stage visible and motion allowed */
  running: boolean
  /** stage visible (render loop of the hologram) */
  visible: boolean
}

function shardBody(id: ShardId, running: boolean, compact = false): ReactNode {
  switch (id) {
    case 'disasm':
      return <DisasmBody running={running} compact={compact} />
    case 'hex':
      return <HexBody running={running} compact={compact} />
    case 'cfg':
      return <CfgBody running={running} />
    case 'http':
      return <HttpBody running={running} compact={compact} />
    case 'wave':
      return <WaveBody compact={compact} />
  }
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
  const core = compact ? 'min(480px, 43vw)' : 'min(620px, 45vw)'

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
        <Suspense fallback={<CoreFallback />}>
          <HoloCore className="absolute inset-0" paused={!visible} />
        </Suspense>
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
              >
                {shardBody(s.id, running)}
              </ShardFrame>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function Traces({ design, hot, running }: { design: StageDesign; hot: ShardId[]; running: boolean }) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${design.w} ${design.h}`}
      fill="none"
    >
      <defs>
        <filter id="pjTraceGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {design.traces.map((t, i) => {
        const isHot = !!t.shard && hot.includes(t.shard)
        const deco = !t.shard
        return (
          <g key={t.id}>
            <motion.path
              d={t.d}
              stroke={isHot ? 'rgb(var(--accent) / 0.6)' : 'rgb(var(--accent) / 0.3)'}
              strokeWidth={isHot ? 2.4 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.06, ease: 'easeOut' }}
              style={{ transition: 'stroke 0.6s, stroke-width 0.6s' }}
            />
            <motion.path
              d={t.d}
              stroke={isHot ? 'rgb(var(--accent-3))' : deco ? 'rgb(var(--accent) / 0.6)' : 'rgb(var(--accent-3) / 0.75)'}
              strokeWidth={isHot ? 2 : 1.3}
              strokeLinecap="round"
              strokeDasharray="6 10"
              filter={isHot ? 'url(#pjTraceGlow)' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 + i * 0.05 }}
              style={{ animation: `pj-dash ${isHot ? 0.9 : deco ? 3.2 : 2.2}s linear infinite` }}
            />
            {isHot && running && (
              <circle r="3.2" fill="rgb(var(--ink))" filter="url(#pjTraceGlow)">
                <animateMotion dur="1.4s" repeatCount="indefinite" path={t.d} keyPoints="0;1" keyTimes="0;1" />
              </circle>
            )}
            {t.nodes.map((n, k) => (
              <g key={k}>
                {n.tone === 'end' && isHot && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="9"
                    fill="none"
                    stroke="rgb(var(--accent) / 0.7)"
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      animation: 'pj-ring 1.8s ease-out infinite',
                    }}
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.tone === 'end' ? 3.6 : n.tone === 'rose' ? 3.2 : 2.4}
                  fill={n.tone === 'rose' ? 'rgb(244 63 94)' : n.tone === 'end' ? 'rgb(var(--accent-3))' : 'rgb(var(--accent))'}
                  filter="url(#pjTraceGlow)"
                  style={
                    n.tone === 'rose'
                      ? { transformBox: 'fill-box', transformOrigin: 'center', animation: `pj-node ${2.2 + k * 0.4}s ease-in-out infinite` }
                      : undefined
                  }
                />
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/** Phones / tablets: smaller hologram with a strip of shards across its base. */
export function CompactStage({ hot, running, visible }: StageProps) {
  const allHot = hot.length > 1
  const shard = (id: ShardId, className?: string) => {
    const isHot = hot.includes(id)
    return (
      <ShardFrame key={id} id={id} hot={isHot} dim={!isHot && !allHot} className={className}>
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
        <Suspense fallback={<CoreFallback />}>
          <HoloCore className="absolute inset-0" paused={!visible} />
        </Suspense>
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
