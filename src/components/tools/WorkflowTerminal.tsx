import { useState } from 'react'
import { RotateCcw, ShieldCheck, SquareTerminal } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { Terminal } from '@/components/ui/Terminal'
import { WORKFLOW_SESSIONS } from '@/data/tools'
import { cn } from '@/lib/utils'
import { useRoving } from './hooks'

/** A replay of real daily work, one tab per session; switching tabs types the new session out. */
export function WorkflowTerminal() {
  const [tab, setTab] = useState(0)
  const [run, setRun] = useState(0)
  const roving = useRoving(WORKFLOW_SESSIONS.length, setTab)
  const session = WORKFLOW_SESSIONS[tab]

  return (
    <HoloPanel title="Daily Workflow" icon={SquareTerminal} badge="replay" from="right" delay={0.1} tilt={4}>
      <div
        role="tablist"
        aria-label="Workflow sessions"
        className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {WORKFLOW_SESSIONS.map((s, i) => {
          const selected = i === tab
          const props = roving.itemProps(i)
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`wf-tab-${s.id}`}
              aria-selected={selected}
              aria-controls="wf-panel"
              {...props}
              tabIndex={selected ? 0 : -1}
              onFocus={() => roving.setIndex(i)}
              onClick={() => {
                roving.setIndex(i)
                setTab(i)
              }}
              className={cn(
                'group relative inline-flex min-h-[40px] shrink-0 items-center gap-2 overflow-hidden rounded-lg border px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-[color,background-color,border-color,box-shadow] duration-300',
                selected
                  ? 'border-accent/70 bg-accent/[0.16] text-ink shadow-glow-sm'
                  : 'border-accent/20 bg-accent/[0.04] text-muted hover:border-accent/50 hover:bg-accent/10 hover:text-ink',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                  selected ? 'animate-pulse bg-accent shadow-glow-sm' : 'bg-muted/50 group-hover:bg-accent/70',
                )}
              />
              {s.label}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-2 bottom-0 h-px origin-center bg-accent transition-transform duration-500',
                  selected ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50',
                )}
              />
            </button>
          )
        })}
      </div>

      {/* no ligatures: "->" and "=>" must print as typed, not as arrow glyphs */}
      <div
        role="tabpanel"
        id="wf-panel"
        aria-labelledby={`wf-tab-${session.id}`}
        className="mt-3 [font-variant-ligatures:none]"
      >
        <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-accent/20 bg-accent/[0.06] px-3 py-1.5">
          <span aria-hidden className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-300/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </span>
          <span className="ml-1 truncate font-mono text-[10px] tracking-[0.08em] text-muted">
            nox@research-vm: {session.cwd ?? '~'}
          </span>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            aria-label="Replay this session"
            className="group ml-auto inline-flex min-h-[30px] shrink-0 items-center gap-1.5 rounded-md border border-accent/30 bg-accent/[0.06] px-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:border-accent hover:bg-accent/15 hover:text-ink"
          >
            <RotateCcw className="h-3 w-3 transition-transform duration-500 group-hover:-rotate-180" />
            replay
          </button>
        </div>
        <Terminal
          key={`${session.id}-${run}`}
          lines={session.lines}
          speed={7}
          height="h-[19.5rem] sm:h-[21rem]"
          className="rounded-t-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="truncate">{session.context}</span>
        </span>
        <span className="text-muted/70 [@media(hover:none)]:hidden">← → switch session</span>
      </div>
    </HoloPanel>
  )
}
