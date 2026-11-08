import { Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Binary,
  Bug,
  FileCode2,
  Network,
  ArrowUpRight,
  Download,
} from 'lucide-react'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout/Navbar'
import { Section } from '@/components/layout/Section'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { HoloButton } from '@/components/ui/HoloButton'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Chip } from '@/components/ui/Chip'
import { useTheme } from '@/theme/ThemeProvider'
import { THEMES } from '@/theme/themes'

const HoloCore = lazy(() =>
  import('@/components/three/HoloCore').then((m) => ({ default: m.HoloCore })),
)

const COPY: Record<string, { eyebrow: string; title: string; sub: string }> = {
  home: {
    eyebrow: 'Reverse Engineer & Systems Developer',
    title: 'I Take Software Apart',
    sub: 'Eight years of binary analysis, protocol reversing and file-format reconstruction — documented so other engineers can follow every step.',
  },
  expertise: {
    eyebrow: 'Core Expertise',
    title: 'What I Actually Do',
    sub: 'Static and dynamic analysis, protocol archaeology, format reconstruction, and the tooling that makes all of it repeatable.',
  },
  projects: {
    eyebrow: 'Selected Work',
    title: 'Explore My Portfolio',
    sub: 'Real reverse engineering projects, deep technical analysis, and detailed write-ups.',
  },
  tools: {
    eyebrow: 'Daily Driver',
    title: 'Tools & Environment',
    sub: 'The disassemblers, debuggers, tracers and runtimes I live inside every day.',
  },
  writeups: {
    eyebrow: 'Long Form',
    title: 'Technical Write-ups',
    sub: 'Case studies from real teardowns — methodology, dead ends and all.',
  },
  about: {
    eyebrow: 'Background',
    title: 'About Me',
    sub: 'Eight years, a few thousand hours in a disassembler, one enduring obsession.',
  },
  contact: {
    eyebrow: 'Open For Work',
    title: 'Get In Touch',
    sub: 'Available for reverse engineering, tooling and low-level systems work.',
  },
}

export default function App() {
  const { section, epoch } = useTheme()
  const copy = COPY[section]

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />

      <Suspense fallback={<CorePlaceholder />}>
        <HoloCore className="pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-[min(76vh,720px)] w-[min(76vw,720px)] -translate-x-1/2 -translate-y-1/2" />
      </Suspense>

      <main className="relative">
        <Section>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${section}-${epoch}`}
              initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <SectionHeading
                eyebrow={copy.eyebrow}
                title={copy.title}
                subtitle={copy.sub}
                className="mx-auto"
              />
            </motion.div>
          </AnimatePresence>

          {/* ── panel system demo — the layout the real sections will use ── */}
          <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-7">
            <div className="flex flex-col gap-6 lg:gap-7">
              <HoloPanel
                title="Binary Analysis"
                icon={Binary}
                badge="x86-64"
                from="left"
                delay={0.05}
                float
              >
                <pre className="overflow-x-auto font-mono text-[11.5px] leading-relaxed text-muted no-scrollbar">
                  <code>
                    {`00401000  push    rbp
00401001  mov     rbp, rsp
00401004  sub     rsp, 0x30
`}
                    <span className="block rounded bg-accent/20 px-1 text-ink">
                      {`0040100B  call    0x4012F0`}
                    </span>
                    {`0040100D  test    eax, eax
0040100F  jnz     0x401030`}
                  </code>
                </pre>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip size="xs">IDA Pro</Chip>
                  <Chip size="xs">Ghidra</Chip>
                  <Chip size="xs">Control Flow</Chip>
                </div>
              </HoloPanel>

              <HoloPanel title="File Format" icon={FileCode2} badge="Hex" from="left" delay={0.14}>
                <pre className="overflow-x-auto font-mono text-[11.5px] leading-relaxed text-muted no-scrollbar">
                  <code>{`0000  52 46 46 54 10 00 00 00   RFFT....
0008  01 00 00 00 20 00 00 00   .... ...
0010  64 61 74 61 00 00 00 00   data....`}</code>
                </pre>
              </HoloPanel>
            </div>

            {/* centre column leaves the hologram visible */}
            <div className="hidden min-h-[380px] lg:block" />

            <div className="flex flex-col gap-6 lg:gap-7">
              <HoloPanel
                title="API & Protocol"
                icon={Network}
                badge="HTTPS"
                from="right"
                delay={0.05}
                float
              >
                <ul className="space-y-2 font-mono text-[11.5px] text-muted">
                  <li className="flex justify-between gap-3">
                    <span className="text-accent">POST /api/login</span>
                    <span>→</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>401 Unauthorized</span>
                    <span>←</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-accent">200 OK (JSON)</span>
                    <span>←</span>
                  </li>
                </ul>
              </HoloPanel>

              <HoloPanel title="Debugger" icon={Bug} badge="Live" from="right" delay={0.14}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11.5px] text-muted">
                  {[
                    ['RAX', '0x00000001'],
                    ['RBX', '0x00000000'],
                    ['RCX', '0x004012F0'],
                    ['RDX', '0x00000020'],
                  ].map(([r, v]) => (
                    <div key={r} className="flex justify-between gap-2">
                      <span className="text-accent">{r}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </HoloPanel>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <HoloButton icon={ArrowUpRight} size="lg">
              View {THEMES[section].label}
            </HoloButton>
            <HoloButton variant="outline" icon={Download} size="lg">
              Download CV
            </HoloButton>
          </div>

          <p className="mt-16 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-muted/50">
            real sections — steps 6 to 10
          </p>
        </Section>
      </main>
    </div>
  )
}

function CorePlaceholder() {
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 -z-[5] h-64 w-64 -translate-x-1/2 -translate-y-1/2">
      <div className="absolute inset-0 animate-pulse rounded-3xl border border-accent/30 bg-accent/5 blur-xl" />
      <div className="absolute inset-8 rounded-2xl border border-accent/40" />
    </div>
  )
}
