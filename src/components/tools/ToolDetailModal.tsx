import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HoloModal } from '@/components/ui/HoloModal'
import { PROFICIENCY_LABEL, TOOLS_AS_OF_YEAR, type Tool } from '@/data/tools'
import { cn } from '@/lib/utils'
import { CATEGORY_BY_ID, CATEGORY_ICON, EASE } from './meta'
import { CodeBlock } from './CodeBlock'
import { ProficiencyMeter } from './ProficiencyMeter'
import { ToolMonogram } from './ToolMonogram'

/**
 * Detail dialog for one tool, with previous / next paging through the list
 * it was opened from (buttons or the arrow keys).
 */
export function ToolDetailModal({
  tool,
  list,
  onClose,
  onNavigate,
}: {
  tool: Tool | null
  list: Tool[]
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  const index = tool ? list.findIndex((t) => t.id === tool.id) : -1
  const prev = index > 0 ? list[index - 1] : list[list.length - 1]
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : list[0]

  useEffect(() => {
    if (!tool || list.length < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if ((e.target as Element | null)?.closest?.('pre')) return
      if (e.key === 'ArrowLeft') onNavigate(prev.id)
      else if (e.key === 'ArrowRight') onNavigate(next.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [tool, list.length, prev, next, onNavigate])

  const cat = tool ? CATEGORY_BY_ID[tool.category] : null

  return (
    <HoloModal
      open={!!tool}
      onClose={onClose}
      title={tool?.name ?? ''}
      eyebrow={cat?.label}
      icon={tool ? CATEGORY_ICON[tool.category] : undefined}
      badge={tool ? PROFICIENCY_LABEL[tool.level] : undefined}
      size="md"
      progress
      contentKey={tool?.id}
      footer={
        tool && list.length > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <PagerButton dir="prev" label={prev.short} onClick={() => onNavigate(prev.id)} />
            <span className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
              <span className="text-accent">{String(index + 1).padStart(2, '0')}</span> / {String(list.length).padStart(2, '0')}
            </span>
            <PagerButton dir="next" label={next.short} onClick={() => onNavigate(next.id)} />
          </div>
        ) : undefined
      }
    >
      {tool && cat && (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <ToolMonogram tool={tool} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  <span>Proficiency</span>
                  <span className="text-ink">
                    {tool.level}/5 · <span className="text-accent">{PROFICIENCY_LABEL[tool.level]}</span>
                  </span>
                </div>
                <ProficiencyMeter level={tool.level} size="lg" shimmer="always" className="mt-2.5" />
              </div>
            </div>
            <dl className="grid grid-cols-[0.75fr_1.5fr_0.85fr] gap-2">
              <Stat term="Years" value={`${tool.years}`} />
              <Stat term="Domain" value={cat.short} />
              <Stat term="Since" value={`${TOOLS_AS_OF_YEAR - tool.years}`} />
            </dl>
          </div>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">How I use it</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink/90">{tool.usage}</p>
          </section>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Field notes</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {tool.specifics.map((s, i) => (
                <motion.li
                  key={s}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 + i * 0.07, ease: EASE }}
                  className="flex gap-2.5 rounded-lg border border-accent/15 bg-accent/[0.04] px-3 py-2 text-[14px] leading-snug text-muted"
                >
                  <span aria-hidden className="mt-[3px] font-mono text-[10px] text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{s}</span>
                </motion.li>
              ))}
            </ul>
          </section>

          {tool.snippet && (
            <section>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Snippet</h3>
              <CodeBlock code={tool.snippet.code} lang={tool.snippet.lang} />
            </section>
          )}

          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {tool.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/80"
              >
                {tag}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </HoloModal>
  )
}

function Stat({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/[0.05] px-2.5 py-1.5">
      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{term}</dt>
      <dd className="truncate text-[15px] font-bold leading-tight text-ink">{value}</dd>
    </div>
  )
}

function PagerButton({ dir, label, onClick }: { dir: 'prev' | 'next'; label: string; onClick: () => void }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${dir === 'prev' ? 'Previous' : 'Next'} tool: ${label}`}
      className={cn(
        'group inline-flex min-h-[40px] max-w-[42%] items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/[0.06] px-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted transition-colors duration-300 hover:border-accent hover:bg-accent/15 hover:text-ink',
        dir === 'next' && 'flex-row-reverse',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-transform duration-300',
          dir === 'prev' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  )
}
