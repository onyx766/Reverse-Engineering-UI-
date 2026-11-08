import { motion } from 'framer-motion'
import { Binary, FileCode2, Network, Bug, GitBranch } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { Chip } from '@/components/ui/Chip'
import { Disassembly } from '@/components/widgets/Disassembly'
import { CfgGraph } from '@/components/widgets/CfgGraph'
import { HexDump } from '@/components/widgets/HexDump'
import { ProtocolFlow } from '@/components/widgets/ProtocolFlow'
import { DebuggerView } from '@/components/widgets/DebuggerView'
import {
  DISASM,
  HEX,
  EXCHANGES,
  REGS,
  TRACE,
  CAPABILITIES,
} from '@/data/expertise'

export function Expertise() {
  return (
    <Section id="expertise">
      <SectionHeading
        eyebrow="Core Expertise"
        title="What I Actually Do"
        subtitle="Static and dynamic analysis, protocol archaeology, format reconstruction — and the tooling that turns a one-off teardown into a repeatable pipeline."
        className="mx-auto"
      />

      {/* ── the four analysis surfaces ─────────────────────────────── */}
      <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-7">
        <HoloPanel
          title="Binary Analysis"
          icon={Binary}
          badge="x86-64"
          from="left"
          delay={0.04}
          float
        >
          <div className="grid gap-4 sm:grid-cols-[1.25fr_1fr]">
            <Disassembly code={DISASM} />
            <div className="min-h-[190px] border-accent/15 sm:border-l sm:pl-4">
              <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
                <GitBranch className="h-3 w-3 text-accent" />
                control flow
              </div>
              <CfgGraph />
            </div>
          </div>
        </HoloPanel>

        <HoloPanel
          title="API & Protocol Analysis"
          icon={Network}
          badge="TLS 1.3"
          from="right"
          delay={0.04}
          float
        >
          <ProtocolFlow exchanges={EXCHANGES} />
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-accent/15 pt-3">
            <Chip size="xs">HMAC signing</Chip>
            <Chip size="xs">Cert pinning</Chip>
            <Chip size="xs">Replay harness</Chip>
          </div>
        </HoloPanel>

        <HoloPanel
          title="File Format Analysis"
          icon={FileCode2}
          badge="Hex"
          from="left"
          delay={0.12}
        >
          <HexDump rows={HEX} />
        </HoloPanel>

        <HoloPanel title="Debugger Analysis" icon={Bug} badge="Live" from="right" delay={0.12}>
          <DebuggerView regs={REGS} trace={TRACE} />
        </HoloPanel>
      </div>

      {/* ── capability cards ───────────────────────────────────────── */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: 34, rotateX: -12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8 }}
            className="glass group relative overflow-hidden rounded-xl p-4"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
            <span className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/10 blur-2xl transition-all duration-500 group-hover:bg-accent/25" />
            <span className="font-mono text-[10px] text-accent">
              0{i + 1}
            </span>
            <h3 className="mt-1.5 font-display text-[15px] font-bold tracking-wide text-ink">
              {c.title}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.body}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <Chip key={t} size="xs">
                  {t}
                </Chip>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  )
}
