import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { cn, seeded } from '@/lib/utils'
import { BOOT } from '@/data/site'

const STORAGE_KEY = 'nox:booted'
const RUN_MS = 2200
const LINE_START_MS = 380
const LINE_GAP_MS = 250
/** a stalled frame (chunk parse, shader compile) advances the intro by at most this */
const MAX_FRAME_MS = 50
const EXIT_S = 0.62
const EXIT_DELAY_S = 0.06
const EASE = [0.22, 1, 0.36, 1] as const
const WIPE_EASE = [0.7, 0, 0.3, 1] as const

const rand = seeded(4096)
const STAMPS = BOOT.log.map((_, i) =>
  ((LINE_START_MS + i * LINE_GAP_MS) / 1000 + rand() * 0.0009).toFixed(4),
)

const SCROLL_KEYS = new Set([' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'])

// progress steps land just after each log line appears
const P_TIMES = [150, 470, 790, 1110, 1430, 1770, 2080]
const P_VALUES = [0, 0.14, 0.31, 0.5, 0.68, 0.87, 1]

function progressAt(ms: number) {
  if (ms <= P_TIMES[0]) return 0
  for (let i = 1; i < P_TIMES.length; i++) {
    if (ms <= P_TIMES[i]) {
      const t = (ms - P_TIMES[i - 1]) / (P_TIMES[i] - P_TIMES[i - 1])
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      return P_VALUES[i - 1] + (P_VALUES[i] - P_VALUES[i - 1]) * e
    }
  }
  return 1
}

/** Boot runs once per browser session, never with ?noboot or reduced motion. */
export function shouldRunBoot(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) === '1') return false
  } catch {
    // storage blocked: fall through and boot
  }
  if (window.location.search.includes('noboot')) return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  return true
}

function rememberBoot() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // private mode / blocked storage: the intro simply plays again next load
  }
}

/**
 * First-visit holographic boot: the hex-cube mark assembles, a loader log
 * scrolls, the progress bar fills, then a scan line wipes the overlay away
 * top-to-bottom. The site is already mounted underneath; any key, click or
 * wheel skips straight to the wipe.
 */
export function BootSequence({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<'run' | 'exit'>('run')
  const [lines, setLines] = useState(0)
  const progress = useMotionValue(0)
  const percent = useTransform(progress, (v) => String(Math.round(v * 100)).padStart(3, '0'))
  const headX = useTransform(progress, (v) => `${v * 100}%`)
  const reveal = useRef(onReveal)
  const done = useRef(onDone)
  reveal.current = onReveal
  done.current = onDone

  const finish = useCallback(() => setPhase('exit'), [])

  // frame-driven clock: a busy main thread pauses the intro instead of skipping it
  useEffect(() => {
    if (phase !== 'run') return
    let raf = 0
    let last = performance.now()
    let elapsed = 0
    let shown = 0
    const tick = (now: number) => {
      elapsed += Math.min(Math.max(0, now - last), MAX_FRAME_MS)
      last = now
      let count = 0
      while (count < BOOT.log.length && elapsed >= LINE_START_MS + count * LINE_GAP_MS) count++
      if (count !== shown) {
        shown = count
        setLines(count)
      }
      progress.set(progressAt(elapsed))
      if (elapsed >= RUN_MS) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, progress, finish])

  useEffect(() => {
    if (phase !== 'run') return
    const onKey = (e: KeyboardEvent) => {
      // the key only skips the intro: no shortcut underneath, no page scroll
      e.stopPropagation()
      if (SCROLL_KEYS.has(e.key)) e.preventDefault()
      finish()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', finish, true)
    window.addEventListener('wheel', finish, { passive: true })
    window.addEventListener('touchmove', finish, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', finish, true)
      window.removeEventListener('wheel', finish)
      window.removeEventListener('touchmove', finish)
    }
  }, [phase, finish])

  useEffect(() => {
    if (phase !== 'exit') return
    rememberBoot()
    setLines(BOOT.log.length)
    const fill = animate(progress, 1, { duration: 0.22, ease: 'easeOut' })
    reveal.current()
    const t = window.setTimeout(() => done.current(), (EXIT_S + EXIT_DELAY_S) * 1000 + 60)
    return () => {
      fill.stop()
      window.clearTimeout(t)
    }
  }, [phase, progress])

  const exiting = phase === 'exit'
  const online = lines >= BOOT.log.length

  return (
    <div
      aria-hidden
      className={cn(
        'fixed inset-0 z-[100] select-none',
        exiting ? 'pointer-events-none' : 'cursor-pointer',
      )}
    >
      <motion.div
        className="absolute inset-0 overflow-hidden bg-deep"
        initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        animate={{ clipPath: exiting ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }}
        transition={{ duration: EXIT_S, delay: EXIT_DELAY_S, ease: WIPE_EASE }}
      >
        <Backdrop />

        <div className="relative flex h-full flex-col items-center justify-center px-6">
          <motion.div
            className="flex w-full max-w-[30rem] flex-col items-center"
            animate={
              exiting
                ? { opacity: 0, scale: 1.05, filter: 'blur(8px)' }
                : { opacity: 1, scale: 1, filter: 'blur(0px)' }
            }
            transition={{ duration: 0.34, ease: 'easeIn' }}
          >
            <BootMark />

            <div className="mt-7 flex font-display text-[44px] font-black leading-none text-ink [text-shadow:0_0_28px_rgb(var(--accent)/0.55)] sm:text-[52px]">
              <Scramble text={BOOT.title} delay={260} duration={620} />
            </div>
            <motion.p
              className="mt-3 font-mono text-[11px] uppercase tracking-[0.34em] text-accent"
              initial={{ opacity: 0, letterSpacing: '0.6em' }}
              animate={{ opacity: 1, letterSpacing: '0.34em' }}
              transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
            >
              {BOOT.subtitle}
            </motion.p>

            {/* progress */}
            <motion.div
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            >
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em]">
                <span className="flex items-center gap-2 text-muted">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shadow-glow-sm',
                      online ? 'bg-accent3' : 'animate-pulse bg-accent',
                    )}
                  />
                  {online ? 'lab online' : 'booting lab'}
                </span>
                <span className="text-accent">
                  <motion.span>{percent}</motion.span>%
                </span>
              </div>
              <div className="relative h-[3px] rounded-full bg-accent/15">
                <motion.div
                  className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-accent2 via-accent to-accent3"
                  style={{ scaleX: progress }}
                />
                <motion.div className="absolute inset-0" style={{ x: headX }}>
                  <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent3 shadow-glow" />
                </motion.div>
              </div>
              <div className="mt-1.5 flex justify-between" aria-hidden>
                {Array.from({ length: 11 }, (_, i) => (
                  <span
                    key={i}
                    className={cn('w-px bg-accent/30', i % 5 === 0 ? 'h-1.5' : 'h-1')}
                  />
                ))}
              </div>
            </motion.div>

            {/* loader log */}
            <div className="mt-5 w-full space-y-1 font-mono text-[10.5px] leading-[1.6] sm:text-[11px]">
              {BOOT.log.map((line, i) => (
                <motion.div
                  key={line.tag}
                  className="flex items-center gap-2.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={i < lines ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <span className="hidden w-[4.4rem] shrink-0 text-muted/70 sm:inline">
                    [{STAMPS[i]}]
                  </span>
                  <span className="w-11 shrink-0 uppercase text-accent">{line.tag}</span>
                  <span className="min-w-0 flex-1 truncate text-ink/80">{line.text}</span>
                  <span
                    className={cn(
                      'shrink-0 uppercase tracking-[0.14em]',
                      line.status === 'go' ? 'text-accent3' : 'text-accent',
                    )}
                  >
                    {line.status === 'go' ? '-> go' : 'ok'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            className="absolute inset-x-0 bottom-7 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted/80 sm:bottom-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ duration: 0.4, delay: exiting ? 0 : 0.7 }}
          >
            {BOOT.hint}
            <span className="ml-1.5 inline-block h-2.5 w-1 animate-blink bg-accent align-middle" />
          </motion.p>
        </div>
      </motion.div>

      {/* the scan line riding the wipe edge */}
      {exiting && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0"
          initial={{ y: '0vh' }}
          animate={{ y: '100vh' }}
          transition={{ duration: EXIT_S, delay: EXIT_DELAY_S, ease: WIPE_EASE }}
        >
          <div className="-mt-20 h-20 bg-gradient-to-b from-transparent to-accent/20" />
          <div className="h-[2px] bg-accent3 shadow-glow-lg" />
          <div className="h-12 bg-gradient-to-b from-accent/30 to-transparent" />
        </motion.div>
      )}
    </div>
  )
}

function Backdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(56rem 36rem at 50% 42%, rgb(var(--accent) / 0.16), transparent 66%), radial-gradient(40rem 30rem at 50% 110%, rgb(var(--accent-2) / 0.12), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 bg-grid opacity-60"
        style={{
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(60% 55% at 50% 45%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(60% 55% at 50% 45%, black, transparent 75%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 3px)',
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-24 animate-scanline opacity-30"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgb(var(--accent) / 0.3), transparent)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 95% at 50% 45%, transparent 55%, rgb(var(--deep) / 0.9) 100%)',
        }}
      />

      <HudCorner className="left-4 top-4 sm:left-6 sm:top-6" text={BOOT.hud.topLeft} />
      <HudCorner className="right-4 top-4 hidden flex-row-reverse sm:flex sm:right-6 sm:top-6" text={BOOT.hud.topRight} flip="x" />
      <HudCorner className="bottom-4 left-4 hidden items-end sm:flex sm:bottom-6 sm:left-6" text={BOOT.hud.bottomLeft} flip="y" />
      <HudCorner className="bottom-4 right-4 hidden flex-row-reverse items-end sm:flex sm:bottom-6 sm:right-6" text={BOOT.hud.bottomRight} flip="xy" />
    </>
  )
}

function HudCorner({
  className,
  text,
  flip,
}: {
  className?: string
  text: string
  flip?: 'x' | 'y' | 'xy'
}) {
  return (
    <motion.div
      className={cn('absolute flex items-start gap-2.5', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <span
        className={cn(
          'h-6 w-6 shrink-0 border-accent/60',
          flip === 'x' && 'border-r border-t',
          flip === 'y' && 'border-b border-l',
          flip === 'xy' && 'border-b border-r',
          !flip && 'border-l border-t',
        )}
      />
      <span className="mt-1 whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted">
        {text}
      </span>
    </motion.div>
  )
}

const FACES = [
  { d: 'M19 24.5 32 17v15l-13 7.5z', fill: 'rgb(var(--accent) / 0.2)', dx: -9, dy: -3 },
  { d: 'M32 17l13 7.5v15L32 32z', fill: 'rgb(var(--accent) / 0.1)', dx: 9, dy: -3 },
  { d: 'M32 32l13 7.5L32 47l-13-7.5z', fill: 'rgb(var(--accent-2) / 0.24)', dx: 0, dy: 10 },
]

/** The hex-cube mark from HoloLogo, assembled stroke by stroke. */
function BootMark() {
  return (
    <div className="relative h-28 w-28 sm:h-32 sm:w-32">
      <svg
        viewBox="0 0 120 120"
        className="absolute -inset-7 h-[calc(100%+3.5rem)] w-[calc(100%+3.5rem)] animate-spin-slow overflow-visible"
      >
        <motion.circle
          cx="60"
          cy="60"
          r="58"
          fill="none"
          stroke="rgb(var(--accent) / 0.35)"
          strokeWidth="0.8"
          strokeDasharray="1.5 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="rgb(var(--accent-3) / 0.5)"
          strokeWidth="0.9"
          strokeDasharray="22 10 4 10"
          initial={{ opacity: 0, rotate: -40 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
          style={{ transformOrigin: '60px 60px' }}
        />
      </svg>

      <svg viewBox="0 0 64 64" className="relative h-full w-full overflow-visible" fill="none">
        <defs>
          <linearGradient id="bootEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-3))" />
            <stop offset="55%" stopColor="rgb(var(--accent))" />
            <stop offset="100%" stopColor="rgb(var(--accent-2))" />
          </linearGradient>
          <filter id="bootGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d="M32 4 55 17.5v29L32 60 9 46.5v-29z"
          fill="rgb(var(--accent) / 0.07)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        />
        <motion.path
          d="M32 4 55 17.5v29L32 60 9 46.5v-29z"
          stroke="url(#bootEdge)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          filter="url(#bootGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.05, ease: [0.65, 0, 0.35, 1] }}
        />

        {FACES.map((f, i) => (
          <motion.path
            key={f.d}
            d={f.d}
            fill={f.fill}
            stroke="url(#bootEdge)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            initial={{ opacity: 0, x: f.dx, y: f.dy }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 + i * 0.12, ease: EASE }}
          />
        ))}

        <motion.circle
          cx="32"
          cy="32"
          r="9"
          stroke="rgb(var(--accent-3))"
          strokeWidth="0.8"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 3, opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.9, delay: 0.92, ease: 'easeOut' }}
          style={{ transformOrigin: '32px 32px' }}
        />
        <motion.circle
          cx="32"
          cy="32"
          r="3.4"
          fill="rgb(var(--accent-3))"
          filter="url(#bootGlow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.9, 1], opacity: [0, 1, 1] }}
          transition={{ duration: 0.55, delay: 0.88, ease: 'easeOut' }}
          style={{ transformOrigin: '32px 32px' }}
        />
      </svg>
    </div>
  )
}

const GLYPHS = '0123456789ABCDEF#%/<>'

/** Settles letter by letter out of random hex glyphs. */
function Scramble({ text, delay, duration }: { text: string; delay: number; duration: number }) {
  const [out, setOut] = useState(() => text.replace(/./g, ' '))

  useEffect(() => {
    let raf = 0
    let lastSwap = 0
    const t0 = performance.now() + delay
    const tick = (now: number) => {
      const p = (now - t0) / duration
      if (p >= 1) {
        setOut(text)
        return
      }
      if (p >= 0 && now - lastSwap > 50) {
        lastSwap = now
        const settled = Math.floor(p * (text.length + 1))
        setOut(
          text
            .split('')
            .map((c, i) => (i < settled ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(''),
        )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, delay, duration])

  return (
    <>
      {out.split('').map((c, i) => (
        <span key={i} className="inline-block w-[0.92em] text-center">
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </>
  )
}
