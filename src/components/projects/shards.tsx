import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { AudioWaveform, Binary, GitBranch, Globe, TerminalSquare, type LucideIcon } from 'lucide-react'
import {
  SHARD_DISASM,
  SHARD_HEX,
  SHARD_HEX_FIELDS,
  SHARD_HTTP,
  SHARD_LABELS,
  type ShardId,
} from '@/data/projects'
import { cn, seeded } from '@/lib/utils'
import { svgId } from './hooks'

const SHARD_ICON: Record<ShardId, LucideIcon> = {
  disasm: TerminalSquare,
  hex: Binary,
  cfg: GitBranch,
  http: Globe,
  wave: AudioWaveform,
}

interface FrameProps {
  id: ShardId
  /** relevant to the focused project: glows and its trace pulses */
  hot: boolean
  /** another shard is hot, so this one recedes */
  dim: boolean
  /** degrees; positive turns the left edge toward the viewer */
  turn?: number
  bob?: { dur: number; delay: number }
  className?: string
  style?: CSSProperties
  bodyClassName?: string
  children: ReactNode
}

/** Small floating glass readout used around the hologram. */
export function ShardFrame({
  id,
  hot,
  dim,
  turn = 0,
  bob,
  className,
  style,
  bodyClassName,
  children,
}: FrameProps) {
  const Icon = SHARD_ICON[id]
  const label = SHARD_LABELS[id]
  return (
    <div className={cn('preserve-3d', className)} style={style}>
      <div
        className="preserve-3d h-full"
        style={bob ? { animation: `pj-bob ${bob.dur}s ease-in-out ${bob.delay}s infinite` } : undefined}
      >
        <div
          className={cn(
            'relative h-full overflow-hidden rounded-xl border transition-[border-color,box-shadow,opacity,transform] duration-700',
            hot ? 'border-accent/80' : 'border-accent/30',
            dim && 'opacity-60',
          )}
          style={{
            transform: `rotateY(${turn}deg) translateZ(${hot ? 18 : 0}px)`,
            background:
              'linear-gradient(150deg, rgb(var(--surface) / 0.9), rgb(var(--deep) / 0.82) 70%), radial-gradient(120% 90% at 0% 0%, rgb(var(--accent) / 0.12), transparent 60%)',
            boxShadow: hot
              ? '0 0 0 1px rgb(var(--accent) / 0.3) inset, 0 0 26px rgb(var(--accent) / 0.55), 0 18px 40px -18px rgb(0 0 0 / 0.9)'
              : '0 0 0 1px rgb(var(--accent) / 0.06) inset, 0 0 18px -6px rgb(var(--accent) / 0.35), 0 18px 40px -20px rgb(0 0 0 / 0.9)',
          }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 3px)',
            }}
          />
          <ShardBrackets />
          {hot && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-accent/15 to-transparent"
              style={{ animation: 'pj-scan 2.8s linear infinite' }}
            />
          )}

          <div className="relative flex items-center gap-1.5 border-b border-accent/15 px-2.5 py-1.5">
            <Icon aria-hidden className={cn('h-3 w-3', hot ? 'text-accent' : 'text-muted')} />
            <span className={cn('font-mono text-[9px] uppercase tracking-[0.16em]', hot ? 'text-ink' : 'text-muted')}>
              {label.title}
            </span>
            <span className="ml-auto truncate font-mono text-[8.5px] tracking-[0.06em] text-muted/70">{label.meta}</span>
            <span
              aria-hidden
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500',
                hot ? 'animate-pulse bg-accent shadow-glow-sm' : 'bg-muted/40',
              )}
            />
          </div>
          <div className={cn('relative px-2.5 py-2', bodyClassName)}>{children}</div>
        </div>
      </div>
    </div>
  )
}

function ShardBrackets() {
  const base = 'pointer-events-none absolute h-2 w-2 border-accent/70'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-1 top-1 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-1 top-1 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-1 left-1 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-1 right-1 border-b border-r')} />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Bodies — each takes `running` (visible + motion allowed)            *
 * ------------------------------------------------------------------ */

function useStepper(length: number, ms: number, running: boolean, start = 0) {
  const [i, setI] = useState(start)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setI((v) => (v + 1) % length), ms)
    return () => clearInterval(t)
  }, [running, length, ms])
  return i
}

/** Disassembly with a stepping instruction pointer. */
export function DisasmBody({ running, compact }: { running: boolean; compact?: boolean }) {
  const pc = useStepper(SHARD_DISASM.length, 820, running, 4)
  return (
    <div className={cn('font-mono leading-[1.62]', compact ? 'text-[9.5px]' : 'text-[10.5px]')}>
      {SHARD_DISASM.map((ins, i) => {
        const on = i === pc
        return (
          <div
            key={ins.addr}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap rounded-[3px] pl-2.5 pr-1 transition-colors duration-300',
              on ? 'bg-accent/20 text-ink' : 'text-ink/80',
            )}
          >
            <span
              aria-hidden
              className={cn('absolute left-0 text-accent transition-opacity duration-200', on ? 'opacity-100' : 'opacity-0')}
            >
              ▸
            </span>
            <span className={cn('w-[4.7em] shrink-0', on ? 'text-accent' : 'text-muted/75')}>{ins.addr}</span>
            <span className={cn('w-[2.9em] shrink-0 font-semibold', on ? 'neon' : 'text-accent3')}>{ins.mnemonic}</span>
            <span className={cn('truncate', ins.target ? 'text-accent2' : '')}>{ins.operands}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Hex view whose highlight walks the DOS and PE header fields. */
export function HexBody({ running, compact }: { running: boolean; compact?: boolean }) {
  const fi = useStepper(SHARD_HEX_FIELDS.length, 950, running, 0)
  const field = SHARD_HEX_FIELDS[fi]

  return (
    <div className={cn('font-mono', compact ? 'text-[9.5px]' : 'text-[10.5px]')}>
      {SHARD_HEX.map((row, r) => (
        <div key={row.offset}>
          {r === 3 && (
            <div className="my-0.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.12em] text-muted/60">
              <span className="h-px flex-1 border-t border-dashed border-accent/25" />
              e_lfanew = 0x80
              <span className="h-px flex-1 border-t border-dashed border-accent/25" />
            </div>
          )}
          <div className="flex items-center gap-2 whitespace-nowrap leading-[1.6]">
            <span className="text-muted/60">{row.offset}</span>
            <span className="flex gap-[0.36em]">
              {row.bytes.map((b, i) => {
                const on = field.row === r && i >= field.start && i < field.start + field.len
                return (
                  <span
                    key={i}
                    className={cn(
                      'rounded-[2px] px-[1px] transition-colors duration-200',
                      on ? 'bg-accent/35 text-ink shadow-[0_0_8px_rgb(var(--accent)/0.6)]' : b === '00' ? 'text-muted/55' : 'text-accent3',
                    )}
                  >
                    {b}
                  </span>
                )
              })}
            </span>
            {!compact && (
              <span className="text-muted/70">
                {row.ascii.split('').map((c, i) => {
                  const on = field.row === r && i >= field.start && i < field.start + field.len
                  return (
                    <span key={i} className={cn(on && 'text-accent')}>
                      {c}
                    </span>
                  )
                })}
              </span>
            )}
          </div>
        </div>
      ))}
      <div className="mt-1 truncate border-t border-accent/15 pt-1 text-[9px] text-muted">
        <span className="text-accent">{field.name}</span> = <span className="text-ink/90">{field.value}</span>
      </div>
    </div>
  )
}

/** Request/response typed out on a loop. */
export function HttpBody({ running, compact }: { running: boolean; compact?: boolean }) {
  const full = useMemo(() => SHARD_HTTP.map((l) => l.text), [])
  const total = full.reduce((n, t) => n + t.length, 0)
  const [shown, setShown] = useState(total)

  useEffect(() => {
    if (!running) {
      setShown(total)
      return
    }
    let n = 0
    let t: ReturnType<typeof setTimeout>
    const reqChars = full.slice(0, 3).reduce((a, s) => a + s.length, 0)
    const tick = () => {
      n += 2
      setShown(Math.min(n, total))
      if (n >= total) {
        t = setTimeout(() => {
          n = 0
          setShown(0)
          t = setTimeout(tick, 500)
        }, 2600)
        return
      }
      // a beat of "latency" between request and response
      t = setTimeout(tick, n >= reqChars && n < reqChars + 2 ? 520 : 24)
    }
    setShown(0)
    t = setTimeout(tick, 400)
    return () => clearTimeout(t)
  }, [running, full, total])

  let budget = shown
  return (
    <div className={cn('font-mono leading-[1.6]', compact ? 'text-[9.5px]' : 'text-[10.5px]')}>
      {SHARD_HTTP.map((l, i) => {
        const visible = Math.max(0, Math.min(l.text.length, budget))
        budget -= l.text.length
        const typing = visible > 0 && visible < l.text.length
        return (
          <div
            key={i}
            className={cn('flex gap-1.5 whitespace-nowrap', i === 3 && 'mt-1', visible === 0 && 'opacity-0')}
          >
            <span className={l.dir === '>' ? 'text-accent' : 'text-accent2'}>{l.dir}</span>
            <span
              className={cn(
                'truncate',
                l.tone === 'status' ? 'font-semibold text-emerald-300' : l.tone === 'header' ? 'text-muted' : 'text-ink',
              )}
            >
              {l.text.slice(0, visible)}
              {typing && <span className="ml-px inline-block h-[1em] w-[0.5em] translate-y-[2px] animate-blink bg-accent" />}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Capture timeline: bars breathe, a playhead sweeps, frame markers tick. */
export function WaveBody({ compact }: { compact?: boolean }) {
  const bars = useMemo(() => {
    const rnd = seeded(7400)
    return Array.from({ length: compact ? 44 : 58 }, (_, i) => {
      const burst = Math.sin(i * 0.5) * 0.5 + 0.5
      const spike = rnd() > 0.86 ? 0.35 : 0
      const h = Math.min(1, 0.18 + burst * 0.45 * rnd() + spike + rnd() * 0.2)
      return { h, dur: 0.9 + rnd() * 1.4, delay: -rnd() * 2, lo: 0.25 + rnd() * 0.35 }
    })
  }, [compact])

  return (
    <div>
      <div className={cn('relative flex items-center gap-[2px]', compact ? 'h-7' : 'h-8')}>
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-accent/25" />
        {bars.map((b, i) => (
          <span
            key={i}
            className="relative flex-1 rounded-full bg-gradient-to-t from-accent2 via-accent to-accent3"
            style={
              {
                height: `${b.h * 100}%`,
                opacity: 0.55 + b.h * 0.45,
                animation: `pj-bar ${b.dur}s ease-in-out ${b.delay}s infinite`,
                '--pj-lo': b.lo,
              } as CSSProperties
            }
          />
        ))}
        {/* playhead: a full-width rail translated across itself */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-[-3px] left-0 w-full"
          style={{ animation: 'pj-playhead 4.2s linear infinite', ['--pj-travel' as string]: '100%' }}
        >
          <span className="absolute inset-y-0 left-0 w-px bg-ink shadow-[0_0_8px_rgb(var(--accent-3))]" />
        </span>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[8px] tracking-[0.08em] text-muted/70">
        <span>0 ms</span>
        <span className="text-accent/90">1,284 frames</span>
        <span>250 ms</span>
      </div>
    </div>
  )
}

const CFG_NODES = [
  { id: 'a', label: '401230', sub: 'entry', x: 64, y: 4, w: 72, kind: 'neutral' },
  { id: 'b', label: '401248', sub: 'fail', x: 8, y: 52, w: 70, kind: 'bad' },
  { id: 'c', label: '401270', sub: 'jne', x: 122, y: 52, w: 70, kind: 'good' },
  { id: 'd', label: '401290', sub: 'ret', x: 64, y: 100, w: 72, kind: 'neutral' },
] as const

const CFG_EDGES = [
  { d: 'M88 26 L52 52', bad: true },
  { d: 'M112 26 L148 52', bad: false },
  { d: 'M44 74 L84 100', bad: true },
  { d: 'M156 74 L116 100', bad: false },
]

/** Tiny control-flow graph with the failing branch in red. */
export function CfgBody({ running }: { running: boolean }) {
  const uid = `cfg${svgId(useId())}`
  return (
    <svg viewBox="0 0 200 124" className="h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <marker id={`${uid}a`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="rgb(var(--accent))" />
        </marker>
        <marker id={`${uid}r`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="rgb(244 63 94)" />
        </marker>
      </defs>
      {CFG_EDGES.map((e, i) => (
        <g key={i}>
          <path
            d={e.d}
            fill="none"
            stroke={e.bad ? 'rgb(244 63 94 / 0.85)' : 'rgb(var(--accent) / 0.75)'}
            strokeWidth="1.2"
            strokeDasharray={e.bad ? '3 2' : undefined}
            markerEnd={`url(#${uid}${e.bad ? 'r' : 'a'})`}
          />
          {running && (
            <circle r="2" fill={e.bad ? 'rgb(253 164 175)' : 'rgb(var(--accent-3))'}>
              <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${i * 0.4}s`} path={e.d} />
              <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
            </circle>
          )}
        </g>
      ))}
      {CFG_NODES.map((n) => {
        const bad = n.kind === 'bad'
        const good = n.kind === 'good'
        return (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={22}
              rx={4}
              fill={bad ? 'rgb(244 63 94 / 0.16)' : good ? 'rgb(var(--accent) / 0.2)' : 'rgb(var(--accent) / 0.1)'}
              stroke={bad ? 'rgb(244 63 94 / 0.9)' : 'rgb(var(--accent) / 0.7)'}
              strokeWidth="1"
            />
            <text
              x={n.x + 6}
              y={n.y + 14.5}
              className="font-mono"
              style={{ fontSize: 9, fill: bad ? 'rgb(253 164 175)' : 'rgb(var(--ink))' }}
            >
              {n.label}
            </text>
            <text
              x={n.x + n.w - 6}
              y={n.y + 14.5}
              textAnchor="end"
              className="font-mono"
              style={{ fontSize: 7.5, fill: bad ? 'rgb(253 164 175 / 0.8)' : 'rgb(var(--muted))' }}
            >
              {n.sub}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
