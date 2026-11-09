import { memo, useEffect, useId, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import {
  PROFICIENCY_LABEL,
  TIME_IN_TOOL,
  TOOL_CATEGORIES,
  TOOLS,
  type Tool,
  type ToolCategoryId,
} from '@/data/tools'
import { HOME_BLOCKS } from '@/data/home'
import { CATEGORY_ICON } from '@/components/tools/meta'
import { usePageVisible } from '@/components/fx/hooks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { BlockFooterAction, BlockHeader } from './BlockHeader'
import { reveal } from './shared'

const COPY = HOME_BLOCKS.toolchain

/** Row 1 is where the reading and running happens; row 2 is everything around it. */
const ROW_GROUPS: ToolCategoryId[][] = [
  ['disasm', 'debug', 'instr'],
  ['net', 'formats', 'lang', 'platform'],
]

const byCategory = (ids: ToolCategoryId[]) =>
  ids.flatMap((id) => TOOLS.filter((t) => t.category === id))

const ROWS = ROW_GROUPS.map(byCategory).filter((r) => r.length > 0)

const COUNTS = TOOL_CATEGORIES.map((c) => ({
  ...c,
  count: TOOLS.filter((t) => t.category === c.id).length,
})).filter((c) => c.count > 0)

const RECENT = TIME_IN_TOOL.map((r) => ({ ...r, tool: TOOLS.find((t) => t.id === r.toolId) }))
  .filter((r): r is typeof r & { tool: Tool } => !!r.tool)
  .slice(0, 4)

/** px per second the ticker travels */
const SPEED = 38

/** "Toolchain": every tool from tools.ts on a two-row ticker that opens the Tools section. */
export function Toolchain() {
  const { setSection } = useTheme()
  const headingId = useId()
  const reduced = useReducedMotion()
  const [halted, setHalted] = useState(false)
  const action = { label: COPY.action, onClick: () => setSection('tools') }
  const subtitle = COPY.subtitle
    .replace('{tools}', String(TOOLS.length))
    .replace('{groups}', String(COUNTS.length))

  return (
    <section aria-labelledby={headingId}>
      <BlockHeader
        index={4}
        eyebrow={COPY.eyebrow}
        title={COPY.title}
        subtitle={subtitle}
        headingId={headingId}
        action={action}
      />

      <motion.div
        {...reveal(0.1, 28, reduced)}
        className="relative mt-8 overflow-hidden rounded-2xl border border-accent/25 py-4 sm:mt-10 sm:py-5"
        style={{
          background:
            'linear-gradient(160deg, rgb(var(--surface) / 0.88), rgb(var(--deep) / 0.82) 70%), radial-gradient(90% 120% at 100% 0%, rgb(var(--accent) / 0.12), transparent 60%)',
          boxShadow: '0 0 0 1px rgb(var(--accent) / 0.06) inset, 0 30px 60px -32px rgb(0 0 0 / 0.9)',
        }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <Brackets />

        {/* top bar: lockfile label, recent hours (lg+), pause */}
        <div className="relative flex items-center gap-3 px-4 sm:px-6">
          <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
            <span className="text-accent">~/lab/</span>toolchain.lock
            <span className="hidden sm:inline">
              {' '}
              · {TOOLS.length} pinned · {COUNTS.length} groups
            </span>
          </span>
          <Recent className="hidden lg:flex" />
          {!reduced && (
            <button
              type="button"
              onClick={() => setHalted((h) => !h)}
              aria-label={halted ? COPY.resume : COPY.pause}
              aria-pressed={halted}
              title={halted ? 'Resume' : 'Pause'}
              className="group grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/[0.06] text-muted transition-[border-color,background-color,color,box-shadow,transform] duration-300 hover:border-accent/70 hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm focus-visible:border-accent active:scale-95"
            >
              {halted ? (
                <Play aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <Pause aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              )}
            </button>
          )}
        </div>

        <div className="relative mt-3 flex flex-col gap-1.5 sm:mt-4">
          {ROWS.map((row, i) => (
            <TickerRow
              key={i}
              label={COPY.rows[i] ?? ''}
              tools={row}
              reverse={i % 2 === 1}
              halted={halted}
              reduced={reduced}
            />
          ))}
        </div>

        {/* legend (+ recent hours below lg) */}
        <div className="relative mt-3 flex flex-col gap-3 border-t border-accent/15 px-4 pt-4 sm:mt-4 sm:px-6">
          <ul className="flex flex-wrap gap-1.5" aria-label="Tools per discipline">
            {COUNTS.map((c) => {
              const Icon = CATEGORY_ICON[c.id]
              return (
                <li
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/[0.05] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted"
                >
                  <Icon aria-hidden className="h-3 w-3 text-accent" />
                  {c.short}
                  <span className="text-ink">{c.count}</span>
                </li>
              )
            })}
          </ul>
          <Recent className="lg:hidden" />
        </div>
      </motion.div>

      <BlockFooterAction action={action} />
    </section>
  )
}

/** Hours per tool over the last 30 days (tools.ts TIME_IN_TOOL), top four. */
function Recent({ className }: { className?: string }) {
  if (RECENT.length === 0) return null
  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-muted', className)}>
      <span className="uppercase tracking-[0.16em] text-accent">{COPY.recent}</span>
      {RECENT.map((r) => (
        <span key={r.toolId} className="whitespace-nowrap">
          {r.tool.short} <span className="text-ink">{r.hours} h</span>
        </span>
      ))}
    </p>
  )
}

/**
 * One compositor-driven marquee row (WAAPI transform). It parks while off
 * screen, while the tab is hidden, while paused, and eases to a stop under
 * the mouse. Under reduced motion it renders a static, wrapping list.
 */
function TickerRow({
  label,
  tools,
  reverse,
  halted,
  reduced,
}: {
  label: string
  tools: Tool[]
  reverse: boolean
  halted: boolean
  reduced: boolean
}) {
  const viewRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const anim = useRef<Animation | null>(null)
  const inView = useInView(viewRef)
  const pageVisible = usePageVisible()
  const [hovered, setHovered] = useState(false)
  const stopped = hovered || halted || !inView || !pageVisible

  useEffect(() => {
    const el = trackRef.current
    if (!el || reduced || typeof el.animate !== 'function') return
    // one copy of the row is half the track; travel it at a constant speed
    const distance = el.scrollWidth / 2
    const a = el.animate(
      [{ transform: 'translate3d(0, 0, 0)' }, { transform: 'translate3d(-50%, 0, 0)' }],
      {
        duration: Math.max(20000, (distance / SPEED) * 1000),
        iterations: Infinity,
        direction: reverse ? 'reverse' : 'normal',
      },
    )
    a.playbackRate = 0
    anim.current = a
    return () => {
      a.cancel()
      anim.current = null
    }
  }, [reduced, reverse, tools.length])

  useEffect(() => {
    const a = anim.current
    if (!a) return
    const from = a.playbackRate
    const to = stopped ? 0 : 1
    if (from === to) return
    // off-screen / hidden tab: stop at once; hover and the pause button ease out
    if (!inView || !pageVisible) {
      a.playbackRate = to
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 450)
      a.playbackRate = from + (to - from) * (1 - (1 - p) ** 3)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stopped, inView, pageVisible, reduced])

  const copies = reduced ? 1 : 2

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="shrink-0 px-4 font-mono text-[9.5px] uppercase tracking-[0.2em] text-accent sm:w-48 sm:pl-6 sm:pr-0">
        {label}
      </span>
      <div
        ref={viewRef}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className={cn(
          'relative min-w-0 flex-1',
          !reduced && 'overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]',
        )}
      >
        <ul
          ref={trackRef}
          aria-label={label}
          className={cn('flex py-2', reduced ? 'flex-wrap gap-y-2 px-4 sm:px-0' : 'w-max will-change-transform')}
        >
          {Array.from({ length: copies }, (_, c) =>
            tools.map((t) => <ToolBadge key={`${c}-${t.id}`} tool={t} hidden={c > 0} />),
          )}
        </ul>
      </div>
    </div>
  )
}

/** Same glass monogram as the Tools section, flattened to one element: the ticker renders 60+ of them. */
const MONO_STYLE = {
  background: 'linear-gradient(140deg, rgb(var(--accent) / 0.34), rgb(var(--accent-2) / 0.1) 52%, rgb(var(--deep) / 0.75))',
  boxShadow: 'inset 0 1px 0 rgb(var(--accent-3) / 0.45), 0 0 10px rgb(var(--accent) / 0.35)',
}

/** One tool on the ticker; memoised so hover / pause re-renders of the row skip it. */
const ToolBadge = memo(function ToolBadge({ tool, hidden }: { tool: Tool; hidden: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="group/badge mr-2.5 shrink-0">
      <div className="relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-accent/20 bg-surface/70 py-1.5 pl-1.5 pr-3.5 transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/15 hover:shadow-glow-sm">
        <span
          aria-hidden
          style={MONO_STYLE}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/45 font-display text-[10.5px] font-black leading-none tracking-tight text-ink"
        >
          {tool.mono}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="whitespace-nowrap font-display text-[12px] font-bold tracking-wide text-ink">
            {tool.short}
          </span>
          <span className="whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover/badge:text-accent3">
            {tool.years} yrs · {PROFICIENCY_LABEL[tool.level]}
          </span>
        </span>
      </div>
    </li>
  )
})

function Brackets() {
  const base = 'pointer-events-none absolute h-3.5 w-3.5 border-accent/60'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
