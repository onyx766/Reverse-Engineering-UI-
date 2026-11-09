import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { isFocusVisible, isMouse, useDismiss } from './dom'

export type CfgKind = 'neutral' | 'decision' | 'good' | 'bad'

export interface CfgBlock {
  id: string
  label: string
  /** start address, printed above the label */
  addr?: string
  x: number
  y: number
  w: number
  h: number
  kind: CfgKind
  /** the block's instructions, listed in its hover card */
  insns?: string[]
}

export interface CfgEdge {
  from: string
  to: string
  /** SVG path in viewBox units */
  d: string
  /** part of the executed path: packets travel these edges in order */
  hot?: boolean
}

interface Props {
  blocks?: CfgBlock[]
  edges?: CfgEdge[]
  /** [width, height] of the viewBox; derived from the blocks when omitted */
  viewBox?: [number, number]
  /** block to emphasise from outside, e.g. the listing row under the cursor */
  active?: string | null
  /** reports the block the user is hovering, focusing or has pinned */
  onActiveChange?: (id: string | null) => void
  /** colour key under the graph */
  legend?: boolean
  className?: string
}

const DEFAULT_BLOCKS: CfgBlock[] = [
  { id: 'start', label: 'start', x: 90, y: 14, w: 64, h: 22, kind: 'neutral' },
  { id: 'init', label: 'init', x: 90, y: 60, w: 64, h: 22, kind: 'neutral' },
  { id: 'check', label: 'check', x: 90, y: 106, w: 64, h: 22, kind: 'decision' },
  { id: 'fail', label: 'fail', x: 22, y: 160, w: 58, h: 22, kind: 'bad' },
  { id: 'ok', label: 'success', x: 150, y: 160, w: 68, h: 22, kind: 'good' },
]

const DEFAULT_EDGES: CfgEdge[] = [
  { from: 'start', to: 'init', d: 'M122 36 L122 60', hot: true },
  { from: 'init', to: 'check', d: 'M122 82 L122 106', hot: true },
  { from: 'check', to: 'fail', d: 'M106 128 C 80 142, 70 146, 51 160' },
  { from: 'check', to: 'ok', d: 'M138 128 C 162 142, 170 146, 184 160', hot: true },
]

const FILL: Record<CfgKind, string> = {
  neutral: 'rgb(var(--accent) / 0.14)',
  decision: 'rgb(var(--accent-2) / 0.16)',
  good: 'rgb(16 185 129 / 0.2)',
  bad: 'rgb(244 63 94 / 0.2)',
}

const STROKE: Record<CfgKind, string> = {
  neutral: 'rgb(var(--accent) / 0.7)',
  decision: 'rgb(var(--accent-2) / 0.8)',
  good: 'rgb(16 185 129 / 0.9)',
  bad: 'rgb(244 63 94 / 0.9)',
}

type Tone = 'flow' | 'good' | 'bad'
const EDGE_RGB: Record<Tone, string> = { flow: 'var(--accent)', good: '16 185 129', bad: '244 63 94' }
const edgeColor = (t: Tone, a: number) => `rgb(${EDGE_RGB[t]} / ${a})`
const toneOf = (k?: CfgKind): Tone => (k === 'good' ? 'good' : k === 'bad' ? 'bad' : 'flow')

const SEG = 0.7

/**
 * Control-flow graph that draws itself in and runs a packet along the
 * executed path. Hovering, focusing or tapping a block lights its incoming
 * and outgoing edges and lists the block's instructions.
 */
export function CfgGraph({
  blocks = DEFAULT_BLOCKS,
  edges = DEFAULT_EDGES,
  viewBox,
  active = null,
  onActiveChange,
  legend = false,
  className,
}: Props) {
  const reduced = useReducedMotion()
  const uid = `cfg${useId().replace(/:/g, '')}`
  const tipId = `${uid}-tip`
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const nodeRefs = useRef<(SVGGElement | null)[]>([])
  const inView = useInView(wrapRef, { margin: '-40px' })
  const [hover, setHover] = useState<string | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  // roving tabindex: the graph is one Tab stop, arrow keys move between blocks
  const [roving, setRoving] = useState(0)
  const [wrapW, setWrapW] = useState(0)
  const local = hover ?? focus ?? pinned
  const current = local ?? active

  const [vbW, vbH] = viewBox ?? [
    Math.max(...blocks.map((b) => b.x + b.w)) + 12,
    Math.max(...blocks.map((b) => b.y + b.h)) + 12,
  ]
  const byId = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks])
  const hot = useMemo(() => edges.filter((e) => e.hot), [edges])
  const cycle = hot.length * SEG + 1.1

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWrapW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (inView) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [inView])

  useEffect(() => {
    if (!inView) setPinned(null)
  }, [inView])

  useDismiss(wrapRef, pinned !== null, () => setPinned(null))

  const report = useRef(onActiveChange)
  report.current = onActiveChange
  useEffect(() => {
    report.current?.(local)
  }, [local])

  const onNodeKey = (e: KeyboardEvent<SVGGElement>, i: number, id: string) => {
    const n = blocks.length
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setPinned((p) => (p === id ? null : id))
    } else if (e.key === 'Escape') {
      setPinned(null)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      nodeRefs.current[(i + 1) % n]?.focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      nodeRefs.current[(i - 1 + n) % n]?.focus()
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      nodeRefs.current[e.key === 'Home' ? 0 : n - 1]?.focus()
    }
  }

  const tipBlock = local ? byId.get(local) : undefined
  let tip: { left: number; top: number; width: number; above: boolean } | null = null
  if (tipBlock && wrapW > 0) {
    const scale = wrapW / vbW
    const width = Math.min(240, wrapW)
    const above = tipBlock.y + tipBlock.h / 2 > vbH * 0.55
    const cx = (tipBlock.x + tipBlock.w / 2) * scale
    tip = {
      width,
      above,
      left: Math.max(0, Math.min(cx - width / 2, wrapW - width)),
      top: above ? tipBlock.y * scale - 6 : (tipBlock.y + tipBlock.h) * scale + 6,
    }
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="block h-auto w-full overflow-visible"
        role="group"
        aria-label="Control-flow graph. Arrow keys move between blocks, Enter pins one."
      >
        <defs>
          {(['flow', 'good', 'bad'] as const).map((t) => (
            <marker
              key={t}
              id={`${uid}-${t}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0 L8 4 L0 8 z" fill={edgeColor(t, 0.9)} />
            </marker>
          ))}
        </defs>

        {edges.map((e, i) => {
          const t = toneOf(byId.get(e.to)?.kind)
          const linked = current !== null && (e.from === current || e.to === current)
          const dim = current !== null && !linked
          const k = hot.indexOf(e)
          return (
            <g
              key={`${e.from}-${e.to}`}
              style={{
                opacity: dim ? 0.16 : 1,
                transition: 'opacity .3s',
                filter: linked ? `drop-shadow(0 0 3px ${edgeColor(t, 0.8)})` : undefined,
              }}
            >
              <motion.path
                d={e.d}
                fill="none"
                stroke={edgeColor(t, linked ? 1 : t === 'flow' ? 0.5 : 0.6)}
                strokeWidth={linked ? 2 : 1.25}
                markerEnd={`url(#${uid}-${t})`}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                style={{ transition: 'stroke-width .25s' }}
              />
              {!reduced && k >= 0 && <Packet d={e.d} k={k} cycle={cycle} />}
            </g>
          )
        })}

        {blocks.map((b, i) => {
          const isCur = current === b.id
          const near =
            current !== null &&
            edges.some(
              (e) => (e.from === current && e.to === b.id) || (e.to === current && e.from === b.id),
            )
          const dim = current !== null && !isCur && !near
          const count = b.insns?.length ?? 0
          return (
            <motion.g
              key={b.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${b.x + b.w / 2}px ${b.y + b.h / 2}px` }}
            >
              <g
                ref={(el) => {
                  nodeRefs.current[i] = el
                }}
                role="button"
                tabIndex={i === roving ? 0 : -1}
                aria-label={`Block ${b.addr ?? b.id}: ${b.label}${count ? `, ${count} instructions` : ''}`}
                aria-pressed={pinned === b.id}
                aria-describedby={local === b.id ? tipId : undefined}
                onPointerEnter={(e) => isMouse(e) && setHover(b.id)}
                onPointerLeave={() => setHover(null)}
                onFocus={(e) => {
                  setRoving(i)
                  if (isFocusVisible(e.currentTarget)) setFocus(b.id)
                }}
                onBlur={() => setFocus(null)}
                onClick={() => setPinned((p) => (p === b.id ? null : b.id))}
                onKeyDown={(e) => onNodeKey(e, i, b.id)}
                className="cursor-pointer outline-none [&:focus-visible_.cfg-ring]:opacity-100"
                style={{ opacity: dim ? 0.4 : 1, transition: 'opacity .3s' }}
              >
                <rect
                  className="cfg-ring opacity-0 transition-opacity duration-200"
                  x={b.x - 3.5}
                  y={b.y - 3.5}
                  width={b.w + 7}
                  height={b.h + 7}
                  rx="7"
                  fill="none"
                  stroke="rgb(var(--accent-3))"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="5"
                  fill={FILL[b.kind]}
                  stroke={STROKE[b.kind]}
                  strokeWidth={isCur ? 2 : 1.1}
                  style={{
                    transition: 'stroke-width .25s',
                    filter: isCur ? `drop-shadow(0 0 5px ${STROKE[b.kind]})` : undefined,
                  }}
                />
                {b.addr ? (
                  <>
                    <text
                      x={b.x + 7}
                      y={b.y + 12}
                      className="fill-muted font-mono"
                      style={{ fontSize: 8 }}
                    >
                      {b.addr}
                    </text>
                    <text
                      x={b.x + 7}
                      y={b.y + b.h - 7.5}
                      className="fill-ink font-mono"
                      style={{ fontSize: 9.5 }}
                    >
                      {b.label}
                    </text>
                  </>
                ) : (
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2 + 3.4}
                    textAnchor="middle"
                    className="fill-ink font-mono"
                    style={{ fontSize: 9.5 }}
                  >
                    {b.label}
                  </text>
                )}
              </g>
            </motion.g>
          )
        })}
      </svg>

      {tipBlock && tip && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: tip.left,
            top: tip.top,
            width: tip.width,
            transform: tip.above ? 'translateY(-100%)' : undefined,
          }}
        >
          <motion.div
            key={tipBlock.id}
            id={tipId}
            role="tooltip"
            initial={{ opacity: 0, y: tip.above ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-lg border border-accent/40 bg-deep/95 p-2.5 font-mono text-[10px] leading-[1.6] shadow-glow-sm"
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em]">
              <span className="truncate text-[10px] normal-case tracking-normal text-accent">
                {tipBlock.addr ? `loc_${tipBlock.addr}` : tipBlock.label}
              </span>
              <span className="shrink-0 text-muted">
                {tipBlock.insns?.length ?? 0} insn
              </span>
            </div>
            {tipBlock.insns?.length ? (
              tipBlock.insns.map((line, k) => {
                const [mn, ...rest] = line.trim().split(/\s+/)
                return (
                  <div key={k} className="truncate whitespace-pre text-ink/90">
                    <span className="inline-block w-[5ch] font-semibold text-accent2">{mn}</span>
                    {rest.join(' ')}
                  </div>
                )
              })
            ) : (
              <div className="text-ink/90">{tipBlock.label}</div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-x-3 border-t border-accent/15 pt-1 text-[9px] text-muted">
              <span>
                in ←{' '}
                {edges
                  .filter((e) => e.to === tipBlock.id)
                  .map((e) => byId.get(e.from)?.addr ?? e.from)
                  .join(' · ') || 'entry'}
              </span>
              <span>
                out →{' '}
                {edges
                  .filter((e) => e.from === tipBlock.id)
                  .map((e) => byId.get(e.to)?.addr ?? e.to)
                  .join(' · ') || 'ret'}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {legend && (
        <div
          aria-hidden
          className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-4 bg-accent" />
            flow
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-4 bg-rose-400" />
            to error path
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-4 bg-emerald-400" />
            to success
          </span>
        </div>
      )}
    </div>
  )
}

/** One packet per executed edge, staggered inside a shared SMIL cycle so they read as a single trace. */
function Packet({ d, k, cycle }: { d: string; k: number; cycle: number }) {
  const a = (k * SEG) / cycle
  const b = ((k + 1) * SEG) / cycle
  const f = (n: number) => n.toFixed(4)
  return (
    <circle r="2.6" fill="rgb(var(--accent-3))" opacity="0">
      <animateMotion
        dur={`${cycle}s`}
        repeatCount="indefinite"
        path={d}
        keyPoints="0;0;1;1"
        keyTimes={`0;${f(a)};${f(b)};1`}
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        dur={`${cycle}s`}
        repeatCount="indefinite"
        values="0;0;1;1;0;0"
        keyTimes={`0;${f(a)};${f(a + 0.01)};${f(b - 0.01)};${f(b)};1`}
      />
    </circle>
  )
}
