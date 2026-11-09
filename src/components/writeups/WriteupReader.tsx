import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, ArrowRight, Clock, ListTree, ChevronDown, BookOpen } from 'lucide-react'
import { HoloModal } from '@/components/ui/HoloModal'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { tableOfContents, type Writeup } from '@/data/writeups'
import { cn } from '@/lib/utils'
import { ArticleBody } from './ArticleBody'
import { DifficultyPips, formatDate, headingDomId, readingLabel } from './shared'

interface Props {
  writeup: Writeup | null
  /** ordered list the reader pages through (the on-screen order) */
  list: Writeup[]
  open: boolean
  onClose: () => void
  onNavigate: (id: string) => void
}

export function WriteupReader({ writeup, list, open, onClose, onNavigate }: Props) {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  // keep the last opened article mounted through the close animation
  const lastRef = useRef<Writeup | null>(null)
  if (writeup) lastRef.current = writeup
  const wu = writeup ?? lastRef.current

  const toc = useMemo(() => (wu ? tableOfContents(wu) : []), [wu])

  const index = wu ? list.findIndex((w) => w.id === wu.id) : -1
  const prev = index >= 0 && list.length > 1 ? list[(index - 1 + list.length) % list.length] : null
  const next = index >= 0 && list.length > 1 ? list[(index + 1) % list.length] : null

  const scrollRoot = () =>
    (wrapRef.current?.closest('.holo-scroll') as HTMLElement | null) ?? null

  // reset per-article view state
  useEffect(() => {
    setActive(toc[0]?.id ?? '')
    setTocOpen(false)
    setProgress(0)
  }, [wu?.id, toc])

  // scroll-spy + reading progress, rooted in the modal's scroll container
  useEffect(() => {
    if (!open || !wu) return
    const root = scrollRoot()
    if (!root) return

    const els = toc
      .map((h) => document.getElementById(headingDomId(wu.id, h.id)))
      .filter((e): e is HTMLElement => e !== null)

    // the active heading is the last one whose top has passed the reading line
    const computeActive = () => {
      const rootTop = root.getBoundingClientRect().top
      let current = els[0]?.dataset.toc ?? ''
      for (const el of els) {
        if (el.getBoundingClientRect().top - rootTop <= 96) current = el.dataset.toc ?? current
        else break
      }
      if (current) setActive(current)
    }

    // IntersectionObserver rooted in the modal body drives the highlight;
    // a scroll listener re-derives it so programmatic jumps update too
    const io = new IntersectionObserver(computeActive, {
      root,
      rootMargin: '0px 0px -60% 0px',
      threshold: [0, 1],
    })
    els.forEach((el) => io.observe(el))

    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight
      setProgress(max > 0 ? Math.min(1, root.scrollTop / max) : 0)
      computeActive()
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      io.disconnect()
      root.removeEventListener('scroll', onScroll)
    }
  }, [open, wu, toc])

  const goTo = useCallback(
    (hid: string, focusTarget = false) => {
      if (!wu) return
      // collapse the phone list first: it sits above the article, so measuring
      // before it closes would overshoot the heading by the list's height
      flushSync(() => {
        setActive(hid)
        setTocOpen(false)
      })
      const root = scrollRoot()
      const el = document.getElementById(headingDomId(wu.id, hid))
      if (root && el) {
        const top =
          el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 10
        root.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
        // the phone list's buttons unmount on close — hand focus to the heading
        // so it does not fall back to <body>, outside the dialog
        if (focusTarget) el.focus({ preventScroll: true })
      }
    },
    [wu, reduced],
  )

  if (!wu) return null

  const minutesLeft = Math.max(0, Math.ceil(wu.readingMinutes * (1 - progress)))

  return (
    <HoloModal
      open={open}
      onClose={onClose}
      title={wu.title}
      eyebrow="Technical write-up"
      icon={BookOpen}
      badge={wu.difficulty}
      size="xl"
      progress
      contentKey={wu.id}
      footer={
        <div className="flex items-center justify-between gap-2">
          <ReaderNavButton
            dir="prev"
            title={prev?.title}
            onClick={() => prev && onNavigate(prev.id)}
          />
          <span className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/5 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:inline-flex">
            <Clock className="h-3 w-3 text-accent" />
            {minutesLeft === 0 ? 'done' : `${minutesLeft} min left`}
          </span>
          <ReaderNavButton
            dir="next"
            title={next?.title}
            onClick={() => next && onNavigate(next.id)}
          />
        </div>
      }
    >
      <div ref={wrapRef} className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-8">
        {/* main column */}
        <div className="min-w-0">
          {/* meta strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-accent/15 pb-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {formatDate(wu.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <Clock className="h-3 w-3 text-accent" />
              {readingLabel(wu.readingMinutes)}
            </span>
            <DifficultyPips level={wu.difficulty} />
            <div className="flex flex-wrap gap-1.5">
              {wu.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-accent/25 bg-accent/[0.06] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[15px] italic leading-relaxed text-ink/80">{wu.summary}</p>

          {/* mobile collapsible TOC */}
          {toc.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-accent/20 bg-accent/[0.04] lg:hidden">
              <button
                type="button"
                onClick={() => setTocOpen((v) => !v)}
                aria-expanded={tocOpen}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-accent"
              >
                <ListTree className="h-3.5 w-3.5" />
                Contents
                <ChevronDown
                  className={cn(
                    'ml-auto h-4 w-4 transition-transform duration-300',
                    tocOpen && 'rotate-180',
                  )}
                />
              </button>
              {tocOpen && (
                <ul className="border-t border-accent/15 px-2 py-2">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => goTo(h.id, true)}
                        className={cn(
                          'block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors',
                          h.level === 3 && 'pl-5 text-[12px]',
                          active === h.id ? 'bg-accent/15 text-accent' : 'text-muted',
                        )}
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <ArticleBody articleId={wu.id} blocks={wu.blocks} />

          {/* end marker */}
          <div className="mt-8 flex items-center gap-3 border-t border-accent/15 pt-5">
            <span className="h-1.5 w-1.5 rotate-45 bg-accent shadow-glow-sm" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
              end of write-up
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
          </div>
        </div>

        {/* desktop sticky TOC */}
        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-0">
              <p className="flex items-center gap-2 border-b border-accent/15 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                <ListTree className="h-3.5 w-3.5" />
                On this page
              </p>
              <nav className="mt-2 flex flex-col gap-0.5">
                {toc.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => goTo(h.id)}
                    className={cn(
                      'group/toc relative rounded-md py-1 pl-3 pr-2 text-left text-[12px] leading-snug transition-colors duration-200',
                      h.level === 3 && 'pl-6 text-[11.5px]',
                      active === h.id ? 'text-accent' : 'text-muted hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 transition-all duration-200',
                        active === h.id
                          ? 'bg-accent shadow-glow-sm'
                          : 'bg-accent/20 group-hover/toc:bg-accent/50',
                      )}
                    />
                    {h.text}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </HoloModal>
  )
}

function ReaderNavButton({
  dir,
  title,
  onClick,
}: {
  dir: 'prev' | 'next'
  title?: string
  onClick: () => void
}) {
  const isNext = dir === 'next'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!title}
      aria-label={isNext ? `Next write-up: ${title ?? ''}` : `Previous write-up: ${title ?? ''}`}
      className={cn(
        'group flex min-w-0 max-w-[46%] items-center gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-40',
        'hover:border-accent/60 hover:bg-accent/12',
        isNext && 'flex-row-reverse text-right',
      )}
    >
      {isNext ? (
        <ArrowRight className="h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-0.5" />
      ) : (
        <ArrowLeft className="h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:-translate-x-0.5" />
      )}
      <span className="min-w-0">
        <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          {isNext ? 'Next' : 'Previous'}
        </span>
        <span className="block truncate font-display text-[11.5px] font-semibold text-ink">
          {title ?? '—'}
        </span>
      </span>
    </button>
  )
}
