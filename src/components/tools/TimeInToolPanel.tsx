import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Timer } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { TIME_IN_TOOL } from '@/data/tools'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { seeded } from '@/lib/utils'
import { EASE, TOOL_BY_ID } from './meta'
import { ToolMonogram } from './ToolMonogram'

const MAX = Math.max(...TIME_IN_TOOL.map((t) => t.hours))
const TOTAL = TIME_IN_TOOL.reduce((s, t) => s + t.hours, 0)

/** Day-by-day split of TOTAL: deterministic, lighter on weekends. */
const DAYS = (() => {
  const rand = seeded(4821)
  const raw = Array.from({ length: 30 }, (_, i) => {
    const weekend = i % 7 === 5 || i % 7 === 6
    return (weekend ? 0.25 : 0.75) + rand() * (weekend ? 0.5 : 0.9)
  })
  const sum = raw.reduce((s, v) => s + v, 0)
  return raw.map((v) => (v / sum) * TOTAL)
})()
const DAY_MAX = Math.max(...DAYS)

/**
 * Hours per tool over the last month. Hovering a row brings that tool to the
 * front of the orbit; clicking opens its detail view.
 */
export function TimeInToolPanel({
  onPreview,
  onOpen,
}: {
  onPreview: (id: string | null) => void
  onOpen: (id: string) => void
}) {
  const { ref, value } = useCountUp(TOTAL, 1400)
  const listRef = useRef<HTMLUListElement>(null)
  const sparkRef = useRef<HTMLDivElement>(null)
  const listShown = useInView(listRef, { once: true, margin: '-30px' })
  const sparkShown = useInView(sparkRef, { once: true, margin: '-20px' })
  // reduced motion: rows only fade (MotionConfig skips transforms, but not blur)
  const reduced = useReducedMotion()

  return (
    <HoloPanel
      title="Time in Tool"
      icon={Timer}
      badge="30d"
      from="right"
      delay={0.12}
      tilt={6}
      bodyClassName="p-2.5 sm:p-3"
    >
      <div className="flex items-end justify-between gap-2 px-1.5 pb-2">
        <p className="font-display text-[28px] font-black leading-none text-ink">
          <span ref={ref}>{value}</span>
          <span className="ml-1 font-mono text-[12px] font-normal text-accent">h</span>
        </p>
        <p className="pb-0.5 text-right font-mono text-[9.5px] uppercase leading-tight tracking-[0.16em] text-muted">
          logged
          <br />
          {(TOTAL / 30).toFixed(1)} h / day
        </p>
      </div>

      <ul ref={listRef} className="flex flex-col gap-0.5">
        {TIME_IN_TOOL.map((row, i) => {
          const tool = TOOL_BY_ID[row.toolId]
          if (!tool) return null
          return (
            <motion.li
              key={row.toolId}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16, filter: 'blur(6px)' }}
              whileInView={reduced ? { opacity: 1 } : { opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.06, ease: EASE }}
            >
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`${tool.name}: ${row.hours} hours in the last 30 days. Open details.`}
                onMouseEnter={() => onPreview(tool.id)}
                onMouseLeave={() => onPreview(null)}
                onFocus={() => onPreview(tool.id)}
                onBlur={() => onPreview(null)}
                onClick={() => onOpen(tool.id)}
                className="group relative flex min-h-[44px] w-full items-center gap-2.5 overflow-hidden rounded-lg border border-transparent px-1.5 text-left transition-[background-color,border-color] duration-300 hover:border-accent/35 hover:bg-accent/[0.07]"
              >
                <ToolMonogram
                  tool={tool}
                  size="xs"
                  className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold leading-none text-ink/90 transition-colors group-hover:text-ink">
                      {tool.short}
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] leading-none text-muted transition-colors group-hover:text-accent">
                      {row.hours}h
                    </span>
                  </span>
                  <span className="relative block h-1.5 overflow-hidden rounded-full bg-accent/10">
                    <motion.span
                      className="absolute inset-y-0 left-0 origin-left rounded-full bg-gradient-to-r from-accent to-accent2 transition-[filter] duration-300 group-hover:brightness-125"
                      style={{ width: `${(row.hours / MAX) * 100}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: listShown ? 1 : 0 }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.08, ease: EASE }}
                    />
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 overflow-hidden"
                      style={{ width: `${(row.hours / MAX) * 100}%` }}
                    >
                      <span className="absolute inset-y-0 left-0 w-1/2 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/60 to-transparent group-hover:animate-sweep" />
                    </span>
                  </span>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>

      <div className="mx-1.5 mt-2.5 border-t border-accent/15 pt-2.5">
        <div ref={sparkRef} aria-hidden className="flex h-9 items-end gap-[2px]">
          {DAYS.map((h, i) => (
            <motion.span
              key={i}
              className="flex-1 origin-bottom rounded-t-[1px] bg-accent/50"
              style={{ height: `${Math.max(8, (h / DAY_MAX) * 100)}%`, opacity: 0.35 + (h / DAY_MAX) * 0.65 }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: sparkShown ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.018, ease: EASE }}
            />
          ))}
        </div>
        <p className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-muted/80">
          <span>-30d</span>
          <span>daily activity</span>
          <span>today</span>
        </p>
      </div>
    </HoloPanel>
  )
}
