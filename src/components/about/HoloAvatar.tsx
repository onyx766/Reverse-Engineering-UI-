import { useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const C = 100

function hex(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180
    return `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

const OUTER = hex(72)
const INNER = hex(64)
const MONOGRAM = 'M100 70 C118 70 126 82 126 100 C126 118 118 130 100 130 C82 130 74 118 74 100 C74 82 82 70 100 70 Z'
const TRACES = ['M100 135 V149', 'M100 65 V51', 'M70 100 H53', 'M130 100 H147']
const VIAS: [number, number][] = [
  [100, 149],
  [100, 51],
  [53, 100],
  [147, 100],
]

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i * 6 * Math.PI) / 180
  const long = i % 5 === 0
  const r1 = long ? 80 : 83
  const r2 = 86
  return {
    x1: C + r1 * Math.cos(a),
    y1: C + r1 * Math.sin(a),
    x2: C + r2 * Math.cos(a),
    y2: C + r2 * Math.sin(a),
    long,
  }
})

/**
 * Generated holographic avatar: a circuit-trace "O" monogram inside a hex
 * scan frame. SMIL drives the loops so they stay off the main thread, and
 * they pause whenever the card is off-screen.
 */
export function HoloAvatar({
  active,
  reduced,
  className,
}: {
  /** run the idle loops (in view and not reduced-motion) */
  active: boolean
  reduced: boolean
  className?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${name}-${uid}`

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || reduced) return
    if (active) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [active, reduced])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id('edge')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent-3))" />
          <stop offset="55%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
        <radialGradient id={id('core')} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--accent) / 0.34)" />
          <stop offset="60%" stopColor="rgb(var(--accent) / 0.08)" />
          <stop offset="100%" stopColor="rgb(var(--deep) / 0)" />
        </radialGradient>
        <linearGradient id={id('scan')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent-3) / 0)" />
          <stop offset="82%" stopColor="rgb(var(--accent-3) / 0.32)" />
          <stop offset="96%" stopColor="rgb(var(--accent-3) / 0.95)" />
          <stop offset="100%" stopColor="rgb(var(--accent-3) / 0)" />
        </linearGradient>
        <pattern id={id('dots')} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.65" fill="rgb(var(--accent) / 0.38)" />
        </pattern>
        <clipPath id={id('clip')}>
          <polygon points={INNER} />
        </clipPath>
        <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer HUD rings */}
      <circle cx={C} cy={C} r="92" fill="none" stroke="rgb(var(--accent) / 0.35)" strokeWidth="0.8" strokeDasharray="1.5 5">
        {!reduced && (
          <animateTransform attributeName="transform" type="rotate" from={`0 ${C} ${C}`} to={`360 ${C} ${C}`} dur="40s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx={C} cy={C} r="77" fill="none" stroke="rgb(var(--accent) / 0.5)" strokeWidth="1.1" strokeDasharray="38 16 5 16">
        {!reduced && (
          <animateTransform attributeName="transform" type="rotate" from={`360 ${C} ${C}`} to={`0 ${C} ${C}`} dur="22s" repeatCount="indefinite" />
        )}
      </circle>
      <g stroke="rgb(var(--accent) / 0.4)">
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.long ? 1.1 : 0.6}
            opacity={t.long ? 1 : 0.6}
          />
        ))}
      </g>

      {/* focus brackets + readouts */}
      <g fill="none" stroke="rgb(var(--accent) / 0.75)" strokeWidth="1.4">
        <path d="M6 22 V6 H22" />
        <path d="M178 6 H194 V22" />
        <path d="M6 178 V194 H22" />
        <path d="M194 178 V194 H178" />
      </g>
      <text x="27" y="13" className="fill-muted font-mono" style={{ fontSize: 7, letterSpacing: '0.12em' }}>
        ID·SCAN 02
      </text>
      <text x="173" y="193" textAnchor="end" className="fill-muted font-mono" style={{ fontSize: 7, letterSpacing: '0.12em' }}>
        0x4E4F58
      </text>

      {/* hex frame */}
      <polygon points={OUTER} fill="rgb(var(--deep) / 0.85)" stroke={`url(#${id('edge')})`} strokeWidth="2.2" strokeLinejoin="round" filter={`url(#${id('glow')})`} />
      <polygon points={INNER} fill={`url(#${id('dots')})`} stroke="rgb(var(--accent) / 0.35)" strokeWidth="0.9" />
      <polygon points={INNER} fill={`url(#${id('core')})`} />

      {/* circuit traces + monogram */}
      <g stroke="rgb(var(--accent) / 0.7)" strokeWidth="1.4" fill="none" strokeLinecap="round">
        {TRACES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {VIAS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.3" fill="rgb(var(--deep))" stroke="rgb(var(--accent-3) / 0.9)" strokeWidth="1.1" />
      ))}

      <path d={MONOGRAM} fill="none" stroke="rgb(var(--accent) / 0.25)" strokeWidth="15" strokeLinejoin="bevel" />
      <motion.path
        d={MONOGRAM}
        fill="none"
        stroke={`url(#${id('edge')})`}
        strokeWidth="8"
        strokeLinejoin="bevel"
        strokeLinecap="square"
        filter={`url(#${id('glow')})`}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.65, 0, 0.35, 1] }}
      />
      <path d={MONOGRAM} fill="none" stroke="rgb(var(--ink) / 0.55)" strokeWidth="1.2" strokeLinejoin="bevel" />
      {[
        [100, 130],
        [100, 70],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.6" fill="rgb(var(--deep))" stroke="rgb(var(--accent-3))" strokeWidth="2" />
      ))}

      {/* signal pulse riding the monogram */}
      {!reduced && (
        <circle r="3.2" fill="rgb(var(--accent-3))" filter={`url(#${id('glow')})`}>
          <animateMotion dur="2.6s" repeatCount="indefinite" path={MONOGRAM} />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2.6s" repeatCount="indefinite" />
        </circle>
      )}

      {/* scanline sweeping the inner hex */}
      {!reduced && (
        <g clipPath={`url(#${id('clip')})`}>
          <g>
            <rect x="30" y="0" width="140" height="24" fill={`url(#${id('scan')})`} />
            <animateTransform attributeName="transform" type="translate" values="0 12; 0 150" dur="3.4s" repeatCount="indefinite" />
          </g>
        </g>
      )}
    </svg>
  )
}
