import { Info, AlertTriangle, Lightbulb, type LucideIcon } from 'lucide-react'
import type { Block, CalloutBlock } from '@/data/writeups'
import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'
import { InlineText, headingDomId } from './shared'

const CALLOUT: Record<
  CalloutBlock['variant'],
  { icon: LucideIcon; wrap: string; chip: string; label: string }
> = {
  note: {
    icon: Info,
    wrap: 'border-accent2/30 bg-accent2/[0.07]',
    chip: 'border-accent2/40 bg-accent2/10 text-accent2',
    label: 'Note',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'border-amber-400/30 bg-amber-400/[0.07]',
    chip: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    label: 'Watch out',
  },
  tip: {
    icon: Lightbulb,
    wrap: 'border-emerald-400/30 bg-emerald-400/[0.07]',
    chip: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    label: 'Tip',
  },
}

/** Renders an article's typed blocks into the reader body. */
export function ArticleBody({ articleId, blocks }: { articleId: string; blocks: Block[] }) {
  return (
    <article className="max-w-none">
      {blocks.map((b, i) => (
        <BlockView key={i} articleId={articleId} block={b} />
      ))}
    </article>
  )
}

function BlockView({ articleId, block }: { articleId: string; block: Block }) {
  switch (block.type) {
    case 'heading': {
      const id = headingDomId(articleId, block.id)
      if (block.level === 2) {
        return (
          <h2
            id={id}
            data-toc={block.id}
            tabIndex={-1}
            className="group/h scroll-mt-6 break-words pt-7 outline-none font-display text-[19px] font-bold tracking-wide text-ink first:pt-1 sm:text-[21px]"
          >
            <span className="mr-2 select-none font-mono text-accent/60">#</span>
            {block.text}
            <span className="mt-2 block h-px w-full bg-gradient-to-r from-accent/40 to-transparent" />
          </h2>
        )
      }
      return (
        <h3
          id={id}
          data-toc={block.id}
          tabIndex={-1}
          className="scroll-mt-6 break-words pt-5 outline-none font-display text-[15.5px] font-semibold tracking-wide text-accent2"
        >
          {block.text}
        </h3>
      )
    }

    case 'paragraph':
      return (
        <p className="mt-3.5 text-[14.5px] leading-[1.75] text-muted">
          <InlineText text={block.text} />
        </p>
      )

    case 'code':
      return (
        <div className="mt-4">
          <CodeBlock code={block.code} lang={block.lang} />
        </div>
      )

    case 'callout': {
      const c = CALLOUT[block.variant]
      const Icon = c.icon
      return (
        <div className={cn('mt-4 rounded-xl border px-4 py-3.5', c.wrap)}>
          <div className="flex items-center gap-2">
            <span className={cn('grid h-6 w-6 place-items-center rounded-md border', c.chip)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span
              className={cn(
                'rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em]',
                c.chip,
              )}
            >
              {block.title ?? c.label}
            </span>
          </div>
          <p className="mt-2 text-[13.5px] leading-[1.7] text-muted">
            <InlineText text={block.text} />
          </p>
        </div>
      )
    }

    case 'list':
      return block.ordered ? (
        <ol className="mt-3.5 flex flex-col gap-2">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-[1.7] text-muted">
              <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border border-accent/30 bg-accent/10 font-mono text-[10px] text-accent">
                {i + 1}
              </span>
              <span>
                <InlineText text={it} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-3.5 flex flex-col gap-2">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-[1.7] text-muted">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45 bg-accent shadow-glow-sm" />
              <span>
                <InlineText text={it} />
              </span>
            </li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <div className="holo-scroll mt-4 overflow-x-auto rounded-xl border border-accent/20">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-accent/[0.08]">
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap border-b border-accent/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-accent"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="odd:bg-white/[0.015]">
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={cn(
                        'border-b border-accent/10 px-3 py-2 align-top leading-snug text-muted',
                        c === 0 && 'font-mono text-[12px] text-ink',
                      )}
                    >
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'ascii':
      return (
        <figure className="mt-4 overflow-hidden rounded-xl border border-accent/20 bg-deep/70">
          {block.title && (
            <figcaption className="border-b border-accent/15 bg-accent/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              {block.title}
            </figcaption>
          )}
          <div className="holo-scroll overflow-x-auto p-3">
            <pre className="font-mono text-[11.5px] leading-[1.5] text-accent3/90">{block.art}</pre>
          </div>
        </figure>
      )
  }
}
