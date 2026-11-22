import { motion } from 'framer-motion'
import { Activity, Box, Check, Cpu, FileScan, FileText, Layers, Route, ShieldCheck, Wrench } from 'lucide-react'
import type { ReactNode, SVGProps } from 'react'
import { STAGES, type Project, type StageId } from '@/data/projects'
import { cn } from '@/lib/utils'
import { OPTIONS, useRadioKeys, type FilterId } from '../FilterPanel'
import { useAnalysisRun } from '../AnalysisPanel'
import { quadMatrix, type Quad } from './quad'

/* ── pane content ───────────────────────────────────────────────────── */

/**
 * The glass itself is part of the photoreal plate (the render's own panes,
 * text removed); this layer carries only the live content, pinned onto the
 * same four corners so it sits exactly where the render's text was.
 */
export function Slab({
  quad,
  w,
  h,
  className,
  children,
  radius = 18,
}: {
  quad: Quad
  w: number
  h: number
  className?: string
  children: ReactNode
  radius?: number
}) {
  return (
    <div
      className={cn('group/slab absolute left-0 top-0 overflow-hidden font-ui', className)}
      style={{ width: w, height: h, transformOrigin: '0 0', transform: quadMatrix(w, h, quad), borderRadius: radius }}
    >
      {/* hover: a light band slides across the glass (additive, so the render shows through) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-1000 ease-out group-hover/slab:translate-x-[320%]"
        style={{ mixBlendMode: 'screen' }}
      />
      {children}
    </div>
  )
}

/* ── filter panel (left) ────────────────────────────────────────────── */

const FILTER_QUAD: Quad = [
  [47, 127],
  [297, 157],
  [300, 497],
  [47, 505],
]
const FW = 262
const FH = 378

function NodesIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="5" r="2.4" />
      <circle cx="5" cy="18" r="2.4" />
      <circle cx="19" cy="18" r="2.4" />
      <path d="M10.8 7.1 6.2 15.9M13.2 7.1l4.6 8.8M7.4 18h9.2" />
    </svg>
  )
}
function GridIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  )
}
function HexDotIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" {...p}>
      <path d="M12 3 19.8 7.5v9L12 21l-7.8-4.5v-9z" />
      <path d="M12 8.4 15.1 10.2v3.6L12 15.6l-3.1-1.8v-3.6z" fill="currentColor" stroke="none" />
    </svg>
  )
}

const FILTER_ICON: Record<FilterId, (p: SVGProps<SVGSVGElement>) => JSX.Element> = {
  all: GridIcon,
  api: NodesIcon,
  binary: (p) => <Cpu strokeWidth={1.6} {...(p as object)} />,
  format: (p) => <FileText strokeWidth={1.6} {...(p as object)} />,
  reimpl: (p) => <Layers strokeWidth={1.6} {...(p as object)} />,
  tooling: (p) => <Wrench strokeWidth={1.6} {...(p as object)} />,
}

/** row centres (y, in pane px): the active row is a roomier pill */
const ROW_Y = [106, 164, 207, 250, 293, 336]

export function RefFilterPanel({
  value,
  onChange,
  counts,
}: {
  value: FilterId
  onChange: (id: FilterId) => void
  counts: Record<FilterId, number>
}) {
  const { refs, onKeyDown } = useRadioKeys(value, onChange, 'y')
  const active = Math.max(0, OPTIONS.findIndex((o) => o.id === value))

  return (
    <Slab quad={FILTER_QUAD} w={FW} h={FH}>
      <div className="absolute left-[44px] top-[25px] flex items-center gap-[16px]">
        <Box aria-hidden strokeWidth={1.5} className="h-[34px] w-[34px] text-ink" />
        <h3 className="text-[21px] font-semibold tracking-[0.005em] text-ink">Projects</h3>
      </div>

      <div role="radiogroup" aria-label="Filter projects by category">
        {/* active pill slides to the chosen row */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-[37px] w-[206px] rounded-[11px]"
          initial={false}
          animate={{ top: ROW_Y[active] - 22 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            height: 44,
            background: 'linear-gradient(90deg, rgb(10 60 78 / 0.85), rgb(8 40 54 / 0.7))',
            boxShadow:
              'inset 0 0 0 2.2px rgb(120 240 255), inset 0 0 16px rgb(var(--accent) / 0.5), 0 0 10px rgb(var(--accent)), 0 0 30px rgb(var(--accent) / 0.5)',
          }}
        />
        {OPTIONS.map((o, i) => {
          const on = i === active
          const Icon = FILTER_ICON[o.id]
          return (
            <motion.button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(o.id)}
              onKeyDown={onKeyDown}
              style={{ top: ROW_Y[i] - 20 }}
              className={cn(
                'group/row absolute left-[37px] flex h-[40px] w-[206px] items-center gap-[13px] rounded-[10px] pl-[15px] text-left text-[16px] outline-none',
                'transition-[color,background-color,text-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-accent3',
                on ? 'text-ink' : 'text-ink hover:bg-accent/[0.08] hover:text-ink hover:[text-shadow:0_0_10px_rgb(var(--accent)/0.7)]',
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  'h-[24px] w-[24px] shrink-0 transition-[color,transform] duration-300 group-hover/row:scale-110',
                  on ? 'text-accent drop-shadow-[0_0_6px_rgb(var(--accent))]' : 'text-ink/90 group-hover/row:text-accent3',
                )}
              />
              <span className="whitespace-nowrap">
                {o.label} ({counts[o.id]})
              </span>
            </motion.button>
          )
        })}
      </div>
    </Slab>
  )
}

/* ── analysis panel (right) ─────────────────────────────────────────── */

const ANALYSIS_QUAD: Quad = [
  [1347, 194],
  [1619, 164],
  [1633, 500],
  [1347, 489],
]
const AW = 282
const AH = 336

function PulseIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M1 13h9l3-7 4 14 4-17 4 13 3-3h11" />
    </svg>
  )
}

const STAGE_GLYPH: Record<StageId, (p: { className?: string }) => JSX.Element> = {
  static: (p) => <ShieldCheck strokeWidth={1.6} {...p} />,
  dynamic: (p) => <ShieldCheck strokeWidth={1.6} {...p} />,
  behavior: (p) => <FileScan strokeWidth={1.6} {...p} />,
  protocol: (p) => <Route strokeWidth={1.6} {...p} />,
  reimpl: HexDotIcon,
}

export function RefAnalysisPanel({ project }: { project: Project }) {
  const { reduced, rootRef, meterRef, applicable, bar, pctText, complete, doneCount } = useAnalysisRun(project)
  return (
    <Slab quad={ANALYSIS_QUAD} w={AW} h={AH}>
      <div ref={rootRef} className="absolute inset-0">
        <div className="absolute left-[24px] top-[30px] flex items-center gap-[11px]">
          <PulseIcon className="h-[22px] w-[33px] text-accent drop-shadow-[0_0_6px_rgb(var(--accent))]" />
          <h3 className="text-[18.5px] font-semibold tracking-[0.005em] text-ink">System Analysis</h3>
        </div>

        <div className="absolute left-[26px] right-[22px] top-[78px] flex items-end justify-between">
          <span className="text-[13.8px] text-ink/95">Analysis Progress</span>
          <span className="text-[15.5px] font-semibold tabular-nums text-ink">
            <motion.span>{pctText}</motion.span>%
          </span>
        </div>
        <div
          ref={meterRef}
          role="progressbar"
          aria-label={`Analysis of ${project.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute left-[26px] right-[22px] top-[104px] h-[10px] overflow-hidden rounded-full bg-accent/[0.14]"
        >
          <motion.span
            className="absolute inset-0 origin-left rounded-full"
            style={{
              scaleX: bar,
              background: 'linear-gradient(90deg, rgb(var(--accent)), rgb(120 246 255) 60%, rgb(200 255 255))',
              boxShadow: '0 0 10px rgb(var(--accent)), 0 0 22px rgb(var(--accent) / 0.6)',
            }}
          />
          {!complete && !reduced && (
            <span className="absolute inset-y-0 left-0 w-1/4 animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          )}
        </div>

        <ul className="absolute left-[22px] right-[20px] top-[129px]">
          {STAGES.map((s, i) => {
            const on = project.stages[s.id]
            const k = applicable.findIndex((a) => a.id === s.id)
            const state = !on ? 'na' : k < doneCount ? 'done' : k === doneCount && !complete ? 'running' : 'pending'
            const Glyph = STAGE_GLYPH[s.id]
            return (
              <li
                key={s.id}
                className={cn(
                  'relative flex h-[36.5px] items-center gap-[12px] pl-[4px] transition-colors duration-500',
                  i > 0 && 'border-t border-white/[0.07]',
                )}
              >
                <Glyph className={cn('h-[18px] w-[18px] shrink-0', state === 'na' ? 'text-ink/35' : 'text-ink/90')} />
                <span className={cn('flex-1 truncate text-[14px]', state === 'na' ? 'text-ink/40' : 'text-ink/95')}>
                  {s.label}
                  <span className="sr-only">
                    {state === 'na' ? ' (not applicable)' : state === 'done' ? ' (complete)' : state === 'running' ? ' (running)' : ' (pending)'}
                  </span>
                </span>
                <span aria-hidden className="grid w-[26px] place-items-center">
                  {state === 'done' && (
                    <motion.span
                      key={`done-${project.id}`}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                      className="text-accent drop-shadow-[0_0_6px_rgb(var(--accent))]"
                    >
                      <Check className="h-[21px] w-[21px]" strokeWidth={2.6} />
                    </motion.span>
                  )}
                  {state === 'running' && <Activity className="h-4 w-4 animate-pulse text-accent3" />}
                  {state === 'pending' && <span className="h-2 w-2 rounded-full border border-ink/40" />}
                  {state === 'na' && <span className="text-[11px] uppercase tracking-[0.1em] text-ink/35">n/a</span>}
                </span>
              </li>
            )
          })}
        </ul>
        <span className="sr-only" aria-live="polite">
          {complete ? `Analysis of ${project.title} complete: ${applicable.length} of ${STAGES.length} stages applied.` : ''}
        </span>
      </div>
    </Slab>
  )
}
