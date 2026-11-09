import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { Radar } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { RADAR_SERIES, SKILL_AXES } from '@/data/tools'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { EASE } from './meta'
import { useRoving } from './hooks'

const R = 112
const N = SKILL_AXES.length
const VIEW = 196

const angle = (i: number) => (i / N) * Math.PI * 2 - Math.PI / 2
const point = (i: number, v: number) => {
  const r = (R * v) / 100
  return { x: Math.cos(angle(i)) * r, y: Math.sin(angle(i)) * r }
}
const pathFor = (values: number[]) =>
  values
    .map((v, i) => {
      const p = point(i, v)
      return `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    })
    .join('') + 'Z'

/** per-axis unfolding so the polygon opens like a fan, not a zoom */
const unfold = (p: number, i: number) => {
  const local = Math.min(1, Math.max(0, (p - i * 0.05) / 0.6))
  return 1 - Math.pow(1 - local, 3)
}

const MEAN = Math.round(SKILL_AXES.reduce((s, a) => s + a.value, 0) / N)

/**
 * Eight-axis self-assessment. The polygon unfolds axis by axis on reveal,
 * a radar sweep idles across it, and hovering or focusing a point (arrow
 * keys move between points) shows the value with a note.
 */
export function SkillRadar() {
  const reduced = useReducedMotion()
  const chartRef = useRef<HTMLDivElement>(null)
  const inView = useInView(chartRef, { margin: '-60px' })
  const revealed = useInView(chartRef, { once: true, margin: '-60px' })
  const [progress, setProgress] = useState(0)
  const [user, setUser] = useState<number | null>(null)
  const [auto, setAuto] = useState(0)
  const roving = useRoving(N, (i) => setUser(i))

  useEffect(() => {
    if (!revealed) return
    if (reduced) {
      setProgress(1)
      return
    }
    const controls = animate(0, 1, { duration: 1.5, ease: 'linear', onUpdate: setProgress })
    return () => controls.stop()
  }, [revealed, reduced])

  useEffect(() => {
    if (!inView || reduced || user !== null || progress < 1) return
    const t = setInterval(() => setAuto((a) => (a + 1) % N), 2600)
    return () => clearInterval(t)
  }, [inView, reduced, user, progress])

  const active = user ?? auto
  const axis = SKILL_AXES[active]
  const nowPath = pathFor(SKILL_AXES.map((a, i) => a.value * unfold(progress, i)))
  const basePath = pathFor(SKILL_AXES.map((a, i) => a.baseline * unfold(progress, i)))

  return (
    <HoloPanel title="Skill Radar" icon={Radar} badge="self-assessed" from="left" delay={0.05} tilt={5}>
      <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <div>
          <div
            ref={chartRef}
            className={cn(
              'relative mx-auto aspect-square w-full max-w-[22rem]',
              !inView && '[&_*]:![animation-play-state:paused]',
            )}
          >
            {!reduced && (
              <div
                aria-hidden
                className="pointer-events-none absolute overflow-hidden rounded-full"
                style={{
                  left: `${50 - (R / VIEW) * 50}%`,
                  top: `${50 - (R / VIEW) * 50}%`,
                  width: `${(R / VIEW) * 100}%`,
                  height: `${(R / VIEW) * 100}%`,
                }}
              >
                <div
                  className="absolute inset-0 animate-spin-slow rounded-full [animation-duration:6s]"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgb(var(--accent) / 0.05) 320deg, rgb(var(--accent) / 0.28) 359deg, transparent 360deg)',
                  }}
                />
              </div>
            )}

            <svg
              viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
              className="relative h-full w-full overflow-visible"
              role="img"
              aria-label={`Skill radar: ${SKILL_AXES.map((a) => `${a.label} ${a.value}`).join(', ')}`}
            >
              <circle r={R + 8} fill="rgb(var(--accent) / 0.04)" stroke="rgb(var(--accent) / 0.25)" strokeWidth="1" strokeDasharray="2 4" />
              {[25, 50, 75, 100].map((lv) => (
                <path
                  key={lv}
                  d={pathFor(SKILL_AXES.map(() => lv))}
                  fill="none"
                  stroke={`rgb(var(--accent) / ${lv === 100 ? 0.4 : 0.16})`}
                  strokeWidth="1"
                />
              ))}
              {SKILL_AXES.map((a, i) => {
                const end = point(i, 100)
                const on = i === active
                return (
                  <line
                    key={a.id}
                    x1="0"
                    y1="0"
                    x2={end.x}
                    y2={end.y}
                    stroke={on ? 'rgb(var(--accent) / 0.9)' : 'rgb(var(--accent) / 0.16)'}
                    strokeWidth={on ? 1.6 : 1}
                    className="transition-[stroke] duration-300"
                  />
                )
              })}
              {[25, 50, 75].map((lv) => (
                <text
                  key={lv}
                  x="4"
                  y={-(R * lv) / 100 - 3}
                  className="fill-muted font-mono"
                  style={{ fontSize: 8.5, opacity: 0.7 }}
                >
                  {lv}
                </text>
              ))}

              <path d={basePath} fill="rgb(var(--accent-2) / 0.06)" stroke="rgb(var(--muted) / 0.7)" strokeWidth="1.1" strokeDasharray="4 3" />
              <path d={nowPath} fill="rgb(var(--accent) / 0.2)" stroke="rgb(var(--accent) / 0.25)" strokeWidth="7" strokeLinejoin="round" />
              <path d={nowPath} fill="none" stroke="rgb(var(--accent))" strokeWidth="1.8" strokeLinejoin="round" />

              {SKILL_AXES.map((a, i) => {
                const p = point(i, a.value * unfold(progress, i))
                const on = i === active
                return (
                  <g key={a.id} transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`}>
                    {on && <circle r="10" fill="rgb(var(--accent) / 0.18)" stroke="rgb(var(--accent) / 0.7)" strokeWidth="1" />}
                    <circle r={on ? 5 : 3.6} fill="rgb(var(--accent-3))" stroke="rgb(var(--deep))" strokeWidth="1.5" />
                  </g>
                )
              })}

              {SKILL_AXES.map((a, i) => {
                const p = point(i, 112)
                const lx = Math.cos(angle(i))
                const anchor = lx > 0.3 ? 'start' : lx < -0.3 ? 'end' : 'middle'
                const dy = Math.sin(angle(i)) > 0.3 ? 14 : Math.sin(angle(i)) < -0.3 ? -12 : 2
                const x = p.x + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0)
                const on = i === active
                return (
                  <g key={a.id} className="transition-opacity duration-300" opacity={on ? 1 : 0.75}>
                    <text
                      x={x}
                      y={p.y + dy}
                      textAnchor={anchor}
                      className={cn('font-mono uppercase', on ? 'fill-accent' : 'fill-muted')}
                      style={{ fontSize: 10, letterSpacing: '0.06em' }}
                    >
                      {a.short}
                    </text>
                    <text
                      x={x}
                      y={p.y + dy + 13}
                      textAnchor={anchor}
                      className={cn('font-display font-bold', on ? 'fill-ink' : 'fill-muted')}
                      style={{ fontSize: 11.5 }}
                    >
                      {a.value}
                    </text>
                  </g>
                )
              })}
            </svg>

            <div role="group" aria-label="Skill axes. Arrow keys move between axes." className="absolute inset-0 z-10">
              {SKILL_AXES.map((a, i) => {
                const p = point(i, a.value)
                const props = roving.itemProps(i)
                return (
                  <button
                    key={a.id}
                    type="button"
                    {...props}
                    aria-label={`${a.label}: ${a.value} out of 100. ${a.note}`}
                    onFocus={() => {
                      roving.setIndex(i)
                      setUser(i)
                    }}
                    onBlur={() => setUser(null)}
                    onMouseEnter={() => setUser(i)}
                    onMouseLeave={() => setUser(null)}
                    className="absolute h-10 w-10 rounded-full transition-colors duration-300 hover:bg-accent/10"
                    style={{
                      left: `calc(${((p.x + VIEW) / (VIEW * 2)) * 100}% - 20px)`,
                      top: `calc(${((p.y + VIEW) / (VIEW * 2)) * 100}% - 20px)`,
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div className="mt-1 flex items-center justify-center gap-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-5 rounded-full bg-accent shadow-glow-sm" />
              {RADAR_SERIES.now}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-5 border-t border-dashed border-muted" />
              {RADAR_SERIES.baseline}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div
            className="relative min-h-[9.5rem] overflow-hidden rounded-xl border border-accent/25 bg-accent/[0.05] p-3.5"
            aria-live={user === null ? 'off' : 'polite'}
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
            <motion.div
              key={axis.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                axis {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
              </p>
              <p className="mt-1 font-display text-[15px] font-bold tracking-wide text-ink">{axis.label}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-[30px] font-black leading-none text-accent [text-shadow:0_0_18px_rgb(var(--accent)/0.6)]">
                  {axis.value}
                </span>
                <span className="font-mono text-[10px] text-muted">/100</span>
                <span className="ml-auto rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[9.5px] text-accent">
                  +{axis.value - axis.baseline}
                </span>
              </p>
              <p className="mt-2 text-[13px] leading-snug text-muted">{axis.note}</p>
            </motion.div>
          </div>

          <ul className="flex flex-col gap-1" aria-label={`Skill levels, average ${MEAN} of 100`}>
            {SKILL_AXES.map((a, i) => (
              <li
                key={a.id}
                onMouseEnter={() => setUser(i)}
                onMouseLeave={() => setUser(null)}
                className={cn(
                  'flex cursor-default items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors duration-300',
                  i === active ? 'bg-accent/[0.12]' : 'hover:bg-accent/[0.07]',
                )}
              >
                <span className={cn('w-[7.75rem] shrink-0 truncate text-[13px] font-semibold', i === active ? 'text-ink' : 'text-muted')}>
                  {a.label}
                </span>
                <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-accent/10">
                  <span
                    className="absolute inset-y-0 left-0 origin-left rounded-full bg-gradient-to-r from-accent to-accent2"
                    style={{ width: `${a.value}%`, transform: `scaleX(${unfold(progress, i).toFixed(3)})` }}
                  />
                </span>
                <span className={cn('w-6 shrink-0 text-right font-mono text-[10.5px]', i === active ? 'text-accent' : 'text-muted')}>
                  {a.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HoloPanel>
  )
}
