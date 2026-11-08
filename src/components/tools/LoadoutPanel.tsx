import { motion } from 'framer-motion'
import { Boxes, ChevronRight, LayoutGrid } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { TOOLS, TOOL_CATEGORIES, type ToolCategoryId } from '@/data/tools'
import { cn } from '@/lib/utils'
import { CATEGORY_COUNT, CATEGORY_ICON, EASE, type CategoryFilter } from './meta'

const ROWS = [
  { id: 'all' as CategoryFilter, label: 'All tools', full: 'All tools', icon: LayoutGrid, count: TOOLS.length },
  ...TOOL_CATEGORIES.map((c) => ({
    id: c.id as CategoryFilter,
    label: c.short,
    full: c.label,
    icon: CATEGORY_ICON[c.id],
    count: CATEGORY_COUNT[c.id],
  })),
]

/**
 * Category index beside the orbit: hovering a row lights its tools up in the
 * orbit, clicking it filters the arsenal grid below.
 */
export function LoadoutPanel({
  filter,
  onFilter,
  onHighlight,
}: {
  filter: CategoryFilter
  onFilter: (f: CategoryFilter) => void
  onHighlight: (c: ToolCategoryId | null) => void
}) {
  const light = (id: CategoryFilter) => onHighlight(id === 'all' ? null : id)

  return (
    <HoloPanel
      title="Loadout"
      icon={Boxes}
      badge={`${TOOL_CATEGORIES.length} domains`}
      from="left"
      delay={0.12}
      tilt={6}
      bodyClassName="p-2.5 sm:p-3"
    >
      <ul className="flex flex-col gap-1">
        {ROWS.map((r, i) => {
          const active = filter === r.id
          const Icon = r.icon
          return (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.05, ease: EASE }}
            >
              <button
                type="button"
                aria-pressed={active}
                title={r.full}
                onClick={() => onFilter(r.id)}
                onMouseEnter={() => light(r.id)}
                onMouseLeave={() => onHighlight(null)}
                onFocus={() => light(r.id)}
                onBlur={() => onHighlight(null)}
                className={cn(
                  'group relative flex min-h-[42px] w-full items-center gap-2.5 overflow-hidden rounded-lg border px-2 text-left transition-[color,background-color,border-color,box-shadow] duration-300',
                  active
                    ? 'border-accent/70 bg-accent/[0.16] text-ink shadow-glow-sm'
                    : 'border-transparent text-muted hover:border-accent/35 hover:bg-accent/[0.07] hover:text-ink',
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-2 left-0 w-[3px] origin-center rounded-r-full bg-accent shadow-glow-sm transition-[opacity,transform] duration-300',
                    active ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'relative grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
                    active ? 'border-accent/60 bg-accent/20 text-accent' : 'border-accent/20 bg-accent/[0.06] text-accent/80',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="relative min-w-0 flex-1 truncate text-[14.5px] font-semibold leading-tight">
                  {r.label} <span className="font-mono text-[11px] font-normal text-muted">({r.count})</span>
                </span>
                <ChevronRight
                  aria-hidden
                  className={cn(
                    'relative h-3.5 w-3.5 shrink-0 text-accent transition-all duration-300',
                    active ? 'opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                />
              </button>
            </motion.li>
          )
        })}
      </ul>
      <p className="mx-1 mt-2.5 border-t border-accent/15 pt-2.5 font-mono text-[9.5px] uppercase leading-relaxed tracking-[0.16em] text-muted/80">
        hover to light the orbit · click to filter
      </p>
    </HoloPanel>
  )
}
