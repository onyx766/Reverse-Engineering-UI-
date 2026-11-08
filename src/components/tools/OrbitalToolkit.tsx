import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ArrowUpRight, Pause, Radio } from 'lucide-react'
import {
  ORBIT_CORE,
  ORBIT_RINGS,
  PROFICIENCY_LABEL,
  TOOLS,
  type Tool,
  type ToolCategoryId,
} from '@/data/tools'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { clamp, cn } from '@/lib/utils'
import { CATEGORY_BY_ID, EASE } from './meta'
import { useElementWidth, useRoving } from './hooks'
import { ProficiencyMeter } from './ProficiencyMeter'
import { ToolMonogram } from './ToolMonogram'

interface RingDef {
  /** radius in design px */
  r: number
  /** inclination of the ring plane, degrees (90 = edge-on) */
  incl: number
  /** roll in the screen plane, degrees */
  rot: number
  /** seconds per revolution */
  period: number
  dir: 1 | -1
  phase: number
  /** where the ring's label sits, radians */
  labelAt: number
}

const RINGS: RingDef[] = [
  { r: 158, incl: 63, rot: -15, period: 56, dir: 1, phase: 0.4, labelAt: Math.PI + 0.42 },
  { r: 244, incl: 67, rot: 11, period: 80, dir: -1, phase: 1.05, labelAt: -0.3 },
  { r: 330, incl: 71, rot: -5, period: 104, dir: 1, phase: 0.18, labelAt: Math.PI - 0.26 },
]

const DEG = Math.PI / 180
const PERSPECTIVE = 1400
const TAU = Math.PI * 2

interface Orbiter {
  tool: Tool
  ring: number
  angle: number
}

const ORBITERS: Orbiter[] = RINGS.flatMap((ring, ri) => {
  const members = TOOLS.filter((t) => t.orbit === ri)
  return members.map((tool, i) => ({ tool, ring: ri, angle: ring.phase + (i / members.length) * TAU }))
})

const ORBIT_INDEX: Record<string, number> = Object.fromEntries(ORBITERS.map((o, i) => [o.tool.id, i]))

interface Bead {
  ring: number
  angle: number
  size: number
  alpha: number
}

/** Evenly spaced ticks plus one comet with a fading tail per ring. */
const BEADS: Bead[] = RINGS.flatMap((ring, ri) => {
  const ticks = Array.from({ length: 14 }, (_, i) => ({
    ring: ri,
    angle: (i / 14) * TAU + ri * 0.21,
    size: 0.7,
    alpha: 0.55,
  }))
  const comet = Array.from({ length: 6 }, (_, i) => ({
    ring: ri,
    angle: ring.phase + 2.2 - ring.dir * i * 0.035,
    size: 1.5 - i * 0.18,
    alpha: 1 - i * 0.15,
  }))
  return [...ticks, ...comet]
})

interface Projected {
  x: number
  y: number
  /** depth normalised to the ring radius: -1 far … 1 near */
  z: number
}

function project(ring: RingDef, theta: number, inclShift: number, gx: number, gy: number, k: number): Projected {
  const a = (ring.incl + inclShift) * DEG
  const b = ring.rot * DEG
  const lx = ring.r * Math.cos(theta)
  const ly = ring.r * Math.sin(theta)
  // incline the ring: its lower half swings toward the viewer
  const y1 = ly * Math.cos(a)
  const z1 = ly * Math.sin(a)
  // roll in the screen plane
  const x2 = lx * Math.cos(b) - y1 * Math.sin(b)
  const y2 = lx * Math.sin(b) + y1 * Math.cos(b)
  // pointer parallax: yaw, then pitch
  const x3 = x2 * Math.cos(gy) + z1 * Math.sin(gy)
  const z3 = -x2 * Math.sin(gy) + z1 * Math.cos(gy)
  const y4 = y2 * Math.cos(gx) - z3 * Math.sin(gx)
  const z4 = y2 * Math.sin(gx) + z3 * Math.cos(gx)
  const s = PERSPECTIVE / (PERSPECTIVE - z4)
  return { x: x3 * s * k, y: y4 * s * k, z: z4 / ring.r }
}

/** Splits a ring into the arcs behind and in front of the core. */
function ringPaths(ring: RingDef, inclShift: number, gx: number, gy: number, k: number, cx: number, cy: number) {
  const N = 120
  let back = ''
  let front = ''
  let side = ''
  let prev = project(ring, 0, inclShift, gx, gy, k)
  for (let i = 1; i <= N; i++) {
    const p = project(ring, (i / N) * TAU, inclShift, gx, gy, k)
    const s = (prev.z + p.z) / 2 >= 0 ? 'f' : 'b'
    const move = s !== side ? `M${(cx + prev.x).toFixed(1)} ${(cy + prev.y).toFixed(1)}` : ''
    const seg = `${move}L${(cx + p.x).toFixed(1)} ${(cy + p.y).toFixed(1)}`
    if (s === 'f') front += seg
    else back += seg
    side = s
    prev = p
  }
  return { back, front }
}

interface Props {
  /** dims every tool outside this category */
  highlight: ToolCategoryId | null
  /** tool activated from outside the orbit (e.g. a hovered list row) */
  external: string | null
  onOpen: (id: string) => void
}

/**
 * The hero of the Tools section: tool badges riding three inclined,
 * counter-rotating rings around a glowing core. Positions are projected with
 * real perspective every frame (transform + opacity writes only), the orbit
 * eases to a stop while a badge is hovered or focused, and the whole system
 * leans toward the pointer.
 */
export function OrbitalToolkit({ highlight, external, onOpen }: Props) {
  const reduced = useReducedMotion()
  const [stageRef, width] = useElementWidth<HTMLDivElement>()
  const inView = useInView(stageRef, { margin: '120px' })
  const tooltipId = useId()

  const [active, setActive] = useState<string | null>(null)
  const shown = active ?? external
  const shownTool = shown && shown in ORBIT_INDEX ? ORBITERS[ORBIT_INDEX[shown]].tool : null
  const [placement, setPlacement] = useState<'above' | 'below'>('above')

  const compact = width > 0 && width < 600
  const k = width ? Math.min(1, (width - (compact ? 46 : 150)) / (2 * RINGS[2].r)) : 0.9
  const H = Math.round(compact ? Math.max(330, 640 * k) : clamp(500 * k + 46, 430, 548))
  const cx = width / 2
  const cy = Math.round(H * (compact ? 0.42 : 0.43))
  const inclShift = compact ? -7 : 0
  const core = Math.round(clamp(150 * k, 92, 150))
  const pedY = H - (compact ? 34 : 50)

  const badgeRefs = useRef<(HTMLButtonElement | null)[]>([])
  const beadRefs = useRef<(HTMLSpanElement | null)[]>([])
  const backRefs = useRef<(SVGPathElement | null)[]>([])
  const frontRefs = useRef<(SVGPathElement | null)[]>([])
  const glowRefs = useRef<(SVGPathElement | null)[]>([])
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const anchorRef = useRef<HTMLDivElement>(null)
  const leaderRef = useRef<HTMLSpanElement>(null)

  const positions = useRef<{ x: number; y: number }[]>([])
  const sim = useRef({ t: 0, speed: 1, gx: 0, gy: 0 })
  const pointer = useRef({ tx: 0, ty: 0 })
  const shownRef = useRef(shown)
  shownRef.current = shown
  const highlightRef = useRef(highlight)
  highlightRef.current = highlight
  const geom = useRef({ cx, cy, k, inclShift, W: width })
  geom.current = { cx, cy, k, inclShift, W: width }

  const clearTimer = useRef<number>()
  const lastPointer = useRef<string>('mouse')

  const roving = useRoving(ORBITERS.length, (i) => setActive(ORBITERS[i].tool.id))

  useEffect(() => () => window.clearTimeout(clearTimer.current), [])

  // the render loop — pure DOM writes, React never re-renders per frame
  useEffect(() => {
    if (!width) return
    let raf = 0
    let last = performance.now()
    let lastGx = Number.NaN
    let lastGy = Number.NaN

    const frame = (now: number, live: boolean) => {
      const m = sim.current
      const g = geom.current
      const shownId = shownRef.current
      if (live) {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        m.speed += ((shownId ? 0 : 1) - m.speed) * Math.min(1, dt * 4.2)
        m.t += dt * m.speed
        if (!shownId) {
          m.gx += (pointer.current.tx - m.gx) * Math.min(1, dt * 3)
          m.gy += (pointer.current.ty - m.gy) * Math.min(1, dt * 3)
        }
      }

      if (!live || Math.abs(m.gx - lastGx) > 2e-4 || Math.abs(m.gy - lastGy) > 2e-4) {
        lastGx = m.gx
        lastGy = m.gy
        RINGS.forEach((ring, ri) => {
          const { back, front } = ringPaths(ring, g.inclShift, m.gx, m.gy, g.k, g.cx, g.cy)
          backRefs.current[ri]?.setAttribute('d', back)
          frontRefs.current[ri]?.setAttribute('d', front)
          glowRefs.current[ri]?.setAttribute('d', front)
          const p = project(ring, ring.labelAt, g.inclShift, m.gx, m.gy, g.k)
          const label = labelRefs.current[ri]
          if (label) label.style.transform = `translate3d(${(g.cx + p.x).toFixed(1)}px, ${(g.cy + p.y).toFixed(1)}px, 0)`
        })
      }

      const hi = highlightRef.current
      ORBITERS.forEach((o, i) => {
        const ring = RINGS[o.ring]
        const p = project(ring, o.angle + ring.dir * (m.t / ring.period) * TAU, g.inclShift, m.gx, m.gy, g.k)
        const x = g.cx + p.x
        const y = g.cy + p.y
        positions.current[i] = { x, y }
        const el = badgeRefs.current[i]
        if (!el) return
        const depth = (p.z + 1) / 2
        const isShown = shownId === o.tool.id
        const dim = hi !== null && o.tool.category !== hi
        const scale = isShown ? 1.05 : 0.64 + 0.3 * depth
        const opacity = isShown ? 1 : (0.36 + 0.64 * depth) * (dim ? 0.2 : 1)
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
        el.style.zIndex = isShown
          ? '160'
          : String(p.z >= 0 ? 80 + Math.round(p.z * 60) : 20 + Math.round((p.z + 1) * 40))
      })

      BEADS.forEach((b, i) => {
        const el = beadRefs.current[i]
        if (!el) return
        const ring = RINGS[b.ring]
        const p = project(ring, b.angle + ring.dir * (m.t / ring.period) * TAU, g.inclShift, m.gx, m.gy, g.k)
        const depth = (p.z + 1) / 2
        el.style.transform = `translate3d(${(g.cx + p.x).toFixed(2)}px, ${(g.cy + p.y).toFixed(2)}px, 0) scale(${((0.55 + 0.65 * depth) * b.size).toFixed(3)})`
        el.style.opacity = ((0.12 + 0.88 * depth) * b.alpha).toFixed(3)
        el.style.zIndex = p.z >= 0 ? '76' : '15'
      })

      const si = shownId ? ORBIT_INDEX[shownId] : undefined
      if (si !== undefined && anchorRef.current) {
        const pos = positions.current[si]
        const half = Math.min(138, g.W / 2 - 6)
        const cardX = clamp(pos.x, half + 4, g.W - half - 4)
        anchorRef.current.style.transform = `translate3d(${cardX.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`
        if (leaderRef.current) leaderRef.current.style.transform = `translateX(${(pos.x - cardX).toFixed(1)}px)`
      }
    }

    if (reduced || !inView) {
      frame(performance.now(), false)
      return
    }
    const loop = (now: number) => {
      frame(now, true)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [width, H, compact, reduced, inView, shown, highlight])

  // flip the tooltip to whichever side of the badge has room
  useLayoutEffect(() => {
    if (!shown || !(shown in ORBIT_INDEX)) return
    const pos = positions.current[ORBIT_INDEX[shown]]
    if (pos) setPlacement(pos.y < cy + 8 ? 'above' : 'below')
  }, [shown, cy])

  // a tap anywhere else dismisses a touch selection
  useEffect(() => {
    if (!active) return
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      if ((e.target as Element | null)?.closest?.('[data-orbit-hit]')) return
      setActive(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [active])

  const scheduleClear = () => {
    window.clearTimeout(clearTimer.current)
    clearTimer.current = window.setTimeout(() => setActive(null), 170)
  }
  const cancelClear = () => window.clearTimeout(clearTimer.current)

  const onStageMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduced || !stageRef.current) return
    const r = stageRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    pointer.current = { tx: py * 12 * DEG, ty: px * 16 * DEG }
  }

  const status = reduced ? 'static' : shown ? 'hold' : 'live'

  return (
    <div className="relative">
      <div
        ref={stageRef}
        onPointerMove={onStageMove}
        onPointerLeave={() => {
          pointer.current = { tx: 0, ty: 0 }
        }}
        className={cn(
          'relative isolate z-10 w-full select-none',
          !inView && '[&_*]:![animation-play-state:paused]',
        )}
        style={{ height: H }}
      >
        {/* HUD corners */}
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l border-t border-accent/50" />
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-5 w-5 border-r border-t border-accent/50" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-3 top-2.5 hidden font-mono text-[9.5px] uppercase leading-relaxed tracking-[0.2em] text-muted/80 sm:block"
        >
          <span className="text-accent">orbit</span> // {RINGS.length} rings
          <br />
          {ORBITERS.length} nodes · {TOOLS.length} total
        </div>
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] transition-colors duration-300',
            status === 'live' ? 'border-accent/35 bg-accent/10 text-accent' : 'border-accent2/40 bg-accent2/10 text-accent2',
          )}
        >
          {status === 'hold' ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Radio className={cn('h-3 w-3', status === 'live' && 'animate-pulse')} />
          )}
          {status === 'hold' ? 'hold' : status === 'live' ? 'live' : 'static'}
        </div>

        <Floor pedY={pedY} k={k} />
        <Beam top={cy} bottom={pedY} k={k} />

        {/* far halves of the rings */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-[10] h-full w-full overflow-visible" viewBox={`0 0 ${width || 1} ${H}`}>
          {RINGS.map((_, ri) => (
            <path
              key={ri}
              ref={(el) => {
                backRefs.current[ri] = el
              }}
              fill="none"
              stroke="rgb(var(--accent) / 0.22)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}
        </svg>

        {BEADS.map((b, i) => (
          <span
            key={i}
            ref={(el) => {
              beadRefs.current[i] = el
            }}
            aria-hidden
            className={cn(
              'pointer-events-none absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full opacity-0',
              b.size > 1 ? 'bg-accent3 shadow-glow-sm' : 'bg-accent',
            )}
          />
        ))}

        <Core cx={cx} cy={cy} size={core} caption={highlight ? CATEGORY_BY_ID[highlight].short : ORBIT_CORE.caption} />

        {/* near halves of the rings */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-[75] h-full w-full overflow-visible" viewBox={`0 0 ${width || 1} ${H}`}>
          {RINGS.map((_, ri) => (
            <g key={ri}>
              <path
                ref={(el) => {
                  glowRefs.current[ri] = el
                }}
                fill="none"
                stroke="rgb(var(--accent) / 0.12)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                ref={(el) => {
                  frontRefs.current[ri] = el
                }}
                fill="none"
                stroke="rgb(var(--accent) / 0.55)"
                strokeWidth="1.2"
              />
            </g>
          ))}
        </svg>

        {/* ring labels */}
        {RINGS.map((_, ri) => (
          <span
            key={ri}
            ref={(el) => {
              labelRefs.current[ri] = el
            }}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-[12]"
          >
            <span
              className={cn(
                'absolute -translate-y-[140%] whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-accent/70',
                Math.cos(RINGS[ri].labelAt) < 0 ? 'left-1' : 'right-1',
              )}
            >
              R{ri}
              {!compact && <span className="text-muted/70"> · {ORBIT_RINGS[ri]}</span>}
            </span>
          </span>
        ))}

        <div
          role="group"
          aria-label={`Orbital toolkit, ${ORBITERS.length} core tools. Arrow keys move between tools, Enter opens details.`}
        >
          {ORBITERS.map((o, i) => {
            const t = o.tool
            const isShown = shown === t.id
            const isHi = highlight !== null && t.category === highlight
            const props = roving.itemProps(i)
            return (
              <button
                key={t.id}
                type="button"
                data-orbit-hit
                ref={(el) => {
                  badgeRefs.current[i] = el
                  props.ref(el)
                }}
                tabIndex={props.tabIndex}
                aria-label={`${t.name}: ${CATEGORY_BY_ID[t.category].label}, ${t.years} years, proficiency ${t.level} of 5`}
                aria-describedby={isShown ? tooltipId : undefined}
                aria-haspopup="dialog"
                onPointerDown={(e) => {
                  lastPointer.current = e.pointerType
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'mouse') return
                  cancelClear()
                  setActive(t.id)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') scheduleClear()
                }}
                onFocus={() => {
                  cancelClear()
                  roving.setIndex(i)
                  setActive(t.id)
                }}
                onBlur={scheduleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setActive(null)
                    return
                  }
                  props.onKeyDown(e)
                }}
                onClick={() => {
                  if (lastPointer.current !== 'mouse' && active !== t.id) {
                    setActive(t.id)
                    return
                  }
                  onOpen(t.id)
                }}
                className={cn(
                  'absolute left-0 top-0 flex items-center rounded-full border opacity-0 will-change-transform',
                  'transition-[border-color,box-shadow,background-color] duration-300',
                  compact ? 'h-10 w-10 justify-center' : 'h-10 gap-2 pl-1 pr-3.5',
                  isShown
                    ? 'border-accent shadow-glow'
                    : isHi
                      ? 'border-accent/90 shadow-glow-sm'
                      : 'border-accent/35 hover:border-accent/70',
                )}
                style={{
                  background: isShown
                    ? 'linear-gradient(135deg, rgb(var(--accent) / 0.32), rgb(var(--surface) / 0.96) 60%)'
                    : 'linear-gradient(135deg, rgb(var(--surface) / 0.94), rgb(var(--deep) / 0.9))',
                }}
              >
                <span
                  className={cn(
                    'relative grid shrink-0 place-items-center rounded-full border font-display font-black leading-none text-ink',
                    compact ? 'h-[34px] w-[34px] text-[10px]' : 'h-8 w-8 text-[10px]',
                    isShown || isHi ? 'border-accent3/80' : 'border-accent/50',
                  )}
                  style={{
                    background:
                      'radial-gradient(circle at 34% 30%, rgb(var(--accent-3) / 0.5), rgb(var(--accent) / 0.22) 55%, rgb(var(--deep) / 0.92))',
                  }}
                >
                  {t.mono}
                </span>
                {!compact && (
                  <span className="whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/90">
                    {t.short}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* tooltip, glued to the hovered badge by the render loop */}
        <div ref={anchorRef} className="pointer-events-none absolute left-0 top-0 z-[200]">
          <AnimatePresence mode="wait">
            {shownTool && (
              <motion.div
                key={shownTool.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.2 }}
              >
                <span
                  ref={leaderRef}
                  aria-hidden
                  className={cn(
                    'absolute left-0 h-[22px] w-px',
                    placement === 'above'
                      ? 'bottom-[8px] bg-gradient-to-t from-accent to-accent/0'
                      : 'top-[8px] bg-gradient-to-b from-accent to-accent/0',
                  )}
                />
                <div
                  className={cn(
                    'absolute left-0 w-[16.5rem] max-w-[calc(100vw-2.5rem)] -translate-x-1/2',
                    placement === 'above' ? 'bottom-[30px]' : 'top-[30px]',
                  )}
                >
                  <motion.div
                    id={tooltipId}
                    role="tooltip"
                    data-orbit-hit
                    initial={{ y: placement === 'above' ? 12 : -12, scale: 0.94, filter: 'blur(6px)' }}
                    animate={{ y: 0, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.3, ease: EASE }}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') cancelClear()
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse' && active) scheduleClear()
                    }}
                    className="pointer-events-auto"
                  >
                    <TooltipCard tool={shownTool} onOpen={() => onOpen(shownTool.id)} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted/80">
        {compact ? (
          'tap a node to inspect · tap again for details'
        ) : (
          <>
            hover or focus a node <span className="text-accent/70">·</span> ← → to cycle{' '}
            <span className="text-accent/70">·</span> enter for details
          </>
        )}
      </p>
    </div>
  )
}

function TooltipCard({ tool, onOpen }: { tool: Tool; onOpen: () => void }) {
  const cat = CATEGORY_BY_ID[tool.category]
  return (
    <div className="glass-strong relative overflow-hidden rounded-xl p-3.5 shadow-glow">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span aria-hidden className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-accent/80" />
      <span aria-hidden className="pointer-events-none absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-accent/80" />
      <div className="flex items-center gap-3">
        <ToolMonogram tool={tool} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13.5px] font-bold tracking-wide text-ink">{tool.name}</p>
          <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.16em] text-accent">{cat.label}</p>
        </div>
        <span className="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-ink">
          {tool.years}y
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <ProficiencyMeter level={tool.level} size="sm" shimmer="always" className="flex-1" />
        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
          {PROFICIENCY_LABEL[tool.level]}
        </span>
      </div>
      <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-snug text-muted">{tool.usage}</p>
      <button
        type="button"
        tabIndex={-1}
        onClick={onOpen}
        className="group mt-3 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent transition-colors duration-300 hover:border-accent hover:bg-accent/20 hover:text-ink"
      >
        Open details
        <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

function Core({ cx, cy, size, caption }: { cx: number; cy: number; size: number; caption: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute z-[70] -translate-x-1/2 -translate-y-1/2"
        style={{ left: cx, top: cy, width: size, height: size }}
      >
        <span
          className="absolute -inset-[45%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(var(--accent) / 0.26), rgb(var(--accent) / 0.06) 45%, transparent 66%)' }}
        />
        <span className="absolute inset-[8%] animate-pulse-ring rounded-full border border-accent/50" />
        <span className="absolute inset-[8%] animate-pulse-ring rounded-full border border-accent2/40 [animation-delay:1.4s]" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
          <polygon
            points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"
            fill="rgb(var(--accent) / 0.05)"
            stroke="rgb(var(--accent) / 0.75)"
            strokeWidth="0.8"
          />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle
              key={a}
              cx={50 + 47 * Math.sin(a * DEG)}
              cy={50 - 47 * Math.cos(a * DEG)}
              r="1.6"
              fill="rgb(var(--accent-3))"
            />
          ))}
        </svg>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-[13%] h-[74%] w-[74%] animate-spin-slow [animation-direction:reverse] [animation-duration:34s]"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--accent-2) / 0.6)" strokeWidth="1" strokeDasharray="4 7" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgb(var(--accent) / 0.3)" strokeWidth="0.6" />
        </svg>

        <span
          className="absolute inset-[27%] rounded-full"
          style={{
            background:
              'radial-gradient(circle at 40% 34%, rgb(var(--ink) / 0.95), rgb(var(--accent-3)) 18%, rgb(var(--accent)) 46%, rgb(var(--accent-2) / 0.55) 68%, transparent 71%)',
            boxShadow: '0 0 34px rgb(var(--accent) / 0.85), 0 0 90px rgb(var(--accent) / 0.35)',
          }}
        />
        <svg viewBox="0 0 40 40" className="absolute inset-[37%] h-[26%] w-[26%] animate-float">
          <g fill="none" stroke="rgb(var(--deep) / 0.85)" strokeWidth="2" strokeLinejoin="round">
            <path d="M20 4 34 12v16l-14 8-14-8V12z" />
            <path d="M20 4v0M6 12l14 8 14-8M20 20v16" />
          </g>
        </svg>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute z-[72] -translate-x-1/2 text-center"
        style={{ left: cx, top: cy + size / 2 + 4 }}
      >
        <p className="font-display text-[13px] font-bold tracking-[0.2em] text-ink [text-shadow:0_0_12px_rgb(var(--accent)/0.8)]">
          {ORBIT_CORE.label}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.22em] text-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-glow-sm" />
          {caption}
        </p>
      </div>
    </>
  )
}

function Beam({ top, bottom, k }: { top: number; bottom: number; k: number }) {
  const w = Math.round(110 * Math.max(k, 0.6))
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-[5] -translate-x-1/2"
      style={{ top, height: Math.max(0, bottom - top), width: w }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgb(var(--accent) / 0.34), rgb(var(--accent) / 0.1) 55%, transparent)',
          clipPath: 'polygon(36% 0, 64% 0, 100% 100%, 0 100%)',
        }}
      />
      <div className="absolute inset-0 rotate-180 overflow-hidden">
        {[
          { left: '30%', delay: '0s', dur: '3.4s' },
          { left: '52%', delay: '1.3s', dur: '4.1s' },
          { left: '68%', delay: '2.2s', dur: '3.7s' },
        ].map((p) => (
          <span
            key={p.left}
            className="absolute top-0 h-[5%] w-[2px] animate-scanline rounded-full bg-accent3/80"
            style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur }}
          />
        ))}
      </div>
    </div>
  )
}

function Floor({ pedY, k }: { pedY: number; k: number }) {
  const w = Math.round(420 * Math.max(k, 0.62))
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[4]">
      {/* perspective grid under the pedestal */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          top: pedY - 40,
          perspective: '380px',
          maskImage: 'radial-gradient(ellipse 60% 90% at 50% 0%, black 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 90% at 50% 0%, black 25%, transparent 75%)',
        }}
      >
        <div
          className="absolute -inset-x-1/4 top-0 h-[260%] origin-top bg-grid opacity-70"
          style={{ backgroundSize: '34px 34px', transform: 'rotateX(64deg)' }}
        />
      </div>

      {/* pedestal: flat rings laid into the floor */}
      <div className="absolute left-1/2 h-0 w-0" style={{ top: pedY, perspective: '700px' }}>
        {[1, 0.78, 0.56, 0.34].map((f, i) => {
          const d = w * f
          return (
            <div
              key={f}
              className="absolute rounded-full"
              style={{
                width: d,
                height: d,
                left: -d / 2,
                top: -d / 2,
                transform: 'rotateX(76deg)',
                border: `1px solid rgb(var(--accent) / ${[0.22, 0.4, 0.6, 0.8][i]})`,
                background:
                  i === 3
                    ? 'radial-gradient(circle, rgb(var(--accent-3) / 0.55), rgb(var(--accent) / 0.25) 55%, transparent 72%)'
                    : i === 0
                      ? 'radial-gradient(circle, rgb(var(--accent) / 0.14), transparent 70%)'
                      : undefined,
                boxShadow: i === 2 ? '0 0 26px rgb(var(--accent) / 0.45), inset 0 0 22px rgb(var(--accent) / 0.3)' : undefined,
              }}
            >
              {i === 1 && (
                <div className="absolute inset-[3%] animate-spin-slow rounded-full border-2 border-dashed border-accent/45" />
              )}
              {i === 2 && (
                <div className="absolute -inset-[6%] animate-spin-slow rounded-full border border-dotted border-accent3/60 [animation-direction:reverse] [animation-duration:16s]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
