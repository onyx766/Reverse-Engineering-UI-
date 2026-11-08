import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ProjectKind } from '@/data/projects'
import { cn } from '@/lib/utils'
import { svgId } from './hooks'

/* ------------------------------------------------------------------ *
 * Isometric helpers (x → right-down, y → left-down, z → up)           *
 * ------------------------------------------------------------------ */

type P3 = [number, number, number]
const C = 0.866
const EASE = [0.22, 1, 0.36, 1] as const

function iso([x, y, z]: P3, ox: number, oy: number): [number, number] {
  return [ox + (x - y) * C, oy + (x + y) * 0.5 - z]
}

function poly(points: P3[], ox: number, oy: number) {
  return points
    .map((p) => {
      const [a, b] = iso(p, ox, oy)
      return `${a.toFixed(1)},${b.toFixed(1)}`
    })
    .join(' ')
}

function boxFaces(x: number, y: number, z: number, a: number, b: number, h: number) {
  return {
    top: [
      [x, y, z + h],
      [x + a, y, z + h],
      [x + a, y + b, z + h],
      [x, y + b, z + h],
    ] as P3[],
    left: [
      [x, y + b, z],
      [x + a, y + b, z],
      [x + a, y + b, z + h],
      [x, y + b, z + h],
    ] as P3[],
    right: [
      [x + a, y, z],
      [x + a, y + b, z],
      [x + a, y + b, z + h],
      [x + a, y, z + h],
    ] as P3[],
  }
}

interface BoxProps {
  x: number
  y: number
  z: number
  a: number
  b?: number
  h: number
  ox: number
  oy: number
  /** face brightness multiplier */
  glow?: number
  topFill?: string
}

function IsoBox({ x, y, z, a, b = a, h, ox, oy, glow = 1, topFill }: BoxProps) {
  const f = boxFaces(x, y, z, a, b, h)
  return (
    <g strokeLinejoin="round">
      <polygon
        points={poly(f.left, ox, oy)}
        fill={`rgb(var(--accent) / ${(0.3 * glow).toFixed(2)})`}
        stroke="rgb(var(--accent-3) / 0.55)"
        strokeWidth="0.7"
      />
      <polygon
        points={poly(f.right, ox, oy)}
        fill={`rgb(var(--accent-2) / ${(0.16 * glow).toFixed(2)})`}
        stroke="rgb(var(--accent-3) / 0.45)"
        strokeWidth="0.7"
      />
      <polygon
        points={poly(f.top, ox, oy)}
        fill={topFill ?? `rgb(var(--accent-3) / ${(0.3 * glow).toFixed(2)})`}
        stroke="rgb(var(--accent-3) / 0.95)"
        strokeWidth="0.8"
      />
    </g>
  )
}

/** Shared <defs>: glow filter + floor gradient, ids unique per instance. */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}glow`} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id={`${id}floor`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.45" />
        <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}node`} cx="38%" cy="35%" r="65%">
        <stop offset="0%" stopColor="rgb(var(--ink))" />
        <stop offset="45%" stopColor="rgb(var(--accent-3))" />
        <stop offset="100%" stopColor="rgb(var(--accent))" />
      </radialGradient>
    </defs>
  )
}

function Floor({ id, cx, cy, rx, ry }: { id: string; cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}floor)`} />
}

/* ------------------------------------------------------------------ *
 * The six illustrations                                               *
 * ------------------------------------------------------------------ */

interface IlluProps {
  id: string
  hover: boolean
}

function ApiCubes({ id, hover }: IlluProps) {
  const ox = 100
  const oy = 60
  const s = 22
  const bottom: [number, number][] = [
    [0, 0],
    [26, 0],
    [0, 26],
    [26, 26],
  ]
  return (
    <>
      <Floor id={id} cx={100} cy={96} rx={64} ry={18} />
      {bottom.map(([x, y], i) => {
        // spread outward along the cube's own iso diagonal
        const sx = x === 0 ? -1 : 1
        const sy = y === 0 ? -1 : 1
        return (
          <motion.g
            key={i}
            animate={hover ? { x: (sx - sy) * 3 * C, y: (sx + sy) * 1.5 } : { x: 0, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <IsoBox x={x} y={y} z={0} a={s} h={s} ox={ox} oy={oy} glow={i === 3 ? 1.25 : 1} />
          </motion.g>
        )
      })}
      <motion.g
        animate={hover ? { y: -12 } : { y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        filter={hover ? `url(#${id}glow)` : undefined}
      >
        <IsoBox
          x={13}
          y={13}
          z={38}
          a={s}
          h={s}
          ox={ox}
          oy={oy}
          glow={1.7}
          topFill="rgb(var(--accent-3) / 0.62)"
        />
      </motion.g>
      {/* data motes rising from the stack */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={88 + i * 12}
          cy={20}
          r={1.4}
          fill="rgb(var(--accent-3))"
          animate={hover ? { opacity: [0, 1, 0], y: [8, -6] } : { opacity: 0, y: 8 }}
          transition={hover ? { duration: 1.4, repeat: Infinity, delay: i * 0.3 } : { duration: 0.3 }}
        />
      ))}
    </>
  )
}

function BinaryChip({ id, hover }: IlluProps) {
  const ox = 100
  const oy = 26
  const n = 6
  const pins = Array.from({ length: n }, (_, i) => 6 + i * 9.6)
  return (
    <>
      <Floor id={id} cx={100} cy={92} rx={70} ry={20} />
      {/* back pins */}
      {pins.map((p) => (
        <g key={`bx${p}`} opacity={0.65}>
          <IsoBox x={-7} y={p} z={1.5} a={7} b={3.2} h={2.2} ox={ox} oy={oy} />
          <IsoBox x={p} y={-7} z={1.5} a={3.2} b={7} h={2.2} ox={ox} oy={oy} />
        </g>
      ))}
      <IsoBox x={0} y={0} z={0} a={60} h={6} ox={ox} oy={oy} glow={1.1} topFill="rgb(var(--surface) / 0.95)" />
      {/* circuit traces etched on the package */}
      <g transform={`matrix(${C} 0.5 ${-C} 0.5 ${ox} ${oy - 6})`} fill="none" strokeWidth="0.8">
        {[10, 20, 40, 50].map((v, i) => (
          <motion.path
            key={v}
            d={i < 2 ? `M${v} 2 V14 H20` : `M${v} 58 V46 H40`}
            stroke="rgb(var(--accent-3))"
            animate={{ opacity: hover ? 0.95 : 0.35 }}
            transition={{ duration: 0.4, delay: hover ? i * 0.08 : 0 }}
          />
        ))}
        {[10, 20, 40, 50].map((v, i) => (
          <motion.path
            key={`h${v}`}
            d={i < 2 ? `M2 ${v} H14 V20` : `M58 ${v} H46 V40`}
            stroke="rgb(var(--accent))"
            animate={{ opacity: hover ? 0.95 : 0.3 }}
            transition={{ duration: 0.4, delay: hover ? 0.3 + i * 0.08 : 0 }}
          />
        ))}
      </g>
      {/* die */}
      <motion.g animate={{ opacity: hover ? 1 : 0.85 }} filter={`url(#${id}glow)`}>
        <IsoBox x={16} y={16} z={6} a={28} h={3} ox={ox} oy={oy} glow={1.6} topFill="rgb(var(--accent) / 0.55)" />
      </motion.g>
      <g transform={`matrix(${C} 0.5 ${-C} 0.5 ${ox} ${oy - 9})`} stroke="rgb(var(--ink) / 0.55)" strokeWidth="0.5">
        {[22, 28, 34, 40].map((v) => (
          <path key={v} d={`M${v} 18 V42 M18 ${v} H42`} />
        ))}
      </g>
      {/* front pins glow in sequence on hover */}
      {pins.map((p, i) => (
        <motion.g
          key={`fx${p}`}
          animate={{ opacity: hover ? [0.5, 1, 0.7] : 0.8 }}
          transition={hover ? { duration: 0.9, repeat: Infinity, repeatType: 'mirror', delay: i * 0.09 } : { duration: 0.3 }}
          filter={`url(#${id}glow)`}
        >
          <IsoBox x={60} y={p} z={1.5} a={7} b={3.2} h={2.2} ox={ox} oy={oy} glow={2} topFill="rgb(var(--accent-3))" />
          <IsoBox x={p} y={60} z={1.5} a={3.2} b={7} h={2.2} ox={ox} oy={oy} glow={2} topFill="rgb(var(--accent-3))" />
        </motion.g>
      ))}
    </>
  )
}

const NET_NODES: P3[] = [
  [0, 0, 30],
  [40, -12, 18],
  [-22, 38, 22],
  [30, 38, 8],
  [-38, -6, 12],
  [58, 26, 26],
  [4, -42, 20],
]
const NET_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 6],
  [1, 5],
  [3, 5],
  [2, 3],
  [4, 6],
  [1, 6],
]

function ProtocolNet({ id, hover }: IlluProps) {
  const ox = 100
  const oy = 58
  const pts = NET_NODES.map((p) => iso(p, ox, oy))
  const floor = NET_NODES.map(([x, y]) => iso([x, y, 0], ox, oy))
  return (
    <>
      <Floor id={id} cx={100} cy={66} rx={78} ry={30} />
      {/* iso floor grid */}
      <g transform={`matrix(${C} 0.5 ${-C} 0.5 ${ox} ${oy})`} stroke="rgb(var(--accent) / 0.18)" strokeWidth="0.6">
        {[-50, -25, 0, 25, 50].map((v) => (
          <path key={v} d={`M${v} -55 V55 M-55 ${v} H55`} />
        ))}
      </g>
      {/* drop lines + shadows */}
      {pts.map(([x, y], i) => (
        <g key={`d${i}`}>
          <line x1={x} y1={y} x2={floor[i][0]} y2={floor[i][1]} stroke="rgb(var(--accent) / 0.3)" strokeDasharray="1.5 2" strokeWidth="0.6" />
          <ellipse cx={floor[i][0]} cy={floor[i][1]} rx={3.6} ry={1.8} fill="rgb(var(--accent) / 0.35)" />
        </g>
      ))}
      {NET_EDGES.map(([a, b], i) => {
        const d = `M${pts[a][0].toFixed(1)} ${pts[a][1].toFixed(1)} L${pts[b][0].toFixed(1)} ${pts[b][1].toFixed(1)}`
        return (
          <g key={i}>
            <motion.path
              d={d}
              stroke="rgb(var(--accent-3))"
              strokeWidth={0.9}
              animate={{ opacity: hover ? 0.95 : 0.55 }}
              transition={{ duration: 0.4 }}
            />
            {hover && i % 2 === 0 && (
              <circle r={1.8} fill="rgb(var(--ink))" filter={`url(#${id}glow)`}>
                <animateMotion dur="1.3s" repeatCount="indefinite" begin={`${i * 0.12}s`} path={d} />
              </circle>
            )}
          </g>
        )
      })}
      {pts.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 ? 5.5 : 4}
          fill={`url(#${id}node)`}
          filter={`url(#${id}glow)`}
          animate={hover ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={hover ? { duration: 1.1, repeat: Infinity, delay: i * 0.12 } : { duration: 0.3 }}
        />
      ))}
    </>
  )
}

function FileLayers({ id, hover }: IlluProps) {
  const ox = 100
  const oy = 62
  const a = 52
  return (
    <>
      <Floor id={id} cx={100} cy={100} rx={62} ry={16} />
      {[0, 1, 2, 3].map((i) => (
        <motion.g
          key={i}
          animate={{ y: hover ? -i * 6 : 0 }}
          transition={{ duration: 0.65, ease: EASE, delay: hover ? i * 0.04 : 0 }}
        >
          <IsoBox
            x={0}
            y={0}
            z={i * 11}
            a={a}
            h={5}
            ox={ox}
            oy={oy}
            glow={0.8 + i * 0.25}
            topFill={i === 3 ? 'rgb(var(--accent) / 0.5)' : undefined}
          />
          {/* hex-row etching on each layer */}
          <g
            transform={`matrix(${C} 0.5 ${-C} 0.5 ${ox} ${oy - i * 11 - 5})`}
            stroke={i === 3 ? 'rgb(var(--ink) / 0.8)' : 'rgb(var(--accent-3) / 0.5)'}
            strokeWidth="1.1"
            strokeLinecap="round"
          >
            {[10, 18, 26, 34, 42].map((v, k) => (
              <path key={v} d={`M8 ${v} H${20 + ((k * 13 + i * 7) % 24)}`} />
            ))}
          </g>
        </motion.g>
      ))}
      <motion.g
        animate={{ opacity: hover ? 1 : 0, y: hover ? -24 : -16 }}
        transition={{ duration: 0.5, ease: EASE }}
        filter={`url(#${id}glow)`}
      >
        <text x={150} y={38} className="font-mono" style={{ fontSize: 7, fill: 'rgb(var(--accent-3))' }}>
          TOC
        </text>
        <text x={150} y={60} className="font-mono" style={{ fontSize: 7, fill: 'rgb(var(--accent-3) / 0.7)' }}>
          zlib
        </text>
      </motion.g>
    </>
  )
}

function gearPath(teeth: number, R: number, r: number, hole: number) {
  const step = (Math.PI * 2) / teeth
  const pt = (rad: number, ang: number) => `${(Math.cos(ang) * rad).toFixed(2)} ${(Math.sin(ang) * rad).toFixed(2)}`
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    d += `${i === 0 ? 'M' : 'L'}${pt(r, a - step * 0.3)} L${pt(R, a - step * 0.16)} L${pt(R, a + step * 0.16)} L${pt(r, a + step * 0.3)} `
  }
  d += `Z M${hole} 0 A${hole} ${hole} 0 1 0 ${-hole} 0 A${hole} ${hole} 0 1 0 ${hole} 0 Z`
  return d
}

function Gear({
  cx,
  cy,
  teeth,
  R,
  dir,
  dur,
  hoverTurn,
  hover,
  front,
}: {
  cx: number
  cy: number
  teeth: number
  R: number
  dir: 1 | -1
  dur: number
  hoverTurn: number
  hover: boolean
  front: boolean
}) {
  const d = useMemo(() => gearPath(teeth, R, R - 5, R * 0.32), [teeth, R])
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g animate={{ rotate: hover ? hoverTurn : 0 }} transition={{ duration: 1.2, ease: EASE }}>
        <g
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: `${dir === 1 ? 'pj-spin' : 'pj-spin-rev'} ${dur}s linear infinite`,
          }}
        >
          <path
            d={d}
            fillRule="evenodd"
            fill={front ? 'rgb(var(--accent) / 0.38)' : 'rgb(var(--accent) / 0.16)'}
            stroke={front ? 'rgb(var(--accent-3) / 0.95)' : 'rgb(var(--accent-3) / 0.35)'}
            strokeWidth={front ? 1.1 : 0.8}
            strokeLinejoin="round"
          />
          {front && (
            <circle r={R * 0.55} fill="none" stroke="rgb(var(--accent-3) / 0.45)" strokeWidth="0.8" strokeDasharray="2 3" />
          )}
        </g>
      </motion.g>
    </g>
  )
}

function Gears({ id, hover }: IlluProps) {
  // gears stand on the front-left wall plane; the back copy is offset to fake thickness
  const plane = `matrix(${C} 0.5 0 1 64 8)`
  const gears = [
    { cx: 28, cy: 30, teeth: 12, R: 28, dir: 1 as const, dur: 16, hoverTurn: 90 },
    { cx: 64, cy: 50, teeth: 8, R: 18, dir: -1 as const, dur: 16 * (8 / 12), hoverTurn: -135 },
  ]
  return (
    <>
      <Floor id={id} cx={104} cy={104} rx={66} ry={14} />
      <g transform="translate(4.3 -2.5)">
        <g transform={plane}>
          {gears.map((g) => (
            <Gear key={`b${g.cx}`} {...g} hover={hover} front={false} />
          ))}
        </g>
      </g>
      <g transform={plane} filter={hover ? `url(#${id}glow)` : undefined}>
        {gears.map((g) => (
          <Gear key={`f${g.cx}`} {...g} hover={hover} front />
        ))}
      </g>
    </>
  )
}

function ToolingKit({ id, hover }: IlluProps) {
  // terminal on the front-right wall plane, wrench crossing in front
  const wall = `matrix(${C} -0.5 0 1 70 64)`
  const lines = [
    { w: 46, tone: 'rgb(var(--ink) / 0.85)' },
    { w: 30, tone: 'rgb(var(--accent-3) / 0.85)' },
    { w: 38, tone: 'rgb(var(--accent-3) / 0.6)' },
    { w: 22, tone: 'rgb(var(--accent) / 0.8)' },
  ]
  return (
    <>
      <Floor id={id} cx={104} cy={100} rx={70} ry={17} />
      <g transform="translate(-3.5 -2)">
        <g transform={wall}>
          <rect x={0} y={-14} width={84} height={58} rx={5} fill="rgb(var(--accent) / 0.14)" />
        </g>
      </g>
      <g transform={wall}>
        <rect
          x={0}
          y={-14}
          width={84}
          height={58}
          rx={5}
          fill="rgb(var(--surface) / 0.92)"
          stroke="rgb(var(--accent-3) / 0.9)"
          strokeWidth="1"
        />
        <path d="M0 -4 H84" stroke="rgb(var(--accent) / 0.5)" strokeWidth="0.8" />
        {[6, 12, 18].map((x, i) => (
          <circle key={x} cx={x} cy={-9} r={1.7} fill={i === 0 ? 'rgb(244 63 94 / 0.8)' : 'rgb(var(--accent) / 0.7)'} />
        ))}
        <text x={6} y={8} className="font-mono" style={{ fontSize: 8, fill: 'rgb(var(--accent-3))' }}>
          &gt;_
        </text>
        {lines.map((l, i) => (
          <motion.rect
            key={i}
            x={20}
            y={2 + i * 8}
            height={2.6}
            rx={1.3}
            fill={l.tone}
            initial={false}
            animate={{ width: hover ? l.w : l.w * 0.45 }}
            transition={{ duration: 0.5, delay: hover ? i * 0.12 : 0, ease: EASE }}
          />
        ))}
        <rect x={20} y={34} width={4} height={6} fill="rgb(var(--accent))" className="animate-blink" />
      </g>
      {/* wrench */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '30% 70%' }}
        animate={{ rotate: hover ? [-8, 14, -4, 6] : 0 }}
        transition={{ duration: 1, ease: EASE }}
        filter={`url(#${id}glow)`}
      >
        <g transform="translate(40 96) rotate(-38)">
          <path
            d="M0 -4 H56 l3 -6 a13 13 0 1 1 0 20 l-3 -6 H0 a4 4 0 0 1 0 -8 Z"
            transform="translate(3 2.5)"
            fill="rgb(var(--accent) / 0.16)"
          />
          <path
            d="M0 -4 H56 l3 -6 a13 13 0 1 1 0 20 l-3 -6 H0 a4 4 0 0 1 0 -8 Z M72.3 0 L69.8 4.33 L64.8 4.33 L62.3 0 L64.8 -4.33 L69.8 -4.33 Z"
            fillRule="evenodd"
            fill="rgb(var(--accent) / 0.42)"
            stroke="rgb(var(--accent-3) / 0.95)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M6 0 H48" stroke="rgb(var(--ink) / 0.6)" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      </motion.g>
    </>
  )
}

const ILLUSTRATIONS: Record<ProjectKind, (p: IlluProps) => JSX.Element> = {
  api: ApiCubes,
  binary: BinaryChip,
  protocol: ProtocolNet,
  format: FileLayers,
  reimpl: Gears,
  tooling: ToolingKit,
}

/** Glowing isometric illustration for a kind of project; animates while `hover`. */
export function ProjectIllustration({
  kind,
  hover,
  className,
}: {
  kind: ProjectKind
  hover: boolean
  className?: string
}) {
  const id = svgId(useId())
  const Art = ILLUSTRATIONS[kind]
  return (
    <svg viewBox="0 0 200 120" className={cn('overflow-visible', className)} aria-hidden fill="none">
      <Defs id={id} />
      <Art id={id} hover={hover} />
    </svg>
  )
}
