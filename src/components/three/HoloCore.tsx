import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { Edges, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '@/theme/ThemeProvider'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { seeded } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * Shared colour rig — every material lerps toward the active theme    *
 * so switching sections melts the hologram into the new palette.      *
 * ------------------------------------------------------------------ */

function useThemeColors() {
  const { theme } = useTheme()
  return useMemo(
    () => ({
      accent: new THREE.Color(theme.gl.accent),
      accent2: new THREE.Color(theme.gl.accent2),
      accent3: new THREE.Color(theme.gl.accent3),
    }),
    [theme],
  )
}

/** Smoothly drives a material's colour + emissive toward a target. */
function useColorLerp(
  ref: React.RefObject<THREE.Mesh | THREE.LineSegments | THREE.Points>,
  target: THREE.Color,
  speed = 2.2,
) {
  useFrame((_, dt) => {
    const obj = ref.current
    if (!obj) return
    const mat = obj.material as THREE.Material & {
      color?: THREE.Color
      emissive?: THREE.Color
    }
    const t = Math.min(1, dt * speed)
    mat.color?.lerp(target, t)
    mat.emissive?.lerp(target, t)
  })
}

/* ------------------------------------------------------------------ *
 * Pieces                                                              *
 * ------------------------------------------------------------------ */

function WireShell({
  size,
  speed,
  opacity,
  edgeOpacity = 0.6,
  color,
  dir = 1,
}: {
  size: number
  speed: number
  opacity: number
  edgeOpacity?: number
  color: THREE.Color
  dir?: number
}) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  useColorLerp(mesh, color)

  useFrame((state, dt) => {
    if (!group.current || reduced) return
    group.current.rotation.y += dt * speed * dir
    group.current.rotation.x += dt * speed * 0.42 * dir
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.1 + size) * 0.015
    group.current.scale.setScalar(pulse)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
        <Edges scale={1} threshold={15}>
          <lineBasicMaterial color={color} transparent opacity={edgeOpacity} />
        </Edges>
      </mesh>
    </group>
  )
}

/** The glowing processor at the heart of the hologram. */
function CoreChip({ color, glow }: { color: THREE.Color; glow: THREE.Color }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  useColorLerp(body, glow)

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
      {/* chip body */}
      <mesh ref={body}>
        <boxGeometry args={[1.05, 0.26, 1.05]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={0.9}
          roughness={0.35}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
        <Edges threshold={15}>
          <lineBasicMaterial color={color} />
        </Edges>
      </mesh>

      {/* pins */}
      {pins.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot}>
          <boxGeometry args={[0.07, 0.05, 0.16]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* inner die glow */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.5]} />
        <meshBasicMaterial color={glow} transparent opacity={0.95} />
      </mesh>

      <pointLight color={glow} intensity={7} distance={6} decay={2} />
    </group>
  )
}

/** Tilted orbit rings around the core. */
function OrbitRings({ color, alt }: { color: THREE.Color; alt: THREE.Color }) {
  const a = useRef<THREE.Mesh>(null)
  const b = useRef<THREE.Mesh>(null)
  const c = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  useColorLerp(a, color)
  useColorLerp(b, alt)
  useColorLerp(c, color)

  useFrame((_, dt) => {
    if (reduced) return
    if (a.current) a.current.rotation.z += dt * 0.6
    if (b.current) b.current.rotation.x += dt * 0.45
    if (c.current) c.current.rotation.y += dt * 0.35
  })

  const mat = (col: THREE.Color) => (
    <meshBasicMaterial
      color={col}
      transparent
      opacity={0.55}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  )

  return (
    <group>
      <mesh ref={a} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[2.25, 0.012, 8, 128]} />
        {mat(color)}
      </mesh>
      <mesh ref={b} rotation={[0, Math.PI / 3, Math.PI / 5]}>
        <torusGeometry args={[2.6, 0.009, 8, 128]} />
        {mat(alt)}
      </mesh>
      <mesh ref={c} rotation={[Math.PI / 1.8, Math.PI / 6, 0]}>
        <torusGeometry args={[1.95, 0.008, 8, 128]} />
        {mat(color)}
      </mesh>
    </group>
  )
}

/** Data motes swirling inside the shells. */
function InnerMotes({ color }: { color: THREE.Color }) {
  const pts = useRef<THREE.Points>(null)
  const reduced = useReducedMotion()
  useColorLerp(pts, color)

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
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
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
function EnergyStreams({ color }: { color: THREE.Color }) {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()

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

  useFrame((state, dt) => {
    if (group.current && !reduced) group.current.rotation.y += dt * 0.07
    if (reduced) return
    pulses.current.forEach((m, i) => {
      if (!m) return
      const t = (state.clock.elapsedTime * 0.28 + i / curves.length) % 1
      const p = curves[i].getPointAt(t)
      m.position.copy(p)
      const s = 0.06 + Math.sin(t * Math.PI) * 0.08
      m.scale.setScalar(s)
    })
  })

  return (
    <group ref={group}>
      {curves.map((curve, i) => (
        <group key={i}>
          <mesh>
            <tubeGeometry args={[curve, 48, 0.008, 6, false]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) pulses.current[i] = el
            }}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Pedestal discs + expanding light rings beneath the hologram. */
function Pedestal({ color, alt }: { color: THREE.Color; alt: THREE.Color }) {
  const rings = useRef<THREE.Mesh[]>([])
  const reduced = useReducedMotion()

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
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.95, 72]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[0.7, 1.15, 64]} />
        <meshBasicMaterial color={alt} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial
          color={alt}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* emitter light cone */}
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[1.5, 2.6, 36, 1, true]} />
        <meshBasicMaterial
          color={color}
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
          ref={(el) => {
            if (el) rings.current[i] = el
          }}
        >
          <ringGeometry args={[1.4, 1.5, 72]} />
          <meshBasicMaterial
            color={color}
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
  const { accent, accent2, accent3 } = useThemeColors()
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
      <Float speed={reduced ? 0 : 1.4} rotationIntensity={0.25} floatIntensity={0.5}>
        <WireShell size={2.75} speed={0.12} opacity={0.022} edgeOpacity={0.15} color={accent} />
        <WireShell size={2.1} speed={0.2} opacity={0.04} edgeOpacity={0.26} color={accent2} dir={-1} />
        <WireShell size={1.55} speed={0.3} opacity={0.07} edgeOpacity={0.45} color={accent} />
        <InnerMotes color={accent3} />
        <CoreChip color={accent} glow={accent3} />
        <OrbitRings color={accent} alt={accent2} />
      </Float>
      <EnergyStreams color={accent2} />
      <Pedestal color={accent} alt={accent3} />
    </group>
  )
}

function Lights() {
  const { accent, accent2 } = useThemeColors()
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 5]} intensity={28} color={accent} distance={18} decay={2} />
      <pointLight position={[-5, -2, 3]} intensity={22} color={accent2} distance={18} decay={2} />
      <pointLight position={[0, 5, -4]} intensity={14} color={accent2} distance={20} decay={2} />
    </>
  )
}

/** The pedestal rings expand past the canvas bounds — feather the edges so they fade instead of clipping. */
const FEATHER = 'radial-gradient(50% 50% at 50% 50%, #000 66%, transparent 100%)'

export function HoloCore({
  className,
  paused = false,
}: {
  className?: string
  /** stops the render loop (e.g. while this instance is faded out) */
  paused?: boolean
}) {
  const reduced = useReducedMotion()

  useEffect(trackWindowPointer, [])

  return (
    <div className={className} style={{ maskImage: FEATHER, WebkitMaskImage: FEATHER }}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.4, 8.6], fov: 40 }}
        frameloop={paused ? 'never' : reduced ? 'demand' : 'always'}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <Rig position={[0, 0.5, 0]} />
        </Suspense>
      </Canvas>
    </div>
  )
}
