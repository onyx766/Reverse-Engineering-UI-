import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Pause, Play, RotateCcw, StepForward, type LucideIcon } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { isFocusVisible, isMouse } from './dom'

export interface Reg {
  name: string
  value: string
  /** what the value refers to, shown when the register is inspected */
  note?: string
}

export interface TraceCall {
  addr: string
  text: string
  /** registers this instruction writes: name → new value */
  set?: Record<string, string>
  /** status flags after it executes, e.g. 'ZF CF'; '' clears them all */
  flags?: string
  /** replaces register notes from this step on */
  notes?: Record<string, string>
  /** explanation shown in the status line once the instruction has run */
  note?: string
  /** basic-block id; consecutive ids form one timeline segment */
  block?: string
}

interface Snapshot {
  values: Record<string, string>
  notes: Record<string, string | undefined>
  flags: Set<string>
  changed: Set<string>
}

const FLAGS = [
  { id: 'ZF', name: 'zero' },
  { id: 'CF', name: 'carry' },
  { id: 'SF', name: 'sign' },
  { id: 'OF', name: 'overflow' },
]
const LINE_H = 20
const MASK64 = (1n << 64n) - 1n

const pad64 = (addr: string) => addr.replace(/^0x/i, '').toUpperCase().padStart(16, '0')

function toBig(v: string): bigint | null {
  const hex = v.trim().replace(/^0x/i, '')
  return /^[0-9a-f]{1,16}$/i.test(hex) ? BigInt(`0x${hex}`) : null
}

/** The readings a reverser does in their head: unsigned, signed, and the bytes as text. */
function interpret(value: string) {
  const n = toBig(value)
  if (n === null) return null
  const u = n & MASK64
  const lo = u & 0xffffffffn
  const bytes = Array.from({ length: 8 }, (_, i) => Number((u >> BigInt(i * 8)) & 0xffn))
  let end = 8
  while (end > 1 && bytes[end - 1] === 0) end--
  let signed: string | null = null
  if (u >> 63n === 1n) signed = (u - (1n << 64n)).toLocaleString('en-US')
  else if (u >> 32n === 0n && lo >> 31n === 1n)
    signed = `${(lo - (1n << 32n)).toLocaleString('en-US')} as i32 (eax)`
  return {
    hex: `0x${u.toString(16).toUpperCase().padStart(16, '0')}`,
    dec: u.toLocaleString('en-US'),
    signed,
    ascii: bytes
      .slice(0, end)
      .map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '·'))
      .join(''),
  }
}

function buildSnapshots(regs: Reg[], trace: TraceCall[]): Snapshot[] {
  const hasRip = regs.some((r) => r.name === 'RIP')
  let values: Record<string, string> = Object.fromEntries(regs.map((r) => [r.name, r.value]))
  let notes: Record<string, string | undefined> = Object.fromEntries(
    regs.map((r) => [r.name, r.note]),
  )
  let flags = new Set<string>()
  const withRip = (v: Record<string, string>, k: number) =>
    hasRip && k < trace.length ? { ...v, RIP: pad64(trace[k].addr) } : v

  const out: Snapshot[] = [{ values: withRip(values, 0), notes, flags, changed: new Set() }]
  trace.forEach((t, i) => {
    values = { ...values, ...t.set }
    notes = { ...notes, ...t.notes }
    if (t.flags !== undefined) flags = new Set(t.flags.split(/\s+/).filter(Boolean))
    out.push({
      values: withRip(values, i + 1),
      notes,
      flags,
      changed: new Set(Object.keys(t.set ?? {}).filter((k) => k !== 'RIP')),
    })
  })
  return out
}

function segment(trace: TraceCall[]) {
  const segs: { start: number; count: number }[] = []
  trace.forEach((t, i) => {
    const last = segs[segs.length - 1]
    if (last && t.block !== undefined && trace[last.start].block === t.block) last.count += 1
    else segs.push({ start: i, count: 1 })
  })
  return segs
}

/**
 * A compressed debugger session: register file with changed-value flashes,
 * status flags, a block-level timeline and a scrolling trace. Runs on its
 * own, pauses while you inspect a register, and can be single-stepped.
 */
export function DebuggerView({
  regs,
  trace,
  interval = 1100,
}: {
  regs: Reg[]
  trace: TraceCall[]
  interval?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const tipId = useId()
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(true)
  const [userRun, setUserRun] = useState(false)
  const [holding, setHolding] = useState(false)
  const [hoverReg, setHoverReg] = useState<string | null>(null)
  const [focusReg, setFocusReg] = useState<string | null>(null)
  const [pinReg, setPinReg] = useState<string | null>(null)

  const snaps = useMemo(() => buildSnapshots(regs, trace), [regs, trace])
  const segments = useMemo(() => segment(trace), [trace])
  const len = trace.length
  const s = Math.min(step, len)
  const snap = snaps[s]
  const done = len > 0 && s >= len
  const auto = running && (!reduced || userRun)
  const ticking = auto && inView && !holding && len > 0

  useEffect(() => {
    if (!ticking) return
    const t = setTimeout(
      () => setStep((v) => (v >= len ? 0 : v + 1)),
      s >= len ? interval * 2.2 : interval,
    )
    return () => clearTimeout(t)
  }, [ticking, s, len, interval])

  useEffect(() => {
    if (!inView) setPinReg(null)
  }, [inView])

  const advance = () => {
    setRunning(false)
    setStep((v) => (v >= len ? 0 : v + 1))
  }
  const toggleRun = () => {
    if (auto) {
      setRunning(false)
    } else {
      setRunning(true)
      setUserRun(true)
    }
  }

  const inspect = hoverReg ?? focusReg ?? pinReg
  const regRows = Math.ceil(regs.length / 2)
  const visible = Math.min(5, len)
  const first = Math.max(0, Math.min(s - 2, len - visible))
  const note =
    s === 0
      ? `breakpoint at ${trace[0]?.addr ?? '—'} · step to execute`
      : (trace[s - 1].note ?? trace[s - 1].text)

  const status = done
    ? { label: 'returned', tone: 'border-emerald-400/40 text-emerald-300', dot: 'bg-emerald-400' }
    : ticking
      ? { label: 'running', tone: 'border-accent/40 text-accent', dot: 'bg-accent animate-pulse' }
      : {
          label: auto ? 'hold' : 'break',
          tone: 'border-amber-400/40 text-amber-300',
          dot: 'bg-amber-400',
        }

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border bg-deep/40 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] transition-colors duration-300',
            status.tone,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted">
          {done ? 'ret →' : 'rip'}{' '}
          <span className="text-ink">{snap.values.RIP?.replace(/^0+(?=.{6})/, '') ?? trace[s]?.addr}</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <CtrlButton
            icon={auto ? Pause : Play}
            label={auto ? 'Pause execution' : 'Run'}
            onClick={toggleRun}
          />
          <CtrlButton icon={StepForward} label="Step into" text="Step" onClick={advance} />
          <CtrlButton icon={RotateCcw} label="Restart from breakpoint" onClick={() => setStep(0)} />
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10.5px] sm:gap-x-3 sm:text-[11px]"
        onPointerEnter={(e) => isMouse(e) && setHolding(true)}
        onPointerLeave={() => {
          setHolding(false)
          setHoverReg(null)
        }}
      >
        {regs.map((r, i) => {
          const value = snap.values[r.name] ?? r.value
          const changed = snap.changed.has(r.name)
          const open = inspect === r.name
          const regNote =
            r.name === 'RIP' && !done && trace[s]
              ? `next: ${trace[s].text.replace(/\s+/g, ' ')}`
              : snap.notes[r.name]
          return (
            <div key={r.name} className={cn('relative', open && 'z-20')}>
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                aria-label={`${r.name} ${value}`}
                aria-describedby={open ? tipId : undefined}
                onPointerEnter={(e) => isMouse(e) && setHoverReg(r.name)}
                onPointerLeave={() => setHoverReg(null)}
                onFocus={(e) => isFocusVisible(e.currentTarget) && setFocusReg(r.name)}
                onBlur={() => setFocusReg(null)}
                onClick={() => setPinReg((p) => (p === r.name ? null : r.name))}
                className={cn(
                  'relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-md border px-1.5 py-[3px] text-left transition-colors duration-300 [@media(pointer:coarse)]:min-h-10',
                  open
                    ? 'border-accent/50 bg-accent/15'
                    : 'border-transparent hover:border-accent/30 hover:bg-accent/[0.07]',
                )}
              >
                {changed && (
                  <motion.span
                    key={s}
                    aria-hidden
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 bg-accent/25"
                  />
                )}
                <span className="relative text-accent">{r.name}</span>
                <span
                  className={cn(
                    'relative truncate tabular-nums transition-colors duration-500',
                    changed ? 'text-accent3' : open ? 'text-ink' : 'text-muted',
                  )}
                >
                  {value}
                </span>
              </motion.button>
              {open && (
                <RegTip
                  id={tipId}
                  name={r.name}
                  value={value}
                  note={regNote}
                  right={i % 2 === 1}
                  above={Math.floor(i / 2) >= regRows / 2}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex shrink-0 gap-1" role="group" aria-label="Status flags">
          {FLAGS.map((f) => {
            const on = snap.flags.has(f.id)
            return (
              <span
                key={f.id}
                title={`${f.name} flag ${on ? 'set' : 'clear'}`}
                className={cn(
                  'rounded border px-1 py-0.5 font-mono text-[9px] leading-none transition-colors duration-300',
                  on ? 'border-accent/60 bg-accent/20 text-ink shadow-glow-sm' : 'border-accent/15 text-muted/45',
                )}
              >
                {f.id}
              </span>
            )
          })}
        </div>
        <div className="relative min-w-0 flex-1" aria-hidden>
          <div className="flex items-center gap-[3px]">
            {segments.map((g, i) => {
              const state = s >= g.start + g.count ? 'done' : s >= g.start ? 'cur' : 'todo'
              return (
                <motion.span
                  key={i}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{ flexGrow: g.count, transformOrigin: 'left' }}
                  className={cn(
                    'h-1.5 rounded-full transition-colors duration-500',
                    state === 'done' && 'bg-accent/70',
                    state === 'cur' && 'animate-pulse bg-accent2',
                    state === 'todo' && 'bg-muted/20',
                  )}
                />
              )
            })}
          </div>
          <div className="relative mt-1 h-2.5">
            <motion.span
              className="absolute top-0 h-2.5 w-px bg-accent shadow-glow-sm"
              animate={{ left: `${(s / Math.max(1, len)) * 100}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            >
              <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-accent" />
            </motion.span>
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-md border border-accent/10 bg-deep/30 font-mono text-[10.5px] [mask-image:linear-gradient(180deg,transparent,#000_7%,#000_93%,transparent)] sm:text-[11px]"
        style={{ height: visible * LINE_H + 8 }}
        aria-label="Execution trace"
        role="list"
      >
        <motion.div
          className="py-1"
          animate={{ y: -first * LINE_H }}
          transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        >
          {trace.map((c, i) => {
            const active = i === s
            return (
              <div
                key={`${c.addr}-${i}`}
                role="listitem"
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex h-5 items-center gap-2.5 px-1.5 transition-colors duration-300',
                  active ? 'bg-accent/15 text-ink' : i < s ? 'text-muted/50' : 'text-muted',
                )}
              >
                <span className={cn('w-2 shrink-0 text-accent', !active && 'opacity-0')}>▸</span>
                <span className={cn('shrink-0 tabular-nums', active ? 'text-accent' : 'text-muted/60')}>
                  {c.addr}
                </span>
                <span className="min-w-0 truncate whitespace-pre">{c.text}</span>
              </div>
            )
          })}
        </motion.div>
      </div>

      <p
        className="flex min-w-0 items-center gap-2 font-mono text-[10px] text-muted"
        aria-live={auto ? 'off' : 'polite'}
      >
        <span className="shrink-0 text-accent">;</span>
        <span className="truncate">{note}</span>
      </p>
    </div>
  )
}

function RegTip({
  id,
  name,
  value,
  note,
  right,
  above,
}: {
  id: string
  name: string
  value: string
  note?: string
  right: boolean
  above: boolean
}) {
  const info = interpret(value)
  return (
    <motion.div
      id={id}
      role="tooltip"
      initial={{ opacity: 0, y: above ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16 }}
      className={cn(
        'pointer-events-none absolute z-30 w-[15.5rem] max-w-[calc(100vw-2.5rem)] rounded-lg border border-accent/40 bg-deep/95 p-2.5 font-mono text-[10px] leading-[1.6] shadow-glow-sm',
        right ? 'right-0' : 'left-0',
        above ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
      )}
    >
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.16em]">
        <span className="text-accent">{name}</span>
        <span className="text-muted">64-bit</span>
      </div>
      {info ? (
        <dl className="grid grid-cols-[3.4rem_minmax(0,1fr)] gap-x-2">
          <dt className="text-muted">hex</dt>
          <dd className="truncate text-ink">{info.hex}</dd>
          <dt className="text-muted">dec</dt>
          <dd className="truncate text-ink">{info.dec}</dd>
          {info.signed && (
            <>
              <dt className="text-muted">signed</dt>
              <dd className="truncate text-accent3">{info.signed}</dd>
            </>
          )}
          <dt className="text-muted">ascii</dt>
          <dd className="truncate text-accent2">
            “{info.ascii}” <span className="text-muted/60">LE bytes</span>
          </dd>
        </dl>
      ) : (
        <p className="text-ink">{value}</p>
      )}
      {note && <p className="mt-1.5 border-t border-accent/15 pt-1.5 text-muted">{note}</p>}
    </motion.div>
  )
}

function CtrlButton({
  icon: Icon,
  label,
  text,
  onClick,
}: {
  icon: LucideIcon
  label: string
  text?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'group relative inline-flex h-8 items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-accent/30 bg-accent/[0.06] font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-all duration-300 hover:border-accent/70 hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm active:scale-95 [@media(pointer:coarse)]:h-10',
        text ? 'px-2.5 [@media(pointer:coarse)]:px-3.5' : 'w-8 [@media(pointer:coarse)]:w-10',
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <Icon className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
      {text && <span className="relative">{text}</span>}
    </button>
  )
}
