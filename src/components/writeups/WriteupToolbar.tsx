import { CalendarClock, Hourglass, Search, X } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { WRITEUP_TAGS, type WriteupTag } from '@/data/writeups'
import { cn } from '@/lib/utils'

export type SortMode = 'newest' | 'reading'
export type TagFilter = WriteupTag | 'All'

interface Props {
  query: string
  onQuery: (v: string) => void
  tag: TagFilter
  onTag: (t: TagFilter) => void
  sort: SortMode
  onSort: (s: SortMode) => void
  resultCount: number
  total: number
}

const TAGS: TagFilter[] = ['All', ...WRITEUP_TAGS]

export function WriteupToolbar({
  query,
  onQuery,
  tag,
  onTag,
  sort,
  onSort,
  resultCount,
  total,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* row 1: search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* search */}
        <div className="group relative flex-1">
          <label htmlFor="writeup-search" className="sr-only">
            Search write-ups
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-accent"
          />
          <input
            id="writeup-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search title, summary or tag…"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-xl border border-accent/25 bg-deep/60 pl-10 pr-10 font-mono text-[13px] text-ink placeholder:text-muted/60 transition-colors duration-300 focus:border-accent/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-muted transition-all duration-300 hover:border-accent hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* sort toggle */}
        <div
          role="group"
          aria-label="Sort order"
          className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-accent/20 bg-deep/40 p-1"
        >
          <SortButton
            active={sort === 'newest'}
            onClick={() => onSort('newest')}
            icon={CalendarClock}
            label="Newest"
          />
          <SortButton
            active={sort === 'reading'}
            onClick={() => onSort('reading')}
            icon={Hourglass}
            label="Reading time"
          />
        </div>
      </div>

      {/* row 2: tag chips + count */}
      <div className="flex flex-wrap items-center gap-2">
        {TAGS.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => onTag(t)}>
            {t}
          </Chip>
        ))}
        <span
          aria-live="polite"
          className="ml-auto whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
        >
          <span className="text-accent">{resultCount}</span>
          {resultCount === total ? ' write-ups' : ` / ${total}`}
        </span>
      </div>
    </div>
  )
}

function SortButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Search
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // phones: the toggle has its own full-width row, so split it evenly and keep the labels
        'inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:flex-none',
        active
          ? 'border border-accent/50 bg-accent/15 text-ink shadow-glow-sm'
          : 'border border-transparent text-muted hover:text-ink',
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  )
}
