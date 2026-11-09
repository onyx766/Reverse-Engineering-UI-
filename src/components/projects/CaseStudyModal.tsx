import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useInView } from 'framer-motion'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FileCode2,
  Flag,
  Layers3,
  ListOrdered,
  Microscope,
  Timer,
  Trophy,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { HoloModal } from '@/components/ui/HoloModal'
import { Chip } from '@/components/ui/Chip'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CATEGORIES, type Metric, type Project } from '@/data/projects'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, FINDING_ICON } from './icons'
import { CodeBlock } from './CodeBlock'
import { useMediaQuery } from './hooks'

const EASE = [0.22, 1, 0.36, 1] as const
const pad = (n: number) => String(n).padStart(2, '0')

interface Props {
  project: Project | null
  index: number
  total: number
  prev: Project | null
  next: Project | null
  onClose: () => void
  onPage: (delta: 1 | -1) => void
}

/** Full case study in an xl HoloModal; ← / → page between projects. */
export function CaseStudyModal({ project, index, total, prev, next, onClose, onPage }: Props) {
  const last = useRef<Project | null>(project)
  if (project) last.current = project
  const shown = project ?? last.current
  const [dir, setDir] = useState<1 | -1>(1)

  const page = (d: 1 | -1) => {
    setDir(d)
    onPage(d)
  }
  const pageRef = useRef(page)
  pageRef.current = page

  // phones: the eyebrow must fit one truncating line beside the icon and close button
  const narrow = useMediaQuery('(max-width: 639px)')

  const open = !!project
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t?.closest('pre, input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      pageRef.current(e.key === 'ArrowRight' ? 1 : -1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!shown) return null
  const category = CATEGORIES.find((c) => c.id === shown.category)

  return (
    <HoloModal
      open={open}
      onClose={onClose}
      title={shown.title}
      eyebrow={
        narrow
          ? `${pad(index + 1)}/${pad(total)} · ${category?.label ?? ''}`
          : `Case study ${pad(index + 1)} / ${pad(total)} · ${category?.label ?? ''}`
      }
      icon={CATEGORY_ICON[shown.category]}
      badge={String(shown.year)}
      size="xl"
      progress
      contentKey={shown.id}
      footer={
        <div className="flex items-center gap-2 sm:gap-3">
          <PagerButton dir="prev" project={prev} onClick={() => page(-1)} />
          <div className="hidden flex-1 flex-col items-center gap-0.5 sm:flex">
            <span className="font-mono text-[11px] tracking-[0.2em] text-ink">
              <span className="text-accent">{pad(index + 1)}</span> / {pad(total)}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              <kbd className="rounded border border-accent/30 px-1 text-accent">←</kbd>{' '}
              <kbd className="rounded border border-accent/30 px-1 text-accent">→</kbd> to browse
            </span>
          </div>
          <PagerButton dir="next" project={next} onClick={() => page(1)} className="ml-auto sm:ml-0" />
        </div>
      }
    >
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.article
          key={shown.id}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 48, filter: 'blur(8px)' }),
            center: { opacity: 1, x: 0, filter: 'blur(0px)' },
            exit: (d: number) => ({ opacity: 0, x: d * -48, filter: 'blur(8px)' }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: EASE }}
          className="flex flex-col gap-8"
        >
          <MetaStrip project={shown} />

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <Block n="01" title="Summary" icon={Microscope}>
              <p className="text-[15.5px] leading-relaxed text-ink/90">{shown.summary}</p>
            </Block>
            <Block n="02" title="The Challenge" icon={Flag}>
              <p className="border-l-2 border-accent/50 pl-4 text-[15.5px] leading-relaxed text-muted">
                {shown.challenge}
              </p>
            </Block>
          </div>

          <Block n="03" title="Approach" icon={ListOrdered}>
            <Timeline project={shown} />
          </Block>

          <Block n="04" title="Key Findings" icon={Crosshair}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {shown.findings.map((f, i) => {
                const Icon = FINDING_ICON[f.icon]
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                    className="group flex gap-3 rounded-xl border border-accent/20 bg-accent/[0.04] p-3 transition-colors duration-300 hover:border-accent/50 hover:bg-accent/[0.08]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="text-[14.5px] leading-snug text-ink/90">{f.text}</span>
                  </motion.li>
                )
              })}
            </ul>
          </Block>

          <Block n="05" title="Technical Artifact" icon={FileCode2}>
            <CodeBlock artifact={shown.artifact} />
          </Block>

          <Block n="06" title="Outcome & Impact" icon={Trophy}>
            <p className="text-[15.5px] leading-relaxed text-ink/90">{shown.outcome.text}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {shown.outcome.metrics.map((m, i) => (
                <MetricTile key={`${shown.id}-${m.label}`} metric={m} delay={i * 0.08} />
              ))}
            </div>
          </Block>

          <Block n="07" title="Stack" icon={Layers3}>
            <div className="flex flex-wrap gap-2">
              {shown.stack.map((s) => (
                <Chip key={s} className="normal-case tracking-[0.06em]">
                  {s}
                </Chip>
              ))}
            </div>
          </Block>
        </motion.article>
      </AnimatePresence>
    </HoloModal>
  )
}

function MetaStrip({ project: p }: { project: Project }) {
  const category = CATEGORIES.find((c) => c.id === p.category)
  const cells: { icon: LucideIcon; label: string; value: string; wide?: boolean }[] = [
    { icon: CATEGORY_ICON[p.category], label: 'Category', value: category?.label ?? '' },
    { icon: CalendarDays, label: 'Year', value: String(p.year) },
    { icon: Timer, label: 'Duration', value: p.duration },
    { icon: UserRound, label: 'Role', value: p.role },
    { icon: Crosshair, label: 'Target', value: p.target, wide: true },
  ]
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-accent/20 bg-accent/[0.03] sm:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,0.8fr))_minmax(0,1.6fr)]">
      {cells.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 + i * 0.06, ease: EASE }}
          className={cn(
            'relative min-w-0 border-accent/15 px-3.5 py-3',
            'border-b sm:border-r lg:border-b-0',
            c.wide && 'col-span-2 sm:col-span-3 lg:col-span-1 lg:border-r-0',
          )}
        >
          <dt className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
            <c.icon aria-hidden className="h-3 w-3 text-accent" />
            {c.label}
          </dt>
          <dd className="mt-1 text-[14.5px] font-semibold leading-snug text-ink">{c.value}</dd>
        </motion.div>
      ))}
    </dl>
  )
}

function Block({ n, title, icon: Icon, children }: { n: string; title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <h3 className="mb-3.5 flex items-center gap-2.5 font-display text-[12.5px] font-bold uppercase tracking-[0.2em] text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
          <Icon aria-hidden className="h-3.5 w-3.5" />
        </span>
        <span className="font-mono text-[10px] font-normal tracking-[0.14em] text-accent">{n}</span>
        {title}
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
      </h3>
      {children}
    </motion.section>
  )
}

function Timeline({ project }: { project: Project }) {
  return (
    <ol className="relative">
      <motion.span
        aria-hidden
        className="absolute bottom-4 left-[15px] top-4 w-px origin-top bg-gradient-to-b from-accent via-accent/50 to-accent/10"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 1.3, ease: EASE }}
      />
      {project.approach.map((s, i) => (
        <motion.li
          key={s.title}
          initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.55, delay: 0.1 + i * 0.09, ease: EASE }}
          className="group relative pb-5 pl-12 last:pb-0"
        >
          <span className="absolute left-0 top-0 grid h-[31px] w-[31px] place-items-center rounded-full border border-accent/60 bg-deep font-mono text-[11px] font-bold text-accent shadow-glow-sm transition-[transform,background-color] duration-300 group-hover:scale-110 group-hover:bg-accent/20">
            {i + 1}
          </span>
          <h4 className="pt-0.5 font-sans text-[16.5px] font-bold leading-tight tracking-wide text-ink">{s.title}</h4>
          <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{s.detail}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.tools.map((t) => (
              <Chip key={t} size="xs" className="normal-case tracking-[0.05em]">
                {t}
              </Chip>
            ))}
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

const formatMetric = (v: number) => Math.round(v).toLocaleString('en-US')

/** Counts up once in view; the number is written straight to the DOM, no per-frame renders. */
function MetricTile({ metric, delay }: { metric: Metric; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = formatMetric(0)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !inView) return
    if (reduced) {
      el.textContent = formatMetric(metric.value)
      return
    }
    const run = animate(0, metric.value, {
      duration: 1.5,
      delay,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => {
        el.textContent = formatMetric(v)
      },
    })
    return () => run.stop()
  }, [inView, reduced, metric.value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotateX: -12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-b from-accent/[0.09] to-transparent px-4 py-4 text-center transition-colors duration-300 hover:border-accent/60"
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-accent/15 blur-2xl transition-colors duration-500 group-hover:bg-accent/30"
      />
      <div className="relative font-display text-[28px] font-black leading-none text-ink">
        {/* filled by the count-up above */}
        <span ref={ref} />
        {metric.suffix && <span className="neon">{metric.suffix}</span>}
      </div>
      <div className="relative mt-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">{metric.label}</div>
    </motion.div>
  )
}

function PagerButton({
  dir,
  project,
  onClick,
  className,
}: {
  dir: 'prev' | 'next'
  project: Project | null
  onClick: () => void
  className?: string
}) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!project}
      aria-label={project ? `${dir === 'prev' ? 'Previous' : 'Next'} case study: ${project.title}` : undefined}
      className={cn(
        'group relative flex min-h-[44px] min-w-0 max-w-[48%] items-center gap-2.5 overflow-hidden rounded-xl border border-accent/30 bg-accent/[0.06] px-3 py-1.5 text-left sm:max-w-[38%]',
        'transition-[border-color,background-color,box-shadow] duration-300 hover:border-accent hover:bg-accent/15 hover:shadow-glow-sm disabled:opacity-40',
        dir === 'next' && 'flex-row-reverse text-right',
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <Icon
        aria-hidden
        className={cn(
          'h-4 w-4 shrink-0 text-accent transition-transform duration-300',
          dir === 'prev' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
        )}
      />
      <span className="min-w-0">
        <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          {dir === 'prev' ? 'Previous' : 'Next'}
        </span>
        <span className="block truncate font-sans text-[14px] font-semibold text-ink">{project?.title}</span>
      </span>
    </button>
  )
}
