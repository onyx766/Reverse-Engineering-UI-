import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Check,
  FilePen,
  FlaskConical,
  Handshake as HandshakeIcon,
  KeyRound,
  Megaphone,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { Terminal } from '@/components/ui/Terminal'
import { ProtocolFlow } from '@/components/widgets/ProtocolFlow'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { HANDSHAKE_FLOW, HANDSHAKE_LINES, HANDSHAKE_SPECS, RULES, type Rule } from '@/data/contact'
import { EASE } from './fields'

// padded: the shared Terminal currently drops the final character of every line

/** "$ nox --open-channel": a Noise XX handshake typed out, beside the same exchange as a ladder. */
export function HandshakePanel() {
  const [run, setRun] = useState(0)

  return (
    <HoloPanel
      title="Handshake"
      icon={KeyRound}
      badge="Noise XX"
      from="left"
      delay={0.05}
      tilt={5}
      float
      className="h-full"
      bodyClassName="flex flex-col lg:min-h-[calc(100%-58px)]"
    >
      <div className="grid flex-1 gap-4 md:grid-cols-2">
        <Terminal
          key={run}
          lines={HANDSHAKE_LINES}
          speed={12}
          height="h-[19rem] md:h-full md:min-h-[19rem]"
        />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-lg border border-accent/20 bg-deep/40 p-3">
            <p className="mb-2.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
              <span>initiator ⇄ responder</span>
              <span className="text-accent">XX</span>
            </p>
            <ProtocolFlow exchanges={HANDSHAKE_FLOW} />
          </div>
          <dl className="grid grid-cols-2 gap-2">
            {HANDSHAKE_SPECS.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-accent/15 bg-accent/[0.04] px-2.5 py-2 transition-colors duration-300 hover:border-accent/45 hover:bg-accent/[0.08]"
              >
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{s.label}</dt>
                <dd className="mt-0.5 truncate font-mono text-[11.5px] text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="group mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted transition-all duration-300 hover:border-accent hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm"
          >
            <RotateCcw
              aria-hidden
              className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180"
            />
            Re-run handshake
          </button>
        </div>
      </div>
    </HoloPanel>
  )
}

const RULE_ICONS: Record<Rule['id'], LucideIcon> = {
  auth: FilePen,
  nda: HandshakeIcon,
  lab: FlaskConical,
  disclosure: Megaphone,
  ip: PackageCheck,
}

/** The legal ground rules, ticked off like the reference's analysis checklist. */
export function RulesPanel() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  const { ref: countRef, value } = useCountUp(100, 1400)

  return (
    <HoloPanel
      title="Rules of Engagement"
      icon={ShieldCheck}
      badge="Signed"
      from="right"
      delay={0.12}
      tilt={6}
      className="h-full"
    >
      <div ref={ref}>
        <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
          <span>Compliance checks</span>
          <span className="tabular-nums text-accent">
            <span ref={countRef}>{value}</span>%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent/10">
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-accent via-accent2 to-accent3 shadow-glow-sm"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : undefined}
            transition={{ duration: reduced ? 0 : 1.4, ease: EASE }}
          />
        </div>
        <ul className="mt-4 flex flex-col gap-1">
          {RULES.map((r, i) => {
            const Icon = RULE_ICONS[r.id]
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: 18 }}
                animate={inView ? { opacity: 1, x: 0 } : undefined}
                transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.2 + i * 0.1, ease: EASE }}
                className="group/rule flex items-start gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-colors duration-300 hover:border-accent/25 hover:bg-accent/[0.05]"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-all duration-300 group-hover/rule:scale-110 group-hover/rule:border-accent group-hover/rule:shadow-glow-sm">
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold leading-snug text-ink">{r.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{r.body}</span>
                </span>
                <motion.span
                  aria-hidden
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : undefined}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 420, damping: 20, delay: 0.55 + i * 0.1 }
                  }
                  className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-accent/50 bg-accent/15 text-accent"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </HoloPanel>
  )
}
