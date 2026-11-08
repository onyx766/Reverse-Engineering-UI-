import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, FileCode2 } from 'lucide-react'
import type { Artifact, ArtifactLang } from '@/data/projects'
import { cn } from '@/lib/utils'

type Kind = 'kw' | 'type' | 'fn' | 'str' | 'num' | 'com' | 'pre' | 'punc' | 'attr' | 'plain' | 'key'

interface Tok {
  t: string
  k: Kind
}

const KIND_CLASS: Record<Kind, string> = {
  kw: 'text-accent font-semibold',
  type: 'text-ink italic',
  fn: 'text-ink font-semibold',
  str: 'text-accent2',
  num: 'text-accent3',
  com: 'text-muted italic',
  pre: 'text-accent2',
  punc: 'text-muted/80',
  attr: 'text-accent3 italic',
  plain: 'text-ink/85',
  key: 'text-accent3',
}

const LANG_LABEL: Record<ArtifactLang, string> = {
  python: 'Python',
  cpp: 'C++',
  lua: 'Lua',
  yaml: 'Kaitai YAML',
  'asm-diff': 'x86-64 patch',
  rust: 'Rust',
}

const words = (s: string) => new Set(s.split(' '))

const KEYWORDS: Partial<Record<ArtifactLang, Set<string>>> = {
  python: words(
    'def class return import from as for in if elif else yield with None True False lambda try except raise while pass async await and or not is',
  ),
  cpp: words(
    'struct class return if else for while const static constexpr bool void sizeof static_assert offsetof auto using namespace true false',
  ),
  lua: words('local function return end if then else elseif for do in and or not nil true false while'),
  rust: words('pub fn let mut if else return struct enum impl use match for in while loop where Self self as const static'),
}

const TYPES: Partial<Record<ArtifactLang, Set<string>>> = {
  python: words('str int float bytes bool dict list tuple self'),
  cpp: words('uint8_t uint16_t uint32_t uint64_t int8_t size_t char int std string'),
  lua: words('Proto ProtoField DissectorTable base'),
  rust: words('Option Some None usize u8 u16 u32 u64 i32 bool Vec'),
}

const COMMENT: Partial<Record<ArtifactLang, string>> = {
  python: '#.*$',
  cpp: '//.*$',
  lua: '--.*$',
  rust: '//.*$',
}

function tokenizeCode(line: string, lang: ArtifactLang): Tok[] {
  if (lang === 'cpp' && /^\s*#/.test(line)) return [{ t: line, k: 'pre' }]
  const parts = [
    `(?<com>${COMMENT[lang] ?? '(?!)'})`,
    lang === 'rust' ? '(?<attr>#\\[[^\\]]*\\])' : lang === 'python' ? '(?<attr>@\\w+)' : '(?<attr>(?!))',
    `(?<str>"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')`,
    '(?<num>\\b(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?)\\b)',
    '(?<id>[A-Za-z_][\\w]*)',
    '(?<ws>\\s+)',
    '(?<punc>.)',
  ]
  const re = new RegExp(parts.join('|'), 'g')
  const out: Tok[] = []
  const kw = KEYWORDS[lang]
  const ty = TYPES[lang]
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    const g = m.groups ?? {}
    const text = m[0]
    // a zero-length match would never advance lastIndex
    if (!text) {
      re.lastIndex += 1
      continue
    }
    if (g.com !== undefined) out.push({ t: text, k: 'com' })
    else if (g.attr !== undefined) out.push({ t: text, k: 'attr' })
    else if (g.str !== undefined) out.push({ t: text, k: 'str' })
    else if (g.num !== undefined) out.push({ t: text, k: 'num' })
    else if (g.id !== undefined) {
      const rest = line.slice(re.lastIndex)
      if (kw?.has(text)) out.push({ t: text, k: 'kw' })
      else if (ty?.has(text) || /^[A-Z][a-z]\w*$/.test(text)) out.push({ t: text, k: 'type' })
      else if (/^\s*\(/.test(rest)) out.push({ t: text, k: 'fn' })
      else out.push({ t: text, k: 'plain' })
    } else if (g.ws !== undefined) out.push({ t: text, k: 'plain' })
    else out.push({ t: text, k: 'punc' })
  }
  return out
}

function tokenizeYaml(line: string): Tok[] {
  if (/^\s*#/.test(line)) return [{ t: line, k: 'com' }]
  const m = /^(\s*)(- )?([\w-]+)(:)(\s*)(.*)$/.exec(line)
  if (!m) return [{ t: line, k: 'plain' }]
  const [, indent, dash, key, colon, gap, value] = m
  const out: Tok[] = [{ t: indent, k: 'plain' }]
  if (dash) out.push({ t: dash, k: 'kw' })
  out.push({ t: key, k: 'key' }, { t: colon, k: 'punc' }, { t: gap, k: 'plain' })
  if (value) {
    const k: Kind = /^".*"$/.test(value)
      ? 'str'
      : /^(?:\d+|0x[0-9a-f]+)$/i.test(value)
        ? 'num'
        : /^(?:true|false|expr|le|be|u[1248]|str|ASCII|zlib|raw)$/.test(value)
          ? 'kw'
          : 'plain'
    out.push({ t: value, k })
  }
  return out
}

function tokenizeAsm(body: string): Tok[] {
  const re =
    /(?<com>;.*$)|(?<addr>0x[0-9A-Fa-f]{6,})|(?<bytes>\b(?:[0-9A-F]{2} )+[0-9A-F]{2}\b)|(?<mn>\b(?:mov|cmp|ja|jae|call|push|pop|lea|test|jne|jmp|ret|sub|add|xor)\b)|(?<reg>\b(?:[re]?[abcd]x|[re]?[sd]i|[re]?[sb]p|r\d+d?|[abcd]l)\b)|(?<num>\b[0-9A-Fa-f]+h\b)|(?<ws>\s+)|(?<other>[A-Za-z_]\w*|.)/g
  const out: Tok[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const g = m.groups ?? {}
    const text = m[0]
    if (!text) {
      re.lastIndex += 1
      continue
    }
    if (g.com !== undefined) out.push({ t: text, k: 'com' })
    else if (g.addr !== undefined) out.push({ t: text, k: 'punc' })
    else if (g.bytes !== undefined) out.push({ t: text, k: 'num' })
    else if (g.mn !== undefined) out.push({ t: text, k: 'kw' })
    else if (g.reg !== undefined) out.push({ t: text, k: 'key' })
    else if (g.num !== undefined) out.push({ t: text, k: 'str' })
    else out.push({ t: text, k: 'plain' })
  }
  return out
}

interface Line {
  toks: Tok[]
  mark?: 'add' | 'del'
}

function highlight(code: string, lang: ArtifactLang): Line[] {
  return code.split('\n').map((raw) => {
    if (lang === 'asm-diff') {
      const mark = raw.startsWith('+') ? 'add' : raw.startsWith('-') ? 'del' : undefined
      const gutter = mark || raw.startsWith(' ')
      const head: Tok[] = gutter ? [{ t: raw[0], k: 'punc' }] : []
      return { mark, toks: [...head, ...tokenizeAsm(gutter ? raw.slice(1) : raw)] }
    }
    if (lang === 'yaml') return { toks: tokenizeYaml(raw) }
    return { toks: tokenizeCode(raw, lang) }
  })
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** Syntax-coloured artifact with language label, line numbers and a copy button. */
export function CodeBlock({ artifact }: { artifact: Artifact }) {
  const lines = useMemo(() => highlight(artifact.code, artifact.lang), [artifact])
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => setCopied(false), [artifact])

  const onCopy = async () => {
    const ok = await copyText(artifact.code)
    if (!ok) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }

  const gutter = String(lines.length).length

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-deep/80">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <div className="flex items-center gap-2.5 border-b border-accent/15 bg-accent/[0.05] px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <FileCode2 aria-hidden className="ml-1 h-3.5 w-3.5 text-accent" />
        <span className="min-w-0 truncate font-mono text-[11px] text-ink/90">{artifact.label}</span>
        <span className="ml-auto hidden shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent sm:inline-block">
          {LANG_LABEL[artifact.lang]}
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied to clipboard' : `Copy ${artifact.label}`}
          className={cn(
            'group relative ml-auto inline-flex h-10 shrink-0 items-center gap-1.5 overflow-hidden rounded-lg border px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-all duration-300 sm:ml-0 sm:h-8 sm:px-2.5',
            copied
              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
              : 'border-accent/35 bg-accent/5 text-muted hover:border-accent hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? 'ok' : 'copy'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="inline-flex items-center gap-1.5"
            >
              {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </motion.span>
          </AnimatePresence>
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Code copied to clipboard' : ''}
        </span>
      </div>
      <pre
        tabIndex={0}
        aria-label={`${LANG_LABEL[artifact.lang]} source: ${artifact.label}`}
        className="holo-scroll max-h-[380px] overflow-auto py-3 font-mono text-[11.5px] leading-[1.7] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60 sm:text-[12px]"
      >
        <code className="block min-w-max">
          {lines.map((l, i) => (
            <span
              key={i}
              className={cn(
                'flex pr-4',
                l.mark === 'add' && 'bg-emerald-400/[0.09]',
                l.mark === 'del' && 'bg-rose-400/[0.09]',
              )}
            >
              <span
                aria-hidden
                className="sticky left-0 shrink-0 select-none bg-deep/95 pl-3 pr-3 text-right text-muted/45"
                style={{ width: `${gutter + 2.4}ch` }}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-pre pl-1',
                  l.mark === 'add' && '[&>span]:!text-emerald-200',
                  l.mark === 'del' && '[&>span]:!text-rose-300/90 line-through decoration-rose-400/40',
                )}
              >
                {l.toks.map((t, k) => (
                  <span key={k} className={KIND_CLASS[t.k]}>
                    {t.t}
                  </span>
                ))}
                {l.toks.length === 0 && ' '}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
