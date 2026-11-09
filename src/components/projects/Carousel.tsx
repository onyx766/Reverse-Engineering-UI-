import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
} from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Project } from '@/data/projects'
import { clamp, cn } from '@/lib/utils'
import { useElementSize } from './hooks'
import { ProjectCard } from './ProjectCard'

export type CarouselMode = 'arc' | 'slider'

interface Layout {
  mode: CarouselMode
  cardW: number
  cardH: number
  /** centre → ±1 slot distance */
  gap1: number
  /** ±1 → ±2 slot distance */
  gap2: number
  /** rotateY per slot, degrees */
  rot: number
  /** translateZ per slot, px (pushed back) */
  depth: number
  /** extra drop per slot², px */
  drop: number
  /** visible slots on each side */
  range: number
  /** opacity of the first neighbour (slider peeks) */
  sideOpacity: number
}

const SPRING = { type: 'spring', stiffness: 165, damping: 25, mass: 1 } as const
const ARROW = 56
/** clear space between the arrows and the outermost card */
const ARROW_GAP = 18
const ARC_PERSPECTIVE = 1500

function computeLayout(width: number, vh: number, mode: CarouselMode): Layout {
  if (mode === 'slider') {
    const cardW = Math.round(clamp(Math.min(width * 0.8, 330), 240, 330))
    return {
      mode,
      cardW,
      cardH: Math.round(cardW * 1.14),
      gap1: cardW * 0.9,
      gap2: cardW * 0.9,
      rot: 30,
      depth: 150,
      drop: 0,
      range: 1,
      sideOpacity: 0.5,
    }
  }
  const fiveW = Math.round(clamp(Math.min(width * 0.166, vh * 0.258), 192, 282))
  const span = width - 2 * (ARROW + ARROW_GAP)
  // five cards with clean gaps between them (as in the reference), squeezed only slightly;
  // when they would start to overlap, three roomier cards instead
  const fit = (span - fiveW) / (4.3 * fiveW)
  const five = fit >= 0.95
  const cardW = five ? fiveW : Math.round(clamp(Math.min(width * 0.2, vh * 0.258), 192, 240))
  const squeeze = five ? Math.min(1, fit) : 1
  return {
    mode,
    cardW,
    cardH: Math.round(cardW * 1.2),
    gap1: cardW * 1.07 * squeeze,
    gap2: cardW * 1.1 * squeeze,
    rot: five ? 11 : 16,
    depth: 58,
    drop: 7,
    range: five ? 2 : 1,
    sideOpacity: 1,
  }
}

function geom(e: number, L: Layout) {
  const a = Math.abs(e)
  const s = Math.sign(e)
  const x = s * (Math.min(a, 1) * L.gap1 + Math.max(0, a - 1) * L.gap2)
  const rot = -s * Math.min(a, 2.6) * L.rot
  const z = -Math.pow(a, 1.15) * L.depth
  const y = a * a * L.drop
  const scale = 1 - Math.min(a, 3) * (L.mode === 'arc' ? 0.025 : 0.06)
  let opacity = 1
  if (a > L.range) opacity = clamp(1 - (a - L.range) * 1.25, 0, 1)
  if (L.mode === 'slider' && a > 0) opacity = Math.min(opacity, 1 - Math.min(a, 1) * (1 - L.sideOpacity))
  return { x, y, z, rot, scale, opacity }
}

/** Projected distance from the track centre to the outer edge of the outermost visible card. */
function arcExtent(L: Layout) {
  const g = geom(L.range, L)
  const half = (L.cardW / 2) * g.scale
  const turn = (Math.abs(g.rot) * Math.PI) / 180
  const x = g.x + half * Math.cos(turn)
  const z = g.z + half * Math.sin(turn) // the outer edge swings toward the viewer
  return (x * ARC_PERSPECTIVE) / (ARC_PERSPECTIVE - z)
}

/** Signed slot offset of card i when card f is focused. */
export function offsetFor(i: number, f: number, n: number) {
  if (n <= 2) return i - f
  let d = (((i - f) % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

interface CarouselProps {
  projects: Project[]
  focusIndex: number
  /** how far every card moved in the last focus change (null = re-layout, no wrap path) */
  shift: number | null
  mode: CarouselMode
  /** stage visible and motion allowed: idle loops on the centre card run only then */
  live: boolean
  onStep: (delta: number) => void
  onOpen: (id: string) => void
  className?: string
}

/**
 * Curved 3D carousel. Cards sit on an arc that bows toward the viewer: the
 * focused card is flat and closest, neighbours turn inward, drop slightly and
 * recede. Drag / swipe, arrows, keyboard (handled by the stage) and clicking a
 * side card all move focus; cards that wrap around exit one side and re-enter
 * from the other instead of sweeping across the stage.
 */
export function Carousel({ projects, focusIndex, shift, mode, live, onStep, onOpen, className }: CarouselProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(rootRef)
  const [vh, setVh] = useState(() => window.innerHeight)
  const drag = useMotionValue(0)
  const didPan = useRef(false)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const firstPaint = useRef(true)
  useEffect(() => {
    firstPaint.current = false
  }, [])

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const L = computeLayout(width || 1200, vh, mode)
  const n = projects.length
  const focused = projects[focusIndex]

  // slots fold the drag offset into their own position first (child effects run first)
  useLayoutEffect(() => {
    drag.set(0)
  }, [focusIndex, projects, drag])

  // keep keyboard focus on the centre card while stepping with the arrows
  useEffect(() => {
    const active = document.activeElement
    if (!active || !rootRef.current?.contains(active) || !active.hasAttribute('data-pj-card')) return
    if (focused) buttons.current.get(focused.id)?.focus({ preventScroll: true })
  }, [focused])

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    // the release's own click fires in this task; keyboard activation must work again afterwards
    setTimeout(() => {
      didPan.current = false
    }, 0)
    const proj = info.offset.x / L.gap1 + (info.velocity.x / L.gap1) * 0.12
    let steps = -Math.round(proj)
    if (steps === 0 && Math.abs(proj) > 0.22) steps = -Math.sign(proj)
    steps = clamp(steps, -2, 2)
    if (steps === 0 || n <= 1) {
      animate(drag, 0, SPRING)
      return
    }
    onStep(steps)
  }

  // empty slots on the arc keep its shape when a filter leaves few cards
  const ghosts: number[] = []
  if (mode === 'arc' && n < 5) {
    const taken = new Set(projects.map((_, i) => offsetFor(i, focusIndex, n)))
    for (const d of [-2, -1, 1, 2]) if (!taken.has(d) && Math.abs(d) <= L.range) ghosts.push(d)
  }

  const trackH = L.cardH + (mode === 'arc' ? 64 : 36)
  // arc arrows sit just outside the outermost cards, as in the reference
  const arrowInset = mode === 'arc' ? Math.max(0, Math.round((width || 1200) / 2 - arcExtent(L) - ARROW_GAP - ARROW)) : 0

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Projects"
      className={cn('relative w-full', className)}
    >
      <motion.div
        className={cn('relative select-none', mode === 'slider' && '-mx-5 overflow-hidden sm:-mx-8')}
        style={{ height: trackH, perspective: mode === 'arc' ? ARC_PERSPECTIVE : 1100, perspectiveOrigin: '50% 30%', touchAction: 'pan-y' }}
        onPointerDownCapture={() => {
          didPan.current = false
        }}
        onPanStart={() => {
          didPan.current = true
        }}
        onPan={(_, info) => {
          if (n > 1) drag.set(clamp(info.offset.x / L.gap1, -1.8, 1.8))
        }}
        onPanEnd={onPanEnd}
      >
        {mode === 'arc' && <ArcFloor L={L} />}

        <AnimatePresence>
          {ghosts.map((d) => (
            <Ghost key={`ghost${d}`} d={d} L={L} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {projects.map((p, i) => (
            <Slot
              key={p.id}
              project={p}
              enterDelay={firstPaint.current ? 0.3 + Math.abs(offsetFor(i, focusIndex, n)) * 0.1 : 0.05}
              d={offsetFor(i, focusIndex, n)}
              index={i}
              total={n}
              shift={shift}
              L={L}
              drag={drag}
              reduced={reduced}
              live={live}
              focused={i === focusIndex}
              didPan={didPan}
              registerButton={(el) => {
                if (el) buttons.current.set(p.id, el)
                else buttons.current.delete(p.id)
              }}
              onSelect={(d) => onStep(d)}
              onOpen={() => onOpen(p.id)}
              onStrayFocus={() => focused && buttons.current.get(focused.id)?.focus({ preventScroll: true })}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* arc: big arrows flank the stage */}
      {mode === 'arc' && n > 1 && (
        <>
          <ArrowButton
            dir="prev"
            onClick={() => onStep(-1)}
            className="absolute"
            style={{ top: L.cardH / 2 - ARROW / 2 + 6, left: arrowInset }}
          />
          <ArrowButton
            dir="next"
            onClick={() => onStep(1)}
            className="absolute"
            style={{ top: L.cardH / 2 - ARROW / 2 + 6, right: arrowInset }}
          />
        </>
      )}

      {/* slider: arrows + dots under the card */}
      {mode === 'slider' && n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <ArrowButton dir="prev" onClick={() => onStep(-1)} className="relative" small />
          <div className="flex items-center">
          {projects.map((p, i) => {
            const on = i === focusIndex
            return (
              <button
                key={p.id}
                type="button"
                aria-label={`Show ${p.title}`}
                aria-current={on ? 'true' : undefined}
                onClick={() => onStep(offsetFor(i, focusIndex, n))}
                className="group grid h-10 w-9 place-items-center rounded-md min-[380px]:w-10"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all duration-500',
                    on ? 'w-6 bg-accent shadow-glow-sm' : 'w-1.5 bg-muted/40 group-hover:bg-accent/70',
                  )}
                />
              </button>
            )
          })}
          </div>
          <ArrowButton dir="next" onClick={() => onStep(1)} className="relative" small />
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {focused ? `${focused.title}, project ${focusIndex + 1} of ${n}` : 'No projects'}
      </p>
    </div>
  )
}

interface SlotProps {
  project: Project
  /** entrance delay in seconds */
  enterDelay: number
  d: number
  index: number
  total: number
  shift: number | null
  L: Layout
  drag: MotionValue<number>
  reduced: boolean
  live: boolean
  focused: boolean
  didPan: React.MutableRefObject<boolean>
  registerButton: (el: HTMLButtonElement | null) => void
  onSelect: (delta: number) => void
  onOpen: () => void
  /** a side card got focus (e.g. a closing dialog restored it there): hand it to the centre card */
  onStrayFocus: () => void
}

function Slot({
  project,
  enterDelay,
  d,
  index,
  total,
  shift,
  L,
  drag,
  reduced,
  live,
  focused,
  didPan,
  registerButton,
  onSelect,
  onOpen,
  onStrayFocus,
}: SlotProps) {
  const pos = useMotionValue(d)
  const prevD = useRef(d)
  const token = useRef(0)
  const ctrl = useRef<AnimationPlaybackControls | null>(null)
  const [hover, setHover] = useState(false)
  const [kbd, setKbd] = useState(false)

  useEffect(() => () => ctrl.current?.stop(), [])

  const transform = useTransform(() => {
    const g = geom(pos.get() + drag.get(), L)
    return `translate3d(${g.x.toFixed(2)}px, ${g.y.toFixed(2)}px, ${g.z.toFixed(2)}px) rotateY(${g.rot.toFixed(2)}deg) scale(${g.scale.toFixed(4)})`
  })
  const opacity = useTransform(() => geom(pos.get() + drag.get(), L).opacity)
  const zIndex = useTransform(() => 100 - Math.round(Math.abs(pos.get() + drag.get()) * 10))

  // declared after the derived values so their listeners are re-attached before pos changes
  useLayoutEffect(() => {
    const prev = prevD.current
    if (prev === d) return
    prevD.current = d
    const t = ++token.current
    ctrl.current?.stop()
    pos.set(pos.get() + drag.get())
    if (reduced) {
      pos.set(d)
      return
    }
    const edge = L.range + 1
    const unwrapped = shift == null ? d : prev + shift
    if (shift == null || unwrapped === d) {
      ctrl.current = animate(pos, d, SPRING)
      return
    }
    // wrap-around: leave in the direction of travel, re-enter from the far side
    const dir = Math.sign(shift)
    const run = async () => {
      if (Math.abs(pos.get()) < edge) {
        ctrl.current = animate(pos, dir * edge, { duration: 0.32, ease: [0.4, 0, 1, 1] })
        await ctrl.current
        if (t !== token.current) return
      }
      pos.set(-dir * edge)
      if (Math.abs(d) < edge) ctrl.current = animate(pos, d, SPRING)
      else pos.set(d)
    }
    void run()
    // only a change of slot starts a transition; the other inputs are read at that moment
  }, [d])

  const hidden = Math.abs(d) > L.range
  const lit = hover || kbd

  const handleClick = () => {
    if (didPan.current) return
    if (focused) onOpen()
    else onSelect(d)
  }

  return (
    <motion.div
      className="preserve-3d absolute left-1/2 top-0"
      style={{
        width: L.cardW,
        height: L.cardH,
        marginLeft: -L.cardW / 2,
        transform,
        opacity,
        zIndex,
        pointerEvents: hidden ? 'none' : undefined,
      }}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${project.title}`}
      aria-hidden={hidden || undefined}
    >
      <motion.div
        className="preserve-3d relative h-full"
        initial={{ opacity: 0, y: 60, scale: 0.88, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 46, scale: 0.84, filter: 'blur(10px)', transition: { duration: 0.35 } }}
        transition={{ duration: 0.7, delay: enterDelay, ease: [0.22, 1, 0.36, 1] }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-[8%] right-[8%] rounded-[50%] bg-accent blur-2xl transition-opacity duration-500"
          style={{ top: L.cardH - 18, height: 46, opacity: focused ? 0.55 : lit ? 0.35 : 0.12 }}
        />
        {focused && L.mode === 'arc' && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[4%] rounded-b-2xl"
            style={{
              top: L.cardH + 6,
              height: 54,
              background: 'linear-gradient(to bottom, rgb(var(--accent) / 0.22), transparent)',
              maskImage: 'linear-gradient(to bottom, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
              transform: 'perspective(400px) rotateX(55deg)',
              transformOrigin: 'top',
            }}
          />
        )}

        <motion.div
          className="preserve-3d relative h-full"
          animate={{ y: lit && !reduced ? -8 : 0, z: lit && !reduced ? 34 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
          <ProjectCard project={project} focused={focused} hover={lit} live={live} width={L.cardW} />
          <button
            ref={registerButton}
            type="button"
            data-pj-card=""
            tabIndex={focused ? 0 : -1}
            aria-label={focused ? `Open case study: ${project.title}` : `Show ${project.title}`}
            onClick={handleClick}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
            onPointerLeave={() => setHover(false)}
            onFocus={(e) => {
              // only the centre card is a tab stop; anything else landing here is passed on
              if (!focused) return onStrayFocus()
              setKbd(e.currentTarget.matches(':focus-visible'))
            }}
            onBlur={() => setKbd(false)}
            className="absolute inset-0 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function Ghost({ d, L }: { d: number; L: Layout }) {
  const g = geom(d, L)
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0"
      style={{
        width: L.cardW,
        height: L.cardH,
        marginLeft: -L.cardW / 2,
        transform: `translate3d(${g.x}px, ${g.y}px, ${g.z}px) rotateY(${g.rot}deg) scale(${g.scale})`,
        zIndex: 10,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="relative h-full w-full rounded-2xl border border-dashed border-accent/25 bg-accent/[0.025]">
        <span className="absolute inset-0 rounded-2xl bg-[repeating-linear-gradient(135deg,rgb(var(--accent)/0.05)_0_2px,transparent_2px_10px)]" />
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-[9.5px] uppercase tracking-[0.24em] text-muted/50">
          empty slot
        </span>
      </div>
    </motion.div>
  )
}

/** The elliptical stage floor the arc of cards stands on. */
function ArcFloor({ L }: { L: Layout }) {
  const w = L.range > 1 ? L.gap1 * 2 + L.gap2 * 2 + L.cardW * 1.5 : L.gap1 * 2 + L.cardW * 1.9
  const h = Math.max(120, w * 0.12)
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{ width: w, height: h, top: L.cardH * 0.6, zIndex: 0 }}
    >
      {/* the turning dashed ring repaints every frame: it gets its own layer between the
          static floor art below and above it, so the gradients and blurred glints stay cached */}
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <radialGradient id="pjFloorFill" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.2" />
            <stop offset="70%" stopColor="rgb(var(--accent))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pjFloorRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="rgb(var(--accent-3))" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <ellipse cx="500" cy="44" rx="490" ry="58" fill="url(#pjFloorFill)" />
        <ellipse cx="500" cy="44" rx="490" ry="58" fill="none" stroke="url(#pjFloorRim)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg
        viewBox="0 0 1000 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ willChange: 'transform' }}
      >
        <ellipse
          cx="500"
          cy="50"
          rx="440"
          ry="48"
          fill="none"
          stroke="rgb(var(--accent) / 0.5)"
          strokeWidth="2"
          strokeDasharray="38 26"
          vectorEffect="non-scaling-stroke"
          style={{ animation: 'pj-dash 2.6s linear infinite' }}
        />
      </svg>
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <ellipse cx="500" cy="58" rx="380" ry="38" fill="none" stroke="rgb(var(--accent-2) / 0.25)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {[300, 700].map((x) => (
          <ellipse key={x} cx={x} cy={100} rx={46} ry={3} fill="rgb(var(--accent-3) / 0.75)" style={{ filter: 'blur(2px)' }} />
        ))}
      </svg>
    </div>
  )
}

function ArrowButton({
  dir,
  onClick,
  className,
  style,
  small,
}: {
  dir: 'prev' | 'next'
  onClick: () => void
  className?: string
  style?: React.CSSProperties
  small?: boolean
}) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous project' : 'Next project'}
      className={cn(
        'group z-[120] grid place-items-center rounded-full border border-accent/50 bg-deep/70 text-accent backdrop-blur-md',
        'shadow-[0_0_22px_-6px_rgb(var(--accent)/0.6)] transition-[border-color,background-color,box-shadow,color,transform] duration-300',
        'hover:scale-105 hover:border-accent hover:bg-accent/20 hover:text-ink hover:shadow-glow active:scale-95',
        small ? 'h-11 w-11' : 'h-14 w-14',
        className,
      )}
      style={style}
    >
      <span className="pointer-events-none absolute inset-1 rounded-full border border-accent/15" />
      <Icon
        aria-hidden
        className={cn(
          'relative transition-transform duration-300',
          small ? 'h-5 w-5' : 'h-6 w-6',
          dir === 'prev' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
        )}
      />
    </button>
  )
}
