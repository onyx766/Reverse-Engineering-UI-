import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

export interface Insn {
  addr: string
  mnemonic: string
  operands: string
  /** renders the operand as a jump target */
  target?: boolean
}

/**
 * A disassembly listing with a live instruction pointer that steps down the
 * function — the same "0040100B call 0x4012F0" highlight as the reference.
 */
export function Disassembly({ code, interval = 900 }: { code: Insn[]; interval?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40px' })
  const reduced = useReducedMotion()
  const [pc, setPc] = useState(3)

  useEffect(() => {
    if (!inView || reduced) return
    const t = setInterval(() => setPc((p) => (p + 1) % code.length), interval)
    return () => clearInterval(t)
  }, [inView, reduced, code.length, interval])

  return (
    <div ref={ref} className="relative font-mono text-[11.5px] leading-[1.75]">
      {code.map((ins, i) => {
        const active = i === pc
        return (
          <div
            key={ins.addr}
            className={cn(
              'relative flex items-center gap-3 rounded px-2 py-px transition-all duration-300',
              active ? 'bg-accent/20 text-ink' : 'text-muted',
            )}
          >
            {/* instruction pointer */}
            <span
              className={cn(
                'absolute -left-1 text-accent transition-opacity duration-300',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              ▸
            </span>
            <span className={cn('w-[4.6rem] shrink-0', active ? 'text-accent' : 'text-muted/70')}>
              {ins.addr}
            </span>
            <span className={cn('w-12 shrink-0 font-semibold', active && 'neon')}>
              {ins.mnemonic}
            </span>
            <span className={cn(ins.target ? 'text-accent2' : '')}>{ins.operands}</span>
            {active && (
              <span className="ml-auto hidden shrink-0 text-[9.5px] uppercase tracking-[0.14em] text-accent/70 sm:block">
                exec
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
