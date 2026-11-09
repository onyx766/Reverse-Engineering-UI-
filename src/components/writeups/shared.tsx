import { Fragment, type ReactNode } from 'react'
import { DIFFICULTY_WEIGHT, type Difficulty } from '@/data/writeups'
import { cn } from '@/lib/utils'

/* ── inline markdown: `code`, **bold** and *emphasis* ─────────────────────── */

// order matters: code first (its body is literal), then bold, then a single-
// asterisk emphasis that must open and close on a non-space character
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s](?:[^*]*[^*\s])?\*)/g

/** Renders a string with inline `code`, **bold** and *emphasis* spans. */
export function InlineText({ text }: { text: string }): JSX.Element {
  const nodes: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(text))) {
    if (m.index > last) nodes.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>)
    const tok = m[0]
    if (tok[0] === '`') {
      nodes.push(
        <code
          key={k++}
          className="break-words rounded-[4px] border border-accent/20 bg-accent/10 px-1 py-px font-mono text-[0.88em] text-accent2"
        >
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok[1] === '*') {
      nodes.push(
        <strong key={k++} className="font-semibold text-ink">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else {
      nodes.push(
        <em key={k++} className="italic text-ink/90">
          {tok.slice(1, -1)}
        </em>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(<Fragment key={k++}>{text.slice(last)}</Fragment>)
  return <>{nodes}</>
}

/* ── difficulty ───────────────────────────────────────────────────────────── */

export function DifficultyPips({
  level,
  className,
  showLabel = true,
}: {
  level: Difficulty
  className?: string
  showLabel?: boolean
}) {
  const filled = DIFFICULTY_WEIGHT[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="flex items-center gap-[3px]" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors duration-300',
              i <= filled ? 'bg-accent shadow-glow-sm' : 'bg-accent/20',
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {level}
        </span>
      )}
    </span>
  )
}

/* ── formatting ───────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** ISO date → "Mar 2024". Parsed as UTC to stay stable across timezones. */
export function formatDate(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  const month = MONTHS[(m ?? 1) - 1] ?? ''
  return `${month} ${y}`
}

export function readingLabel(minutes: number): string {
  return `${minutes} min read`
}

/** Globally-unique DOM id for a heading, so the TOC can scroll to it. */
export function headingDomId(articleId: string, headingId: string): string {
  return `wu-${articleId}-${headingId}`
}
