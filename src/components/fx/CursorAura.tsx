import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useMediaQuery } from './hooks'

const INTERACTIVE = [
  'a[href]',
  'button:not([disabled])',
  '[role="button"]',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'label',
  'summary',
  '[data-cursor]',
].join(',')

/**
 * Soft accent ring + dot that trail the native cursor on spring lag and
 * flare into a reticle over anything clickable. Desktop pointers only; all
 * motion runs through motion values, so pointer moves never re-render React.
 */
export function CursorAura() {
  const reduced = useReducedMotion()
  const fine = useMediaQuery('(pointer: fine)')
  if (reduced || !fine) return null
  return <Aura />
}

function Aura() {
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const ringX = useSpring(x, { stiffness: 340, damping: 30, mass: 0.55 })
  const ringY = useSpring(y, { stiffness: 340, damping: 30, mass: 0.55 })
  const dotX = useSpring(x, { stiffness: 1500, damping: 70, mass: 0.2 })
  const dotY = useSpring(y, { stiffness: 1500, damping: 70, mass: 0.2 })

  const shown = useMotionValue(0)
  const opacity = useSpring(shown, { stiffness: 260, damping: 32 })
  const hot = useMotionValue(0)
  const heat = useSpring(hot, { stiffness: 380, damping: 26 })
  const press = useMotionValue(0)
  const squeeze = useSpring(press, { stiffness: 700, damping: 32 })

  const ringScale = useTransform([heat, squeeze], ([h, p]: number[]) => (1 + h * 0.72) * (1 - p * 0.2))
  const dotScale = useTransform([heat, squeeze], ([h, p]: number[]) => (1 - h * 0.4) * (1 + p * 0.7))
  const flare = useTransform(heat, [0, 1], [0, 1])
  const calm = useTransform(heat, [0, 1], [1, 0.35])

  const [label, setLabel] = useState<string | null>(null)
  const current = useRef<{ target: Element | null; label: string | null }>({
    target: null,
    label: null,
  })
  const last = useRef({ x: -200, y: -200, seen: false })

  useEffect(() => {
    const resolve = (el: Element | null) => {
      const target = el?.closest(INTERACTIVE) ?? null
      const text = el?.closest('[data-cursor-label]')?.getAttribute('data-cursor-label') || null
      if (target === current.current.target && text === current.current.label) return
      current.current = { target, label: text }
      hot.set(target || text ? 1 : 0)
      setLabel(text)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
        shown.set(0)
        return
      }
      if (!last.current.seen) {
        ringX.jump(e.clientX)
        ringY.jump(e.clientY)
        dotX.jump(e.clientX)
        dotY.jump(e.clientY)
        last.current.seen = true
      }
      last.current.x = e.clientX
      last.current.y = e.clientY
      x.set(e.clientX)
      y.set(e.clientY)
      shown.set(1)
    }
    const onOver = (e: PointerEvent) => resolve(e.target as Element)
    const onDown = () => press.set(1)
    const onUp = () => press.set(0)
    const hide = () => {
      shown.set(0)
      press.set(0)
    }
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide()
    }

    // content can scroll under a resting pointer; re-check what it is over
    let frame = 0
    const onScroll = () => {
      if (frame || !last.current.seen) return
      frame = requestAnimationFrame(() => {
        frame = 0
        resolve(document.elementFromPoint(last.current.x, last.current.y))
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseout', onOut)
    window.addEventListener('blur', hide)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', hide)
    }
  }, [x, y, ringX, ringY, dotX, dotY, shown, hot, press])

  return (
    <>
      {/* trailing ring + reticle */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-[17px] -mt-[17px] h-[34px] w-[34px] mix-blend-screen"
        style={{ x: ringX, y: ringY, opacity, scale: ringScale }}
      >
        <motion.span
          className="absolute inset-0 rounded-full border border-accent/45 bg-accent/[0.04]"
          style={{ opacity: calm }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-[1.5px] border-accent bg-accent/10 shadow-glow"
          style={{ opacity: flare }}
        />
        <motion.span className="absolute -inset-[5px]" style={{ opacity: flare }}>
          <span className="absolute inset-0 animate-spin-slow">
            <span className="absolute left-1/2 top-0 h-[5px] w-px -translate-x-1/2 bg-accent3" />
            <span className="absolute bottom-0 left-1/2 h-[5px] w-px -translate-x-1/2 bg-accent3" />
            <span className="absolute left-0 top-1/2 h-px w-[5px] -translate-y-1/2 bg-accent3" />
            <span className="absolute right-0 top-1/2 h-px w-[5px] -translate-y-1/2 bg-accent3" />
          </span>
        </motion.span>
      </motion.div>

      {/* hint label from [data-cursor-label] */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-screen"
        style={{ x: ringX, y: ringY, opacity }}
      >
        <span
          className={`absolute left-6 top-4 whitespace-nowrap rounded-md border border-accent/40 bg-deep/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent3 shadow-glow-sm transition-[opacity,transform] duration-200 ${
            label ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'
          }`}
        >
          {label}
        </span>
      </motion.div>

      {/* precise dot */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-accent3 shadow-glow-sm mix-blend-screen"
        style={{ x: dotX, y: dotY, opacity, scale: dotScale }}
      />
    </>
  )
}
