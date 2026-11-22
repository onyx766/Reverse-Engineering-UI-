import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { usePageVisible } from '@/components/fx/hooks'
import { useTheme } from '@/theme/ThemeProvider'
import { morphVars } from '@/theme/themes'
import roomUrl from '@/assets/ref/room.webp'
import { ParticleField } from './ParticleField'

/**
 * The lab every section stands in: the reference render's own room, with the
 * interface removed and thrown out of focus, so all pages share its light
 * (cyan core, warm tubes, red indicators) without competing with the content.
 *
 * Performance budget (iGPU): one static image moved by a compositor-only
 * transform for a slight pointer parallax, plus the existing mote field.
 */
export function Background() {
  const { theme } = useTheme()
  const reduced = useReducedMotion()
  const visible = usePageVisible()

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 50, damping: 22, mass: 1 })
  const py = useSpring(my, { stiffness: 50, damping: 22, mass: 1 })
  const x = useTransform(px, (v) => v * -14)
  const y = useTransform(py, (v) => v * -9)

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

  return (
    <div
      aria-hidden
      className="palette-morph pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#04080b]"
      style={morphVars(theme)}
    >
      <motion.img
        src={roomUrl}
        alt=""
        draggable={false}
        decoding="async"
        className="absolute -inset-[3%] h-[106%] w-[106%] max-w-none select-none object-cover"
        style={{ x, y }}
      />

      {/* motes drifting through the room's light */}
      <div className="absolute inset-0 opacity-70">
        <ParticleField paused={!visible} />
      </div>

      {/* vignette: keeps the edges dark and the copy readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 95% at 50% 42%, transparent 38%, rgb(3 6 9 / 0.55) 78%, rgb(3 6 9 / 0.82) 100%), linear-gradient(to bottom, rgb(3 6 9 / 0.25), transparent 22%, transparent 70%, rgb(3 6 9 / 0.45))',
        }}
      />
    </div>
  )
}
