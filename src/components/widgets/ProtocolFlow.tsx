import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Server } from 'lucide-react'
import { useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

export interface Exchange {
  label: string
  dir: 'up' | 'down'
  tone?: 'ok' | 'err' | 'info'
}

const TONE: Record<string, string> = {
  ok: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  err: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
  info: 'text-accent border-accent/40 bg-accent/10',
}

/**
 * Client ⇄ Server ladder. Each exchange lights up in sequence with a packet
 * sliding along its own lane, mirroring a captured session.
 */
export function ProtocolFlow({ exchanges }: { exchanges: Exchange[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return
    const t = setInterval(() => setStep((s) => (s + 1) % (exchanges.length + 1)), 1150)
    return () => clearInterval(t)
  }, [inView, reduced, exchanges.length])

  return (
    <div ref={ref} className="flex items-stretch gap-3">
      <Endpoint icon={Monitor} label="Client" active={step % 2 === 1} />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        {exchanges.map((x, i) => {
          const active = reduced || i === step - 1
          const done = reduced || i < step - 1
          return (
            <div key={x.label} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-[10.5px] transition-all duration-300',
                  active || done ? TONE[x.tone ?? 'info'] : 'border-white/5 bg-white/[0.02] text-muted/50',
                  active && 'shadow-glow-sm',
                )}
              >
                <span className={cn('shrink-0', x.dir === 'up' ? 'order-1' : 'order-3')}>
                  {x.dir === 'up' ? '→' : '←'}
                </span>
                <span className="order-2 min-w-0 flex-1 truncate">{x.label}</span>
              </motion.div>

              {/* travelling packet */}
              {active && !reduced && (
                <motion.span
                  key={`${x.label}-${step}`}
                  initial={{ left: x.dir === 'up' ? '0%' : '100%', opacity: 0 }}
                  animate={{ left: x.dir === 'up' ? '100%' : '0%', opacity: [0, 1, 0] }}
                  transition={{ duration: 0.95, ease: 'easeInOut' }}
                  className="pointer-events-none absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent3 shadow-glow-sm"
                  style={{ background: 'rgb(var(--accent-3))' }}
                />
              )}
            </div>
          )
        })}
      </div>

      <Endpoint icon={Server} label="Server" active={step % 2 === 0 && step > 0} />
    </div>
  )
}

function Endpoint({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Monitor
  label: string
  active: boolean
}) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5">
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-xl border transition-all duration-300',
          active
            ? 'border-accent bg-accent/20 text-accent shadow-glow'
            : 'border-accent/25 bg-accent/5 text-muted',
        )}
      >
        <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{label}</span>
    </div>
  )
}
