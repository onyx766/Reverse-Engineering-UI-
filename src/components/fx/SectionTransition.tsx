import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER, type Theme } from '@/theme/themes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PE_HEADER_BYTES, ROUTE_HUD } from '@/data/site'

const SWEEP_MS = 720
const SWEEP_EASE = 'cubic-bezier(0.62, 0.02, 0.32, 1)'

/**
 * Fires on every section switch (never on first load): a scan beam in the
 * NEW palette sweeps the viewport top to bottom trailing a line of PE header
 * bytes, with a brief chromatic glitch and a routing readout in the corner.
 * Colours come straight from the incoming theme so the beam is already the
 * destination hue while the CSS palette is still morphing.
 */
export function SectionTransition() {
  const { epoch, theme } = useTheme()
  const reduced = useReducedMotion()
  const seen = useRef(epoch)
  const [run, setRun] = useState<{ id: number; theme: Theme } | null>(null)

  useEffect(() => {
    if (epoch === seen.current) return
    seen.current = epoch
    if (!reduced) setRun({ id: epoch, theme })
  }, [epoch, theme, reduced])

  if (!run) return null
  return (
    <Sweep
      key={run.id}
      theme={run.theme}
      onDone={() => setRun((r) => (r && r.id === run.id ? null : r))}
    />
  )
}

function Sweep({ theme, onDone }: { theme: Theme; onDone: () => void }) {
  const rgb = (triplet: string, a = 1) => `rgb(${triplet} / ${a})`
  const index = Math.max(0, SECTION_ORDER.indexOf(theme.id))
  const address = `0x${(ROUTE_HUD.base + index * 0x1000).toString(16).toUpperCase().padStart(8, '0')}`
  const tones = [theme.accent, theme.accent2, theme.accent3]

  const { rows, slices } = useMemo(() => {
    const bytes = PE_HEADER_BYTES.split(' ')
    const start = Math.floor(Math.random() * bytes.length)
    const row = (offset: number) =>
      Array.from({ length: 120 }, (_, i) => bytes[(start + offset + i) % bytes.length]).join(' ')
    return {
      rows: [row(0), row(37), row(71)],
      slices: Array.from({ length: 8 }, (_, i) => ({
        top: 5 + Math.random() * 88,
        left: Math.random() * 45,
        width: 28 + Math.random() * 50,
        height: 2 + Math.random() * 11,
        dx: (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 30),
        delay: Math.random() * 140,
        tone: i % 3,
      })),
    }
  }, [])

  const beam = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const sliceEls = useRef<(HTMLSpanElement | null)[]>([])
  const done = useRef(onDone)
  done.current = onDone

  // WAAPI runs on the compositor, so the sweep stays smooth while the next section mounts
  useLayoutEffect(() => {
    const anims: Animation[] = []
    const play = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      if (el && typeof el.animate === 'function') anims.push(el.animate(frames, { fill: 'both', ...opts }))
    }

    play(beam.current, [{ transform: 'translate3d(0,-34vh,0)' }, { transform: 'translate3d(0,104vh,0)' }], {
      duration: SWEEP_MS,
      easing: SWEEP_EASE,
    })
    play(
      flash.current,
      [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0.25, offset: 0.3 }, { opacity: 0.7, offset: 0.45 }, { opacity: 0 }],
      { duration: 420 },
    )
    slices.forEach((s, i) =>
      play(
        sliceEls.current[i],
        [
          { opacity: 0, transform: 'translate3d(0,0,0)' },
          { opacity: 0.95, transform: `translate3d(${s.dx}px,0,0)`, offset: 0.2 },
          { opacity: 0.45, transform: `translate3d(${-s.dx * 0.55}px,0,0)`, offset: 0.45 },
          { opacity: 0.8, transform: `translate3d(${s.dx * 0.25}px,0,0)`, offset: 0.7 },
          { opacity: 0, transform: 'translate3d(0,0,0)' },
        ],
        { duration: 300, delay: s.delay },
      ),
    )
    play(
      hud.current,
      [
        { opacity: 0, transform: 'translate3d(-14px,0,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)', offset: 0.14 },
        { opacity: 1, transform: 'translate3d(0,0,0)', offset: 0.72 },
        { opacity: 0, transform: 'translate3d(6px,0,0)' },
      ],
      { duration: 1050, easing: 'ease-out' },
    )
    play(bar.current, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: SWEEP_MS,
      easing: SWEEP_EASE,
    })

    let alive = true
    Promise.all(anims.map((a) => a.finished))
      .then(() => alive && done.current())
      .catch(() => {})
    return () => {
      alive = false
      anims.forEach((a) => a.cancel())
    }
  }, [slices])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {/* glitch flash */}
      <div
        ref={flash}
        className="absolute inset-0 opacity-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${rgb(theme.accent, 0.16)}, transparent 70%)`,
        }}
      />

      {/* chromatic split slices */}
      {slices.map((s, i) => (
        <span
          key={i}
          ref={(el) => {
            sliceEls.current[i] = el
          }}
          className="absolute opacity-0"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.width}%`,
            height: s.height,
            background: `linear-gradient(90deg, transparent, ${rgb(tones[s.tone], 0.55)} 14%, ${rgb(tones[(s.tone + 1) % 3], 0.38)} 58%, ${rgb(tones[(s.tone + 2) % 3], 0.5)} 86%, transparent)`,
            boxShadow: `0 -1px 0 ${rgb(tones[(s.tone + 2) % 3], 0.6)}, 0 1px 0 ${rgb(tones[s.tone], 0.45)}`,
          }}
        />
      ))}

      {/* scan beam */}
      <div ref={beam} className="absolute inset-x-0 top-0 will-change-transform">
        <div
          className="h-[30vh]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${rgb(theme.accent, 0.06)} 55%, ${rgb(theme.accent, 0.24)})`,
          }}
        />
        <div className="relative -mt-12 overflow-hidden whitespace-nowrap font-mono text-[10px] leading-4 tracking-[0.2em]">
          <div style={{ color: rgb(theme.accent3, 0.18) }}>{rows[2]}</div>
          <div style={{ color: rgb(theme.accent3, 0.36) }}>{rows[1]}</div>
          <div style={{ color: rgb(theme.accent3, 0.66) }}>{rows[0]}</div>
        </div>
        <div className="relative h-[2px]">
          <span
            className="absolute inset-0"
            style={{
              background: rgb(theme.accent3),
              boxShadow: `0 0 14px 2px ${rgb(theme.accent, 0.9)}, 0 0 70px 10px ${rgb(theme.accent, 0.35)}`,
            }}
          />
          <span
            className="absolute inset-x-0 -top-[3px] h-px translate-x-[6px]"
            style={{ background: rgb(theme.accent2, 0.85) }}
          />
          <span
            className="absolute inset-x-0 top-[4px] h-px -translate-x-[6px]"
            style={{ background: rgb(theme.accent, 0.8) }}
          />
        </div>
        <div
          className="h-16"
          style={{ background: `linear-gradient(to bottom, ${rgb(theme.accent, 0.24)}, transparent)` }}
        />
      </div>

      {/* routing HUD */}
      <div ref={hud} className="absolute bottom-5 left-4 opacity-0 sm:bottom-8 sm:left-8">
        <div
          className="relative rounded-md border px-3 py-2 font-mono uppercase"
          style={{
            borderColor: rgb(theme.accent, 0.45),
            background: rgb(theme.deep, 0.8),
            boxShadow: `0 0 24px -6px ${rgb(theme.accent, 0.6)}`,
          }}
        >
          <span
            className="absolute -left-px -top-px h-2 w-2 border-l border-t"
            style={{ borderColor: rgb(theme.accent3) }}
          />
          <span
            className="absolute -bottom-px -right-px h-2 w-2 border-b border-r"
            style={{ borderColor: rgb(theme.accent3) }}
          />
          <div
            className="flex items-center gap-2 text-[11px] tracking-[0.22em]"
            style={{ color: rgb(theme.ink) }}
          >
            <span style={{ color: rgb(theme.accent) }}>{ROUTE_HUD.label}</span>
            <span className="font-bold">{theme.label}</span>
            <span className="inline-block h-3 w-1.5 animate-blink" style={{ background: rgb(theme.accent) }} />
          </div>
          <div
            className="mt-1 flex items-center gap-2 text-[9.5px] tracking-[0.18em]"
            style={{ color: rgb(theme.muted) }}
          >
            <span>jmp {address}</span>
            <span
              className="relative h-[2px] w-16 overflow-hidden rounded-full"
              style={{ background: rgb(theme.accent, 0.18) }}
            >
              <span
                ref={bar}
                className="absolute inset-0 origin-left"
                style={{ background: rgb(theme.accent3), transform: 'scaleX(0)' }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
