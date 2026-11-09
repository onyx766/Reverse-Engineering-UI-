import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

type Kind = 'com' | 'str' | 'num' | 'prompt'
interface Tok {
  t: string
  k?: Kind
}

const KIND_CLASS: Record<Kind, string> = {
  com: 'text-muted/70 italic',
  str: 'text-accent3',
  num: 'text-accent2',
  prompt: 'text-accent font-semibold',
}

const PROMPT = /^(\$ |0:000> |pwndbg> )/

function commentMarker(lang: string): string | null {
  const l = lang.toLowerCase()
  if (l.includes('lua')) return '--'
  // GNU as on AArch64 reads ';' as a statement separator, so comments there are '//'
  if (l.includes('aarch64')) return '//'
  if (l.includes('asm')) return ';'
  if (l.includes('cmd')) return 'rem'
  if (l.includes('windbg')) return null
  if (/python|shell|yaml|bpftrace/.test(l)) return '#'
  return '//'
}

function pushPlain(out: Tok[], text: string) {
  text.split(/(0x[0-9a-fA-F]+|\b\d+\b)/).forEach((part, i) => {
    if (part) out.push(i % 2 ? { t: part, k: 'num' } : { t: part })
  })
}

/** Deliberately tiny: comments, strings, numbers and prompts — enough to read a snippet at a glance. */
function tokenize(line: string, marker: string | null): Tok[] {
  const out: Tok[] = []
  let i = 0
  let buf = ''
  const flush = () => {
    pushPlain(out, buf)
    buf = ''
  }

  const prompt = line.match(PROMPT)
  if (prompt) {
    out.push({ t: prompt[0], k: 'prompt' })
    i = prompt[0].length
  }

  while (i < line.length) {
    const atWordStart = i === 0 || /\s/.test(line[i - 1])
    if (marker && atWordStart && line.startsWith(marker, i)) {
      flush()
      out.push({ t: line.slice(i), k: 'com' })
      return out
    }
    if (marker === '//' && line.startsWith('/*', i)) {
      const end = line.indexOf('*/', i + 2)
      const stop = end === -1 ? line.length : end + 2
      flush()
      out.push({ t: line.slice(i, stop), k: 'com' })
      i = stop
      continue
    }
    const ch = line[i]
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1
      flush()
      out.push({ t: line.slice(i, j + 1), k: 'str' })
      i = j + 1
      continue
    }
    buf += ch
    i += 1
  }
  flush()
  return out
}

/** Read-only code panel with a language tab and a copy-to-clipboard button. */
export function CodeBlock({ code, lang, className }: { code: string; lang: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>()
  const marker = commentMarker(lang)
  const lines = code.split('\n')

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-accent/25 bg-deep/80', className)}>
      <div className="flex items-center gap-2 border-b border-accent/15 bg-accent/[0.05] px-3 py-1.5">
        <span aria-hidden className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-300/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </span>
        <span className="ml-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{lang}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy snippet'}
          className="group ml-auto inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-md border border-accent/30 bg-accent/[0.06] px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:border-accent hover:bg-accent/15 hover:text-ink"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" />
          ) : (
            <Copy className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
          )}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {/* no ligatures: code must read exactly as typed ("!=" rather than a "≠" glyph) */}
      <pre className="holo-scroll overflow-x-auto px-3.5 py-3 font-mono text-[11.5px] leading-[1.65] text-ink/90 [font-variant-ligatures:none]">
        <code>
          {lines.map((line, n) => (
            <span key={n} className="block min-h-[1.65em] whitespace-pre">
              {tokenize(line, marker).map((tok, j) =>
                tok.k ? (
                  <span key={j} className={KIND_CLASS[tok.k]}>
                    {tok.t}
                  </span>
                ) : (
                  tok.t
                ),
              )}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
