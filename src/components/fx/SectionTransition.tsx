import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/theme/ThemeProvider'
import { SECTION_ORDER, type Theme } from '@/theme/themes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PE_HEADER_BYTES, ROUTE_HUD } from './content'

const SWEEP_S = 0.72
const EASE_SWEEP = [0.62, 0.02, 0.32, 1] as const

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

  const { rows, slices } = useMemo(() => {
    const bytes = PE_HEADER_BYTES.split(' ')
    const start = Math.floor(Math.random() * bytes.length)
    const row = (offset: number) =>
      Array.from({ length: 120 }, (_, i) => bytes[(start + offset + i) % bytes.length]).join(' ')
    return {
      rows: [row(0), row(37), row(71)],
      slices: Array.from({ length: 7 }, (_, i) => ({
        top: 6 + Math.random() * 86,
        height: 2 + Math.random() * 10,
        dx: (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 26),
        delay: Math.random() * 0.12,
        tone: i % 3,
      })),
    }
  }, [])

  const tones = [theme.accent, theme.accent2, theme.accent3]

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {/* glitch flash */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${rgb(theme.accent, 0.16)}, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.25, 0.7, 0] }}
        transition={{ duration: 0.42, times: [0, 0.12, 0.3, 0.45, 1], ease: 'linear' }}
      />

      {/* chromatic split slices */}
      {slices.map((s, i) => (
        <motion.span
          key={i}
          className="absolute inset-x-0"
          style={{
            top: `${s.top}%`,
            height: s.height,
            background: `linear-gradient(90deg, transparent, ${rgb(tones[s.tone], 0.5)} 18%, ${rgb(tones[(s.tone + 1) % 3], 0.32)} 64%, transparent)`,
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: [0, s.dx, -s.dx * 0.55, s.dx * 0.25, 0], opacity: [0, 0.95, 0.5, 0.8, 0] }}
          transition={{ duration: 0.3, delay: s.delay, ease: 'linear' }}
        />
      ))}

      {/* scan beam */}
      <motion.div
        className="absolute inset-x-0 top-0"
        initial={{ y: '-34vh' }}
        animate={{ y: '104vh' }}
        transition={{ duration: SWEEP_S, ease: EASE_SWEEP }}
      >
        <div
          className="h-[30vh]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${rgb(theme.accent, 0.05)} 55%, ${rgb(theme.accent, 0.2)})`,
          }}
        />
        <div className="relative -mt-12 overflow-hidden whitespace-nowrap font-mono text-[10px] leading-4 tracking-[0.2em]">
          <div style={{ color: rgb(theme.accent3, 0.18) }}>{rows[2]}</div>
          <div style={{ color: rgb(theme.accent3, 0.34) }}>{rows[1]}</div>
          <div style={{ color: rgb(theme.accent3, 0.62) }}>{rows[0]}</div>
        </div>
        <div className="relative h-[2px]">
          <span
            className="absolute inset-0"
            style={{
              background: rgb(theme.accent3),
              boxShadow: `0 0 14px 2px ${rgb(theme.accent, 0.85)}, 0 0 60px 8px ${rgb(theme.accent, 0.35)}`,
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
          className="h-14"
          style={{ background: `linear-gradient(to bottom, ${rgb(theme.accent, 0.22)}, transparent)` }}
        />
      </motion.div>

      {/* routing HUD */}
      <motion.div
        className="absolute bottom-5 left-4 sm:bottom-8 sm:left-8"
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-14, 0, 0, 6] }}
        transition={{ duration: 1.05, times: [0, 0.14, 0.72, 1], ease: 'easeOut' }}
        onAnimationComplete={onDone}
      >
        <div
          className="relative rounded-md border px-3 py-2 font-mono uppercase"
          style={{
            borderColor: rgb(theme.accent, 0.45),
            background: rgb(theme.deep, 0.78),
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
            <span
              className="inline-block h-3 w-1.5 animate-blink"
              style={{ background: rgb(theme.accent) }}
            />
          </div>
          <div
            className="mt-1 flex items-center gap-2 text-[9.5px] tracking-[0.18em]"
            style={{ color: rgb(theme.muted) }}
          >
            <span>jmp {address}</span>
            <span className="relative h-[2px] w-16 overflow-hidden rounded-full" style={{ background: rgb(theme.accent, 0.18) }}>
              <motion.span
                className="absolute inset-0 origin-left"
                style={{ background: rgb(theme.accent3) }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: SWEEP_S, ease: EASE_SWEEP }}
              />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
