import { useRef, type PointerEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { PROFICIENCY_LABEL, type Tool } from '@/data/tools'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CATEGORY_BY_ID } from './meta'
import { ProficiencyMeter } from './ProficiencyMeter'
import { ToolMonogram } from './ToolMonogram'

const SPRING = { stiffness: 240, damping: 24, mass: 0.5 }

/**
 * Glass tool card: tilts toward the pointer, lifts and glows on hover, and
 * runs a shimmer along its proficiency meter. The whole card is one button
 * (a stretched overlay) that opens the detail dialog.
 */
export function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const cat = CATEGORY_BY_ID[tool.category]

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), SPRING)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), SPRING)
  const glare = useTransform(
    [gx, gy],
    ([x, y]: number[]) =>
      `radial-gradient(22rem 15rem at ${x}% ${y}%, rgb(var(--accent) / 0.17), transparent 62%)`,
  )

  const onMove = (e: PointerEvent) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    mx.set(px - 0.5)
    my.set(py - 0.5)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={reduced ? undefined : { y: -7 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      style={{ rotateX, rotateY, transformPerspective: 950 }}
      className="group/card relative h-full"
    >
      {/* outer glow + ground light, outside the clipped glass */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-glow transition-opacity duration-500 group-hover/card:opacity-100 group-has-[:focus-visible]/card:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 -bottom-4 h-8 rounded-[50%] bg-accent/25 opacity-0 blur-xl transition-opacity duration-500 group-hover/card:opacity-100"
      />

      <div className="glass relative flex h-full flex-col overflow-hidden rounded-2xl p-4 group-hover/card:border-accent/60 group-has-[:focus-visible]/card:border-accent/80">
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{ background: glare }}
          />
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)' }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <span className="block h-px w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-[1100ms] ease-out group-hover/card:translate-x-[320%]" />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/[0.08] to-transparent transition-transform duration-1000 ease-out group-hover/card:translate-x-full"
        />
        <Brackets />

        <div className="relative flex items-start gap-3.5">
          <ToolMonogram
            tool={tool}
            size="md"
            className="transition-transform duration-500 ease-out group-hover/card:-rotate-6 group-hover/card:scale-110"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <h4 className="font-display text-[15px] font-bold leading-tight tracking-wide text-ink">
              {tool.name}
            </h4>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-accent">
              {cat.short} <span className="text-muted">· {tool.years} yrs</span>
            </p>
          </div>
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/[0.08] text-accent transition-all duration-300 group-hover/card:border-accent group-hover/card:shadow-glow-sm group-hover/card:bg-accent/20 group-hover/card:text-ink"
          >
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5" />
          </span>
        </div>

        <p className="relative mt-3 flex-1 text-[13.5px] leading-snug text-muted transition-colors duration-300 group-hover/card:text-ink/85">
          {tool.usage}
        </p>

        <ul className="relative mt-3 flex flex-wrap gap-1.5">
          {tool.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-accent/20 bg-accent/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover/card:border-accent/35 group-hover/card:text-ink/80"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="relative mt-3.5 flex items-center gap-2.5 border-t border-accent/10 pt-3">
          <ProficiencyMeter level={tool.level} size="sm" shimmer="card" className="flex-1" />
          <span className="w-[4.6rem] shrink-0 text-right font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
            {PROFICIENCY_LABEL[tool.level]}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(tool.id)}
        aria-haspopup="dialog"
        aria-label={`${tool.name} — open details`}
        className="absolute inset-0 z-20 rounded-2xl"
      />
    </motion.article>
  )
}

function Brackets() {
  const base =
    'pointer-events-none absolute h-3 w-3 border-accent/60 transition-all duration-500 group-hover/card:h-4 group-hover/card:w-4 group-hover/card:border-accent'
  return (
    <>
      <span aria-hidden className={`${base} left-1.5 top-1.5 border-l border-t`} />
      <span aria-hidden className={`${base} bottom-1.5 right-1.5 border-b border-r`} />
    </>
  )
}
