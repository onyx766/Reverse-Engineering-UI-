import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const KEYWORDS = new Set([
  // python / general
  'def', 'return', 'for', 'while', 'if', 'else', 'elif', 'import', 'from', 'as',
  'in', 'is', 'not', 'and', 'or', 'class', 'try', 'except', 'with', 'assert',
  'break', 'continue', 'lambda', 'pass', 'raise', 'yield', 'global',
  // c / js / lua
  'void', 'int', 'char', 'const', 'static', 'struct', 'sizeof', 'unsigned',
  'function', 'local', 'end', 'then', 'do', 'nil', 'true', 'false', 'null',
  'var', 'let', 'new', 'this', 'typeof', 'require', 'exit', 'return',
  // asm mnemonics
  'mov', 'movzx', 'test', 'jne', 'je', 'jnz', 'jmp', 'call', 'push', 'pop',
  'sub', 'cmp', 'lea', 'xor', 'add', 'nop', 'and', 'int',
])

const COMMENT_PATTERN: Record<string, string> = {
  asm: ';[^\\n]*',
  python: '#[^\\n]*',
  yaml: '#[^\\n]*',
  bash: '#[^\\n]*',
  sh: '#[^\\n]*',
  lua: '--[^\\n]*',
  c: '\\/\\/[^\\n]*',
  cpp: '\\/\\/[^\\n]*',
  js: '\\/\\/[^\\n]*',
  javascript: '\\/\\/[^\\n]*',
  typescript: '\\/\\/[^\\n]*',
}

const TOKEN_CLASS = {
  comment: 'italic text-muted/70',
  string: 'text-accent3',
  number: 'text-accent',
  keyword: 'font-medium text-accent2',
} as const

function buildRegex(lang: string): RegExp {
  const comment = COMMENT_PATTERN[lang] ?? '(?:#|\\/\\/)[^\\n]*'
  const str = '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`'
  const num = '\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?\\b'
  const word = '[A-Za-z_]\\w*'
  return new RegExp(`(${comment})|(${str})|(${num})|(${word})`, 'g')
}

/** Tokenises a single line into coloured spans. Keeps everything else plain. */
function highlight(line: string, re: RegExp): ReactNode[] {
  const out: ReactNode[] = []
  re.lastIndex = 0
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(<Fragment key={k++}>{line.slice(last, m.index)}</Fragment>)
    const [tok, comment, string, number, word] = m
    let cls: string | null = null
    if (comment) cls = TOKEN_CLASS.comment
    else if (string) cls = TOKEN_CLASS.string
    else if (number) cls = TOKEN_CLASS.number
    else if (word && KEYWORDS.has(word)) cls = TOKEN_CLASS.keyword
    out.push(
      cls ? (
        <span key={k++} className={cls}>
          {tok}
        </span>
      ) : (
        <Fragment key={k++}>{tok}</Fragment>
      ),
    )
    last = m.index + tok.length
    if (m.index === re.lastIndex) re.lastIndex++ // guard against zero-width
  }
  if (last < line.length) out.push(<Fragment key={k++}>{line.slice(last)}</Fragment>)
  return out
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  const re = useMemo(() => buildRegex(lang.toLowerCase()), [lang])
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="group/code relative overflow-hidden rounded-xl border border-accent/20 bg-deep/70">
      {/* header */}
      <div className="flex items-center justify-between border-b border-accent/15 bg-accent/[0.04] px-3 py-1.5">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          <span className="flex gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-accent/40" />
            <span className="h-2 w-2 rounded-full bg-accent/25" />
            <span className="h-2 w-2 rounded-full bg-accent/15" />
          </span>
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
            copied
              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
              : 'border-accent/30 bg-accent/5 text-muted hover:border-accent/60 hover:text-ink',
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* body */}
      <div className="flex">
        {/* line-number gutter (static) */}
        <div
          aria-hidden
          className="select-none border-r border-accent/10 bg-white/[0.015] py-3 pl-3 pr-2.5 text-right font-mono text-[11px] leading-[1.65] text-muted/40"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* code (scrolls horizontally) */}
        <div className="holo-scroll min-w-0 flex-1 overflow-x-auto py-3 pl-3 pr-4">
          <pre className="font-mono text-[11.5px] leading-[1.65] text-ink/90">
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre">
                {line.length ? highlight(line, re) : ' '}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}
