import {
  Component,
  Suspense,
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { useTheme } from '@/theme/ThemeProvider'
import { morphVars, type Theme } from '@/theme/themes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { THEME_MORPH_MS, themeMorphEase } from '@/components/fx/hooks'
import { seeded } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * Palette rig: one set of colours per canvas, shared BY REFERENCE by   *
 * every material and eased toward the active theme on the same curve   *
 * and length as the CSS palette morph. Materials never receive colour  *
 * props, so a theme change re-renders nothing in the scene graph.      *
 * ------------------------------------------------------------------ */

type Role = 'accent' | 'accent2' | 'accent3' | 'glow'
type Palette = Record<Role, THREE.Color>

const ROLES: Role[] = ['accent', 'accent2', 'accent3', 'glow']
/** the chip runs hot: an over-range accent3 that tone mapping rolls toward white */
const GLOW_GAIN = 1.9

function paletteFor(theme: Theme): Palette {
  return {
    accent: new THREE.Color(theme.gl.accent),
    accent2: new THREE.Color(theme.gl.accent2),
    accent3: new THREE.Color(theme.gl.accent3),
    glow: new THREE.Color(theme.gl.accent3).multiplyScalar(GLOW_GAIN),
  }
}

const PaletteCtx = createContext<Palette | null>(null)

/** Ref callback that points a material's colour at a shared palette colour. */
function useTint(role: Role) {
  const palette = useContext(PaletteCtx)
  return useMemo(
    () => (material: THREE.Material | null) => {
      const target = palette?.[role]
      if (material && target && 'color' in material) (material as THREE.MeshBasicMaterial).color = target
    },
    [palette, role],
  )
}

function PaletteProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const reduced = useReducedMotion()
  const invalidate = useThree((s) => s.invalidate)
  const [palette] = useState(() => paletteFor(theme))
  const tween = useRef<{ from: Palette; to: Palette; start: number } | null>(null)
  const shown = useRef(theme.id)

  useEffect(() => {
    if (shown.current === theme.id) return
    shown.current = theme.id
    const to = paletteFor(theme)
    if (reduced) {
      ROLES.forEach((r) => palette[r].copy(to[r]))
      tween.current = null
    } else {
      const from = paletteFor(theme)
      ROLES.forEach((r) => from[r].copy(palette[r]))
      tween.current = { from, to, start: performance.now() }
    }
    invalidate()
  }, [theme, reduced, palette, invalidate])

  useFrame(() => {
    const tw = tween.current
    if (!tw) return
    const p = Math.min(1, (performance.now() - tw.start) / THEME_MORPH_MS)
    const e = themeMorphEase(p)
    ROLES.forEach((r) => palette[r].lerpColors(tw.from[r], tw.to[r], e))
    if (p >= 1) tween.current = null
    else invalidate()
  })

  return <PaletteCtx.Provider value={palette}>{children}</PaletteCtx.Provider>
}

/* ------------------------------------------------------------------ *
 * Small local stand-ins for drei's Float and Edges (drei pulled ~100   *
 * KB plus a fat-line shader into the bundle for these two).            *
 * ------------------------------------------------------------------ */

/** Gentle bob + sway, the same curves as drei's <Float>. */
function Bob({
  speed,
  rotationIntensity,
  floatIntensity,
  children,
}: {
  speed: number
  rotationIntensity: number
  floatIntensity: number
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const offset = useMemo(() => Math.random() * 10000, [])
  useFrame((state) => {
    const g = ref.current
    if (!g || speed === 0) return
    const t = ((offset + state.clock.getElapsedTime()) / 4) * speed
    g.rotation.x = (Math.cos(t) / 8) * rotationIntensity
    g.rotation.y = (Math.sin(t) / 8) * rotationIntensity
    g.rotation.z = (Math.sin(t) / 20) * rotationIntensity
    g.position.y = (Math.sin(t) / 10) * floatIntensity
  })
  return <group ref={ref}>{children}</group>
}

const noRaycast = () => null

/** Hard edges of a box as 1px lines in a palette colour. */
function BoxEdges({ args, role, opacity = 1 }: { args: [number, number, number]; role: Role; opacity?: number }) {
  const tint = useTint(role)
  const [w, h, d] = args
  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(w, h, d)
    const edges = new THREE.EdgesGeometry(box, 15)
    box.dispose()
    return edges
  }, [w, h, d])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <lineSegments geometry={geometry} raycast={noRaycast}>
      <lineBasicMaterial ref={tint} transparent={opacity < 1} opacity={opacity} />
    </lineSegments>
  )
}

/* ------------------------------------------------------------------ *
 * Pieces                                                              *
 * ------------------------------------------------------------------ */

function WireShell({
  size,
  speed,
  opacity,
  edgeOpacity = 0.6,
  role,
  dir = 1,
}: {
  size: number
  speed: number
  opacity: number
  edgeOpacity?: number
  role: Role
  dir?: number
}) {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  const tint = useTint(role)

  useFrame((state, dt) => {
    if (!group.current || reduced) return
    group.current.rotation.y += dt * speed * dir
    group.current.rotation.x += dt * speed * 0.42 * dir
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.1 + size) * 0.015
    group.current.scale.setScalar(pulse)
  })

  return (
    <group ref={group}>
      <mesh raycast={noRaycast}>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial
          ref={tint}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <BoxEdges args={[size, size, size]} role={role} opacity={edgeOpacity} />
    </group>
  )
}

/** The glowing processor at the heart of the hologram. */
function CoreChip() {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  const glow = useTint('glow')
  const accent = useTint('accent')
  const die = useTint('accent3')

  const pins = useMemo(() => {
    const out: { pos: [number, number, number]; rot: [number, number, number] }[] = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const o = -0.45 + (i / (n - 1)) * 0.9
      out.push({ pos: [o, 0, 0.62], rot: [0, 0, 0] })
      out.push({ pos: [o, 0, -0.62], rot: [0, 0, 0] })
      out.push({ pos: [0.62, 0, o], rot: [0, Math.PI / 2, 0] })
      out.push({ pos: [-0.62, 0, o], rot: [0, Math.PI / 2, 0] })
    }
    return out
  }, [])

  useFrame((state, dt) => {
    if (!group.current) return
    if (!reduced) group.current.rotation.y += dt * 0.55
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.04
    group.current.scale.setScalar(s)
  })

  return (
    <group ref={group}>
      {/* chip body: unlit, driven past 1.0 so tone mapping makes it run hot */}
      <mesh raycast={noRaycast}>
        <boxGeometry args={[1.05, 0.26, 1.05]} />
        <meshBasicMaterial ref={glow} transparent opacity={0.9} />
      </mesh>
      <BoxEdges args={[1.05, 0.26, 1.05]} role="accent" />

      {/* pins */}
      {pins.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot} raycast={noRaycast}>
          <boxGeometry args={[0.07, 0.05, 0.16]} />
          <meshBasicMaterial ref={accent} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* inner die glow */}
      <mesh position={[0, 0.16, 0]} raycast={noRaycast}>
        <boxGeometry args={[0.5, 0.03, 0.5]} />
        <meshBasicMaterial ref={die} transparent opacity={0.95} />
      </mesh>
    </group>
  )
}

/** Tilted orbit rings around the core. */
function OrbitRings() {
  const a = useRef<THREE.Mesh>(null)
  const b = useRef<THREE.Mesh>(null)
  const c = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  const accent = useTint('accent')
  const accent2 = useTint('accent2')

  useFrame((_, dt) => {
    if (reduced) return
    if (a.current) a.current.rotation.z += dt * 0.6
    if (b.current) b.current.rotation.x += dt * 0.45
    if (c.current) c.current.rotation.y += dt * 0.35
  })

  const mat = (tint: (m: THREE.Material | null) => void) => (
    <meshBasicMaterial ref={tint} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
  )

  return (
    <group>
      <mesh ref={a} rotation={[Math.PI / 2.6, 0, 0]} raycast={noRaycast}>
        <torusGeometry args={[2.25, 0.012, 8, 128]} />
        {mat(accent)}
      </mesh>
      <mesh ref={b} rotation={[0, Math.PI / 3, Math.PI / 5]} raycast={noRaycast}>
        <torusGeometry args={[2.6, 0.009, 8, 128]} />
        {mat(accent2)}
      </mesh>
      <mesh ref={c} rotation={[Math.PI / 1.8, Math.PI / 6, 0]} raycast={noRaycast}>
        <torusGeometry args={[1.95, 0.008, 8, 128]} />
        {mat(accent)}
      </mesh>
    </group>
  )
}

/** Data motes swirling inside the shells. */
function InnerMotes() {
  const pts = useRef<THREE.Points>(null)
  const reduced = useReducedMotion()
  const tint = useTint('accent3')

  const positions = useMemo(() => {
    const rnd = seeded(4242)
    const n = 260
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 0.4 + rnd() * 1.5
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th)
      arr[i * 3 + 1] = r * Math.cos(ph)
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    return arr
  }, [])

  useFrame((state, dt) => {
    if (!pts.current || reduced) return
    pts.current.rotation.y += dt * 0.22
    pts.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
  })

  return (
    <points ref={pts} raycast={noRaycast}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={tint}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Curved energy conduits that arc away from the core toward the panels. */
function EnergyStreams() {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  const tint = useTint('accent2')

  const curves = useMemo(() => {
    const rnd = seeded(777)
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2
      const spread = 3.4 + rnd() * 2.2
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(a) * 1.6, (rnd() - 0.5) * 1.4, Math.sin(a) * 1.6),
        new THREE.Vector3(Math.cos(a) * 2.7, (rnd() - 0.5) * 2.2, Math.sin(a) * 2.7),
        new THREE.Vector3(Math.cos(a) * spread, (rnd() - 0.5) * 2.8, Math.sin(a) * spread),
      ])
    })
  }, [])

  const pulses = useRef<THREE.Mesh[]>([])
  // resting spots for the pulses when motion is reduced (useFrame owns them otherwise)
  const rest = useMemo(() => curves.map((c, i) => c.getPointAt(0.35 + i * 0.07)), [curves])

  useFrame((state, dt) => {
    if (group.current && !reduced) group.current.rotation.y += dt * 0.07
    if (reduced) return
    pulses.current.forEach((m, i) => {
      if (!m) return
      const t = (state.clock.elapsedTime * 0.28 + i / curves.length) % 1
      curves[i].getPointAt(t, m.position)
      m.scale.setScalar(0.06 + Math.sin(t * Math.PI) * 0.08)
    })
  })

  return (
    <group ref={group}>
      {curves.map((curve, i) => (
        <group key={i}>
          <mesh raycast={noRaycast}>
            <tubeGeometry args={[curve, 48, 0.008, 6, false]} />
            <meshBasicMaterial ref={tint} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) pulses.current[i] = el
            }}
            position={rest[i]}
            scale={reduced ? 0.1 : 0}
            raycast={noRaycast}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial ref={tint} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Pedestal discs + expanding light rings beneath the hologram. */
function Pedestal() {
  const rings = useRef<THREE.Mesh[]>([])
  const reduced = useReducedMotion()
  const accent = useTint('accent')
  const accent3 = useTint('accent3')

  useFrame((state) => {
    if (reduced) return
    rings.current.forEach((m, i) => {
      if (!m) return
      const t = (state.clock.elapsedTime * 0.45 + i / 3) % 1
      m.scale.setScalar(0.9 + t * 2.3)
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.5
    })
  })

  return (
    <group position={[0, -2.55, 0]}>
      {/* stacked platter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
        <ringGeometry args={[1.25, 1.95, 72]} />
        <meshBasicMaterial ref={accent} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} raycast={noRaycast}>
        <ringGeometry args={[0.7, 1.15, 64]} />
        <meshBasicMaterial ref={accent3} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]} raycast={noRaycast}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial ref={accent3} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* emitter light cone */}
      <mesh position={[0, 1.3, 0]} raycast={noRaycast}>
        <coneGeometry args={[1.5, 2.6, 36, 1, true]} />
        <meshBasicMaterial
          ref={accent}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* pulsing ground rings */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
          raycast={noRaycast}
          ref={(el) => {
            if (el) rings.current[i] = el
          }}
        >
          <ringGeometry args={[1.4, 1.5, 72]} />
          <meshBasicMaterial
            ref={accent}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/*
 * The canvas sits behind the page content, so it never receives pointer
 * events itself — track the pointer at window level instead.
 */
const windowPointer = { x: 0, y: 0 }
let pointerTracked = false
function trackWindowPointer() {
  if (pointerTracked) return
  pointerTracked = true
  window.addEventListener(
    'pointermove',
    (e) => {
      windowPointer.x = (e.clientX / window.innerWidth) * 2 - 1
      windowPointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true },
  )
}

/** Whole assembly — tilts toward the pointer. */
function Rig(props: ThreeElements['group']) {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()

  useFrame((state, dt) => {
    if (!group.current) return
    const { x, y } = windowPointer
    const tx = reduced ? 0 : y * 0.22
    const ty = reduced ? 0 : x * 0.5
    group.current.rotation.x += (tx - group.current.rotation.x) * Math.min(1, dt * 2.4)
    group.current.rotation.y += (ty - group.current.rotation.y) * Math.min(1, dt * 2.4)
    if (!reduced) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.12
    }
  })

  return (
    <group ref={group} {...props}>
      <Bob speed={reduced ? 0 : 1.4} rotationIntensity={0.25} floatIntensity={0.5}>
        <WireShell size={2.75} speed={0.12} opacity={0.022} edgeOpacity={0.3} role="accent" />
        <WireShell size={2.1} speed={0.2} opacity={0.04} edgeOpacity={0.45} role="accent2" dir={-1} />
        <WireShell size={1.55} speed={0.3} opacity={0.07} edgeOpacity={0.7} role="accent3" />
        <InnerMotes />
        <CoreChip />
        <OrbitRings />
      </Bob>
      <EnergyStreams />
      <Pedestal />
    </group>
  )
}

type ProgramHandle = { isReady?: () => boolean }

/**
 * Compiles every shader program before the first frame. With
 * KHR_parallel_shader_compile (Chrome on ANGLE) the driver links them off
 * the main thread, so mounting a core no longer stalls the page for several
 * hundred ms; the render loop starts once they are all ready.
 *
 * This is three's compileAsync() with an off switch: its own poll keeps
 * running after the canvas unmounts (leaving Projects mid-compile) and then
 * throws on the disposed materials, an uncaught error in a timer.
 */
function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const ready = useRef(onReady)
  ready.current = onReady
  useEffect(() => {
    // shader diagnostics are synchronous driver round-trips on first use
    // (~300 ms on ANGLE / D3D11 for this scene): keep them for development
    gl.debug.checkShaderErrors = import.meta.env.DEV
    let alive = true
    let timer = 0
    let pending: Set<THREE.Material>
    try {
      pending = gl.compile(scene, camera)
    } catch {
      pending = new Set()
    }
    const poll = () => {
      if (!alive) return
      try {
        for (const material of pending) {
          const program = (gl.properties.get(material) as { currentProgram?: ProgramHandle }).currentProgram
          // a program that is gone (disposed, context lost) will never report ready: stop waiting for it
          if (!program?.isReady || program.isReady()) pending.delete(material)
        }
      } catch {
        pending.clear()
      }
      if (pending.size === 0) ready.current()
      else timer = window.setTimeout(poll, 16)
    }
    poll()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [gl, scene, camera])
  return null
}

/** The pedestal rings expand past the canvas bounds — feather the edges so they fade instead of clipping. */
const FEATHER = 'radial-gradient(50% 50% at 50% 50%, #000 66%, transparent 100%)'

/* ------------------------------------------------------------------ *
 * WebGL can be missing — hardened browsers, locked-down GPUs, remote  *
 * desktops. Without a guard the renderer's throw unmounts the whole   *
 * app, so probe once and keep a boundary as the second line.          *
 * ------------------------------------------------------------------ */

let webglSupport: boolean | null = null

function hasWebGL() {
  if (webglSupport !== null) return webglSupport
  try {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl')
    webglSupport = !!gl
    // hand the probe context back right away; browsers cap live contexts
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    webglSupport = false
    console.warn('[holo-core] WebGL unavailable, showing the static core:', error.message)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Static SVG stand-in for the WebGL core: same silhouette, themed, no GPU needed. */
function CoreFallback() {
  const { theme } = useTheme()
  // two cores can be mounted at once (background + Projects stage): keep gradient ids unique
  const beam = `core-beam-${useId().replace(/:/g, '')}`
  const edge = 'rgb(var(--accent) / 0.8)'
  const hidden = 'rgb(var(--accent) / 0.3)'
  return (
    <div aria-hidden className="palette-morph relative grid h-full w-full place-items-center" style={morphVars(theme)}>
      <div className="absolute inset-[22%] rounded-full bg-accent/15 blur-3xl" />
      <svg
        viewBox="0 0 200 220"
        className="relative h-[72%] w-[72%] overflow-visible"
        style={{ filter: 'drop-shadow(0 0 14px rgb(var(--accent) / 0.55))' }}
      >
        <defs>
          <linearGradient id={beam} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.35" />
            <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* pedestal + emitter beam */}
        <path d="M58 192 L86 112 L114 112 L142 192 Z" fill={`url(#${beam})`} />
        <ellipse cx="100" cy="194" rx="74" ry="15" fill="none" stroke="rgb(var(--accent) / 0.35)" />
        <ellipse
          cx="100"
          cy="194"
          rx="50"
          ry="10"
          fill="rgb(var(--accent) / 0.12)"
          stroke="rgb(var(--accent-3) / 0.55)"
          className="motion-safe:animate-pulse"
        />

        <g className="motion-safe:animate-float-slow">
          {/* outer wire cube (isometric): hidden edges first, then the visible hull */}
          <g fill="none" strokeWidth="1.1" strokeLinejoin="round">
            <path d="M100 88 L100 20 M100 88 L159 122 M100 88 L41 122" stroke={hidden} strokeDasharray="3 4" />
            <path d="M100 20 L159 54 L159 122 L100 156 L41 122 L41 54 Z" stroke={edge} />
            <path d="M100 88 L159 54 M100 88 L41 54 M100 88 L100 156" stroke={edge} />
          </g>
          {/* inner cube + chip */}
          <g fill="none" strokeWidth="1" stroke="rgb(var(--accent-2) / 0.8)">
            <path d="M100 58 L126 73 L126 103 L100 118 L74 103 L74 73 Z" />
            <path d="M100 88 L126 73 M100 88 L74 73 M100 88 L100 118" />
          </g>
          <rect x="91" y="79" width="18" height="18" rx="3" transform="rotate(45 100 88)" fill="rgb(var(--accent-3) / 0.85)" />
          <circle cx="100" cy="88" r="20" fill="rgb(var(--accent-3) / 0.18)" />
        </g>
      </svg>
    </div>
  )
}

export function HoloCore({
  className,
  paused = false,
}: {
  className?: string
  /** stops the render loop (e.g. while this instance is faded out) */
  paused?: boolean
}) {
  const reduced = useReducedMotion()
  // nothing renders until every program is compiled (see Warmup); the core then fades in
  const [warm, setWarm] = useState(false)

  useEffect(trackWindowPointer, [])

  const fallback = <CoreFallback />
  const loop = !warm || paused ? 'never' : reduced ? 'demand' : 'always'

  return (
    <div className={className} style={{ maskImage: FEATHER, WebkitMaskImage: FEATHER }}>
      {hasWebGL() ? (
        <GLBoundary fallback={fallback}>
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0.4, 8.6], fov: 40 }}
            frameloop={loop}
            style={{ pointerEvents: 'none', opacity: warm ? 1 : 0, transition: 'opacity 0.6s ease-out' }}
          >
            <Suspense fallback={null}>
              <PaletteProvider>
                <Rig position={[0, 0.5, 0]} />
              </PaletteProvider>
              <Warmup onReady={() => setWarm(true)} />
            </Suspense>
          </Canvas>
        </GLBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}
