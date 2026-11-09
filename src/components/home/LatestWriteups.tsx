import { useId } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { WRITEUPS, type Writeup } from '@/data/writeups'
import { HOME_BLOCKS, LATEST_WRITEUP_COUNT } from '@/data/home'
import { WriteupCover } from '@/components/writeups/WriteupCover'
import { DifficultyPips, formatDate, readingLabel } from '@/components/writeups/shared'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { setIntent } from '@/lib/intent'
import { BlockFooterAction, BlockHeader } from './BlockHeader'
import { EASE } from './shared'

const COPY = HOME_BLOCKS.writeups

const LATEST = [...WRITEUPS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, LATEST_WRITEUP_COUNT)

const CARD =
  'group relative flex h-full w-full overflow-hidden rounded-2xl border border-accent/25 text-left transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.18)_inset,0_0_44px_-12px_rgb(var(--accent)/0.6)] focus-visible:-translate-y-1 focus-visible:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-deep'

const CARD_BG = {
  background: 'linear-gradient(165deg, rgb(var(--surface) / 0.9) 0%, rgb(var(--deep) / 0.86) 70%)',
}

/**
 * "Latest write-ups": the newest articles. Phones get three compact rows;
 * tablets a wide lead card over two cover-topped cards; desktops the lead on
 * the left beside two compact rows.
 */
export function LatestWriteups() {
  const { setSection } = useTheme()
  const headingId = useId()
  const still = useReducedMotion()
  const action = { label: COPY.action, onClick: () => setSection('writeups') }
  const open = (id: string) => () => {
    setIntent('writeups', id)
    setSection('writeups')
  }
  const [lead, ...rest] = LATEST
  if (!lead) return null

  return (
    <section aria-labelledby={headingId}>
      <BlockHeader
        index={3}
        eyebrow={COPY.eyebrow}
        title={COPY.title}
        subtitle={COPY.subtitle}
        headingId={headingId}
        action={action}
      />

      <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-5">
        <motion.li
          initial={still ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -8% 0px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="min-w-0 sm:col-span-2 lg:col-span-1 lg:row-span-2"
        >
          <LeadCard writeup={lead} onOpen={open(lead.id)} />
        </motion.li>
        {rest.map((w, i) => (
          <motion.li
            key={w.id}
            initial={still ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.7, delay: 0.08 + i * 0.08, ease: EASE }}
            className="min-w-0"
          >
            <CompactCard writeup={w} seed={i + 2} onOpen={open(w.id)} />
          </motion.li>
        ))}
      </ol>

      <BlockFooterAction action={action} />
    </section>
  )
}

function Meta({ writeup: w }: { writeup: Writeup }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-muted">
      <time dateTime={w.date} className="uppercase tracking-[0.14em] text-accent">
        {formatDate(w.date)}
      </time>
      <span className="inline-flex items-center gap-1">
        <Clock aria-hidden className="h-3 w-3" />
        {readingLabel(w.readingMinutes)}
      </span>
    </span>
  )
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-md border border-accent/20 bg-accent/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover:border-accent/40 group-hover:text-accent"
        >
          {t}
        </span>
      ))}
    </span>
  )
}

function ReadArrow() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-accent transition-colors duration-300 group-hover:text-ink"
    >
      Read
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
    </span>
  )
}

/** The newest article: a compact row on phones, a wide row on tablets, a cover-topped card on desktops. */
function LeadCard({ writeup: w, onOpen }: { writeup: Writeup; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className={cn(CARD, 'flex-row items-stretch lg:flex-col')} style={CARD_BG}>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px hairline" />
      <span className="relative block w-24 shrink-0 border-r border-accent/15 sm:w-[44%] lg:w-full lg:border-r-0">
        <WriteupCover motif={w.motif} seed={1} className="h-full w-full lg:h-56" />
        <span className="absolute left-3 top-8 hidden items-center gap-1.5 rounded-full border border-accent/45 bg-deep/70 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent shadow-glow-sm sm:inline-flex">
          <Sparkles aria-hidden className="h-3 w-3" />
          {COPY.latest}
        </span>
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col p-4 sm:p-6">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-accent3 sm:hidden">
            <Sparkles aria-hidden className="h-3 w-3" />
            {COPY.latest}
          </span>
          <Meta writeup={w} />
        </span>
        <span className="mt-2 line-clamp-3 font-display text-[15px] font-bold leading-snug tracking-wide text-ink transition-colors duration-300 group-hover:text-accent3 sm:mt-2.5 sm:line-clamp-none sm:text-[19px] sm:font-black sm:leading-[1.18] sm:tracking-tight lg:text-[22px]">
          {w.title}
        </span>
        <span className="mt-3 hidden text-[14.5px] leading-relaxed text-muted sm:line-clamp-3">{w.summary}</span>
        <span className="mt-4 hidden sm:mb-5 sm:block">
          <Tags tags={w.tags} />
        </span>
        <span className="mt-3 flex items-center justify-between gap-3 pt-0.5 sm:mt-auto sm:border-t sm:border-accent/15 sm:pt-3.5">
          <DifficultyPips level={w.difficulty} />
          <ReadArrow />
        </span>
        <span className="sr-only"> (opens the article in Write-ups)</span>
      </span>
    </button>
  )
}

/** The next articles: rows on phones and desktops, cover-topped cards side by side on tablets. */
function CompactCard({ writeup: w, seed, onOpen }: { writeup: Writeup; seed: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(CARD, 'flex-row items-stretch sm:flex-col lg:flex-row')}
      style={CARD_BG}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px hairline" />
      <WriteupCover
        motif={w.motif}
        seed={seed}
        className="w-24 shrink-0 border-r border-accent/15 sm:h-28 sm:w-full sm:border-r-0 lg:h-auto lg:w-40 lg:border-r xl:w-44"
      />
      <span className="relative flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <Meta writeup={w} />
        <span className="mt-2 line-clamp-3 font-display text-[15px] font-bold leading-snug tracking-wide text-ink transition-colors duration-300 group-hover:text-accent3 sm:text-[16px]">
          {w.title}
        </span>
        <span className="mt-2 hidden text-[13.5px] leading-relaxed text-muted sm:line-clamp-2">{w.summary}</span>
        <span className="mt-3 flex items-center justify-between gap-3 pt-0.5 sm:mt-auto sm:pt-3">
          <DifficultyPips level={w.difficulty} />
          <ReadArrow />
        </span>
        <span className="sr-only"> (opens the article in Write-ups)</span>
      </span>
    </button>
  )
}
