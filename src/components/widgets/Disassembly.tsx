import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { isMouse, useDismiss } from './dom'

export interface Insn {
  addr: string
  mnemonic: string
  operands: string
  /** renders the operand as a jump / call target */
  target?: boolean
  /** raw encoding, e.g. '48 83 FE 24' */
  bytes?: string
  /** analyst comment, revealed on hover */
  comment?: string
  /** cross-reference hint, e.g. '→ sub_4012F0' */
  xref?: string
  /** destination address; when it is inside the listing the operand becomes clickable */
  to?: string
  /** label printed on its own line above the instruction, e.g. 'loc_40102C' */
  label?: string
  /** dimmed remark after the label, e.g. 'CODE XREF ×4' */
  labelNote?: string
  /** basic-block id, used to link the listing with a CfgGraph */
  block?: string
}

interface Props {
  code: Insn[]
  interval?: number
  /** addresses to emphasise, e.g. the CFG block under the cursor */
  highlight?: string[]
  /** reports the address under the cursor or keyboard caret (null when none) */
  onFocusAddr?: (addr: string | null) => void
  /** accessible name of the listing */
  label?: string
  className?: string
}

const LINE = 20
const norm = (a: string) => a.replace(/^0x/i, '').replace(/^0+(?=.)/, '').toUpperCase()
const SIZE_KW = /^(byte|word|dword|qword)$/i
const NUMBER = /^(0x[0-9a-f]+|\d+)$/i

/**
 * A disassembly listing with a live instruction pointer, IDA-style flow
 * arrows in the gutter, hover comments, xref hints and click-to-follow jumps.
 * Arrow keys move a caret; Enter follows the jump under it.
 */
export function Disassembly({
  code,
  interval = 1000,
  highlight,
  onFocusAddr,
  label = 'Disassembly listing',
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const uid = useId()
  const markerId = `dis${uid.replace(/:/g, '')}`
  const [pc, setPc] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [caret, setCaret] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const [jump, setJump] = useState<{ from: number; to: number; n: number } | null>(null)
  const [spoken, setSpoken] = useState('')

  const index = useMemo(() => new Map(code.map((c, i) => [norm(c.addr), i])), [code])
  const tops = useMemo(() => {
    let y = 0
    return code.map((c) => {
      if (c.label) y += LINE
      const top = y
      y += LINE
      return top
    })
  }, [code])
  const height = code.reduce((h, c) => h + (c.label ? 2 : 1) * LINE, 0)

  const arrows = useMemo(() => {
    const list = code.flatMap((c, i) => {
      const j = c.to ? index.get(norm(c.to)) : undefined
      return j === undefined ? [] : [{ from: i, to: j }]
    })
    return list
      .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
      .map((a, lane) => ({ ...a, lane }))
  }, [code, index])

  const gutter = 12 + arrows.length * 4
  const lit = useMemo(() => new Set((highlight ?? []).map(norm)), [highlight])
  const focusIdx = hover ?? caret
  const paused = hover !== null || focused || jump !== null

  useEffect(() => {
    if (!inView || reduced || paused) return
    const t = setInterval(
      () =>
        setPc((p) =>
          /^ret/i.test(code[p]?.mnemonic ?? '') || p + 1 >= code.length ? 0 : p + 1,
        ),
      interval,
    )
    return () => clearInterval(t)
  }, [inView, reduced, paused, code, interval])

  useDismiss(ref, caret !== null, () => setCaret(null))

  useEffect(() => {
    if (!jump) return
    const t = setTimeout(() => setJump(null), 1800)
    return () => clearTimeout(t)
  }, [jump])

  const report = useRef(onFocusAddr)
  report.current = onFocusAddr
  const focusAddr = focusIdx === null ? null : (code[focusIdx]?.addr ?? null)
  useEffect(() => {
    report.current?.(focusAddr)
  }, [focusAddr])

  const targetOf = (i: number) => {
    const t = code[i]?.to
    return t ? index.get(norm(t)) : undefined
  }

  const describe = (i: number) => {
    const c = code[i]
    return c ? `${c.addr} ${c.mnemonic} ${c.operands}${c.comment ? `. ${c.comment}` : ''}` : ''
  }

  const follow = (i: number) => {
    const j = targetOf(i)
    if (j === undefined) return
    setCaret(j)
    setJump({ from: i, to: j, n: Date.now() })
    setSpoken(`Jumped to ${describe(j)}`)
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = caret ?? pc
    let next: number
    switch (e.key) {
      case 'ArrowDown':
        next = caret === null ? cur : Math.min(code.length - 1, cur + 1)
        break
      case 'ArrowUp':
        next = caret === null ? cur : Math.max(0, cur - 1)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = code.length - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (caret !== null) follow(caret)
        return
      case 'Escape':
        setCaret(null)
        return
      default:
        return
    }
    e.preventDefault()
    setCaret(next)
    setSpoken(describe(next))
  }

  const arrowOn = (a: { from: number; to: number }) =>
    (jump !== null && jump.from === a.from && jump.to === a.to) ||
    (focusIdx !== null && (a.from === focusIdx || a.to === focusIdx))

  const shown = focusIdx ?? pc
  const info = code[shown]

  return (
    <div ref={ref} className={cn('flex flex-col gap-2', className)}>
      <div
        role="listbox"
        tabIndex={0}
        aria-label={`${label}. Arrow keys move the caret, Enter follows a jump.`}
        aria-activedescendant={caret !== null ? `${uid}-o${caret}` : undefined}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPointerLeave={() => setHover(null)}
        className="relative rounded-md font-mono text-[10.5px] outline-none focus-visible:ring-1 focus-visible:ring-accent/60 sm:text-[11.5px]"
        style={{ paddingLeft: gutter }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={gutter}
          height={height}
        >
          <defs>
            <marker id={`${markerId}-d`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0 L6 3 L0 6 z" fill="rgb(var(--accent) / 0.55)" />
            </marker>
            <marker id={`${markerId}-a`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0 L6 3 L0 6 z" fill="rgb(var(--accent-3))" />
            </marker>
          </defs>
          {arrows.map((a) => {
            const on = arrowOn(a)
            const x = 3 + a.lane * 4
            const xr = gutter - 3
            const ys = tops[a.from] + LINE / 2
            const yd = tops[a.to] + LINE / 2
            const dir = yd > ys ? 1 : -1
            return (
              <path
                key={`${a.from}-${a.to}`}
                d={`M${xr} ${ys} H${x + 3} Q${x} ${ys} ${x} ${ys + 3 * dir} V${yd - 3 * dir} Q${x} ${yd} ${x + 3} ${yd} H${xr}`}
                fill="none"
                stroke={on ? 'rgb(var(--accent-3))' : 'rgb(var(--accent) / 0.34)'}
                strokeWidth={on ? 1.5 : 1}
                markerEnd={`url(#${markerId}-${on ? 'a' : 'd'})`}
                style={{
                  transition: 'stroke .25s, stroke-width .25s',
                  filter: on ? 'drop-shadow(0 0 3px rgb(var(--accent-3) / 0.85))' : undefined,
                }}
              />
            )
          })}
          {code.length > 0 && (
            <g
              style={{
                transform: `translateY(${(tops[pc] ?? 0) + LINE / 2}px)`,
                transition: reduced ? undefined : 'transform .35s cubic-bezier(.22,1,.36,1)',
              }}
            >
              <path d={`M${gutter - 10} -3.5 L${gutter - 5} 0 L${gutter - 10} 3.5 z`} fill="rgb(var(--accent))" />
            </g>
          )}
        </svg>

        {code.map((ins, i) => {
          const exec = i === pc
          const focus = i === focusIdx
          const linked = lit.has(norm(ins.addr))
          const target = targetOf(i)
          return (
            <div
              key={`${ins.addr}-${i}`}
              id={`${uid}-o${i}`}
              role="option"
              aria-selected={caret === i}
              onPointerEnter={(e) => isMouse(e) && setHover(i)}
              onClick={() => setCaret((c) => (c === i ? null : i))}
            >
              {ins.label && (
                <div className="flex h-5 items-center gap-2 overflow-hidden whitespace-nowrap pl-1.5">
                  <span className="shrink-0 font-semibold text-accent2">{ins.label}:</span>
                  {ins.labelNote && <span className="truncate text-muted/55">; {ins.labelNote}</span>}
                </div>
              )}
              <div
                className={cn(
                  'relative flex h-5 items-center gap-2 whitespace-nowrap rounded px-1.5 transition-colors duration-200 sm:gap-2.5',
                  exec
                    ? 'bg-accent/[0.18] text-ink'
                    : focus
                      ? 'bg-accent/[0.1] text-ink'
                      : linked
                        ? 'bg-accent2/[0.12] text-ink'
                        : 'text-muted',
                )}
              >
                {(focus || linked) && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-y-[3px] left-0 w-[2px] rounded-full',
                      focus ? 'bg-accent shadow-glow-sm' : 'bg-accent2',
                    )}
                  />
                )}
                {jump?.to === i && (
                  <motion.span
                    key={jump.n}
                    aria-hidden
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.6, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 rounded bg-accent3/25 ring-1 ring-accent3/80"
                  />
                )}
                <span className={cn('w-[8.5ch] shrink-0 tabular-nums', exec ? 'text-accent' : 'text-muted/65')}>
                  {ins.addr}
                </span>
                <span className={cn('w-[4.5ch] shrink-0 font-semibold', exec && 'neon')}>{ins.mnemonic}</span>
                <span className="shrink-0">{renderOperands(ins, target !== undefined, () => follow(i))}</span>
                {ins.comment && (
                  <span
                    className={cn(
                      'ml-auto hidden min-w-0 truncate pl-3 text-muted/75 transition-opacity duration-200 sm:block',
                      focus ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    ; {ins.comment}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex h-[42px] flex-col justify-center overflow-hidden rounded-md border border-accent/15 bg-deep/40 px-2.5 font-mono text-[10px] leading-[1.55]">
        {info && (
          <>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={cn(
                  'shrink-0 rounded px-1 text-[8.5px] uppercase tracking-[0.14em] transition-colors duration-200',
                  focusIdx !== null ? 'bg-accent2/20 text-accent2' : 'bg-accent/15 text-accent',
                )}
              >
                {focusIdx !== null ? 'inspect' : 'exec'}
              </span>
              <span className="shrink-0 tabular-nums text-muted/70">{info.addr}</span>
              {info.bytes && <span className="min-w-0 truncate text-accent3/90">{info.bytes}</span>}
              {info.xref && (
                <span className="ml-auto hidden shrink-0 pl-2 text-accent2/90 lg:inline">{info.xref}</span>
              )}
            </div>
            <div className="truncate text-muted">
              {info.comment ? `; ${info.comment}` : `${info.mnemonic} ${info.operands}`}
              {info.xref && <span className="text-accent2/80 lg:hidden"> · {info.xref}</span>}
            </div>
          </>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </div>
  )
}

function renderOperands(ins: Insn, followable: boolean, follow: () => void): ReactNode {
  if (followable) {
    return (
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation()
          follow()
        }}
        title={`Follow jump to ${ins.to}`}
        className="relative rounded-sm px-0.5 text-accent2 underline decoration-accent2/40 decoration-dotted underline-offset-[3px] transition-colors after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] hover:bg-accent2/15 hover:text-ink hover:decoration-accent2"
      >
        {ins.operands}
      </button>
    )
  }
  if (ins.target) return <span className="text-accent2">{ins.operands}</span>
  return ins.operands
    .split(/(0x[0-9a-f]+|\b\d+\b|\b(?:byte|word|dword|qword)\b)/i)
    .map((part, k) =>
      NUMBER.test(part) ? (
        <span key={k} className="text-accent3">
          {part}
        </span>
      ) : SIZE_KW.test(part) ? (
        <span key={k} className="text-muted/70">
          {part}
        </span>
      ) : (
        part
      ),
    )
}
