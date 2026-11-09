import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useAnimationFrame, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { Check, Mail, Monitor, Send, Server, type LucideIcon } from 'lucide-react'
import { clamp, cn, seeded } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PROFILE } from '@/data/profile'
import { crc32, endpointLabel, type Brief } from './lib'
import { EASE } from './fields'

export type Delivery = 'pending' | 'ok' | 'fail'

interface Props {
  brief: Brief
  mode: 'mailto' | 'endpoint'
  host: string
  delivery: Delivery
  /** server status line on success, or the human-readable failure, for the log */
  detail?: string
  onDone: (result: 'ok' | 'fail') => void
}

interface LogLine {
  id: string
  at: number
  tag: string
  text: string
  tone?: 'ok' | 'err' | 'accent'
}

const NORMAL = { encode: 1000, frame: 260, flight: 560, ack: 380, confirm: 520, nack: 950 }
const REDUCED = { encode: 0, frame: 0, flight: 0, ack: 0, confirm: 320, nack: 450 }
const HEX_ROWS = 8
/** React re-renders ~15x/s for the discrete events; motion values carry everything that glides */
const TICK_MS = 66
/** while the server thinks nothing moves, so the React clock drops to 4 fps */
const IDLE_MS = 250

type Stage = 'encode' | 'transmit' | 'await' | 'ack' | 'done' | 'nack'
type FrameState = 'queued' | 'sent' | 'ack' | 'nack'

const hex = (n: number, w: number) => n.toString(16).padStart(w, '0')
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

/**
 * The "transmission" played after a valid submit: the message's real UTF-8
 * bytes scramble into a hex dump, frames (with their real CRC-32s) fly to the
 * receiver with ACKs coming back, and the submit button collapses into the
 * progress bar it leaves behind.
 */
export function Transmission({ brief, mode, host, delivery, detail, onDone }: Props) {
  const reduced = useReducedMotion()
  const T = reduced ? REDUCED : NORMAL
  const rootRef = useRef<HTMLDivElement>(null)
  const bytes = useMemo(() => new TextEncoder().encode(brief.message), [brief.message])
  const chunks = useMemo(() => {
    const n = clamp(Math.ceil(bytes.length / 256), 3, 6)
    const size = Math.ceil(bytes.length / n)
    return Array.from({ length: n }, (_, i) => {
      const part = bytes.subarray(i * size, Math.min(bytes.length, (i + 1) * size))
      return { offset: i * size, len: part.length, crc: crc32(part) }
    })
  }, [bytes])
  const frames = chunks.length

  // one clock drives the sequence: a motion value every frame for the packets, the
  // progress fill and the scan line, React state a few times a second for the rest
  const clock = useMotionValue(0)
  const [t, setT] = useState(0)
  const lastTick = useRef(0)
  const resolvedAt = useRef<number | null>(delivery === 'pending' ? null : 0)
  const awaiting = useRef(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const fired = useRef(false)

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true })
  }, [])

  useAnimationFrame((time) => {
    if (fired.current) return
    clock.set(time)
    if (time - lastTick.current >= (awaiting.current ? IDLE_MS : TICK_MS)) {
      lastTick.current = time
      setT(time)
    }
  })

  if (delivery !== 'pending' && resolvedAt.current === null) resolvedAt.current = t

  const encodeP = T.encode ? clamp(t / T.encode, 0, 1) : 1
  const launch = (i: number) => T.encode + i * T.frame
  const arrival = (i: number) => launch(i) + T.flight
  const flightAt = (i: number, now: number) =>
    T.flight ? clamp((now - launch(i)) / T.flight, 0, 1) : now >= launch(i) ? 1 : 0
  const allArrived = arrival(frames - 1)
  const resolved = resolvedAt.current
  // the final frame is only ACKed (or NACKed) after the earlier ACKs and the real delivery have settled
  const settled = frames > 1 ? Math.max(allArrived, arrival(frames - 2) + T.ack) : allArrived
  const finalAck = resolved === null ? Infinity : Math.max(settled, resolved)
  const ackAt = (i: number) => (i < frames - 1 ? arrival(i) + T.ack : finalAck + T.ack)

  let sent = 0
  for (let i = 0; i < frames; i++) if (t >= launch(i)) sent++

  const confirmAt = (now: number) =>
    delivery === 'ok' && now >= finalAck ? clamp((now - finalAck) / T.confirm, 0, 1) : 0
  const confirmP = confirmAt(t)

  let stage: Stage
  if (encodeP < 1) stage = 'encode'
  else if (t < allArrived) stage = 'transmit'
  else if (t < finalAck) stage = 'await'
  else if (delivery === 'fail') stage = 'nack'
  else stage = confirmP < 1 ? 'ack' : 'done'
  // nothing moves while the server thinks, so the clock can idle
  awaiting.current = delivery === 'pending' && t >= settled
  const failed = stage === 'nack'

  const frameState = (i: number): FrameState => {
    if (i === frames - 1 && failed) return 'nack'
    if (t >= ackAt(i)) return 'ack'
    if (t >= launch(i)) return 'sent'
    return 'queued'
  }
  const acked = chunks.filter((_, i) => frameState(i) === 'ack').length

  const progressAt = (now: number) => {
    let sentFrac = 0
    for (let i = 0; i < frames; i++) sentFrac += flightAt(i, now)
    sentFrac /= frames
    if (failed) return 0.15 + sentFrac * 0.75
    const enc = T.encode ? clamp(now / T.encode, 0, 1) : 1
    return enc * 0.15 + sentFrac * 0.75 + confirmAt(now) * 0.1
  }
  // the transformer is re-read on every render, so it always sees the latest delivery state
  const progress = useTransform(clock, progressAt)
  const percent = useTransform(progress, (p) => `${Math.round(p * 100)}%`)

  useEffect(() => {
    if (fired.current) return
    if (stage === 'done') {
      fired.current = true
      doneRef.current('ok')
    } else if (stage === 'nack' && t - finalAck >= T.nack) {
      fired.current = true
      doneRef.current('fail')
    }
  }, [stage, t, finalAck, T.nack])

  const recently = (at: number) => t >= at && t - at < 240
  let serverPulse = false
  let clientPulse = false
  for (let i = 0; i < frames; i++) {
    if (recently(arrival(i))) serverPulse = true
    if (T.ack && recently(ackAt(i))) clientPulse = true
  }

  const log: LogLine[] = [
    {
      id: 'open',
      at: 0,
      tag: 'open',
      text: mode === 'mailto' ? `mailto:${PROFILE.email}` : `POST ${endpointLabel()}`,
      tone: 'accent',
    },
    { id: 'enc', at: 0, tag: 'encode', text: `utf-8 · ${bytes.length} B → ${frames} frames` },
  ]
  if (encodeP >= 1)
    log.push({
      id: 'dig',
      at: T.encode,
      tag: brief.digest.algo,
      text: `${brief.digest.hex.slice(0, 16)}…`,
    })
  chunks.forEach((c, i) => {
    if (t >= launch(i))
      log.push({ id: `tx${i}`, at: launch(i), tag: 'tx', text: `#${i + 1} len ${c.len} crc ${hex(c.crc, 8)}` })
    if (frameState(i) === 'ack') log.push({ id: `ack${i}`, at: ackAt(i), tag: 'ack', text: `#${i + 1}`, tone: 'ok' })
  })
  if (mode === 'endpoint' && t >= allArrived)
    log.push({ id: 'wait', at: allArrived, tag: 'wait', text: `response from ${host}…` })
  if (failed) log.push({ id: 'err', at: finalAck, tag: 'error', text: detail ?? 'delivery failed', tone: 'err' })
  if (delivery === 'ok' && t >= finalAck)
    log.push({
      id: 'fin',
      at: finalAck,
      tag: mode === 'mailto' ? 'handoff' : 'http',
      text: mode === 'mailto' ? 'opening your default mail client' : (detail ?? `accepted by ${host}`),
      tone: 'ok',
    })
  if (stage === 'done') log.push({ id: 'close', at: finalAck + T.confirm, tag: 'close', text: brief.ref })
  log.sort((a, b) => a.at - b.at)

  const label: Record<Stage, string> = {
    encode: 'Encoding payload',
    transmit: `Transmitting frame ${Math.max(1, sent)} of ${frames}`,
    await: `Awaiting ACK from ${host}`,
    ack: mode === 'mailto' ? 'Handing off to your mail client' : 'ACK received',
    done: mode === 'mailto' ? 'Handed off' : 'Delivered',
    nack: 'Transmission failed',
  }
  const stepIndex = stage === 'encode' ? 0 : stage === 'transmit' || stage === 'await' || stage === 'nack' ? 1 : 2
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.5, delay: reduced ? 0 : delay, ease: EASE },
  })

  return (
    <motion.div
      ref={rootRef}
      tabIndex={-1}
      role="group"
      aria-label="Transmitting your message"
      initial={{ opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-1 flex-col outline-none"
    >
      <div className="flex flex-1 flex-col gap-4 pb-5">
        {/* stepper + reference */}
        <motion.div {...reveal(0.12)} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ol className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]">
            {['Encode', 'Transmit', 'Deliver'].map((s, i) => {
              const done = i < stepIndex || stage === 'done'
              const active = i === stepIndex && stage !== 'done'
              return (
                <li key={s} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={cn('h-px w-3 sm:w-6', done || active ? 'bg-accent/70' : 'bg-accent/20')}
                    />
                  )}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors duration-300',
                      active && failed
                        ? 'border-rose-400/60 bg-rose-400/10 text-rose-300'
                        : active
                          ? 'border-accent/70 bg-accent/15 text-ink shadow-glow-sm'
                          : done
                            ? 'border-accent/40 text-accent'
                            : 'border-accent/15 text-muted/60',
                    )}
                  >
                    {done ? (
                      <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <span aria-hidden className="text-[9px] opacity-70">
                        0{i + 1}
                      </span>
                    )}
                    {s}
                  </span>
                </li>
              )
            })}
          </ol>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            ref <span className="text-accent">{brief.ref}</span>
          </span>
        </motion.div>

        <HexStream bytes={bytes} encodeP={encodeP} t={t} reduced={reduced} clock={clock} encodeMs={T.encode} />

        <motion.p
          initial={false}
          animate={{ opacity: encodeP >= 1 ? 1 : 0.35 }}
          transition={{ duration: 0.4 }}
          className="-mt-1 flex min-w-0 items-center gap-2 font-mono text-[10.5px] text-muted"
        >
          <span className="shrink-0 uppercase tracking-[0.14em] text-accent">{brief.digest.algo}</span>
          <span className="truncate">
            {encodeP >= 1
              ? brief.digest.hex.length > 24
                ? `${brief.digest.hex.slice(0, 20)}…${brief.digest.hex.slice(-12)}`
                : brief.digest.hex
              : 'computing…'}
          </span>
        </motion.p>

        {/* packet lane */}
        <motion.div {...reveal(0.22)} className="rounded-xl border border-accent/15 bg-deep/40 px-3 py-3">
          <div className="flex items-center gap-3">
            <Node icon={Monitor} label="you" active={clientPulse} />
            <div className="relative h-12 min-w-0 flex-1 overflow-hidden">
              <span
                aria-hidden
                className="absolute inset-x-0 top-[38%] h-px bg-gradient-to-r from-accent/60 via-accent/25 to-accent/60"
              />
              <span
                aria-hidden
                className="absolute inset-x-0 top-[72%] h-px"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgb(var(--accent-2) / 0.35) 0 4px, transparent 4px 9px)',
                }}
              />
              {!reduced &&
                chunks.map((c, i) => (
                  <LaneMarker key={`f${c.offset}`} clock={clock} from={launch(i)} duration={T.flight}>
                    <span className="absolute left-0 top-[38%] flex -translate-x-full -translate-y-1/2 items-center">
                      <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent3" />
                      <span className="h-2 w-3 rounded-[2px] bg-accent3 shadow-glow-sm" />
                    </span>
                  </LaneMarker>
                ))}
              {!reduced &&
                chunks.map((c, i) =>
                  frameState(i) === 'nack' ? null : (
                    <LaneMarker key={`a${c.offset}`} clock={clock} from={ackAt(i) - T.ack} duration={T.ack} reverse>
                      <span className="absolute left-0 top-[72%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent2 shadow-glow-sm" />
                    </LaneMarker>
                  ),
                )}
            </div>
            <Node
              icon={mode === 'mailto' ? Mail : Server}
              label={mode === 'mailto' ? 'mail app' : host}
              active={serverPulse || stage === 'ack' || stage === 'done'}
              failed={failed}
            />
          </div>
        </motion.div>

        {/* capture table: real offsets, lengths and CRC-32s of each frame */}
        <motion.div
          {...reveal(0.3)}
          className="overflow-hidden rounded-xl border border-accent/15 bg-deep/40 font-mono text-[10.5px]"
        >
          <div className="grid grid-cols-[1.6rem_4.4rem_2.6rem_minmax(0,1fr)_3.4rem] gap-2 border-b border-accent/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-muted">
            <span>#</span>
            <span>offset</span>
            <span>len</span>
            <span>crc32</span>
            <span className="text-right">state</span>
          </div>
          {chunks.map((c, i) => {
            const st = frameState(i)
            return (
              <div
                key={c.offset}
                className={cn(
                  'grid grid-cols-[1.6rem_4.4rem_2.6rem_minmax(0,1fr)_3.4rem] gap-2 px-3 py-[3px] transition-colors duration-300',
                  st === 'sent' && 'bg-accent/[0.08]',
                  st === 'nack' && 'bg-rose-400/[0.08]',
                )}
              >
                <span className="text-muted/70">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-muted">0x{hex(c.offset, 4)}</span>
                <span className="tabular-nums text-ink/80">{c.len}</span>
                <span className={cn('truncate', st === 'queued' ? 'text-muted/40' : 'text-accent')}>
                  {hex(c.crc, 8)}
                </span>
                <span
                  className={cn(
                    'text-right uppercase tracking-[0.1em]',
                    st === 'ack'
                      ? 'text-emerald-300'
                      : st === 'nack'
                        ? 'text-rose-300'
                        : st === 'sent'
                          ? 'text-accent'
                          : 'text-muted/45',
                  )}
                >
                  {st}
                </span>
              </div>
            )
          })}
        </motion.div>

        <TxLog lines={log} reduced={reduced} live={stage !== 'done' && !failed} />
      </div>

      {/* status + the submit button collapsing into a progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.16em]">
          <span
            role="status"
            aria-live="polite"
            className={cn('inline-flex min-w-0 items-center gap-2', failed ? 'text-rose-300' : 'text-accent')}
          >
            <span
              aria-hidden
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                failed ? 'bg-rose-400' : 'bg-accent shadow-glow-sm',
                !reduced && stage !== 'done' && !failed && 'animate-pulse',
              )}
            />
            <span className="truncate">{label[stage]}</span>
          </span>
          <span aria-hidden className="flex shrink-0 items-center gap-3">
            <span className="hidden text-muted sm:inline">
              ack <span className="tabular-nums text-accent">{acked}</span>/{frames}
            </span>
            <motion.span className={cn('tabular-nums', failed ? 'text-rose-300' : 'text-ink')}>
              {percent}
            </motion.span>
          </span>
        </div>
        <motion.div
          initial={{ height: 52, borderRadius: 14 }}
          animate={{ height: 10, borderRadius: 999 }}
          transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : 0.1, ease: EASE }}
          role="progressbar"
          aria-label="Transmission progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressAt(t) * 100)}
          className={cn(
            'relative w-full overflow-hidden border transition-colors duration-300',
            failed ? 'border-rose-400/60 bg-rose-400/10' : 'border-accent/60 bg-accent/15',
          )}
        >
          <motion.span
            aria-hidden
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            className="absolute inset-0 flex items-center justify-center gap-2.5 font-display text-[12.5px] font-bold uppercase tracking-[0.2em] text-ink"
          >
            <Send className="h-4 w-4" />
            Transmit message
          </motion.span>
          <motion.span
            aria-hidden
            className={cn(
              'absolute inset-0 origin-left',
              failed ? 'bg-rose-400/80' : 'bg-gradient-to-r from-accent via-accent2 to-accent3',
            )}
            style={{ scaleX: progress }}
          />
          {!reduced && !failed && stage !== 'done' && (
            <span
              aria-hidden
              className="absolute inset-0 animate-shimmer"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, transparent 30%, rgb(255 255 255 / 0.4) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/** A packet or ACK gliding along the lane, positioned straight from the clock (no re-renders). */
function LaneMarker({
  clock,
  from,
  duration,
  reverse,
  children,
}: {
  clock: MotionValue<number>
  from: number
  duration: number
  reverse?: boolean
  children: ReactNode
}) {
  const p = useTransform(clock, (now) => (duration ? clamp((now - from) / duration, 0, 1) : 0))
  const x = useTransform(p, (v) => `${(reverse ? 1 - easeInOut(v) : easeInOut(v)) * 100}%`)
  const opacity = useTransform(p, (v) => (v > 0 && v < 1 ? 1 : 0))
  return (
    <motion.span aria-hidden className="absolute inset-0" style={{ x, opacity }}>
      {children}
    </motion.span>
  )
}

const TAG_TONE = {
  ok: 'text-emerald-300',
  err: 'text-rose-300',
  accent: 'text-accent',
} as const

/** Timestamped event log; grows into whatever height the panel has left. */
function TxLog({ lines, reduced, live }: { lines: LogLine[]; reduced: boolean; live: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.36, ease: EASE }}
      className="relative min-h-[150px] flex-1 overflow-hidden rounded-xl border border-accent/15 bg-deep/50"
    >
      <div className="flex items-center justify-between border-b border-accent/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        <span>tx.log</span>
        <span className="tabular-nums">{lines.length} events</span>
      </div>
      <div
        ref={boxRef}
        aria-hidden
        className="no-scrollbar absolute inset-x-0 bottom-0 top-[27px] overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-[1.8]"
      >
        {lines.map((l) => (
          <motion.div
            key={l.id}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex gap-3 whitespace-nowrap"
          >
            <span className="shrink-0 tabular-nums text-muted/50">+{(l.at / 1000).toFixed(3)}</span>
            <span className={cn('w-[4.5rem] shrink-0', l.tone ? TAG_TONE[l.tone] : 'text-accent/80')}>
              {l.tag}
            </span>
            <span className={cn('truncate', l.tone === 'err' ? 'text-rose-200/90' : 'text-ink/80')}>{l.text}</span>
          </motion.div>
        ))}
        {live && <span className="mt-0.5 inline-block h-3 w-1.5 animate-blink bg-accent align-middle" />}
      </div>
    </motion.div>
  )
}

function Node({
  icon: Icon,
  label,
  active,
  failed,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  failed?: boolean
}) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-20">
      <span
        className={cn(
          'relative grid h-11 w-11 place-items-center rounded-xl border transition-[color,background-color,border-color,box-shadow,transform] duration-200',
          failed
            ? 'border-rose-400/70 bg-rose-400/15 text-rose-300'
            : active
              ? 'scale-105 border-accent bg-accent/25 text-accent shadow-glow'
              : 'border-accent/30 bg-accent/5 text-muted',
        )}
      >
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="max-w-full truncate font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
    </div>
  )
}

/**
 * Hex dump of the message's real UTF-8 bytes, laid out exactly like
 * `hexdump -C` (16 per row) or `xxd -c8 -g1` (8 per row, narrow panels).
 * Cells flicker through random values until the encode sweep locks them to
 * the actual byte; the text column fills in as each byte locks.
 */
function HexStream({
  bytes,
  encodeP,
  t,
  reduced,
  clock,
  encodeMs,
}: {
  bytes: Uint8Array
  encodeP: number
  t: number
  reduced: boolean
  clock: MotionValue<number>
  encodeMs: number
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [perRow, setPerRow] = useState(() => (window.innerWidth >= 1024 ? 16 : 8))

  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      setPerRow(entry.contentRect.width >= 500 ? 16 : 8)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visible = Math.min(bytes.length, HEX_ROWS * perRow)
  const rows = Math.max(1, Math.ceil(visible / perRow))
  const locked = Math.floor(encodeP * visible)
  const rng = seeded(7 + Math.floor(t / 60))
  const scanning = !reduced && encodeP < 1
  const xxd = perRow !== 16
  const scanTop = useTransform(clock, (now) => `${(encodeMs ? clamp(now / encodeMs, 0, 1) : 1) * 100}%`)

  return (
    <motion.div
      ref={boxRef}
      initial={{ opacity: 0, y: reduced ? 0 : 12, rotateX: reduced ? 0 : -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.06, ease: EASE }}
      className="relative overflow-hidden rounded-xl border border-accent/25 bg-deep/70 px-3 py-2.5 font-mono text-[10.5px] leading-[1.8] sm:text-[11px]"
    >
      {scanning && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-10 -translate-y-1/2 bg-gradient-to-b from-transparent via-accent/20 to-transparent"
          style={{ top: scanTop }}
        />
      )}
      <div className="mb-1 flex items-center justify-between gap-3 text-[9.5px] uppercase tracking-[0.16em] text-muted">
        <span className="truncate">
          payload · utf-8 · <span className="normal-case tracking-[0.06em]">{xxd ? 'xxd -c8 -g1' : 'hexdump -C'}</span>
        </span>
        <span className="shrink-0 tabular-nums text-accent">{bytes.length.toLocaleString('en-US')} B</span>
      </div>
      <div aria-hidden className="no-scrollbar overflow-x-auto">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-3 whitespace-pre">
            <span className="text-muted/50">
              {hex(r * perRow, 8)}
              {xxd ? ':' : ''}
            </span>
            <span className="flex">
              {Array.from({ length: perRow }, (_, c) => {
                const k = r * perRow + c
                const gap = c > 0 ? (perRow === 16 && c === 8 ? 'ml-[1.1ch]' : 'ml-[0.55ch]') : ''
                if (k >= visible)
                  return (
                    <span key={c} className={cn(gap, 'text-transparent')}>
                      00
                    </span>
                  )
                const isLocked = k < locked
                return (
                  <span
                    key={c}
                    className={cn(
                      gap,
                      isLocked
                        ? k >= locked - 3 && encodeP < 1
                          ? 'text-accent3'
                          : 'text-accent'
                        : 'text-muted/35',
                    )}
                  >
                    {hex(isLocked ? bytes[k] : Math.floor(rng() * 256), 2)}
                  </span>
                )
              })}
            </span>
            <span className="text-muted/50">
              {xxd ? '' : '|'}
              {Array.from({ length: Math.min(perRow, visible - r * perRow) }, (_, c) => {
                const k = r * perRow + c
                const b = bytes[k]
                const ch = k < locked && b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'
                return (
                  <span key={c} className={k < locked ? 'text-ink/85' : 'text-muted/40'}>
                    {ch}
                  </span>
                )
              })}
              {xxd ? '' : '|'}
            </span>
          </div>
        ))}
      </div>
      {bytes.length > visible && (
        <div className="text-[10px] text-muted/55">… +{(bytes.length - visible).toLocaleString('en-US')} B</div>
      )}
      <span className="sr-only">Encoding {bytes.length} bytes of message text.</span>
    </motion.div>
  )
}
