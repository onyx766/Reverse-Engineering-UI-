import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SearchX, RotateCcw } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { LazyMount } from '@/components/ui/LazyMount'
import { FeaturedCard } from '@/components/writeups/FeaturedCard'
import { WriteupCard } from '@/components/writeups/WriteupCard'
import { WriteupReader } from '@/components/writeups/WriteupReader'
import {
  WriteupToolbar,
  type SortMode,
  type TagFilter,
} from '@/components/writeups/WriteupToolbar'
import { FEATURED_WRITEUP, WRITEUPS, type Writeup } from '@/data/writeups'
import { clearIntent, peekIntent } from '@/lib/intent'

function matchesQuery(w: Writeup, q: string): boolean {
  if (!q) return true
  const hay = `${w.title} ${w.summary} ${w.tags.join(' ')}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((term) => hay.includes(term))
}

export function Writeups() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<TagFilter>('All')
  const [sort, setSort] = useState<SortMode>('newest')
  // arriving from a Home card: open that article straight away
  const [openId, setOpenId] = useState<string | null>(() => {
    const id = peekIntent('writeups')
    return id && WRITEUPS.some((w) => w.id === id) ? id : null
  })
  useEffect(() => clearIntent('writeups'), [])

  const q = query.trim()
  const isDefault = q === '' && tag === 'All'

  const sorted = useMemo(() => {
    const list = WRITEUPS.filter(
      (w) => (tag === 'All' || w.tags.includes(tag)) && matchesQuery(w, q),
    )
    return [...list].sort((a, b) =>
      sort === 'newest'
        ? b.date.localeCompare(a.date)
        : a.readingMinutes - b.readingMinutes || b.date.localeCompare(a.date),
    )
  }, [q, tag, sort])

  // the list the user actually sees, in order — reader paging follows it
  const gridList = isDefault ? sorted.filter((w) => w.id !== FEATURED_WRITEUP.id) : sorted
  const readerList = isDefault ? [FEATURED_WRITEUP, ...gridList] : sorted

  const openWriteup = openId ? (WRITEUPS.find((w) => w.id === openId) ?? null) : null
  const empty = sorted.length === 0

  const reset = () => {
    setQuery('')
    setTag('All')
    setSort('newest')
  }

  return (
    <Section id="writeups">
      <SectionHeading
        eyebrow="Long Form"
        title="Technical Write-ups"
        subtitle="Full teardowns from authorised engagements — the methodology, the exact commands and the code, written so another engineer could reproduce every step."
        className="mx-auto"
      />

      <div className="mx-auto mt-12 max-w-3xl">
        <WriteupToolbar
          query={query}
          onQuery={setQuery}
          tag={tag}
          onTag={setTag}
          sort={sort}
          onSort={setSort}
          resultCount={sorted.length}
          total={WRITEUPS.length}
        />
      </div>

      {/* featured hero — only in the default (unfiltered) view */}
      {isDefault && (
        <div className="mt-10">
          <FeaturedCard writeup={FEATURED_WRITEUP} onOpen={setOpenId} />
        </div>
      )}

      {/* the rest */}
      {!empty && (
        <>
          <div className="mt-10 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              {isDefault ? 'More write-ups' : 'Results'}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
          </div>

          <LazyMount minHeight={560} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gridList.map((w, i) => (
                <WriteupCard key={w.id} writeup={w} index={i} onOpen={setOpenId} />
              ))}
            </div>
          </LazyMount>
        </>
      )}

      {empty && <EmptyState query={q} onReset={reset} />}

      <WriteupReader
        writeup={openWriteup}
        list={readerList}
        open={openId !== null}
        onClose={() => setOpenId(null)}
        onNavigate={setOpenId}
      />
    </Section>
  )
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-12 max-w-md"
    >
      <div className="glass relative overflow-hidden rounded-2xl p-8 text-center">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span className="pointer-events-none absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full bg-accent/10 blur-2xl" />

        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent shadow-glow-sm"
        >
          <SearchX className="h-6 w-6" />
        </motion.span>

        <h3 className="relative mt-5 font-display text-lg font-bold uppercase tracking-wide text-ink">
          No matches
        </h3>
        <p className="relative mt-2 text-[13px] leading-relaxed text-muted">
          {query ? (
            <>
              Nothing matches <span className="neon">“{query}”</span> with the current filters.
            </>
          ) : (
            <>No write-ups match the current filters.</>
          )}
        </p>

        <button
          type="button"
          onClick={onReset}
          className="group relative mt-5 inline-flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/15 px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-300 hover:border-accent hover:bg-accent/25 hover:shadow-glow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" />
          Reset filters
        </button>
      </div>
    </motion.div>
  )
}
