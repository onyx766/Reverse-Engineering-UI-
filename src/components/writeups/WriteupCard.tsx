import { ArrowRight, Clock } from 'lucide-react'
import type { Writeup } from '@/data/writeups'
import { TiltCard } from './TiltCard'
import { WriteupCover } from './WriteupCover'
import { DifficultyPips, formatDate, readingLabel } from './shared'

export function WriteupCard({
  writeup,
  index,
  onOpen,
}: {
  writeup: Writeup
  index: number
  onOpen: (id: string) => void
}) {
  return (
    <TiltCard
      onClick={() => onOpen(writeup.id)}
      ariaLabel={`Read write-up: ${writeup.title}`}
      delay={(index % 3) * 0.08}
      className="h-full"
      bodyClassName="flex h-full flex-col"
    >
      <WriteupCover
        motif={writeup.motif}
        seed={index + 2}
        className="h-32 w-full shrink-0 rounded-t-2xl"
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* meta */}
        <div className="flex items-center gap-3 font-mono text-[10.5px] text-muted">
          <span className="uppercase tracking-[0.14em] text-accent">{formatDate(writeup.date)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingLabel(writeup.readingMinutes)}
          </span>
        </div>

        <h3 className="mt-2 font-display text-[16px] font-bold leading-snug tracking-wide text-ink transition-colors duration-300 group-hover:text-accent">
          {writeup.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">
          {writeup.summary}
        </p>

        {/* tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {writeup.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-accent/20 bg-accent/[0.06] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover:border-accent/40 group-hover:text-accent"
            >
              {t}
            </span>
          ))}
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-between border-t border-accent/15 pt-3">
          <DifficultyPips level={writeup.difficulty} />
          <span className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            Read
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </span>
        </div>
      </div>
    </TiltCard>
  )
}
