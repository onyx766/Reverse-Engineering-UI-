import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useInView } from 'framer-motion'
import { CircleCheck, Server } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { LAB_CHECKS, LAB_NODES, LAB_STATUS_LABEL, type LabNode, type LabNodeId, type LabStatus } from '@/data/tools'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { EASE } from './meta'
import { useElementWidth, useRoving } from './hooks'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface Layout {
  view: [number, number]
  bus: 'v' | 'h'
  nodes: Record<LabNodeId, Box>
  links: { a: LabNodeId; b: LabNodeId; d: string; drop?: [number, number] }[]
  packets: { d: string; dur: number; begin: number; drop?: boolean }[]
}

const WIDE: Layout = {
  view: [640, 324],
  bus: 'v',
  nodes: {
    host: { x: 12, y: 126, w: 134, h: 56 },
    notes: { x: 12, y: 252, w: 134, h: 56 },
    bus: { x: 188, y: 22, w: 18, h: 288 },
    win11: { x: 248, y: 18, w: 160, h: 56 },
    remnux: { x: 248, y: 98, w: 160, h: 56 },
    ubuntu: { x: 248, y: 178, w: 160, h: 56 },
    mitm: { x: 248, y: 258, w: 160, h: 56 },
    bench: { x: 468, y: 178, w: 160, h: 56 },
    wan: { x: 468, y: 258, w: 160, h: 56 },
  },
  links: [
    { a: 'host', b: 'bus', d: 'M146 154H188' },
    { a: 'host', b: 'notes', d: 'M79 182V252' },
    { a: 'bus', b: 'win11', d: 'M206 46H248' },
    { a: 'bus', b: 'remnux', d: 'M206 126H248' },
    { a: 'bus', b: 'ubuntu', d: 'M206 206H248' },
    { a: 'bus', b: 'mitm', d: 'M206 286H248' },
    { a: 'ubuntu', b: 'bench', d: 'M408 206H468' },
    { a: 'mitm', b: 'wan', d: 'M408 286H468', drop: [440, 286] },
  ],
  packets: [
    { d: 'M248 46H197V126H248', dur: 2.8, begin: 0 },
    { d: 'M248 46H197V286H248', dur: 3.4, begin: 1.3 },
    { d: 'M408 286H436', dur: 1.8, begin: 2.4, drop: true },
    { d: 'M468 206H408', dur: 1.5, begin: 0.4 },
    { d: 'M408 206H468', dur: 1.5, begin: 1.2 },
    { d: 'M79 182V252', dur: 2, begin: 0.8 },
    { d: 'M146 154H197V206H248', dur: 2.6, begin: 1.9 },
  ],
}

const TALL: Layout = {
  view: [340, 388],
  bus: 'h',
  nodes: {
    host: { x: 8, y: 8, w: 152, h: 52 },
    notes: { x: 180, y: 8, w: 152, h: 52 },
    bus: { x: 8, y: 90, w: 324, h: 16 },
    win11: { x: 8, y: 134, w: 152, h: 52 },
    remnux: { x: 180, y: 134, w: 152, h: 52 },
    ubuntu: { x: 8, y: 220, w: 152, h: 52 },
    mitm: { x: 180, y: 220, w: 152, h: 52 },
    bench: { x: 8, y: 328, w: 152, h: 52 },
    wan: { x: 180, y: 328, w: 152, h: 52 },
  },
  links: [
    { a: 'host', b: 'bus', d: 'M84 60V90' },
    { a: 'host', b: 'notes', d: 'M160 34H180' },
    { a: 'bus', b: 'win11', d: 'M84 106V134' },
    { a: 'bus', b: 'remnux', d: 'M256 106V134' },
    { a: 'bus', b: 'ubuntu', d: 'M170 106V246H160' },
    { a: 'bus', b: 'mitm', d: 'M170 106V246H180' },
    { a: 'ubuntu', b: 'bench', d: 'M84 272V328' },
    { a: 'mitm', b: 'wan', d: 'M256 272V328', drop: [256, 302] },
  ],
  packets: [
    { d: 'M84 134V98H256V134', dur: 2.8, begin: 0 },
    { d: 'M84 134V98H170V246H180', dur: 3.4, begin: 1.3 },
    { d: 'M256 272V298', dur: 1.8, begin: 2.4, drop: true },
    { d: 'M84 328V272', dur: 1.5, begin: 0.4 },
    { d: 'M84 272V328', dur: 1.5, begin: 1.2 },
    { d: 'M160 34H180', dur: 2, begin: 0.8 },
    { d: 'M84 60V98H170V246H160', dur: 2.6, begin: 1.9 },
  ],
}

/** fixed semantic hues for ok / warning / blocked; theme tokens for the rest */
const STATUS_RGB: Record<LabStatus, string> = {
  online: '52 211 153',
  snapshot: 'var(--accent-2)',
  standby: '251 191 36',
  isolated: 'var(--accent-3)',
  blocked: '251 113 133',
}
const statusColor = (s: LabStatus, alpha = 1) => `rgb(${STATUS_RGB[s]} / ${alpha})`
const STATUSES = Object.keys(STATUS_RGB) as LabStatus[]

/**
 * The analysis lab as a live network diagram: packets move along the links,
 * egress dies at the gateway, and hovering or focusing a node (arrow keys
 * move between nodes) opens its spec sheet alongside the containment checks.
 */
export function LabTopology() {
  const reduced = useReducedMotion()
  const [wrapRef, width] = useElementWidth<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const inView = useInView(wrapRef, { margin: '-40px' })
  const layout = width > 0 && width < 520 ? TALL : WIDE

  const [user, setUser] = useState<number | null>(null)
  const [auto, setAuto] = useState(0)
  const roving = useRoving(LAB_NODES.length, (i) => setUser(i))
  const active = user ?? auto
  const activeNode = LAB_NODES[active]

  useEffect(() => {
    if (!inView || reduced || user !== null) return
    const t = setInterval(() => setAuto((a) => (a + 1) % LAB_NODES.length), 3200)
    return () => clearInterval(t)
  }, [inView, reduced, user])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || reduced) return
    if (inView) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [inView, reduced, layout])

  const release = (i: number) => {
    setAuto(i)
    setUser(null)
  }

  const [vw, vh] = layout.view
  const linked = (l: { a: LabNodeId; b: LabNodeId }) => l.a === activeNode.id || l.b === activeNode.id

  return (
    <HoloPanel title="Analysis Lab" icon={Server} badge="isolated" from="bottom" delay={0.05} tilt={2.5}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
        <div ref={wrapRef} className={cn('relative min-w-0', !inView && '[&_*]:![animation-play-state:paused]')}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${vw} ${vh}`}
            className="h-auto w-full overflow-visible"
            role="group"
            aria-label="Lab topology. Arrow keys move between machines."
          >
            <defs>
              <pattern id="lab-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.9" fill="rgb(var(--accent) / 0.22)" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={vw} height={vh} rx="12" fill="url(#lab-dots)" opacity="0.7" />

            {layout.links.map((l) => {
              const on = linked(l)
              return (
                <g key={`${l.a}-${l.b}`}>
                  <path
                    d={l.d}
                    fill="none"
                    stroke={on ? 'rgb(var(--accent) / 0.95)' : 'rgb(var(--accent) / 0.32)'}
                    strokeWidth={on ? 1.8 : 1.2}
                    strokeDasharray={l.drop ? '5 4' : undefined}
                    className="transition-[stroke] duration-300"
                  />
                  {l.drop && (
                    <g transform={`translate(${l.drop[0]} ${l.drop[1]})`}>
                      <circle r="8" fill="rgb(var(--deep))" stroke="rgb(251 113 133 / 0.9)" strokeWidth="1.2" />
                      <path d="M-3.2 -3.2L3.2 3.2M3.2 -3.2L-3.2 3.2" stroke="rgb(251 113 133)" strokeWidth="1.6" strokeLinecap="round" />
                      <text
                        y={layout.bus === 'v' ? -13 : 3.5}
                        x={layout.bus === 'v' ? 0 : 13}
                        textAnchor={layout.bus === 'v' ? 'middle' : 'start'}
                        className="font-mono"
                        style={{ fontSize: 8, letterSpacing: '0.14em', fill: 'rgb(251 113 133)' }}
                      >
                        DROP
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {!reduced &&
              layout.packets.map((p, i) => (
                <circle
                  key={`${layout.bus}-${i}`}
                  r={p.drop ? 2.6 : 2.8}
                  opacity="0"
                  fill={p.drop ? 'rgb(251 113 133)' : 'rgb(var(--accent-3))'}
                >
                  <animateMotion
                    dur={`${p.dur}s`}
                    begin={`${p.begin}s`}
                    repeatCount="indefinite"
                    path={p.d}
                    keyPoints="0;1;1"
                    keyTimes="0;0.72;1"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0;0"
                    keyTimes="0;0.08;0.64;0.72;1"
                    dur={`${p.dur}s`}
                    begin={`${p.begin}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}

            {LAB_NODES.map((node, i) => {
              const box = layout.nodes[node.id]
              const on = i === active
              const props = roving.itemProps(i)
              const onKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setUser(i)
                  return
                }
                props.onKeyDown(e)
              }
              return (
                <g
                  key={node.id}
                  ref={props.ref}
                  tabIndex={props.tabIndex}
                  role="button"
                  aria-label={`${node.label}, ${node.role}, ${LAB_STATUS_LABEL[node.status]}`}
                  onKeyDown={onKeyDown}
                  onFocus={() => {
                    roving.setIndex(i)
                    setUser(i)
                  }}
                  onBlur={() => release(i)}
                  onMouseEnter={() => setUser(i)}
                  onMouseLeave={() => release(i)}
                  onClick={() => setUser(i)}
                  className="group/node cursor-pointer outline-none"
                  transform={`translate(${box.x} ${box.y})`}
                >
                  {node.id === 'bus' ? (
                    <BusShape box={box} vertical={layout.bus === 'v'} on={on} />
                  ) : (
                    <NodeShape node={node} box={box} on={on} reduced={reduced} />
                  )}
                  <rect
                    x={-5}
                    y={-5}
                    width={box.w + 10}
                    height={box.h + 10}
                    rx={node.id === 'bus' ? 8 : 13}
                    fill="none"
                    stroke="rgb(var(--accent))"
                    strokeWidth="1.4"
                    strokeDasharray="4 3"
                    className="opacity-0 transition-opacity duration-200 group-focus-visible/node:opacity-100"
                  />
                </g>
              )
            })}
          </svg>

          <ul
            aria-label="Status legend"
            className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted"
          >
            {STATUSES.map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5">
                <Led status={s} />
                {LAB_STATUS_LABEL[s]}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <NodeReadout node={activeNode} index={active} />
          <Containment />
        </div>
      </div>
    </HoloPanel>
  )
}

function Led({ status, size = 'sm' }: { status: LabStatus; size?: 'sm' | 'md' }) {
  const hollow = status === 'isolated'
  return (
    <span
      aria-hidden
      className={cn('shrink-0 rounded-full', size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5', hollow && 'border-2')}
      style={{
        background: hollow ? 'transparent' : statusColor(status),
        borderColor: hollow ? statusColor(status) : undefined,
        boxShadow: `0 0 9px ${statusColor(status, 0.75)}`,
      }}
    />
  )
}

function NodeShape({ node, box, on, reduced }: { node: LabNode; box: Box; on: boolean; reduced: boolean }) {
  const color = statusColor(node.status)
  return (
    <>
      <rect
        x={-3}
        y={-3}
        width={box.w + 6}
        height={box.h + 6}
        rx={12}
        fill="none"
        stroke="rgb(var(--accent) / 0.28)"
        strokeWidth="6"
        className={cn('transition-opacity duration-300', on ? 'opacity-100' : 'opacity-0')}
      />
      <rect
        width={box.w}
        height={box.h}
        rx={9}
        fill={on ? 'rgb(var(--surface) / 0.98)' : 'rgb(var(--surface) / 0.88)'}
        stroke={on ? 'rgb(var(--accent))' : 'rgb(var(--accent) / 0.38)'}
        strokeWidth={on ? 1.5 : 1}
        className="transition-[stroke] duration-300 group-hover/node:stroke-[rgb(var(--accent))]"
      />
      <rect x={0} y={12} width={3} height={box.h - 24} rx={1.5} fill={color} />
      <text x={14} y={22} className="fill-ink font-mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em' }}>
        {node.label}
      </text>
      <text x={14} y={39} className="fill-muted" style={{ fontSize: 10.5, fontWeight: 500 }}>
        {node.role}
      </text>
      <circle cx={box.w - 13} cy={14} r={3.4} fill={color} />
      {!reduced && node.status !== 'blocked' && (
        <circle cx={box.w - 13} cy={14} r={3.4} fill="none" stroke={color} strokeWidth="1">
          <animate attributeName="r" values="3.4;9" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
      )}
    </>
  )
}

function BusShape({ box, vertical, on }: { box: Box; vertical: boolean; on: boolean }) {
  return (
    <>
      <rect
        width={box.w}
        height={box.h}
        rx={vertical ? 9 : 8}
        fill={on ? 'rgb(var(--accent) / 0.3)' : 'rgb(var(--accent) / 0.14)'}
        stroke={on ? 'rgb(var(--accent))' : 'rgb(var(--accent) / 0.5)'}
        strokeWidth={on ? 1.5 : 1}
        className="transition-[fill,stroke] duration-300"
      />
      <text
        transform={vertical ? `translate(${box.w / 2 + 3.4} ${box.h / 2}) rotate(-90)` : `translate(${box.w / 2} ${box.h / 2 + 3.4})`}
        textAnchor="middle"
        className="fill-ink font-mono"
        style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em' }}
      >
        VMBR1 · HOST-ONLY · 10.13.37.0/24
      </text>
    </>
  )
}

function NodeReadout({ node, index }: { node: LabNode; index: number }) {
  const color = statusColor(node.status)
  return (
    <div className="relative min-h-[11.5rem] overflow-hidden rounded-xl border border-accent/25 bg-accent/[0.05] p-4" aria-live="polite">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <div className="flex items-center gap-2">
          <Led status={node.status} size="md" />
          <span className="truncate font-mono text-[12.5px] font-bold tracking-[0.08em] text-ink">{node.label}</span>
          <span
            className="ml-auto shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
            style={{ color, borderColor: statusColor(node.status, 0.45), background: statusColor(node.status, 0.1) }}
          >
            {LAB_STATUS_LABEL[node.status]}
          </span>
        </div>
        <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
          node {String(index + 1).padStart(2, '0')} · {node.role}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {node.specs.map((s) => (
            <li key={s} className="flex gap-2 text-[13.5px] leading-snug text-ink/85">
              <span aria-hidden className="mt-[2px] font-mono text-[10px] text-accent">▸</span>
              {s}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}

function Containment() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const shown = useInView(ref, { once: true, margin: '-30px' }) || reduced
  return (
    <div ref={ref} className="rounded-xl border border-accent/25 bg-deep/40 p-4">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="text-ink">Containment</span>
        <span className="text-accent">
          {LAB_CHECKS.length}/{LAB_CHECKS.length} · 100%
        </span>
      </div>
      <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-accent/10">
        <motion.span
          className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-accent to-accent2 shadow-glow-sm"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: shown ? 1 : 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: EASE }}
        />
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {LAB_CHECKS.map((c, i) => (
          <motion.li
            key={c.label}
            initial={reduced ? false : { opacity: 0, x: -10 }}
            animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{ duration: 0.4, delay: 0.35 + i * 0.12, ease: EASE }}
            className="flex items-center gap-2.5"
          >
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: shown ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.5 + i * 0.12 }}
              className="shrink-0"
            >
              <CircleCheck className="h-4 w-4 text-accent" aria-hidden />
            </motion.span>
            <span className="text-[14px] font-semibold text-ink/90">{c.label}</span>
            <span className="ml-auto hidden truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted sm:inline">
              {c.detail}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
