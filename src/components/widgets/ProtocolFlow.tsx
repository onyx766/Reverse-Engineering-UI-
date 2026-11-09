import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useInView } from 'framer-motion'
import { Monitor, Server, type LucideIcon } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { isFocusVisible, isMouse, offsetWithin, useDismiss } from './dom'

export interface Exchange {
  label: string
  dir: 'up' | 'down'
  tone?: 'ok' | 'err' | 'info'
  /** raw request / response head: start line, headers, optional blank line + body */
  raw?: string[]
  /** short tag on the row, e.g. 'unsigned' */
  note?: string
}

interface Props {
  exchanges: Exchange[]
  interval?: number
  /** endpoint captions */
  client?: string
  server?: string
}

const TONE: Record<NonNullable<Exchange['tone']>, string> = {
  ok: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  err: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
  info: 'text-accent border-accent/40 bg-accent/10',
}

const statusTone = (code: string) =>
  code.startsWith('2') ? 'text-emerald-300' : /^[45]/.test(code) ? 'text-rose-300' : 'text-amber-300'

/**
 * Client ⇄ Server ladder. Exchanges light up in sequence with a packet
 * sliding along each lane; hovering (or tapping) one freezes the capture and
 * opens its raw HTTP head, the way you would in an intercepting proxy.
 */
export function ProtocolFlow({ exchanges, interval = 1150, client = 'Client', server = 'Server' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const popId = useId()
  const [step, setStep] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  // roving tabindex: the ladder is one Tab stop, arrow keys walk the exchanges
  const [roving, setRoving] = useState(0)
  const open = hover ?? focus ?? pinned

  const onRowKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'Escape') {
      setPinned(null)
      return
    }
    const n = exchanges.length
    const to =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? i + 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? i - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : null
    if (to === null || to < 0 || to >= n) return
    e.preventDefault()
    rowRefs.current[to]?.focus()
  }

  useEffect(() => {
    if (!inView || reduced || open !== null) return
    const t = setInterval(() => setStep((s) => (s + 1) % (exchanges.length + 1)), interval)
    return () => clearInterval(t)
  }, [inView, reduced, open, exchanges.length, interval])

  useEffect(() => {
    if (!inView) setPinned(null)
  }, [inView])

  useDismiss(ref, pinned !== null, () => setPinned(null))

  const current = open ?? (step > 0 ? step - 1 : null)
  const sender = current !== null ? exchanges[current]?.dir : undefined

  let pop: { top: number; above: boolean; x: Exchange; i: number } | null = null
  if (open !== null && ref.current && exchanges[open]?.raw?.length) {
    const el = rowRefs.current[open]
    if (el) {
      const p = offsetWithin(el, ref.current)
      const above = open >= exchanges.length / 2
      pop = { x: exchanges[open], i: open, above, top: above ? p.y - 6 : p.y + el.offsetHeight + 6 }
    }
  }

  return (
    <div ref={ref} className="relative flex items-stretch gap-2 sm:gap-3">
      <Endpoint icon={Monitor} label={client} active={sender === 'up'} />

      <div
        role="group"
        aria-label={`${client} to ${server} exchanges. Arrow keys move between them, Enter pins one open.`}
        className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:gap-2"
        onPointerLeave={() => setHover(null)}
      >
        {exchanges.map((x, i) => {
          const active = !reduced && i === step - 1 && open === null
          // while one exchange is open the replay is frozen and the whole capture reads as recorded
          const done = reduced || open !== null || i < step - 1
          const inspected = open === i
          const lit = active || done || inspected
          return (
            <motion.button
              key={`${x.label}-${i}`}
              ref={(el) => {
                rowRefs.current[i] = el
              }}
              type="button"
              tabIndex={i === roving ? 0 : -1}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              aria-label={`${x.dir === 'up' ? `${client} to ${server}` : `${server} to ${client}`}: ${x.label}`}
              aria-expanded={x.raw ? inspected : undefined}
              aria-describedby={inspected && x.raw ? popId : undefined}
              onPointerEnter={(e) => isMouse(e) && setHover(i)}
              onFocus={(e) => {
                setRoving(i)
                if (isFocusVisible(e.currentTarget)) setFocus(i)
              }}
              onBlur={() => setFocus(null)}
              onClick={() => setPinned((p) => (p === i ? null : i))}
              onKeyDown={(e) => onRowKey(e, i)}
              className={cn(
                'relative flex w-full items-center gap-2 overflow-hidden rounded-md border px-2 py-1.5 text-left font-mono text-[10.5px] transition-[color,background-color,border-color,box-shadow] duration-300 [@media(pointer:coarse)]:min-h-10',
                lit ? TONE[x.tone ?? 'info'] : 'border-white/5 bg-white/[0.02] text-muted/50',
                active && 'shadow-glow-sm',
                inspected ? 'text-ink ring-1 ring-inset ring-accent/70' : 'hover:border-accent/50 hover:text-ink',
              )}
            >
              <span aria-hidden className={cn('shrink-0', x.dir === 'up' ? 'order-1' : 'order-4')}>
                {x.dir === 'up' ? '→' : '←'}
              </span>
              <span className="order-2 min-w-0 flex-1 truncate">{x.label}</span>
              {x.note && (
                <span className="order-3 hidden shrink-0 rounded border border-white/15 px-1 text-[8.5px] uppercase tracking-[0.12em] opacity-80 sm:inline">
                  {x.note}
                </span>
              )}
              {active && <PacketTrack key={step} dir={x.dir} />}
            </motion.button>
          )
        })}
      </div>

      <Endpoint icon={Server} label={server} active={sender === 'down'} />

      {pop && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30"
          style={{ top: pop.top, transform: pop.above ? 'translateY(-100%)' : undefined }}
        >
          <motion.div
            key={pop.i}
            id={popId}
            role="tooltip"
            initial={{ opacity: 0, y: pop.above ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="rounded-lg border border-accent/40 bg-deep/95 p-2.5 font-mono text-[10px] leading-[1.6] shadow-glow-sm"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.16em]">
              <span className="truncate text-accent">
                {pop.x.dir === 'up' ? `request · ${client} → ${server}` : `response · ${server} → ${client}`}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {String(pop.i + 1).padStart(2, '0')}/{String(exchanges.length).padStart(2, '0')}
              </span>
            </div>
            {pop.x.raw?.map((line, k, all) => (
              <HttpLine key={k} line={line} first={k === 0} body={all.indexOf('') > -1 && k > all.indexOf('')} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}

function HttpLine({ line, first, body }: { line: string; first: boolean; body: boolean }) {
  if (!line) return <div className="h-1.5" aria-hidden />
  if (first) {
    const status = line.match(/^(HTTP\/[\d.]+)\s+(\d{3})\s+(.*)$/)
    if (status)
      return (
        <div className="truncate">
          <span className="text-muted">{status[1]} </span>
          <span className={statusTone(status[2])}>
            {status[2]} {status[3]}
          </span>
        </div>
      )
    const request = line.match(/^([A-Z]+)\s+(\S+)\s+(HTTP\/[\d.]+)$/)
    if (request)
      return (
        <div className="truncate">
          <span className="font-semibold text-accent">{request[1]}</span>{' '}
          <span className="text-ink">{request[2]}</span> <span className="text-muted">{request[3]}</span>
        </div>
      )
  }
  const header = !body && line.match(/^([A-Za-z0-9-]+):\s?(.*)$/)
  if (header)
    return (
      <div className="truncate">
        <span className="text-accent2">{header[1]}:</span> <span className="text-ink/90">{header[2]}</span>
      </div>
    )
  return <div className="truncate text-accent3/90">{line}</div>
}

function PacketTrack({ dir }: { dir: 'up' | 'down' }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
      <motion.span
        className="absolute inset-y-0 left-0 w-full"
        initial={{ x: dir === 'up' ? '-3%' : '97%' }}
        animate={{ x: dir === 'up' ? '97%' : '-3%' }}
        transition={{ duration: 0.95, ease: 'easeInOut' }}
      >
        <motion.span
          className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent3 shadow-glow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.95 }}
        />
      </motion.span>
    </span>
  )
}

function Endpoint({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center justify-center gap-1.5 sm:w-14">
      <span
        className={cn(
          'relative grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 sm:h-10 sm:w-10',
          active
            ? 'border-accent bg-accent/20 text-accent shadow-glow'
            : 'border-accent/25 bg-accent/5 text-muted',
        )}
      >
        {active && (
          <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-xl border border-accent/60" />
        )}
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="max-w-full truncate font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
    </div>
  )
}
