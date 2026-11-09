import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { LazyMount } from '@/components/ui/LazyMount'
import { TOOLS, TOOL_CATEGORIES } from '@/data/tools'
import { cn } from '@/lib/utils'
import { CATEGORY_BY_ID, CATEGORY_COUNT, CATEGORY_ICON, EASE, reserve, toolsFor, type CategoryFilter } from './meta'
import { SubHeading } from './SubHeading'
import { ToolCard } from './ToolCard'

const OPTIONS = [
  { id: 'all' as CategoryFilter, label: 'All', icon: LayoutGrid, count: TOOLS.length },
  ...TOOL_CATEGORIES.map((c) => ({
    id: c.id as CategoryFilter,
    label: c.short,
    icon: CATEGORY_ICON[c.id],
    count: CATEGORY_COUNT[c.id],
  })),
]

/** Cards shown on phones before "show all" (the full grid is a long scroll there). */
const PHONE_PREVIEW = 8

/** Category filter + animated grid of every tool. */
export function ToolArsenal({
  filter,
  onFilter,
  onOpen,
}: {
  filter: CategoryFilter
  onFilter: (f: CategoryFilter) => void
  onOpen: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = useMemo(() => toolsFor(filter), [filter])
  const collapsed = filter === 'all' && !expanded
  const label = filter === 'all' ? 'all categories' : CATEGORY_BY_ID[filter].label

  return (
    <div id="tools-arsenal">
      <SubHeading
        index="02"
        title="The Arsenal"
        kicker="Every tool, and exactly what I use it for"
        right={
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            showing <span className="text-accent">{String(visible.length).padStart(2, '0')}</span> / {TOOLS.length}
          </span>
        }
      />

      <div
        role="group"
        aria-label="Filter tools by category"
        className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {OPTIONS.map((o) => {
          const active = filter === o.id
          const Icon = o.icon
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(o.id)}
              className={cn(
                'group relative inline-flex min-h-[40px] shrink-0 items-center gap-2 overflow-hidden rounded-xl border px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300',
                active
                  ? 'border-transparent text-ink'
                  : 'border-accent/25 bg-accent/[0.05] text-muted hover:border-accent/60 hover:bg-accent/[0.12] hover:text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="arsenal-filter"
                  aria-hidden
                  className="absolute inset-0 rounded-xl border border-accent/80 bg-accent/20 shadow-glow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              <Icon
                aria-hidden
                className={cn(
                  'relative h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110',
                  active ? 'text-accent' : 'text-accent/70',
                )}
              />
              <span className="relative">{o.label}</span>
              <span
                className={cn(
                  'relative rounded-md px-1.5 py-px text-[10px] transition-colors duration-300',
                  active ? 'bg-accent/30 text-ink' : 'bg-accent/10 text-muted group-hover:text-ink',
                )}
              >
                {o.count}
              </span>
            </button>
          )
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} tools in {label}.
      </p>

      {/* 32 cards are the heaviest mount in the section: they wait until the switch has settled */}
      <LazyMount minHeight={reserve('arsenal')} margin="120px 0px" delay={900} className="mt-6">
        <motion.ul layout className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          <AnimatePresence mode="popLayout">
            {visible.map((t, i) => (
              <motion.li
                key={t.id}
                layout="position"
                // no blur here: animating a filter on 32 cards is costly on weak GPUs, and the
                // filter: blur(0px) framer leaves behind would switch off the card's glass blur
                initial={{ opacity: 0, y: 30, rotateX: -12 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.22 } }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  default: { duration: 0.6, delay: (i % 4) * 0.07, ease: EASE },
                  layout: { type: 'spring', stiffness: 320, damping: 32 },
                }}
                className={cn('[perspective:1200px]', collapsed && i >= PHONE_PREVIEW && 'max-sm:hidden')}
              >
                <ToolCard tool={t} onOpen={onOpen} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {collapsed && (
          <div className="mt-5 flex justify-center sm:hidden">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-accent/45 bg-accent/10 px-5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:border-accent hover:bg-accent/20"
            >
              Show all {TOOLS.length} tools
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </div>
        )}
      </LazyMount>
    </div>
  )
}
