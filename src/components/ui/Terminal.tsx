import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

export interface TermLine {
  text: string
  tone?: 'ok' | 'warn' | 'dim'
}

const TONE = {
  ok: 'text-accent',
  warn: 'text-amber-300',
  dim: 'text-muted',
} as const

/**
 * Types a log out line-by-line, character-by-character, the first time it
 * scrolls into view. Auto-scrolls and parks a blinking cursor at the end.
 */
export function Terminal({
  lines,
  speed = 14,
  className,
  height = 'h-52',
}: {
  lines: TermLine[]
  speed?: number
  className?: string
  height?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState<string[]>([])

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setShown(lines.map((l) => l.text))
      return
    }

    let line = 0
    let char = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (line >= lines.length) return
      const full = lines[line].text
      char += 1
      setShown((prev) => {
        const next = prev.slice(0, line)
        next[line] = full.slice(0, char)
        return next
      })
      if (char >= full.length) {
        line += 1
        char = 0
        timer = setTimeout(tick, 230)
      } else {
        timer = setTimeout(tick, speed)
      }
    }

    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [inView, lines, speed, reduced])

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [shown])

  return (
    <div
      ref={boxRef}
      className={cn(
        'no-scrollbar overflow-y-auto rounded-lg border border-accent/20 bg-deep/60 p-3 font-mono text-[11.5px] leading-[1.7]',
        height,
        className,
      )}
    >
      {shown.map((text, i) => (
        <div key={i} className={cn('whitespace-pre-wrap', TONE[lines[i]?.tone ?? 'dim'])}>
          {text}
          {i === shown.length - 1 && shown.length < lines.length && (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-blink bg-accent align-middle" />
          )}
        </div>
      ))}
      {shown.length >= lines.length && (
        <div className="text-accent">
          ${' '}
          <span className="ml-0.5 inline-block h-3 w-1.5 animate-blink bg-accent align-middle" />
        </div>
      )}
    </div>
  )
}
