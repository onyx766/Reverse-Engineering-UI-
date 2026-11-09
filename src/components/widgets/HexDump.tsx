import { Fragment, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { isFocusVisible, isMouse, offsetWithin, useDismiss } from './dom'

export type FieldKind = 'header' | 'meta' | 'data' | 'footer' | 'none'

export interface HexRow {
  offset: string
  bytes: string[]
  ascii: string
  /** per-byte field classification, same length as `bytes` */
  kinds?: FieldKind[]
}

export interface HexField {
  name: string
  /** absolute byte offset */
  offset: number
  /** length in bytes */
  size: number
  kind: FieldKind
  /** declared type, e.g. 'char[4]' or 'u32 LE' */
  type: string
  /** decoded value */
  value: string
  /** decoding detail shown in the tooltip */
  note?: string
}

/** The payload once decoded (inflated, decrypted, …), shown under the hex grid. */
export interface HexDecoded {
  /** the operation, e.g. 'inflate(chunk[0])' */
  label: string
  /** size change or similar, e.g. '28 B → 20 B' */
  meta?: string
  /** the decoded value, printed in full */
  value: string
  /** one-line verdict under the value */
  note?: string
  /** byte region lit while the pointer is over the box */
  kind?: FieldKind
}

interface Props {
  rows: HexRow[]
  legend?: boolean
  /** field map; enables per-field hover, tooltips and the structure table */
  fields?: HexField[]
  /** legend / badge wording per kind */
  labels?: Partial<Record<FieldKind, string>>
  /** show the parsed structure next to the hex (requires `fields`) */
  structure?: boolean
  /**
   * Decoded payload under the hex grid. Beside a structure table it is shown
   * from md up only (on phones the table already prints the value in full).
   */
  decoded?: HexDecoded
}

const KIND_TEXT: Record<FieldKind, string> = {
  header: 'text-accent',
  meta: 'text-accent2',
  data: 'text-accent3',
  footer: 'text-emerald-300',
  none: 'text-muted',
}

const KIND_BAND: Record<FieldKind, string> = {
  header: 'bg-accent/30',
  meta: 'bg-accent2/30',
  data: 'bg-accent3/25',
  footer: 'bg-emerald-400/25',
  none: 'bg-white/10',
}

const SWATCH: Record<FieldKind, string> = {
  header: 'bg-accent',
  meta: 'bg-accent2',
  data: 'bg-accent3',
  footer: 'bg-emerald-400',
  none: 'bg-muted',
}

const DEFAULT_LABELS: Record<FieldKind, string> = {
  header: 'Header',
  meta: 'Metadata',
  data: 'Data (zlib)',
  footer: 'Footer',
  none: 'Unmapped',
}

const KIND_ORDER: FieldKind[] = ['header', 'meta', 'data', 'footer', 'none']

type Sel = { field: number; anchor: number } | { kind: FieldKind } | null

interface Cell {
  b: string
  off: number
  fi: number
  kind: FieldKind
  ch: string
}

const hex = (n: number, w = 4) => n.toString(16).toUpperCase().padStart(w, '0')

/**
 * Line-break opportunities after commas, so a wrapped value splits between JSON
 * members. Chrome breaks at <wbr> even under white-space: nowrap, so where the
 * text must stay on one line pass a class that hides the <wbr> (display: none
 * removes the opportunity).
 */
const breakable = (v: string, wbrClassName?: string): ReactNode =>
  v.includes(',')
    ? v.split(',').map((part, i, all) => (
        <Fragment key={i}>
          {part}
          {i < all.length - 1 && (
            <>
              ,<wbr className={wbrClassName} />
            </>
          )}
        </Fragment>
      ))
    : v

const sameSel = (a: Sel, b: Sel) =>
  !!a && !!b && ('field' in a ? 'field' in b && a.field === b.field : 'kind' in b && a.kind === b.kind)

const sameField = (a: Cell, b: Cell) => a.fi === b.fi && (a.fi >= 0 || a.kind === b.kind)

/**
 * Hex view with per-field colouring, contiguous highlight bands, a decoding
 * tooltip, an optional parsed-structure table (010 Editor / ImHex style) and
 * a legend that lights every byte of a region.
 */
export function HexDump({ rows, legend = true, fields, labels, structure = false, decoded }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const byteRefs = useRef(new Map<number, HTMLSpanElement>())
  const fieldRefs = useRef<(HTMLButtonElement | null)[]>([])
  const inView = useInView(rootRef, { margin: '-40px' })
  const reduced = useReducedMotion()
  const tipId = useId()
  const [hover, setHover] = useState<Sel>(null)
  const [focus, setFocus] = useState<Sel>(null)
  const [pinned, setPinned] = useState<Sel>(null)
  const [cursor, setCursor] = useState(0)
  // roving tabindex: the structure table is one Tab stop, arrow keys walk the fields
  const [roving, setRoving] = useState(0)
  const sel = hover ?? focus ?? pinned
  const names = { ...DEFAULT_LABELS, ...labels }
  const showStruct = structure && !!fields?.length
  const cols = rows.reduce((m, r) => Math.max(m, r.bytes.length), 0)

  const grid = useMemo<Cell[][]>(
    () =>
      rows.map((r) => {
        const base = parseInt(r.offset, 16) || 0
        return r.bytes.map((b, i) => {
          const off = base + i
          const fi = fields ? fields.findIndex((f) => off >= f.offset && off < f.offset + f.size) : -1
          const kind = fi >= 0 && fields ? fields[fi].kind : (r.kinds?.[i] ?? 'none')
          return { b, off, fi, kind, ch: r.ascii[i] ?? '.' }
        })
      }),
    [rows, fields],
  )

  const counts = useMemo(() => {
    const c: Partial<Record<FieldKind, number>> = {}
    grid.flat().forEach((cell) => {
      c[cell.kind] = (c[cell.kind] ?? 0) + 1
    })
    return c
  }, [grid])

  const total = grid.reduce((n, r) => n + r.length, 0)
  const legendKinds = KIND_ORDER.filter((k) => k !== 'none' && counts[k])
  const parsing = fields?.length && !sel && !reduced ? cursor : -1

  useEffect(() => {
    if (!fields?.length || !inView || reduced || sel) return
    const t = setInterval(() => setCursor((c) => (c + 1) % fields.length), 950)
    return () => clearInterval(t)
  }, [fields, inView, reduced, sel])

  useEffect(() => {
    if (!inView) setPinned(null)
  }, [inView])

  useDismiss(rootRef, pinned !== null, () => setPinned(null))

  const selFor = (c: Cell): Sel => (c.fi >= 0 ? { field: c.fi, anchor: c.off } : { kind: c.kind })
  const toggle = (s: Sel) => setPinned((p) => (sameSel(p, s) ? null : s))
  const litOf = (c: Cell): boolean | null => {
    if (!sel) return null
    return 'field' in sel ? c.fi === sel.field : c.kind === sel.kind
  }

  const moveFocus = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = fields?.length ?? 0
    if (e.key === 'Escape') {
      setPinned(null)
      return
    }
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
    fieldRefs.current[to]?.focus()
  }

  let tip: { left: number; top: number; width: number; above: boolean; f: HexField } | null = null
  if (sel && 'field' in sel && fields && rootRef.current) {
    const el = byteRefs.current.get(sel.anchor)
    const f = fields[sel.field]
    if (el && f) {
      const root = rootRef.current
      const p = offsetWithin(el, root)
      const width = Math.min(252, root.offsetWidth)
      const above = p.y > 100
      tip = {
        f,
        width,
        above,
        left: Math.max(0, Math.min(p.x - 12, root.offsetWidth - width)),
        top: above ? p.y - 6 : p.y + el.offsetHeight + 6,
      }
    }
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-3">
      <div className={cn('flex flex-col gap-4', showStruct && 'md:flex-row md:items-start md:gap-6')}>
        <div
          className={cn(
            'flex shrink-0 flex-col gap-3',
            showStruct ? 'self-center md:self-start' : 'self-start',
          )}
        >
          <div
            role="group"
            aria-label={`Hex view, ${total} bytes`}
            onPointerLeave={() => setHover(null)}
            className="relative font-mono text-[10.5px] leading-5 min-[400px]:text-[11px]"
          >
            {!reduced && (
              <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded">
                <span className="absolute inset-x-0 top-0 h-6 animate-scanline bg-gradient-to-b from-transparent via-accent/10 to-transparent" />
              </span>
            )}
            <div aria-hidden className="flex h-5 items-center gap-3 whitespace-nowrap text-muted/40">
              <span className="w-[4ch]">off</span>
              <span className="flex">
                {Array.from({ length: cols }, (_, i) => (
                  <span key={i} className="px-[0.28em]">
                    {hex(i, 2)}
                  </span>
                ))}
              </span>
              <span>ascii</span>
            </div>
            {grid.map((row, r) => (
              <motion.div
                key={rows[r].offset}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: r * 0.06 }}
                className="flex h-5 items-center gap-3 whitespace-nowrap"
              >
                <span className="w-[4ch] tabular-nums text-muted/60">{rows[r].offset}</span>
                <span className="flex">
                  {row.map((c, i) => {
                    const lit = litOf(c)
                    const joinL = i > 0 && sameField(row[i - 1], c)
                    const joinR = i < row.length - 1 && sameField(row[i + 1], c)
                    return (
                      <span
                        key={c.off}
                        ref={(el) => {
                          if (el) byteRefs.current.set(c.off, el)
                          else byteRefs.current.delete(c.off)
                        }}
                        onPointerEnter={(e) => isMouse(e) && setHover(selFor(c))}
                        onClick={() => toggle(selFor(c))}
                        className={cn(
                          'cursor-default px-[0.28em] transition-[background-color,color,opacity,box-shadow] duration-200',
                          !joinL && 'rounded-l-[3px]',
                          !joinR && 'rounded-r-[3px]',
                          lit === null
                            ? KIND_TEXT[c.kind]
                            : lit
                              ? cn(KIND_BAND[c.kind], 'text-ink')
                              : cn(KIND_TEXT[c.kind], 'opacity-30'),
                          c.fi >= 0 && c.fi === parsing && 'shadow-[inset_0_-1px_0_rgb(var(--accent)/0.85)]',
                        )}
                      >
                        {c.b}
                      </span>
                    )
                  })}
                  {Array.from({ length: cols - row.length }, (_, i) => (
                    <span key={`pad${i}`} aria-hidden className="px-[0.28em] opacity-0">
                      00
                    </span>
                  ))}
                </span>
                <span className="flex" aria-label={`ascii ${rows[r].ascii}`}>
                  {row.map((c, i) => {
                    const lit = litOf(c)
                    const joinL = i > 0 && sameField(row[i - 1], c)
                    const joinR = i < row.length - 1 && sameField(row[i + 1], c)
                    return (
                      <span
                        key={c.off}
                        aria-hidden
                        onPointerEnter={(e) => isMouse(e) && setHover(selFor(c))}
                        onClick={() => toggle(selFor(c))}
                        className={cn(
                          'cursor-default whitespace-pre transition-[background-color,color,opacity] duration-200',
                          !joinL && 'rounded-l-[2px]',
                          !joinR && 'rounded-r-[2px]',
                          lit === null ? 'text-muted/80' : lit ? cn(KIND_BAND[c.kind], 'text-ink') : 'text-muted/30',
                        )}
                      >
                        {c.ch}
                      </span>
                    )
                  })}
                </span>
              </motion.div>
            ))}
          </div>

          {decoded && (
            <div
              onPointerEnter={(e) => decoded.kind && isMouse(e) && setHover({ kind: decoded.kind })}
              onPointerLeave={() => decoded.kind && setHover(null)}
              className={cn(
                // w-0 + min-w-full: fills the hex column without ever widening it
                'w-0 min-w-full rounded-md border border-accent/15 bg-deep/40 px-2.5 py-2 font-mono transition-colors duration-200 hover:border-accent/40',
                showStruct && 'hidden md:block',
              )}
            >
              <div className="flex items-center gap-2 text-[9.5px] text-muted">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span className="truncate">{decoded.label}</span>
                {decoded.meta && (
                  <span className="ml-auto shrink-0 tabular-nums text-muted/70">{decoded.meta}</span>
                )}
              </div>
              <div className={cn('mt-1 break-words text-[11px] leading-5', KIND_TEXT[decoded.kind ?? 'data'])}>
                {breakable(decoded.value)}
              </div>
              {decoded.note && <div className="truncate text-[9.5px] text-muted/80">{decoded.note}</div>}
            </div>
          )}
        </div>

        {showStruct && fields && (
          <div
            role="group"
            aria-label="Parsed structure. Arrow keys move between fields, Enter pins one."
            className="min-w-0 flex-1 md:border-l md:border-accent/15 md:pl-6"
          >
            <div
              aria-hidden
              className="mb-1 hidden h-5 items-center gap-2 px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted/50 md:flex"
            >
              <span className="w-1.5" />
              <span className="w-[5ch]">off</span>
              <span className="flex-1">field</span>
              <span className="w-[8ch]">type</span>
              <span className="w-[12ch] text-right">value</span>
            </div>
            <div className="grid grid-cols-2 gap-1 md:grid-cols-1 md:gap-0">
              {fields.map((f, i) => {
                const on = !!sel && ('field' in sel ? sel.field === i : sel.kind === f.kind)
                const isParsing = parsing === i
                return (
                  <button
                    key={`${f.name}-${f.offset}`}
                    ref={(el) => {
                      fieldRefs.current[i] = el
                    }}
                    type="button"
                    tabIndex={i === roving ? 0 : -1}
                    aria-pressed={!!pinned && 'field' in pinned && pinned.field === i}
                    aria-describedby={sel && 'field' in sel && sel.field === i ? tipId : undefined}
                    onPointerEnter={(e) => isMouse(e) && setHover({ field: i, anchor: f.offset })}
                    onPointerLeave={() => setHover(null)}
                    onFocus={(e) => {
                      setRoving(i)
                      if (isFocusVisible(e.currentTarget)) setFocus({ field: i, anchor: f.offset })
                    }}
                    onBlur={() => setFocus(null)}
                    onClick={() => toggle({ field: i, anchor: f.offset })}
                    onKeyDown={(e) => moveFocus(e, i)}
                    className={cn(
                      'relative flex min-h-10 min-w-0 flex-col justify-center rounded-md border px-2 text-left font-mono transition-colors duration-200 md:h-[22px] md:min-h-0 md:flex-row md:items-center md:justify-start md:gap-2 md:border-transparent md:px-1.5 [@media(pointer:coarse)]:md:h-9',
                      on
                        ? 'border-accent/40 bg-accent/15 text-ink md:border-transparent'
                        : isParsing
                          ? 'border-accent/15 bg-accent/[0.07] text-ink/90'
                          : 'border-accent/10 text-muted hover:bg-accent/10 hover:text-ink',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 md:contents">
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SWATCH[f.kind])} />
                      <span className="hidden w-[5ch] shrink-0 text-[10px] tabular-nums text-muted/60 md:inline">
                        +{hex(f.offset, 2)}
                      </span>
                      <span className="min-w-0 truncate text-[10px] md:flex-1 md:text-[10.5px]">{f.name}</span>
                    </span>
                    <span className="hidden w-[8ch] shrink-0 truncate text-[10px] text-muted/60 md:inline">
                      {f.type}
                    </span>
                    <span
                      className={cn(
                        // phones wrap long values (the inflated payload); the md+ table truncates and
                        // the decoded box under the hex prints it in full
                        'min-w-0 break-words text-[10.5px] md:w-[12ch] md:shrink-0 md:truncate md:text-right',
                        KIND_TEXT[f.kind],
                      )}
                    >
                      {breakable(f.value, 'md:hidden')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {legend && legendKinds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-t border-accent/15 pt-2.5">
          {legendKinds.map((k, i) => {
            const on = !!sel && 'kind' in sel && sel.kind === k
            return (
              <motion.button
                key={k}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                aria-pressed={!!pinned && 'kind' in pinned && pinned.kind === k}
                onPointerEnter={(e) => isMouse(e) && setHover({ kind: k })}
                onPointerLeave={() => setHover(null)}
                onFocus={(e) => isFocusVisible(e.currentTarget) && setFocus({ kind: k })}
                onBlur={() => setFocus(null)}
                onClick={() => toggle({ kind: k })}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md border px-2 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors duration-200 [@media(pointer:coarse)]:h-10',
                  on
                    ? 'border-accent/50 bg-accent/15 text-ink'
                    : 'border-transparent text-muted hover:border-accent/30 hover:bg-accent/[0.08] hover:text-ink',
                )}
              >
                <span className={cn('h-2 w-2 rounded-[3px]', SWATCH[k])} />
                {names[k]}
                <span className="normal-case tracking-normal text-muted/60">{counts[k]} B</span>
              </motion.button>
            )
          })}
          {fields?.length ? (
            <span className="ml-auto hidden font-mono text-[9.5px] text-muted/60 sm:inline">
              {total} bytes · {fields.length} fields
            </span>
          ) : null}
        </div>
      )}

      {tip && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: tip.left,
            top: tip.top,
            width: tip.width,
            transform: tip.above ? 'translateY(-100%)' : undefined,
          }}
        >
          <motion.div
            key={tip.f.offset}
            id={tipId}
            role="tooltip"
            initial={{ opacity: 0, y: tip.above ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="rounded-lg border border-accent/40 bg-deep/95 p-2.5 font-mono text-[10px] leading-[1.55] shadow-glow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold text-ink">{tip.f.name}</span>
              <span
                className={cn(
                  'shrink-0 rounded px-1 py-px text-[8.5px] uppercase tracking-[0.14em]',
                  KIND_BAND[tip.f.kind],
                  KIND_TEXT[tip.f.kind],
                )}
              >
                {names[tip.f.kind]}
              </span>
            </div>
            <div className="mt-0.5 text-muted">
              0x{hex(tip.f.offset)} · {tip.f.size} {tip.f.size === 1 ? 'byte' : 'bytes'} · {tip.f.type}
            </div>
            <div className={cn('mt-1 break-words text-[11px]', KIND_TEXT[tip.f.kind])}>{tip.f.value}</div>
            {tip.f.note && (
              <div className="mt-1 border-t border-accent/15 pt-1 text-muted/90">{tip.f.note}</div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
