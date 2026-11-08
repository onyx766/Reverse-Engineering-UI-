import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { usePageVisible } from '@/components/fx/hooks'
import { ParticleField } from './ParticleField'
import { seeded } from '@/lib/utils'

const rand = seeded(90210)
const BARS = Array.from({ length: 14 }, () => ({
  top: rand() * 90,
  left: rand() * 100,
  w: 40 + rand() * 180,
  h: rand() > 0.55 ? 3 : 2,
  delay: rand() * 6,
  dur: 4 + rand() * 6,
  vertical: rand() > 0.7,
  op: 0.12 + rand() * 0.3,
}))

/** Ceiling rig spotlights: soft conic cones, angle in degrees (180 = straight down). */
const BEAMS = [
  { left: '16%', angle: 172, spread: 13, op: 0.1 },
  { left: '50%', angle: 180, spread: 16, op: 0.12 },
  { left: '84%', angle: 188, spread: 13, op: 0.1 },
]

/**
 * The lab the whole portfolio floats inside. Every layer is tinted by the
 * active section palette: wash → spotlights → horizon → floor rings → aurora →
 * neon strips → grid floor/ceiling → particles → scan beam → vignette/scanlines.
 *
 * Performance budget (iGPU): no blur filters on large layers, pointer
 * parallax through motion values (zero React renders per move), and every
 * loop is a compositor-only transform/opacity animation that pauses while
 * the tab is hidden.
 */
export function Background() {
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const paused = reduced || !visible

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 60, damping: 22, mass: 1 })
  const py = useSpring(my, { stiffness: 60, damping: 22, mass: 1 })

  useEffect(() => {
    if (reduced) {
      mx.set(0)
      my.set(0)
      return
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced, mx, my])

  const auroraX = useTransform(px, (v) => v * -26)
  const auroraY = useTransform(py, (v) => v * -18)
  const stripsX = useTransform(px, (v) => v * -12)
  const stripsY = useTransform(py, (v) => v * -8)
  const floorOrigin = useTransform(px, (v) => `${50 + v * 6}% 0%`)
  const floorTransform = useTransform(py, (v) => `rotateX(74deg) translateY(${v * 10}px)`)
  const ceilingTransform = useTransform(py, (v) => `rotateX(-72deg) translateY(${v * -8}px)`)

  return (
    <div
      aria-hidden
      data-fx-paused={paused ? 'true' : undefined}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1 — base wash */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(95rem 62rem at 50% -12%, rgb(var(--accent) / 0.20), transparent 62%),
                       radial-gradient(62rem 44rem at 6% 106%, rgb(var(--accent-2) / 0.16), transparent 62%),
                       radial-gradient(54rem 42rem at 96% 64%, rgb(var(--accent-3) / 0.10), transparent 62%),
                       rgb(var(--deep))`,
        }}
      />

      {/* static layers 2–4 stay BELOW the animated ones, or Chrome promotes each to its own GPU layer */}

      {/* 2 — ceiling spotlights */}
      {BEAMS.map((b) => (
        <span
          key={b.left}
          className="absolute top-0 h-[88vh] w-[72vh] -translate-x-1/2"
          style={{
            left: b.left,
            background: `conic-gradient(from ${b.angle - b.spread}deg at 50% -4%, transparent 0deg, rgb(var(--accent) / ${b.op}) ${b.spread}deg, transparent ${b.spread * 2}deg)`,
            maskImage: 'linear-gradient(to bottom, black 10%, transparent 92%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 92%)',
          }}
        />
      ))}

      {/* 3 — horizon: haze and bloom are centred ON the horizon so neither side ends in an edge */}
      <div className="absolute inset-x-0 top-[42vh]">
        <div
          className="absolute inset-x-0 -top-[18vh] h-[36vh]"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgb(var(--accent) / 0.05) 35%, rgb(var(--accent) / 0.08) 50%, rgb(var(--accent) / 0.04) 66%, transparent)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-[26vh] w-[130vw] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(closest-side, rgb(var(--accent) / 0.2), rgb(var(--accent) / 0.08) 45%, rgb(var(--accent) / 0.02) 75%, transparent)',
          }}
        />
      </div>

      {/* 4 — floor rings echoing the emitter pedestal */}
      <div
        className="absolute left-1/2 top-[74vh] hidden h-[34vh] w-[150vh] -translate-x-1/2 sm:block"
        style={{
          background:
            'radial-gradient(closest-side, transparent 57%, rgb(var(--accent) / 0.11) 59.5%, transparent 62%, transparent 75%, rgb(var(--accent-2) / 0.08) 77.5%, transparent 80%, transparent 92%, rgb(var(--accent) / 0.06) 94.5%, transparent 97%)',
        }}
      />

      {/* 5 — drifting aurora (pre-softened gradients instead of a blur filter) */}
      <motion.div className="absolute inset-0" style={{ x: auroraX, y: auroraY }}>
        <Blob className="-left-[6%] top-[0%] h-[46rem] w-[46rem]" delay={0} />
        <Blob className="-right-[8%] top-[18%] h-[40rem] w-[40rem]" delay={-7} alt />
        <Blob className="-bottom-[10%] left-[24%] h-[42rem] w-[42rem]" delay={-12} />
      </motion.div>

      {/* 6 — distant neon strips (the server-room glow in the reference) */}
      <motion.div className="absolute inset-0" style={{ x: stripsX, y: stripsY }}>
        {BARS.map((b, i) => (
          <span
            key={i}
            className="fx-strip absolute rounded-full"
            style={{
              top: `${b.top}%`,
              left: `${b.left}%`,
              width: b.vertical ? b.h : b.w,
              height: b.vertical ? b.w : b.h,
              background: `linear-gradient(${b.vertical ? '180deg' : '90deg'}, transparent, rgb(var(--accent) / ${b.op}), transparent)`,
              boxShadow: `0 0 12px rgb(var(--accent) / ${b.op * 0.8})`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${-b.delay}s`,
            }}
          />
        ))}
      </motion.div>

      {/* 7 — perspective grid floor, rolling toward the viewer */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[58vh]"
        style={{ perspective: '520px', perspectiveOrigin: floorOrigin }}
      >
        <motion.div
          className="absolute inset-x-[-60%] bottom-[-18%] top-0 origin-bottom overflow-hidden"
          style={{
            transform: floorTransform,
            maskImage: 'linear-gradient(to top, black 6%, rgb(0 0 0 / 0.55) 34%, transparent 72%)',
            WebkitMaskImage: 'linear-gradient(to top, black 6%, rgb(0 0 0 / 0.55) 34%, transparent 72%)',
          }}
        >
          <div className="fx-grid-roll absolute inset-x-0 -top-[68px] bottom-0 bg-grid" style={{ backgroundSize: '68px 68px' }} />
        </motion.div>
      </motion.div>

      {/* 8 — grid ceiling */}
      <div className="absolute inset-x-0 top-0 h-[34vh]" style={{ perspective: '620px' }}>
        <motion.div
          className="absolute inset-x-[-50%] bottom-0 top-[-14%] origin-top bg-grid opacity-60"
          style={{
            transform: ceilingTransform,
            backgroundSize: '84px 84px',
            maskImage: 'linear-gradient(to bottom, black 2%, transparent 72%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 2%, transparent 72%)',
          }}
        />
      </div>

      {/* 9 — particle motes */}
      <div className="absolute inset-0">
        <ParticleField paused={!visible} />
      </div>

      {/* 10 — sweeping scan beam */}
      {!reduced && (
        <div
          className="absolute inset-x-0 top-0 h-24 animate-scanline opacity-20"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgb(var(--accent) / 0.35), transparent)',
          }}
        />
      )}

      {/* 11 — vignette + CRT scanlines in one overlay layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(130% 100% at 50% 40%, transparent 42%, rgb(var(--deep) / 0.75) 100%),
                       repeating-linear-gradient(0deg, rgb(var(--ink) / 0.05) 0px, rgb(var(--ink) / 0.05) 1px, transparent 1px, transparent 3px)`,
        }}
      />
    </div>
  )
}

function Blob({ className, delay, alt }: { className?: string; delay: number; alt?: boolean }) {
  const c = alt ? '--accent-2' : '--accent'
  const a = alt ? 0.3 : 0.27
  return (
    <div
      className={`fx-aurora absolute rounded-full ${className ?? ''}`}
      style={{
        background: `radial-gradient(closest-side, rgb(var(${c}) / ${a}), rgb(var(${c}) / ${a * 0.72}) 22%, rgb(var(${c}) / ${a * 0.38}) 46%, rgb(var(${c}) / ${a * 0.12}) 72%, transparent)`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}
