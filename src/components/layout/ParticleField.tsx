import { useEffect, useRef } from 'react'
import { useTheme } from '@/theme/ThemeProvider'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { seeded } from '@/lib/utils'

interface P {
  x: number
  y: number
  z: number
  r: number
  vy: number
  vx: number
  tw: number
  phase: number
}

/**
 * Canvas dust/data-mote field. Three depth layers drift upward at
 * different speeds and parallax against the pointer, which sells the
 * "you are standing inside the scene" feeling behind the glass panels.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const reduced = useReducedMotion()

  // keep latest colors available to the rAF loop without restarting it
  const colorRef = useRef(theme.gl)
  colorRef.current = theme.gl

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let particles: P[] = []
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    const build = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const rand = seeded(1337)
      const density = Math.round((w * h) / 16000)
      const count = Math.max(40, Math.min(140, density))
      particles = Array.from({ length: count }, () => {
        const z = rand()
        return {
          x: rand() * w,
          y: rand() * h,
          z,
          r: 0.5 + z * 1.9,
          vy: -(0.06 + z * 0.34),
          vx: (rand() - 0.5) * 0.14,
          tw: 0.6 + rand() * 1.8,
          phase: rand() * Math.PI * 2,
        }
      })
    }

    build()

    const ro = new ResizeObserver(build)
    ro.observe(canvas)

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    let t = 0

    const hexToRgb = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }

    const draw = () => {
      t += 0.016
      pointer.x += (pointer.tx - pointer.x) * 0.045
      pointer.y += (pointer.ty - pointer.y) * 0.045

      ctx.clearRect(0, 0, w, h)

      const [ar, ag, ab] = hexToRgb(colorRef.current.accent)
      const [br, bg, bb] = hexToRgb(colorRef.current.accent3)

      for (const p of particles) {
        if (!reduced) {
          p.y += p.vy
          p.x += p.vx + Math.sin(t * 0.35 + p.phase) * 0.08
          if (p.y < -10) {
            p.y = h + 10
            p.x = Math.random() * w
          }
          if (p.x < -10) p.x = w + 10
          if (p.x > w + 10) p.x = -10
        }

        // depth parallax — nearer motes move further with the pointer
        const px = p.x - pointer.x * (8 + p.z * 46)
        const py = p.y - pointer.y * (6 + p.z * 32)

        const twinkle = reduced ? 0.6 : 0.45 + Math.sin(t * p.tw + p.phase) * 0.35
        const alpha = (0.1 + p.z * 0.5) * twinkle
        const mix = p.z > 0.72

        const r = mix ? br : ar
        const g = mix ? bg : ag
        const b = mix ? bb : ab

        ctx.beginPath()
        ctx.arc(px, py, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()

        // halo on the nearest layer only (cheap bloom)
        if (p.z > 0.82) {
          ctx.beginPath()
          ctx.arc(px, py, p.r * 4.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
