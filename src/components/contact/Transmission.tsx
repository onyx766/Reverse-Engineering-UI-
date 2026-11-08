import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Mail, Monitor, Send, Server, type LucideIcon } from 'lucide-react'
import { clamp, cn, seeded } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Brief } from './lib'
import { EASE } from './fields'

export type Delivery = 'pending' | 'ok' | 'fail'

interface Props {
  brief: Brief
  mode: 'mailto' | 'endpoint'
  host: string
  delivery: Delivery
  onDone: (result: 'ok' | 'fail') => void
}

const NORMAL = { encode: 1000, frame: 250, flight: 560, ack: 380, confirm: 460, nack: 900 }
const REDUCED = { encode: 0, frame: 0, flight: 0, ack: 0, confirm: 320, nack: 450 }
const ROWS = 6

type Stage = 'encode' | 'transmit' | 'await' | 'ack' | 'done' | 'nack'

const hex2 = (n: number) => n.toString(16).padStart(2, '0')
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

/**
 * The "transmission" played after a valid submit: the message's real UTF-8
 * bytes scramble into an xxd-style dump, frames fly to the receiver with ACKs
 * coming back, and the submit button collapses into the progress bar.
 */
export function Transmission({ brief, mode, host, delivery, onDone }: Props) {
  const reduced = useReducedMotion()
  const T = reduced ? REDUCED : NORMAL
  const bytes = useMemo(() => new TextEncoder().encode(brief.message), [brief.message])
  const frames = clamp(Math.ceil(bytes.length / 256), 3, 6)
  const frameBytes = Math.ceil(bytes.length / frames)

  const [t, setT] = useState(0)
  const resolvedAt = useRef<number | null>(delivery === 'pending' ? null : 0)
  const awaiting = useRef(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const fired = useRef(false)

  // one clock drives the whole sequence; it idles at 4 fps while waiting on the server
  useEffect(() => {
    let raf = 0
    let last = 0
    const start = performance.now()
    const loop = (now: number) => {
      const el = now - start
      if (!awaiting.current || el - last > 250) {
        last = el
        setT(el)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (delivery !== 'pending' && resolvedAt.current === null) resolvedAt.current = t

  const encodeP = T.encode ? clamp(t / T.encode, 0, 1) : 1
  const tx = t - T.encode
  const launch = (i: number) => T.encode + i * T.frame
  const arrival = (i: number) => launch(i) + T.flight
  const flight = (i: number) =>
    T.flight ? clamp((t - launch(i)) / T.flight, 0, 1) : tx >= 0 ? 1 : 0
  const allArrived = arrival(frames - 1)

  let sentFrac = 0
  let sent = 0
  let acked = 0
  for (let i = 0; i < frames; i++) {
    sentFrac += flight(i)
    if (t >= launch(i)) sent++
    if (t >= arrival(i) + T.ack) acked++
  }
  sentFrac /= frames

  const resolved = resolvedAt.current
  const confirmStart = resolved === null ? Infinity : Math.max(allArrived, resolved)
  const confirmP =
    delivery === 'ok' && t >= confirmStart ? clamp((t - confirmStart) / T.confirm, 0, 1) : 0

  let stage: Stage
  if (encodeP < 1) stage = 'encode'
  else if (t < allArrived) stage = 'transmit'
  else if (delivery === 'pending') stage = 'await'
  else if (delivery === 'fail') stage = 'nack'
  else stage = confirmP < 1 ? 'ack' : 'done'
  awaiting.current = stage === 'await'

  const failed = stage === 'nack'
  const progress = failed
    ? 0.15 + sentFrac * 0.75
    : encodeP * 0.15 + sentFrac * 0.75 + confirmP * 0.1

  useEffect(() => {
    if (fired.current) return
    if (stage === 'done') {
      fired.current = true
      doneRef.current('ok')
    } else if (stage === 'nack' && t - confirmStart >= T.nack) {
      fired.current = true
      doneRef.current('fail')
    }
  }, [stage, t, confirmStart, T.nack])

  const recently = (at: number) => t >= at && t - at < 220
  let serverPulse = false
  let clientPulse = false
  for (let i = 0; i < frames; i++) {
    if (recently(arrival(i))) serverPulse = true
    if (T.ack && recently(arrival(i) + T.ack)) clientPulse = true
  }

  const label: Record<Stage, string> = {
    encode: 'Encoding payload',
    transmit: 'Transmitting',
    await: `Awaiting ACK from ${host}`,
    ack: mode === 'mailto' ? 'Handing off to your mail client' : 'ACK received',
    done: mode === 'mailto' ? 'Handed off' : 'Delivered',
    nack: 'Transmission failed',
  }
  const stepIndex = stage === 'encode' ? 0 : stage === 'transmit' || stage === 'await' || stage === 'nack' ? 1 : 2

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-1 flex-col gap-4"
    >
      {/* stepper + reference */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        <ol className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]">
          {['Encode', 'Transmit', 'Deliver'].map((s, i) => {
            const done = i < stepIndex || stage === 'done'
            const active = i === stepIndex && stage !== 'done'
            return (
              <li key={s} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn('h-px w-4 sm:w-6', done || active ? 'bg-accent/70' : 'bg-accent/20')}
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

      <HexStream bytes={bytes} encodeP={encodeP} t={t} reduced={reduced} />

      <motion.p
        initial={false}
        animate={{ opacity: encodeP >= 1 ? 1 : 0, y: encodeP >= 1 ? 0 : 6 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="-mt-1 truncate font-mono text-[10.5px] text-muted"
      >
        <span className="uppercase tracking-[0.14em] text-accent">{brief.digest.algo}</span>{' '}
        {brief.digest.hex.length > 24
          ? `${brief.digest.hex.slice(0, 16)}…${brief.digest.hex.slice(-8)}`
          : brief.digest.hex}
      </motion.p>

      {/* packet lane */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
        className="rounded-xl border border-accent/15 bg-deep/40 px-3 py-3"
      >
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
              Array.from({ length: frames }, (_, i) => {
                const p = flight(i)
                if (p <= 0 || p >= 1) return null
                return (
                  <span
                    key={`f${i}`}
                    aria-hidden
                    className="absolute inset-0"
                    style={{ transform: `translateX(${easeInOut(p) * 100}%)` }}
                  >
                    <span className="absolute left-0 top-[38%] flex -translate-x-full -translate-y-1/2 items-center">
                      <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent3" />
                      <span className="h-2 w-3 rounded-[2px] bg-accent3 shadow-glow-sm" />
                    </span>
                  </span>
                )
              })}
            {!reduced &&
              Array.from({ length: frames }, (_, i) => {
                const p = clamp((t - arrival(i)) / T.ack, 0, 1)
                if (p <= 0 || p >= 1) return null
                return (
                  <span
                    key={`a${i}`}
                    aria-hidden
                    className="absolute inset-0"
                    style={{ transform: `translateX(${(1 - easeInOut(p)) * 100}%)` }}
                  >
                    <span className="absolute left-0 top-[72%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent2 shadow-glow-sm" />
                  </span>
                )
              })}
          </div>
          <Node
            icon={mode === 'mailto' ? Mail : Server}
            label={mode === 'mailto' ? 'mail client' : host}
            active={serverPulse || stage === 'ack' || stage === 'done'}
            failed={failed}
          />
        </div>
        <div
          aria-hidden
          className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
        >
          <span>
            frame <span className="tabular-nums text-ink">{sent}</span>/{frames} ·{' '}
            {frameBytes.toLocaleString('en-US')} B
          </span>
          <span>
            ack <span className="tabular-nums text-accent">{acked}</span>
          </span>
        </div>
      </motion.div>

      {/* status + the submit button collapsing into a progress bar */}
      <div className="mt-auto pt-1">
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
          <span aria-hidden className={cn('tabular-nums', failed ? 'text-rose-300' : 'text-ink')}>
            {Math.round(progress * 100)}%
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
          aria-valuenow={Math.round(progress * 100)}
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
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 origin-left',
              failed ? 'bg-rose-400/80' : 'bg-gradient-to-r from-accent via-accent2 to-accent3',
            )}
            style={{ transform: `scaleX(${progress})` }}
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
 * xxd-style dump of the message's real UTF-8 bytes. Cells flicker through
 * random values until the encode sweep locks them to the actual byte.
 */
function HexStream({
  bytes,
  encodeP,
  t,
  reduced,
}: {
  bytes: Uint8Array
  encodeP: number
  t: number
  reduced: boolean
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

  const visible = Math.min(bytes.length, ROWS * perRow)
  const rows = Math.max(1, Math.ceil(visible / perRow))
  const locked = Math.floor(encodeP * visible)
  const rng = seeded(7 + Math.floor(t / 60))
  const scanning = !reduced && encodeP < 1

  return (
    <motion.div
      ref={boxRef}
      initial={{ opacity: 0, y: 12, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      className="relative overflow-hidden rounded-xl border border-accent/25 bg-deep/70 px-3 py-2.5 font-mono text-[10.5px] leading-[1.8] sm:text-[11px]"
    >
      {scanning && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-accent/20 to-transparent"
          style={{ top: `${encodeP * 100}%`, transform: 'translateY(-50%)' }}
        />
      )}
      <div className="mb-1 flex items-center justify-between gap-3 text-[9.5px] uppercase tracking-[0.16em] text-muted">
        <span className="truncate">payload · utf-8 · xxd -g1</span>
        <span className="shrink-0 tabular-nums text-accent">{bytes.length.toLocaleString('en-US')} B</span>
      </div>
      <div aria-hidden className="no-scrollbar overflow-x-auto">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-3 whitespace-pre">
            <span className="text-muted/50">{(r * perRow).toString(16).padStart(8, '0')}</span>
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
                      'transition-colors duration-150',
                      isLocked
                        ? k >= locked - 3 && encodeP < 1
                          ? 'text-accent3'
                          : 'text-accent'
                        : 'text-muted/35',
                    )}
                  >
                    {hex2(isLocked ? bytes[k] : Math.floor(rng() * 256))}
                  </span>
                )
              })}
            </span>
            <span className="text-muted/50">
              |
              {Array.from({ length: perRow }, (_, c) => {
                const k = r * perRow + c
                if (k >= visible) return ' '
                const b = bytes[k]
                const ch = b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'
                return (
                  <span key={c} className={k < locked ? 'text-ink/85' : 'text-muted/40'}>
                    {ch}
                  </span>
                )
              })}
              |
            </span>
          </div>
        ))}
      </div>
      {bytes.length > visible && (
        <div className="text-[10px] text-muted/55">
          … +{(bytes.length - visible).toLocaleString('en-US')} B
        </div>
      )}
      <span className="sr-only">
        Encoding {bytes.length} bytes of message text.
      </span>
    </motion.div>
  )
}
