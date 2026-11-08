import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

export interface Reg {
  name: string
  value: string
}

export interface TraceCall {
  addr: string
  text: string
}

const SEGMENTS = [
  { w: 14, tone: 'bg-emerald-400/70' },
  { w: 8, tone: 'bg-accent/70' },
  { w: 22, tone: 'bg-emerald-400/70' },
  { w: 10, tone: 'bg-accent2/70' },
  { w: 16, tone: 'bg-accent/70' },
  { w: 12, tone: 'bg-emerald-400/70' },
  { w: 18, tone: 'bg-accent2/70' },
]

/**
 * Register file + execution timeline + a stepping call trace — a compressed
 * version of what a debugger session actually looks like mid-analysis.
 */
export function DebuggerView({ regs, trace }: { regs: Reg[]; trace: TraceCall[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const [pc, setPc] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return
    const t = setInterval(() => {
      setPc((p) => (p + 1) % trace.length)
      setTick((v) => v + 1)
    }, 1100)
    return () => clearInterval(t)
  }, [inView, reduced, trace.length])

  return (
    <div ref={ref} className="flex flex-col gap-3.5">
      {/* registers */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
        {regs.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex items-center justify-between gap-2"
          >
            <span className="text-accent">{r.name}</span>
            <motion.span
              key={`${r.name}-${r.name === 'RAX' ? tick : 0}`}
              initial={r.name === 'RAX' ? { opacity: 0.3, color: 'rgb(var(--accent-3))' } : false}
              animate={{ opacity: 1, color: 'rgb(var(--muted))' }}
              transition={{ duration: 0.6 }}
              className="text-muted"
            >
              {r.name === 'RAX'
                ? `0x${(0x1 + tick * 0x2f).toString(16).padStart(8, '0')}`
                : r.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* execution timeline */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-[3px]">
          {SEGMENTS.map((s, i) => (
            <motion.span
              key={i}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              style={{ flexGrow: s.w, transformOrigin: 'left' }}
              className={cn('h-1.5 rounded-full', s.tone)}
            />
          ))}
        </div>
        <div className="relative h-3">
          {/* playhead */}
          <motion.span
            className="absolute top-0 h-3 w-px bg-accent shadow-glow-sm"
            animate={{ left: `${(pc / Math.max(1, trace.length - 1)) * 100}%` }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
          >
            <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-accent" />
          </motion.span>
        </div>
      </div>

      {/* call trace */}
      <div className="font-mono text-[11px] leading-[1.7]">
        {trace.map((c, i) => {
          const active = i === pc
          return (
            <div
              key={c.addr}
              className={cn(
                'flex items-center gap-2.5 rounded px-1.5 transition-all duration-300',
                active ? 'bg-accent/15 text-ink' : 'text-muted',
              )}
            >
              <span className={cn('w-2 shrink-0 text-accent', !active && 'opacity-0')}>&gt;</span>
              <span className={cn('shrink-0', active ? 'text-accent' : 'text-muted/70')}>
                {c.addr}
              </span>
              <span className="truncate">{c.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
