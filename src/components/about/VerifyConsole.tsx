import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { clamp, cn } from '@/lib/utils'
import type { TermLine } from '@/components/ui/Terminal'

const TONE = {
  ok: 'text-accent',
  warn: 'text-amber-300',
  dim: 'text-muted',
} as const

/**
 * Types a short shell session once it scrolls into view. Progress is a single
 * character counter held in a motion value, so each keystroke writes text
 * straight to the DOM instead of re-rendering React every few milliseconds
 * (which would also keep interrupting the deferred mounts further down the
 * page). Untyped text is laid out invisibly, so the box never changes size.
 */
export function VerifyConsole({
  lines,
  speed = 11,
  className,
}: {
  lines: TermLine[]
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const starts = useMemo(() => {
    let acc = 0
    return lines.map((l) => {
      const start = acc
      acc += l.text.length
      return start
    })
  }, [lines])
  const ends = useMemo(() => lines.map((l, i) => starts[i] + l.text.length), [lines, starts])
  const total = ends[ends.length - 1] ?? 0
  const count = useMotionValue(reduced ? total : 0)
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      count.set(total)
      setDone(true)
      return
    }
    let timer = 0
    const tick = () => {
      const c = count.get()
      if (c >= total) {
        setDone(true)
        return
      }
      // two characters per tick, but never skip past the end of a line
      const next = Math.min(c + 2, ends.find((e) => e > c) ?? total)
      const pause = c === 0 ? 500 : ends.includes(c) ? 260 : speed
      timer = window.setTimeout(() => {
        count.set(next)
        tick()
      }, pause)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [inView, reduced, total, ends, speed, count])

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-accent/20 bg-deep/60 p-3 font-mono text-[11.5px] leading-[1.7]',
        className,
      )}
    >
      <div className="sr-only">
        {lines.map((l, i) => (
          <p key={i}>{l.text}</p>
        ))}
      </div>
      <div aria-hidden>
        {lines.map((l, i) => (
          <TypedLine key={i} line={l} start={starts[i]} count={count} />
        ))}
        {/* the next prompt only appears once the session has finished printing */}
        <div className={cn('text-accent', !done && 'invisible')}>
          $ <Caret />
        </div>
      </div>
    </div>
  )
}

function TypedLine({ line, start, count }: { line: TermLine; start: number; count: MotionValue<number> }) {
  const { text } = line
  const typed = (c: number) => clamp(c - start, 0, text.length)
  const shown = useTransform(count, (c) => text.slice(0, typed(c)))
  const rest = useTransform(count, (c) => text.slice(typed(c)))
  // the caret sits on the line being typed; it takes no room anywhere else
  const caret = useTransform(count, (c) => {
    const t = typed(c)
    return t > 0 && t < text.length ? 'inline-block' : 'none'
  })

  return (
    <div className={cn('whitespace-pre-wrap break-words', TONE[line.tone ?? 'dim'])}>
      <motion.span>{shown}</motion.span>
      <motion.span className={CARET} style={{ display: caret }} />
      <motion.span className="invisible">{rest}</motion.span>
    </div>
  )
}

const CARET = 'ml-0.5 inline-block h-3 w-1.5 animate-blink bg-accent align-middle'

function Caret() {
  return <span className={CARET} />
}
