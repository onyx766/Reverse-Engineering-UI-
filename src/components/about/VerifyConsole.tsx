import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { TermLine } from '@/components/ui/Terminal'

const TONE = {
  ok: 'text-accent',
  warn: 'text-amber-300',
  dim: 'text-muted',
} as const

/**
 * Types a short shell session once it scrolls into view. Progress is a single
 * character counter, and untyped text is laid out invisibly so the box never
 * changes size while it types.
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
  const ends = useMemo(() => {
    let acc = 0
    return lines.map((l) => (acc += l.text.length))
  }, [lines])
  const total = ends[ends.length - 1] ?? 0
  const [count, setCount] = useState(0)
  // two characters per tick, but never skip past the end of a line
  const nextStop = (c: number) => Math.min(c + 2, ends.find((e) => e > c) ?? total)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setCount(total)
      return
    }
    if (count >= total) return
    const pause = count === 0 ? 500 : ends.includes(count) ? 260 : speed
    const t = setTimeout(() => setCount((c) => Math.min(total, nextStop(c))), pause)
    return () => clearTimeout(t)
  }, [inView, reduced, count, total, ends, speed])

  const done = count >= total
  let before = 0

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-accent/20 bg-deep/60 p-3 font-mono text-[11.5px] leading-[1.7]',
        className,
      )}
    >
      <div className="sr-only">
        {lines.map((l) => (
          <p key={l.text}>{l.text}</p>
        ))}
      </div>
      <div aria-hidden>
        {lines.map((l, i) => {
          const typed = Math.max(0, Math.min(l.text.length, count - before))
          const typing = !done && typed > 0 && typed < l.text.length
          before += l.text.length
          return (
            <div key={i} className={cn('whitespace-pre-wrap break-words', TONE[l.tone ?? 'dim'])}>
              {l.text.slice(0, typed)}
              {typing && <Caret />}
              <span className="invisible">{l.text.slice(typed)}</span>
            </div>
          )
        })}
        <div className="text-accent">
          $ <span className={cn(!done && 'invisible')}><Caret /></span>
        </div>
      </div>
    </div>
  )
}

function Caret() {
  return <span className="ml-0.5 inline-block h-3 w-1.5 animate-blink bg-accent align-middle" />
}
