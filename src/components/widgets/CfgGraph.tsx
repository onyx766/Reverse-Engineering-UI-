import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const NODES = [
  { id: 'start', label: 'start', x: 90, y: 14, w: 64, h: 22, kind: 'neutral' },
  { id: 'init', label: 'init', x: 90, y: 60, w: 64, h: 22, kind: 'neutral' },
  { id: 'check', label: 'check', x: 90, y: 106, w: 64, h: 22, kind: 'decision' },
  { id: 'fail', label: 'fail', x: 22, y: 160, w: 58, h: 22, kind: 'bad' },
  { id: 'ok', label: 'success', x: 150, y: 160, w: 68, h: 22, kind: 'good' },
] as const

const EDGES = [
  { from: 'start', to: 'init', d: 'M122 36 L122 60' },
  { from: 'init', to: 'check', d: 'M122 82 L122 106' },
  { from: 'check', to: 'fail', d: 'M106 128 C 80 142, 70 146, 51 160' },
  { from: 'check', to: 'ok', d: 'M138 128 C 162 142, 170 146, 184 160' },
]

const FILL = {
  neutral: 'rgb(var(--accent) / 0.14)',
  decision: 'rgb(var(--accent-2) / 0.16)',
  good: 'rgb(16 185 129 / 0.2)',
  bad: 'rgb(244 63 94 / 0.2)',
} as const

const STROKE = {
  neutral: 'rgb(var(--accent) / 0.7)',
  decision: 'rgb(var(--accent-2) / 0.8)',
  good: 'rgb(16 185 129 / 0.9)',
  bad: 'rgb(244 63 94 / 0.9)',
} as const

/** Control-flow graph that draws itself in, with a packet running each edge. */
export function CfgGraph() {
  const reduced = useReducedMotion()

  return (
    <svg viewBox="0 0 244 196" className="h-full w-full overflow-visible" role="img" aria-label="Control flow graph">
      <defs>
        <marker id="cfgArrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="rgb(var(--accent) / 0.8)" />
        </marker>
      </defs>

      {EDGES.map((e, i) => (
        <g key={`${e.from}-${e.to}`}>
          <motion.path
            d={e.d}
            fill="none"
            stroke="rgb(var(--accent) / 0.45)"
            strokeWidth="1.3"
            markerEnd="url(#cfgArrow)"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.18, ease: 'easeOut' }}
          />
          {/* packet travelling the edge — native SMIL keeps it off the main thread */}
          {!reduced && (
            <circle r="2.4" fill="rgb(var(--accent-3))" opacity="0.95">
              <animateMotion dur="2.2s" repeatCount="indefinite" begin={`${i * 0.45}s`} path={e.d} />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                dur="2.2s"
                repeatCount="indefinite"
                begin={`${i * 0.45}s`}
              />
            </circle>
          )}
        </g>
      ))}

      {NODES.map((n, i) => (
        <motion.g
          key={n.id}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: `${n.x + n.w / 2}px ${n.y + n.h / 2}px` }}
        >
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            rx="5"
            fill={FILL[n.kind]}
            stroke={STROKE[n.kind]}
            strokeWidth="1.1"
          />
          <text
            x={n.x + n.w / 2}
            y={n.y + n.h / 2 + 3.4}
            textAnchor="middle"
            className="fill-ink font-mono"
            style={{ fontSize: 9.5 }}
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}
