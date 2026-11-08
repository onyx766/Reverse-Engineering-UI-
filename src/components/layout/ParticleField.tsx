import { useEffect, useRef } from 'react'
import { useTheme } from '@/theme/ThemeProvider'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { THEME_MORPH_MS, themeMorphEase } from '@/components/fx/hooks'
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

type RGB = [number, number, number]

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Canvas dust/data-mote field. Three depth layers drift upward at
 * different speeds and parallax against the pointer, which sells the
 * "you are standing inside the scene" feeling behind the glass panels.
 * Mote colours ease to a new palette on the same curve and duration as the
 * CSS palette morph, so the canvas never snaps ahead of the UI.
 */
export function ParticleField({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const reduced = useReducedMotion()

  // the rAF loop reads the latest palette / pause flag through refs, so it never restarts
  const targetRef = useRef(theme.gl)
  targetRef.current = theme.gl
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const wakeRef = useRef<() => void>(() => {})

  useEffect(() => {
    wakeRef.current()
  }, [theme, paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
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

    // palette tween state (reduced motion snaps, matching the CSS rule)
    let key = ''
    let fromA: RGB = [0, 0, 0]
    let fromB: RGB = [0, 0, 0]
    let toA: RGB = [0, 0, 0]
    let toB: RGB = [0, 0, 0]
    const colA: RGB = [0, 0, 0]
    const colB: RGB = [0, 0, 0]
    let tweenStart = -1

    const syncPalette = (now: number) => {
      const next = targetRef.current.accent + targetRef.current.accent3
      if (next !== key) {
        const snap = key === '' || reduced
        key = next
        toA = hexToRgb(targetRef.current.accent)
        toB = hexToRgb(targetRef.current.accent3)
        if (snap) {
          colA[0] = toA[0]
          colA[1] = toA[1]
          colA[2] = toA[2]
          colB[0] = toB[0]
          colB[1] = toB[1]
          colB[2] = toB[2]
          tweenStart = -1
        } else {
          fromA = [colA[0], colA[1], colA[2]]
          fromB = [colB[0], colB[1], colB[2]]
          tweenStart = now
        }
      }
      if (tweenStart < 0) return false
      const p = Math.min(1, (now - tweenStart) / THEME_MORPH_MS)
      const e = themeMorphEase(p)
      for (let i = 0; i < 3; i++) {
        colA[i] = fromA[i] + (toA[i] - fromA[i]) * e
        colB[i] = fromB[i] + (toB[i] - fromB[i]) * e
      }
      if (p >= 1) tweenStart = -1
      return p < 1
    }

    let raf = 0
    let last = 0
    let t = 0

    const draw = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const step = dt * 60
      t += dt

      const tweening = syncPalette(now)
      const ease = 1 - Math.pow(1 - 0.045, step)
      pointer.x += (pointer.tx - pointer.x) * ease
      pointer.y += (pointer.ty - pointer.y) * ease

      ctx.clearRect(0, 0, w, h)

      const ar = Math.round(colA[0])
      const ag = Math.round(colA[1])
      const ab = Math.round(colA[2])
      const br = Math.round(colB[0])
      const bg = Math.round(colB[1])
      const bb = Math.round(colB[2])

      for (const p of particles) {
        if (!reduced) {
          p.y += p.vy * step
          p.x += (p.vx + Math.sin(t * 0.35 + p.phase) * 0.08) * step
          if (p.y < -10) {
            p.y = h + 10
            p.x = Math.random() * w
          }
          if (p.x < -10) p.x = w + 10
          if (p.x > w + 10) p.x = -10
        }

        // depth parallax: nearer motes move further with the pointer
        const px = p.x - pointer.x * (8 + p.z * 46)
        const py = p.y - pointer.y * (6 + p.z * 32)

        const twinkle = reduced ? 0.6 : 0.45 + Math.sin(t * p.tw + p.phase) * 0.35
        const alpha = (0.1 + p.z * 0.5) * twinkle
        const near = p.z > 0.72
        const r = near ? br : ar
        const g = near ? bg : ag
        const b = near ? bb : ab

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

      // reduced motion: draw only while something changes (resize / palette tween)
      const keepGoing = !pausedRef.current && (!reduced || tweening)
      if (keepGoing) raf = requestAnimationFrame(draw)
      else last = 0
    }

    const wake = () => {
      if (raf || pausedRef.current) return
      last = 0
      raf = requestAnimationFrame(draw)
    }
    wakeRef.current = wake

    build()
    wake()

    const ro = new ResizeObserver(() => {
      build()
      wake()
    })
    ro.observe(canvas)

    const onMove = (e: PointerEvent) => {
      if (reduced) return
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      wakeRef.current = () => {}
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
