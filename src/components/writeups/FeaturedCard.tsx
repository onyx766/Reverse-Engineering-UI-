import { ArrowRight, Clock, Star } from 'lucide-react'
import type { Writeup } from '@/data/writeups'
import { TiltCard } from './TiltCard'
import { WriteupCover } from './WriteupCover'
import { DifficultyPips, formatDate, readingLabel } from './shared'

export function FeaturedCard({
  writeup,
  onOpen,
}: {
  writeup: Writeup
  onOpen: (id: string) => void
}) {
  return (
    <TiltCard
      onClick={() => onOpen(writeup.id)}
      ariaLabel={`Read featured write-up: ${writeup.title}`}
      tilt={5}
      bodyClassName="grid lg:grid-cols-[1.05fr_1fr]"
    >
      {/* cover */}
      <WriteupCover
        motif={writeup.motif}
        seed={1}
        animated
        className="h-52 w-full rounded-t-2xl lg:h-full lg:rounded-l-2xl lg:rounded-tr-none"
      />

      {/* content */}
      <div className="flex flex-col justify-center gap-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/45 bg-accent/12 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent shadow-glow-sm">
            <Star className="h-3 w-3" />
            Featured
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {formatDate(writeup.date)}
          </span>
        </div>

        <h3 className="font-display text-[22px] font-black leading-[1.12] tracking-tight text-ink transition-colors duration-300 group-hover:text-accent sm:text-[27px]">
          {writeup.title}
        </h3>

        <p className="max-w-xl text-[14px] leading-relaxed text-muted sm:text-[14.5px]">
          {writeup.summary}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
            <Clock className="h-3.5 w-3.5 text-accent" />
            {readingLabel(writeup.readingMinutes)}
          </span>
          <DifficultyPips level={writeup.difficulty} />
          <div className="flex flex-wrap gap-1.5">
            {writeup.tags.map((t) => (
              <span
                key={t}
                className="rounded-md border border-accent/25 bg-accent/[0.06] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* read affordance (visual — the whole card is the button) */}
        <span className="relative mt-1 inline-flex w-fit items-center gap-2 overflow-hidden rounded-xl border border-accent/50 bg-accent/15 px-5 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent/25 group-hover:shadow-glow">
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          Read write-up
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </span>
      </div>
    </TiltCard>
  )
}
