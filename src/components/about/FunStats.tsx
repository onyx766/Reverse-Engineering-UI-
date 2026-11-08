import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { FunStat } from '@/data/about'
import { EASE, GLOW_HOVER, SWEEP } from './fx'

type CountStat = Extract<FunStat, { kind: 'count' }>
type RatioStat = Extract<FunStat, { kind: 'ratio' }>

const tileMotion = (index: number) => ({
  initial: { opacity: 0, y: 30, rotateX: -14, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.75, delay: index * 0.08, ease: EASE },
  whileHover: { y: -6 },
  style: { transformPerspective: 1000 },
})

/** Count-up stat tiles: label, number, one line of context. */
export function FunStats({ stats, className }: { stats: FunStat[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5', className)}>
      {stats.map((s, i) =>
        s.kind === 'count' ? (
          <CountTile key={s.label} stat={s} index={i} />
        ) : (
          <RatioTile key={s.label} stat={s} index={i} />
        ),
      )}
    </div>
  )
}

function TileChrome() {
  return (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span aria-hidden className={SWEEP} />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/10 blur-2xl transition-colors duration-500 group-hover:bg-accent/30"
      />
    </>
  )
}

function CountTile({ stat, index }: { stat: CountStat; index: number }) {
  const { ref, value } = useCountUp(stat.value)
  const Icon = stat.icon
  return (
    <motion.div
      {...tileMotion(index)}
      className={cn('glass group relative flex flex-col overflow-hidden rounded-xl p-4 sm:p-5', GLOW_HOVER)}
    >
      <TileChrome />
      <div className="relative flex items-start justify-between gap-2">
        <span className="font-mono text-[9.5px] uppercase leading-snug tracking-[0.18em] text-muted">
          {stat.label}
        </span>
        <Icon
          aria-hidden
          className="h-4 w-4 shrink-0 text-accent/80 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-125"
        />
      </div>
      <p className="relative mt-auto pt-4 font-display text-[clamp(2rem,3.4vw,2.6rem)] font-black leading-none tabular-nums text-ink">
        <span ref={ref}>{value.toLocaleString()}</span>
        {stat.suffix && <span className="neon">{stat.suffix}</span>}
      </p>
      <p className="relative mt-2 text-[13px] leading-snug text-muted">{stat.note}</p>
    </motion.div>
  )
}

function RatioTile({ stat, index }: { stat: RatioStat; index: number }) {
  const { ref, value } = useCountUp(stat.right, 1900)
  const boxRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef, { margin: '-40px' })
  const reduced = useReducedMotion()
  const Icon = stat.icon
  const RightIcon = stat.rightIcon

  return (
    <motion.div
      ref={boxRef}
      {...tileMotion(index)}
      className={cn(
        'glass group relative col-span-2 flex flex-col overflow-hidden rounded-xl p-4 sm:p-5 lg:col-span-1',
        GLOW_HOVER,
      )}
    >
      <TileChrome />
      <div className="relative flex items-start justify-between gap-2">
        <span className="font-mono text-[9.5px] uppercase leading-snug tracking-[0.18em] text-muted">
          {stat.label}
        </span>
        <span aria-hidden className="flex items-center gap-1 text-accent/80">
          <span className="relative">
            <Icon className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12" />
            {inView && !reduced && <Steam />}
          </span>
          <span className="font-mono text-[10px]">:</span>
          <RightIcon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-12" />
        </span>
      </div>
      <p className="relative mt-auto flex items-baseline gap-2 pt-4 font-display text-[clamp(2rem,3.4vw,2.6rem)] font-black leading-none tabular-nums text-ink">
        <span>{stat.left}</span>
        <span className="neon text-[0.8em]">:</span>
        <span ref={ref}>{value}</span>
      </p>
      <p className="relative mt-2 text-[13px] leading-snug text-muted">{stat.note}</p>
    </motion.div>
  )
}

function Steam() {
  return (
    <span className="pointer-events-none absolute -top-3 left-[3px] flex gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-px rounded-full bg-accent3"
          initial={{ y: 2, opacity: 0 }}
          animate={{ y: [2, -5], opacity: [0, 0.9, 0], scaleY: [0.6, 1.2, 0.8] }}
          transition={{ duration: 1.6, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </span>
  )
}
