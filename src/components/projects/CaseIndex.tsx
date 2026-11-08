import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, Crosshair, Timer, Trophy } from 'lucide-react'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Chip } from '@/components/ui/Chip'
import { CATEGORIES, PROJECTS_COPY, type Project } from '@/data/projects'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON } from './icons'
import { ProjectIllustration } from './Illustrations'
import { useCanHover } from './hooks'

const EASE = [0.22, 1, 0.36, 1] as const

/** Every project as a rich row with its key facts and an "Open case study" action. */
export function CaseIndex({
  projects,
  onOpen,
  id,
}: {
  projects: Project[]
  onOpen: (id: string) => void
  id: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative mx-auto mt-24 max-w-[1400px] scroll-mt-28 sm:mt-28">
      <SectionHeading
        eyebrow={PROJECTS_COPY.indexEyebrow}
        title={PROJECTS_COPY.indexTitle}
        subtitle={PROJECTS_COPY.indexSubtitle}
      />
      <span id={`${id}-title`} className="sr-only">
        Case study index
      </span>

      <ol className="mt-12 flex flex-col gap-4 sm:gap-5">
        {projects.map((p, i) => (
          <IndexRow key={p.id} project={p} index={i} onOpen={() => onOpen(p.id)} />
        ))}
      </ol>
    </section>
  )
}

function IndexRow({ project: p, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  const canHover = useCanHover()
  const [hover, setHover] = useState(false)
  const category = CATEGORIES.find((c) => c.id === p.category)
  const CatIcon = CATEGORY_ICON[p.category]

  const facts = [
    { icon: Crosshair, label: 'Target', value: p.target },
    { icon: Timer, label: 'Duration', value: p.duration },
    { icon: CalendarDays, label: 'Year', value: String(p.year) },
    { icon: Trophy, label: 'Outcome', value: p.outcome.headline },
  ]

  return (
    <motion.li
      initial={{ opacity: 0, y: 34, rotateX: -10, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, delay: (index % 3) * 0.08, ease: EASE }}
      onPointerEnter={(e) => canHover && e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocusCapture={(e) => setHover((e.target as HTMLElement).matches(':focus-visible'))}
      onBlurCapture={() => setHover(false)}
      className="relative"
      style={{ transformPerspective: 1200 }}
    >
      <motion.article
        animate={{ y: hover ? -5 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className={cn(
          'glass group relative grid gap-5 overflow-hidden rounded-2xl p-4 sm:p-5',
          'lg:grid-cols-[150px_minmax(0,1.15fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-7',
          hover && 'border-accent/60',
        )}
        style={
          hover
            ? { boxShadow: '0 0 0 1px rgb(var(--accent) / 0.2) inset, 0 0 46px -10px rgb(var(--accent) / 0.6), 0 30px 60px -30px rgb(0 0 0 / 0.9)' }
            : undefined
        }
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-1000 ease-out',
            hover ? 'translate-x-[420%]' : 'translate-x-0',
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-accent transition-opacity duration-500',
            hover ? 'opacity-100 shadow-glow-sm' : 'opacity-30',
          )}
        />

        <div className="relative flex items-center gap-4 lg:flex-col lg:items-start lg:gap-1">
          <span className="font-display text-[34px] font-black leading-none text-gradient lg:text-[40px]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <ProjectIllustration
            kind={p.kind}
            hover={hover}
            className="h-[64px] w-[108px] drop-shadow-[0_0_8px_rgb(var(--accent)/0.4)] lg:h-[72px] lg:w-[124px]"
          />
        </div>

        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="xs" icon={CatIcon} active={hover}>
              {category?.label}
            </Chip>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{p.role}</span>
          </div>
          <h3 className="mt-2 font-display text-[18px] font-bold leading-tight tracking-wide text-ink sm:text-[20px]">
            {p.title}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-[14.5px] leading-relaxed text-muted">{p.summary}</p>
        </div>

        <div className="relative min-w-0">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {facts.map((f) => (
              <div key={f.label} className={cn('min-w-0', (f.label === 'Target' || f.label === 'Outcome') && 'col-span-2')}>
                <dt className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
                  <f.icon aria-hidden className="h-3 w-3 text-accent" />
                  {f.label}
                </dt>
                <dd className={cn('mt-0.5 text-[14px] font-semibold leading-snug', f.label === 'Outcome' ? 'text-accent3' : 'text-ink')}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.stack.slice(0, 5).map((s) => (
              <Chip key={s} size="xs" className="normal-case tracking-[0.04em]">
                {s}
              </Chip>
            ))}
          </div>
        </div>

        {/* action: its ::after stretches over the whole row */}
        <div className="flex lg:justify-end">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open case study: ${p.title}`}
            className={cn(
              'group/btn inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl border px-4 font-display text-[11.5px] font-bold uppercase tracking-[0.16em] outline-none',
              'transition-[border-color,background-color,box-shadow,color] duration-300',
              'after:absolute after:inset-0 after:rounded-2xl after:content-[""]',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-deep',
              hover
                ? 'border-accent bg-accent/25 text-ink shadow-glow'
                : 'border-accent/45 bg-accent/10 text-accent',
            )}
          >
            Open case study
            <ArrowUpRight
              aria-hidden
              className={cn('h-4 w-4 transition-transform duration-300', hover && 'translate-x-0.5 -translate-y-0.5')}
            />
          </button>
        </div>
      </motion.article>
    </motion.li>
  )
}
