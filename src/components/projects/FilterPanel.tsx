import { useRef, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Box } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { CATEGORIES, type CategoryId } from '@/data/projects'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON } from './icons'

export type FilterId = CategoryId | 'all'

interface FilterProps {
  value: FilterId
  onChange: (id: FilterId) => void
  counts: Record<FilterId, number>
}

const OPTIONS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  ...CATEGORIES.map((c) => ({ id: c.id as FilterId, label: c.label })),
]

const ROW = 44
const GAP = 6

/** Roving-tabindex radio group: arrows move the selection, Home/End jump. */
function useRadioKeys(value: FilterId, onChange: (id: FilterId) => void, axis: 'x' | 'y') {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = OPTIONS.findIndex((o) => o.id === value)
    const n = OPTIONS.length
    const fwd = axis === 'y' ? 'ArrowDown' : 'ArrowRight'
    const back = axis === 'y' ? 'ArrowUp' : 'ArrowLeft'
    let next = -1
    if (e.key === fwd) next = (i + 1) % n
    else if (e.key === back) next = (i - 1 + n) % n
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next < 0) return
    e.preventDefault()
    onChange(OPTIONS[next].id)
    refs.current[next]?.focus()
  }
  return { refs, onKeyDown }
}

/** Left stage panel: category list with live counts and a sliding active pill. */
export function FilterPanel({ value, onChange, counts }: FilterProps) {
  const { refs, onKeyDown } = useRadioKeys(value, onChange, 'y')
  const index = Math.max(0, OPTIONS.findIndex((o) => o.id === value))

  return (
    <HoloPanel title="Projects" icon={Box} badge="filter" from="left" tilt={5} bodyClassName="p-3 sm:p-3.5">
      <div
        role="radiogroup"
        aria-label="Filter projects by category"
        className="relative flex flex-col"
        style={{ gap: GAP }}
      >
        {/* active pill slides between rows (explicit y keeps it exact inside the 3D tilt) */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 rounded-xl border border-accent/80 bg-accent/[0.16]"
          style={{
            height: ROW,
            boxShadow:
              '0 0 0 1px rgb(var(--accent) / 0.25) inset, 0 0 18px rgb(var(--accent) / 0.55), inset 0 0 22px rgb(var(--accent) / 0.25)',
          }}
          initial={false}
          animate={{ y: index * (ROW + GAP) }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-accent shadow-glow-sm" />
        </motion.span>

        {OPTIONS.map((o, i) => {
          const active = o.id === value
          const Icon = CATEGORY_ICON[o.id]
          return (
            <motion.button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(o.id)}
              onKeyDown={onKeyDown}
              initial={{ opacity: 0, x: -18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group/row relative flex items-center gap-3 overflow-hidden rounded-xl px-3 text-left outline-none',
                'transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
                active ? 'text-ink' : 'text-muted hover:bg-accent/[0.07] hover:text-ink',
              )}
              style={{ height: ROW }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/20 to-transparent transition-transform duration-700 ease-out group-hover/row:translate-x-full" />
              <Icon
                aria-hidden
                className={cn(
                  'relative h-[18px] w-[18px] shrink-0 transition-all duration-300 group-hover/row:translate-x-0.5 group-hover/row:scale-110',
                  active ? 'text-accent drop-shadow-[0_0_6px_rgb(var(--accent)/0.9)]' : 'text-muted group-hover/row:text-accent',
                )}
              />
              <span className="relative flex min-w-0 flex-1 items-baseline gap-1.5 font-sans text-[15.5px] font-semibold tracking-wide">
                <span className="truncate">{o.label}</span>
                <span className={cn('font-mono text-[11.5px]', active ? 'text-accent' : 'text-muted/80')}>
                  ({counts[o.id]})
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </HoloPanel>
  )
}

/** Small screens: the same filter as a horizontally scrollable chip row. */
export function FilterChips({ value, onChange, counts }: FilterProps) {
  const { refs, onKeyDown } = useRadioKeys(value, onChange, 'x')

  return (
    <div
      role="radiogroup"
      aria-label="Filter projects by category"
      className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 py-1 sm:-mx-8 sm:px-8"
    >
      {OPTIONS.map((o, i) => {
        const active = o.id === value
        const Icon = CATEGORY_ICON[o.id]
        return (
          <motion.button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'group relative flex min-h-[42px] shrink-0 snap-start items-center gap-2 overflow-hidden rounded-xl border px-3.5 font-sans text-[14.5px] font-semibold tracking-wide',
              'transition-[color,background-color,border-color,box-shadow] duration-300',
              active
                ? 'border-accent/80 bg-accent/[0.18] text-ink shadow-glow-sm'
                : 'border-accent/25 bg-surface/60 text-muted hover:border-accent/60 hover:text-ink',
            )}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Icon aria-hidden className={cn('relative h-4 w-4', active ? 'text-accent' : 'text-muted')} />
            <span className="relative whitespace-nowrap">{o.label}</span>
            <span className={cn('relative font-mono text-[11px]', active ? 'text-accent' : 'text-muted/70')}>
              {counts[o.id]}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
