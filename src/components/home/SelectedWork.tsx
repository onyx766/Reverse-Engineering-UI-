import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Crosshair } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { KIND_LABEL, PROJECTS, type Project } from '@/data/projects'
import { FEATURED_PROJECT_IDS, HOME_BLOCKS } from '@/data/home'
import { ProjectIllustration } from '@/components/projects/Illustrations'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { setIntent } from '@/lib/intent'
import { BlockFooterAction, BlockHeader } from './BlockHeader'
import { EASE } from './shared'

const COPY = HOME_BLOCKS.work
const fmt = new Intl.NumberFormat('en-US')

/** The featured case studies, in the order home.ts lists them (falls back to the first three). */
function pickFeatured(): Project[] {
  const picked = FEATURED_PROJECT_IDS.map((id) => PROJECTS.find((p) => p.id === id)).filter(
    (p): p is Project => !!p,
  )
  return picked.length ? picked : PROJECTS.slice(0, 3)
}

const FEATURED = pickFeatured()

/**
 * "Selected work": three case studies as illustrated cards that open the
 * Projects section. Phones get a swipeable snap row (one card plus a peek of
 * the next), small tablets a stacked list, desktops three columns.
 */
export function SelectedWork() {
  const { setSection } = useTheme()
  const headingId = useId()
  const listRef = useRef<HTMLOListElement>(null)
  const active = useActiveSlide(listRef, FEATURED.length)
  const action = { label: COPY.action, onClick: () => setSection('projects') }

  return (
    <section aria-labelledby={headingId}>
      <BlockHeader
        index={2}
        eyebrow={COPY.eyebrow}
        title={COPY.title}
        subtitle={COPY.subtitle}
        headingId={headingId}
        action={action}
      />

      <ol
        ref={listRef}
        className={cn(
          'no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1',
          'sm:mx-0 sm:mt-10 sm:grid sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-5',
        )}
      >
        {FEATURED.map((p, i) => (
          <WorkCard
            key={p.id}
            project={p}
            index={i}
            onOpen={() => {
              setIntent('projects', p.id)
              setSection('projects')
            }}
          />
        ))}
      </ol>

      {/* slide position (phones only) */}
      <div aria-hidden className="mt-4 flex justify-center gap-2 sm:hidden">
        {FEATURED.map((p, i) => (
          <span
            key={p.id}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === active ? 'w-6 bg-accent shadow-glow-sm' : 'w-1.5 bg-accent/30',
            )}
          />
        ))}
      </div>

      <BlockFooterAction action={action} />
    </section>
  )
}

/** Index of the slide most in view inside a horizontal snap list (IntersectionObserver, no scroll handler). */
function useActiveSlide(ref: React.RefObject<HTMLElement>, count: number) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = ref.current
    if (!root || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.slide ?? 0))
        }
      },
      { root, threshold: 0.6 },
    )
    root.querySelectorAll('[data-slide]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ref, count])

  return active
}

/**
 * Keyboard focus on a card that only peeks into the phone snap row: the
 * browser leaves a partly visible card where it is, so scroll the row until
 * the card sits at its snap position. A no-op where the row does not scroll.
 */
function alignInRow(card: HTMLElement, still: boolean) {
  const row = card.closest('ol')
  if (!row || row.scrollWidth <= row.clientWidth + 1) return
  const pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0
  const delta = card.getBoundingClientRect().left - row.getBoundingClientRect().left - pad
  if (Math.abs(delta) > 1) row.scrollBy({ left: delta, behavior: still ? 'auto' : 'smooth' })
}

function WorkCard({ project: p, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  const [lit, setLit] = useState(false)
  const still = useReducedMotion()
  const number = String(index + 1).padStart(2, '0')

  return (
    <motion.li
      data-slide={index}
      initial={still ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, delay: 0.05 + index * 0.08, ease: EASE }}
      className="w-[84%] min-w-0 max-w-sm shrink-0 snap-start py-1.5 sm:w-auto sm:max-w-none sm:py-0"
    >
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setLit(true)}
        onPointerLeave={() => setLit(false)}
        onFocus={(e) => {
          const keyboard = e.currentTarget.matches(':focus-visible')
          setLit(keyboard)
          if (keyboard) alignInRow(e.currentTarget, still)
        }}
        onBlur={() => setLit(false)}
        className={cn(
          'group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left',
          'sm:grid sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-x-6 sm:p-5 lg:flex lg:flex-col lg:p-0',
          'transition-[transform,border-color,box-shadow] duration-500 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-deep',
          lit ? '-translate-y-1.5 border-accent/65' : 'border-accent/25',
        )}
        style={{
          background:
            'linear-gradient(165deg, rgb(var(--surface) / 0.9) 0%, rgb(var(--deep) / 0.86) 64%), radial-gradient(130% 70% at 50% 0%, rgb(var(--accent) / 0.14), transparent 60%)',
          boxShadow: lit
            ? '0 0 0 1px rgb(var(--accent) / 0.2) inset, 0 0 46px -10px rgb(var(--accent) / 0.6), 0 30px 60px -30px rgb(0 0 0 / 0.9)'
            : '0 0 0 1px rgb(var(--accent) / 0.06) inset, 0 24px 50px -28px rgb(0 0 0 / 0.9)',
        }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px hairline" />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 -left-1/2 z-[1] w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-1000 ease-out',
            lit ? 'translate-x-[320%]' : 'translate-x-0',
          )}
        />

        {/* illustration stage: a banner on phones and desktops, a side panel in between */}
        <span
          aria-hidden
          className="relative block h-36 w-full shrink-0 overflow-hidden border-b border-accent/15 sm:h-full sm:min-h-[8.5rem] sm:rounded-xl sm:border lg:h-44 lg:min-h-0 lg:rounded-none lg:border-0 lg:border-b"
        >
          <span
            className={cn('absolute inset-0 transition-opacity duration-500', lit ? 'opacity-100' : 'opacity-60')}
            style={{ background: 'radial-gradient(60% 70% at 50% 62%, rgb(var(--accent) / 0.3), transparent 70%)' }}
          />
          <span
            className="absolute inset-x-0 bottom-0 h-2/3 bg-grid opacity-40"
            style={{
              backgroundSize: '18px 18px',
              maskImage: 'linear-gradient(to top, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
            }}
          />
          <ProjectIllustration
            kind={p.kind}
            hover={lit}
            className="absolute inset-0 m-auto h-[82%] w-[76%] drop-shadow-[0_0_10px_rgb(var(--accent)/0.45)] sm:h-[86%] sm:w-[92%] lg:h-[80%] lg:w-[70%]"
          />
          <span className="absolute left-4 top-3 font-display text-[24px] font-black leading-none text-gradient sm:hidden lg:block lg:text-[26px]">
            {number}
          </span>
          <span className="absolute right-3 top-3 rounded-md border border-accent/30 bg-deep/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-accent sm:hidden lg:block">
            {KIND_LABEL[p.kind]}
          </span>
        </span>

        {/* row layout (sm–md): the arrow badge stands in for the CTA line */}
        <span
          aria-hidden
          className={cn(
            'absolute right-4 top-4 z-[1] hidden h-9 w-9 place-items-center rounded-full border transition-all duration-300 sm:grid lg:hidden',
            lit ? 'border-accent bg-accent/25 text-ink shadow-glow-sm' : 'border-accent/45 bg-deep/50 text-accent',
          )}
        >
          <ArrowRight className={cn('h-4 w-4 transition-transform duration-300', lit && 'translate-x-0.5')} />
        </span>

        {/* copy */}
        <span className="relative flex min-w-0 flex-1 flex-col px-4 pb-4 pt-3.5 sm:p-0 sm:pr-12 lg:px-5 lg:pb-5 lg:pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <span className="hidden sm:inline lg:hidden">
              {number} · {KIND_LABEL[p.kind]} ·{' '}
            </span>
            {p.year} · {p.duration}
          </span>
          <span className="mt-1.5 font-display text-[16px] font-bold leading-snug tracking-wide text-ink transition-colors duration-300 group-hover:text-accent3 sm:text-[17px]">
            {p.title}
          </span>
          <span className="mt-2 flex items-start gap-1.5 font-mono text-[11px] leading-snug text-muted">
            <Crosshair aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            {p.target}
          </span>
          <span className="mt-3 text-[15px] font-semibold leading-snug text-accent3">{p.outcome.headline}</span>

          <span className="mt-4 grid grid-cols-3 gap-3 border-t border-accent/15 pt-3">
            {p.outcome.metrics.map((m) => (
              <span key={m.label} className="min-w-0">
                <span className="block font-display text-[16px] font-black leading-none text-ink sm:text-[17px]">
                  {fmt.format(m.value)}
                  {m.suffix && <span className="text-accent">{m.suffix}</span>}
                </span>
                <span className="mt-1 block font-mono text-[9.5px] uppercase leading-snug tracking-[0.08em] text-muted">
                  {m.label}
                </span>
              </span>
            ))}
          </span>

          <span
            aria-hidden
            className={cn(
              'mt-4 inline-flex items-center gap-2 pt-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-300 sm:hidden lg:mt-auto lg:inline-flex lg:pt-5',
              lit ? 'text-ink' : 'text-accent',
            )}
          >
            {COPY.cardAction}
            <ArrowRight className={cn('h-4 w-4 transition-transform duration-300', lit && 'translate-x-1.5')} />
          </span>
          <span className="sr-only"> (opens the case study in Projects)</span>
        </span>
      </button>
    </motion.li>
  )
}
