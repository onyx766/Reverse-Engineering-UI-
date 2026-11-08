import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { RotateCw } from 'lucide-react'
import { clamp, cn, seeded } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { IdCardData } from '@/data/about'
import { CardBack, CardFront, Face, type FaceMotion } from './IdCardFaces'
import { EASE } from './fx'

const facing = (deg: number) => {
  const a = ((deg % 360) + 360) % 360
  return a < 90 || a > 270 ? 'front' : 'back'
}

const rand = seeded(4096)
const MOTES = Array.from({ length: 9 }, () => ({
  left: 18 + rand() * 64,
  size: 2 + rand() * 2.5,
  dur: 2.6 + rand() * 2.4,
  delay: rand() * 3,
  rise: 180 + rand() * 160,
}))

const LIGHTS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2
  return { left: 50 + 43 * Math.cos(a), top: 50 + 43 * Math.sin(a), delay: i * 0.18 }
})

/**
 * Holographic operator badge hovering over an emitter pedestal. Tilts toward
 * the pointer (mouse only), throws foil and glare, and flips to its back on
 * click, Enter or Space.
 */
export function IdCard({ data }: { data: IdCardData }) {
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { margin: '-40px' })
  const [flips, setFlips] = useState(0)
  const [hovered, setHovered] = useState(false)
  const flipped = flips % 2 === 1
  const live = inView && !reduced

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(24)
  const spring = { stiffness: 170, damping: 18, mass: 0.6 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-15, 15]), spring)
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), spring)
  const py = useSpring(useTransform(my, [-0.5, 0.5], [-9, 9]), spring)

  const flip = useMotionValue(0)
  useEffect(() => {
    const target = flips * 180
    if (reduced) {
      flip.set(target)
      return
    }
    const controls = animate(flip, target, { type: 'spring', stiffness: 62, damping: 13, mass: 1 })
    return () => controls.stop()
  }, [flips, reduced, flip])

  const lift = useTransform(flip, (v) => Math.abs(Math.sin((v * Math.PI) / 180)))
  const flipScale = useTransform(lift, (l) => 1 - l * 0.08)
  const flipZ = useTransform(lift, (l) => l * 60)
  const frontVisibility = useTransform(flip, (v): string => (facing(v) === 'front' ? 'visible' : 'hidden'))
  const backVisibility = useTransform(flip, (v): string => (facing(v) === 'back' ? 'visible' : 'hidden'))

  const faceMotion: FaceMotion = useMemo(
    () => ({ gx, gy, px, py, hovered, live, reduced }),
    [gx, gy, px, py, hovered, live, reduced],
  )

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduced || !stageRef.current) return
    const r = stageRef.current.getBoundingClientRect()
    const x = clamp((e.clientX - r.left) / r.width, 0, 1)
    const y = clamp((e.clientY - r.top) / r.height, 0, 1)
    mx.set(x - 0.5)
    my.set(y - 0.5)
    gx.set(x * 100)
    gy.set(y * 100)
  }

  const onEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') setHovered(true)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
    gx.set(50)
    gy.set(24)
    setHovered(false)
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[440px] flex-col items-center">
      {/* light cone rising from the emitter */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[86px] left-1/2 h-[62%] w-[min(100%,420px)] -translate-x-1/2"
        style={{
          clipPath: 'polygon(37% 100%, 63% 100%, 100% 0%, 0% 0%)',
          background:
            'linear-gradient(to top, rgb(var(--accent) / 0.42), rgb(var(--accent) / 0.12) 45%, transparent 90%)',
        }}
      >
        {live &&
          MOTES.map((m, i) => (
            <motion.span
              key={i}
              className="absolute bottom-0 rounded-full bg-accent3 shadow-glow-sm"
              style={{ left: `${m.left}%`, width: m.size, height: m.size }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -m.rise, opacity: [0, 1, 0] }}
              transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 22, scale: 0.92, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
        style={{ transformPerspective: 1200 }}
        className="relative z-10 w-[min(100%,350px)]"
      >
        <div className={cn(live && 'animate-float')}>
          <div
            ref={stageRef}
            onPointerMove={onMove}
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            className="relative"
            style={{ perspective: 1100 }}
          >
            <motion.div className="preserve-3d relative" style={{ rotateX, rotateY }}>
              <motion.div
                className="preserve-3d relative grid"
                style={{ rotateY: flip, scale: flipScale, z: flipZ }}
              >
                <Face showing={!flipped} visibility={frontVisibility} motion={faceMotion}>
                  <CardFront data={data} motion={faceMotion} />
                </Face>
                <Face back showing={flipped} visibility={backVisibility} motion={faceMotion}>
                  <CardBack data={data} />
                </Face>
              </motion.div>
            </motion.div>

            <button
              type="button"
              onClick={() => setFlips((f) => f + 1)}
              onFocus={(e) => {
                // a tall target that is only partly on screen is not scrolled by the browser on focus
                const el = e.currentTarget
                const r = el.getBoundingClientRect()
                if (el.matches(':focus-visible') && (r.top < 90 || r.bottom > window.innerHeight)) {
                  el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
                }
              }}
              aria-pressed={flipped}
              aria-label={
                flipped ? 'Flip the ID card back to its front' : 'Flip the ID card to read its back'
              }
              className="absolute inset-0 z-20 cursor-pointer rounded-[22px] focus-visible:outline-offset-[6px]"
            />
          </div>
        </div>
      </motion.div>

      {/* emitter pedestal */}
      <div aria-hidden className="pointer-events-none relative -mt-3 h-[104px] w-[min(100%,400px)]">
        <div className="absolute inset-x-[14%] top-1/2 h-16 -translate-y-1/2 rounded-[50%] bg-accent/25 blur-2xl" />
        <div className="absolute left-0 top-1/2 aspect-square w-full -translate-y-1/2 scale-y-[0.24]">
          <div className="absolute inset-0 rounded-full border border-accent/25" />
          <div
            className={cn(
              'absolute inset-[7%] rounded-full border-2 border-dashed border-accent/45',
              live && 'animate-spin-slow',
            )}
          />
          <div className="absolute inset-[17%] rounded-full border-2 border-accent/70 shadow-glow" />
          <div className="absolute inset-[27%] rounded-full border border-accent3/40 bg-accent/10" />
          <div className="absolute inset-[37%] rounded-full bg-accent/35 blur-md" />
        </div>
        {LIGHTS.map((l, i) => (
          <span
            key={i}
            className={cn(
              'absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent3 shadow-glow-sm',
              live && 'animate-pulse',
            )}
            style={{ left: `${l.left}%`, top: `${l.top}%`, animationDelay: `${l.delay}s` }}
          />
        ))}
      </div>

      {/* dock readout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
        className="relative z-10 mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
      >
        <span className="flex items-center gap-1" aria-hidden>
          {(['A', 'B'] as const).map((side) => {
            const on = (side === 'B') === flipped
            return (
              <span
                key={side}
                className={cn(
                  'grid h-5 w-5 place-items-center rounded border text-[9.5px] transition-all duration-500',
                  on ? 'border-accent bg-accent/20 text-ink shadow-glow-sm' : 'border-accent/25 text-muted',
                )}
              >
                {side}
              </span>
            )
          })}
        </span>
        <span aria-hidden className="h-px w-6 bg-accent/30" />
        <span className="flex items-center gap-1.5">
          <RotateCw
            aria-hidden
            className={cn('h-3 w-3 text-accent transition-transform duration-700', flipped && 'rotate-180')}
          />
          <span className="[@media(hover:none)]:hidden">Click or press Enter to flip</span>
          <span className="hidden [@media(hover:none)]:inline">Tap the card to flip</span>
        </span>
      </motion.div>
    </div>
  )
}
