import { useMemo } from 'react'
import type { CoverMotif } from '@/data/writeups'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn, seeded } from '@/lib/utils'

interface Props {
  motif: CoverMotif
  /** stable variation so repeated motifs differ slightly */
  seed?: number
  /** idle animation (featured hero only); hover animation always applies */
  animated?: boolean
  /** richer, large-canvas composition for the featured hero */
  dense?: boolean
  className?: string
}

/**
 * Abstract, theme-tinted cover art for a write-up. Each motif is a small SVG
 * scene built from accent tokens so it re-tints with the palette. Hover is
 * driven by the card's `group`; idle motion is opt-in and respects reduced
 * motion. The art always fills its box (slice) and carries the lab-glass
 * overlay — grid, scanline, corner readout — so it matches the reference.
 */
export function WriteupCover({ motif, seed = 1, animated = false, dense = false, className }: Props) {
  const reduced = useReducedMotion()
  const idle = animated && !reduced

  return (
    <div className={cn('relative overflow-hidden [container-type:inline-size]', className)} aria-hidden>
      {/* wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -20%, rgb(var(--accent) / 0.26), transparent 60%), linear-gradient(160deg, rgb(var(--surface) / 0.7), rgb(var(--deep) / 0.9))',
        }}
      />
      {/* fine grid floor */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--accent) / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--accent) / 0.1) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'linear-gradient(180deg, transparent, #000 140%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 140%)',
        }}
      />

      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        className={cn(
          'absolute inset-0 h-full w-full',
          // hero: always fit the width (centred). A box wider than 16:9 still
          // crops top/bottom like `slice`; a taller one (lg side column, small
          // phones) shows the whole scene, so client, server and pin readout
          // are never sliced off at the sides
          dense && 'bottom-auto top-1/2 aspect-[16/9] h-auto -translate-y-1/2',
        )}
      >
        <Motif motif={motif} seed={seed} idle={idle} dense={dense} />
      </svg>

      {/* scanline sweep on hover */}
      <span className="pointer-events-none absolute inset-x-0 -top-1/3 h-1/3 bg-gradient-to-b from-transparent via-accent/20 to-transparent opacity-0 transition-all duration-700 group-hover:top-full group-hover:opacity-100" />

      {/* corner readout — tighter on narrow thumbnails (Home's 96px phone rows)
          so the longest label still fits on one line without an ellipsis */}
      <span className="pointer-events-none absolute left-3 top-2.5 max-w-[calc(100%-1.5rem)] truncate whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-accent/70 [@container(max-width:8rem)]:left-2 [@container(max-width:8rem)]:max-w-[calc(100%-1rem)] [@container(max-width:8rem)]:tracking-[0.06em]">
        {LABEL[motif]}
      </span>
      <span className="pointer-events-none absolute bottom-2.5 right-3 font-mono text-[9px] tracking-[0.14em] text-muted/60 [@container(max-width:8rem)]:right-2">
        0x{(0x1a40 + seed * 0x40).toString(16)}
      </span>

      {/* edge hairlines + bottom fade into the card body */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface/90 to-transparent" />
    </div>
  )
}

const LABEL: Record<CoverMotif, string> = {
  hexgrid: 'xor · map',
  shield: 'tls · pin',
  stack: 'container',
  packet: 'wire · tcp',
  graph: 'trace · diff',
  pulse: 'anti-dbg',
}

function Motif({
  motif,
  seed,
  idle,
  dense,
}: {
  motif: CoverMotif
  seed: number
  idle: boolean
  dense: boolean
}) {
  switch (motif) {
    case 'hexgrid':
      return <HexGrid seed={seed} idle={idle} />
    case 'shield':
      return <Shield idle={idle} dense={dense} />
    case 'stack':
      return <Stack idle={idle} />
    case 'packet':
      return <Packet idle={idle} />
    case 'graph':
      return <Graph idle={idle} />
    case 'pulse':
      return <Pulse idle={idle} />
  }
}

/* ── hexgrid — bytes being XOR-mapped ──────────────────────────────────────── */
function HexGrid({ seed, idle }: { seed: number; idle: boolean }) {
  const cells = useMemo(() => {
    const rnd = seeded(seed * 131 + 7)
    const out: { x: number; y: number; on: number }[] = []
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 9; c++) {
        out.push({ x: 24 + c * 34 + (r % 2) * 17, y: 24 + r * 40, on: rnd() })
      }
    }
    return out
  }, [seed])
  const hex = (cx: number, cy: number, s = 13) => {
    const pts: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6
      pts.push(`${(cx + s * Math.cos(a)).toFixed(1)},${(cy + s * Math.sin(a)).toFixed(1)}`)
    }
    return pts.join(' ')
  }
  return (
    <g>
      {cells.map((c, i) => (
        <polygon
          key={i}
          points={hex(c.x, c.y)}
          fill={c.on > 0.6 ? 'rgb(var(--accent) / 0.22)' : 'rgb(var(--accent) / 0.04)'}
          stroke="rgb(var(--accent) / 0.4)"
          strokeWidth="0.9"
          className="transition-transform duration-500 group-hover:translate-y-[-2px]"
          style={{ transformOrigin: `${c.x}px ${c.y}px` }}
        >
          {idle && c.on > 0.72 && (
            <animate
              attributeName="fill-opacity"
              values="0.4;1;0.4"
              dur={`${2.4 + (i % 5) * 0.4}s`}
              repeatCount="indefinite"
            />
          )}
        </polygon>
      ))}
      {idle && (
        <rect x="0" y="0" width="320" height="6" fill="rgb(var(--accent-3) / 0.5)">
          <animate attributeName="y" values="-6;180" dur="3.6s" repeatCount="indefinite" />
        </rect>
      )}
    </g>
  )
}

/* ── shield — cert pinning / TLS interception ──────────────────────────────── */
function Shield({ idle, dense = false }: { idle: boolean; dense?: boolean }) {
  // decorative SHA-256-style fingerprint rows for the hero readout
  const fp = useMemo(() => {
    const rnd = seeded(97)
    return Array.from({ length: 5 }, () =>
      Array.from({ length: 3 }, () => (((rnd() * 256) | 0) & 0xff).toString(16).padStart(2, '0')).join(
        ' ',
      ),
    )
  }, [])

  return (
    <g>
      {dense && (
        <g aria-hidden>
          {/* pinned channel: client ── intercept ── server */}
          <line
            x1="22"
            y1="92"
            x2="298"
            y2="92"
            stroke="rgb(var(--accent) / 0.22)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          {/* client (phone) */}
          <g transform="translate(22 92)">
            <rect x="-9" y="-15" width="18" height="30" rx="3" fill="rgb(var(--accent) / 0.1)" stroke="rgb(var(--accent) / 0.55)" strokeWidth="1.1" />
            <line x1="-4" y1="10" x2="4" y2="10" stroke="rgb(var(--accent) / 0.7)" strokeWidth="1.2" />
            <rect x="-6" y="-11" width="12" height="16" rx="1.5" fill="rgb(var(--accent) / 0.12)" />
          </g>
          {/* server (stacked) */}
          <g transform="translate(298 92)">
            <rect x="-12" y="-15" width="20" height="13" rx="2" fill="rgb(var(--accent) / 0.1)" stroke="rgb(var(--accent) / 0.55)" strokeWidth="1.1" />
            <rect x="-12" y="2" width="20" height="13" rx="2" fill="rgb(var(--accent) / 0.1)" stroke="rgb(var(--accent) / 0.55)" strokeWidth="1.1" />
            <circle cx="-7" cy="-8.5" r="1.4" fill="rgb(var(--accent-3))" />
            <circle cx="-7" cy="8.5" r="1.4" fill="rgb(var(--accent-3))" />
          </g>
          {/* request packets caught at the pin */}
          {idle && (
            <>
              <rect x="30" y="88.5" width="11" height="7" rx="1.6" fill="rgb(var(--accent-3) / 0.9)">
                <animate attributeName="x" values="30;118;118" keyTimes="0;0.62;1" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.62;1" dur="2.6s" repeatCount="indefinite" />
              </rect>
              <rect x="256" y="88.5" width="11" height="7" rx="1.6" fill="rgb(var(--accent) / 0.85)">
                <animate attributeName="x" values="256;202;202" keyTimes="0;0.62;1" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.62;1" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
              </rect>
            </>
          )}
          {/* fingerprint / pin readout — label clear of the first row, last row
              clear of the channel, scan bar no wider than the hex */}
          <g transform="translate(236 50)">
            <text x="0" y="-9" className="fill-accent font-mono" style={{ fontSize: 6, letterSpacing: '1px', opacity: 0.75 }}>
              sha256/pin
            </text>
            {fp.map((row, i) => (
              <text
                key={i}
                x="0"
                y={i * 9}
                className="fill-ink font-mono"
                style={{ fontSize: 7, opacity: i === 2 ? 0.92 : 0.38 }}
              >
                {row}
              </text>
            ))}
            {idle && (
              <rect x="-3" y="11" width="42" height="9" fill="rgb(var(--accent) / 0.16)">
                <animate attributeName="y" values="-7;29;-7" dur="5.2s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        </g>
      )}

      <g transform="translate(160 92)">
        {/* concentric rings */}
        {(dense ? [34, 50, 66, 82] : [34, 50, 66]).map((r, i) => (
          <circle key={r} r={r} fill="none" stroke="rgb(var(--accent) / 0.15)" strokeWidth="1" strokeDasharray="3 6">
            {idle && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={i % 2 ? '360 0 0' : '0 0 0'}
                to={i % 2 ? '0 0 0' : '360 0 0'}
                dur={`${16 + i * 6}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
        {/* soft core glow behind the shield */}
        <circle r="30" fill="rgb(var(--accent) / 0.08)" />
        {/* shield body + inner hairline */}
        <path
          d="M0 -46 L34 -32 V2 C34 26 18 40 0 48 C-18 40 -34 26 -34 2 V-32 Z"
          fill="rgb(var(--accent) / 0.1)"
          stroke="rgb(var(--accent) / 0.65)"
          strokeWidth="1.6"
          className="transition-transform duration-500 [transform-box:fill-box] group-hover:scale-105"
          style={{ transformOrigin: 'center' }}
        />
        <path
          d="M0 -38 L27 -26 V1 C27 21 14 33 0 39 C-14 33 -27 21 -27 1 V-26 Z"
          fill="none"
          stroke="rgb(var(--accent) / 0.22)"
          strokeWidth="0.8"
        />
        {/* padlock */}
        <rect x="-11" y="-6" width="22" height="18" rx="3" fill="rgb(var(--accent) / 0.28)" stroke="rgb(var(--accent))" strokeWidth="1.2" />
        <path d="M-6 -6 V-13 a6 6 0 0 1 12 0 V-6" fill="none" stroke="rgb(var(--accent))" strokeWidth="1.6" />
        <circle cx="0" cy="2" r="2.4" fill="rgb(var(--accent-3))" />
        {idle && (
          <circle cx="0" cy="2" r="2.4" fill="none" stroke="rgb(var(--accent-3))" strokeWidth="1">
            <animate attributeName="r" values="2.4;9" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur="2.2s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    </g>
  )
}

/* ── stack — chunked container layers ──────────────────────────────────────── */
function Stack({ idle }: { idle: boolean }) {
  const layers = [0, 1, 2, 3, 4]
  return (
    <g transform="translate(160 96)">
      {layers.map((i) => {
        const y = -46 + i * 22
        return (
          <g
            key={i}
            className="transition-transform duration-500 group-hover:translate-x-[6px]"
            style={{ transform: `translateX(${(i - 2) * 2}px)` }}
          >
            <path
              d={`M-88 ${y} l88 -16 l88 16 l-88 16 Z`}
              fill={`rgb(var(--accent) / ${0.08 + i * 0.04})`}
              stroke="rgb(var(--accent) / 0.5)"
              strokeWidth="1"
            />
            <rect x={-70} y={y - 2} width={i % 2 ? 40 : 26} height="3" rx="1.5" fill="rgb(var(--accent-3) / 0.8)">
              {idle && (
                <animate attributeName="width" values={`${i % 2 ? 40 : 26};${i % 2 ? 18 : 44};${i % 2 ? 40 : 26}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
              )}
            </rect>
          </g>
        )
      })}
    </g>
  )
}

/* ── packet — framed messages on a wire ────────────────────────────────────── */
function Packet({ idle }: { idle: boolean }) {
  const frames = [20, 118, 216]
  return (
    <g>
      <line x1="0" y1="92" x2="320" y2="92" stroke="rgb(var(--accent) / 0.3)" strokeWidth="1" strokeDasharray="2 5" />
      {frames.map((x, i) => (
        <g key={x} className="transition-transform duration-500 group-hover:translate-y-[-3px]">
          <rect x={x} y="70" width="84" height="44" rx="4" fill="rgb(var(--accent) / 0.08)" stroke="rgb(var(--accent) / 0.55)" strokeWidth="1.1" />
          <rect x={x} y="70" width="20" height="44" rx="4" fill="rgb(var(--accent) / 0.2)" />
          <rect x={x + 26} y="80" width={46} height="4" rx="2" fill="rgb(var(--accent-3) / 0.7)" />
          <rect x={x + 26} y="90" width={32} height="4" rx="2" fill="rgb(var(--accent) / 0.5)" />
          <rect x={x + 26} y="100" width={40} height="4" rx="2" fill="rgb(var(--accent) / 0.4)" />
          <text x={x + 10} y="96" textAnchor="middle" className="fill-ink font-mono" style={{ fontSize: 8 }}>
            {['AC', '1D', 'FF'][i]}
          </text>
        </g>
      ))}
      {idle && (
        <circle r="3" cy="92" fill="rgb(var(--accent-3))">
          <animate attributeName="cx" values="-10;330" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.8s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  )
}

/* ── graph — diverging execution traces ────────────────────────────────────── */
function Graph({ idle }: { idle: boolean }) {
  const common = 'M14 92 H110'
  const up = 'M110 92 C150 92 160 48 210 44 H300'
  const down = 'M110 92 C150 92 160 140 210 138 H300'
  const nodes = [14, 60, 110]
  return (
    <g>
      <path d={common} fill="none" stroke="rgb(var(--accent) / 0.7)" strokeWidth="2" />
      <path d={up} fill="none" stroke="rgb(16 185 129 / 0.8)" strokeWidth="1.8" strokeDasharray={idle ? '4 4' : undefined}>
        {idle && <animate attributeName="stroke-dashoffset" values="16;0" dur="1.1s" repeatCount="indefinite" />}
      </path>
      <path d={down} fill="none" stroke="rgb(244 63 94 / 0.75)" strokeWidth="1.8" strokeDasharray="4 4" opacity="0.8">
        {idle && <animate attributeName="stroke-dashoffset" values="0;16" dur="1.3s" repeatCount="indefinite" />}
      </path>
      {nodes.map((x) => (
        // fill-box: scale each node about its own centre (SVG defaults to the
        // viewBox origin, which flung the nodes off the trace on hover)
        <circle key={x} cx={x} cy="92" r="5" fill="rgb(var(--accent) / 0.25)" stroke="rgb(var(--accent))" strokeWidth="1.4" className="origin-center transition-transform duration-500 [transform-box:fill-box] group-hover:scale-125" />
      ))}
      <g className="transition-transform duration-500 group-hover:translate-x-[4px]">
        <circle cx="110" cy="92" r="8" fill="none" stroke="rgb(var(--accent-3))" strokeWidth="1.4" />
        <text x="110" y="74" textAnchor="middle" className="fill-ink font-mono" style={{ fontSize: 8 }}>je</text>
      </g>
      <circle cx="300" cy="44" r="4" fill="rgb(16 185 129 / 0.9)" />
      <circle cx="300" cy="138" r="4" fill="rgb(244 63 94 / 0.9)" />
    </g>
  )
}

/* ── pulse — timing / radar sweep ──────────────────────────────────────────── */
function Pulse({ idle }: { idle: boolean }) {
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => i), [])
  return (
    <g>
      <g transform="translate(160 92)">
        {[20, 36, 52].map((r) => (
          <circle key={r} r={r} fill="none" stroke="rgb(var(--accent) / 0.18)" strokeWidth="1" />
        ))}
        <line x1="0" y1="0" x2="52" y2="0" stroke="rgb(var(--accent) / 0.6)" strokeWidth="1.4">
          {idle && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3.4s" repeatCount="indefinite" />}
        </line>
      </g>
      <g>
        {bars.map((i) => {
          const x = 10 + i * 7.6
          const h = 6 + (Math.sin(i * 0.9) * 0.5 + 0.5) * 30
          return (
            <rect
              key={i}
              x={x}
              y={150 - h}
              width="3.4"
              height={h}
              rx="1.5"
              fill={`rgb(var(--accent) / ${0.25 + (i % 5) * 0.12})`}
            >
              {idle && (
                <animate
                  attributeName="height"
                  values={`${h};${h * 0.4};${h}`}
                  dur={`${1.6 + (i % 7) * 0.2}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          )
        })}
      </g>
    </g>
  )
}
