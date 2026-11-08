import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Download,
  TerminalSquare,
  ShieldCheck,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { HoloButton } from '@/components/ui/HoloButton'
import { Chip } from '@/components/ui/Chip'
import { Terminal } from '@/components/ui/Terminal'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useCountUp } from '@/hooks/useCountUp'
import { useTheme } from '@/theme/ThemeProvider'
import { PROFILE, STATS, BOOT_LINES } from '@/data/profile'

export function Home() {
  const { setSection } = useTheme()
  const { text } = useTypewriter(PROFILE.roles)

  return (
    <Section id="home">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* ── left: the pitch ───────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-start gap-6">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Available for work
            </span>
            <Chip icon={MapPin} size="xs">
              {PROFILE.location}
            </Chip>
          </motion.div>

          <div className="space-y-2">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-mono text-[12px] uppercase tracking-[0.34em] text-muted"
            >
              {'>'} whoami
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 26, filter: 'blur(14px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.95, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(2.6rem,7vw,5.2rem)] font-black uppercase leading-[0.92] tracking-tight"
            >
              <span className="text-gradient">{PROFILE.name}</span>
            </motion.h1>

            {/* typing role line */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[2.4rem] items-center gap-2 font-display text-[clamp(1.05rem,2.6vw,1.75rem)] font-bold uppercase tracking-[0.08em] text-ink"
            >
              <span className="text-accent">/</span>
              <span>{text}</span>
              <span className="inline-block h-[1.1em] w-[3px] animate-blink bg-accent" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-balance text-[15.5px] leading-relaxed text-muted"
          >
            {PROFILE.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3"
          >
            <HoloButton size="lg" iconRight={ArrowUpRight} onClick={() => setSection('projects')}>
              Explore Portfolio
            </HoloButton>
            <HoloButton
              size="lg"
              variant="outline"
              icon={Download}
              onClick={() => setSection('contact')}
            >
              Hire Me
            </HoloButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-1.5"
          >
            {['x86-64', 'ARM64', 'PE / ELF', 'TLS', 'Fuzzing', 'Emulation'].map((t) => (
              <Chip key={t} size="xs">
                {t}
              </Chip>
            ))}
          </motion.div>
        </div>

        {/* ── right: live terminal ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 48, rotateY: -16 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <HoloPanel
            title="nox@workstation"
            icon={TerminalSquare}
            badge="session"
            from="center"
            tilt={7}
            float
          >
            <Terminal lines={BOOT_LINES} height="h-[15rem]" />
            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-accent" />
                sandboxed vm
              </span>
              <span>pid 4821 · 0 crashes</span>
            </div>
          </HoloPanel>
        </motion.div>
      </div>

      {/* ── stats ───────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-16 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <StatTile key={s.label} {...s} delay={i * 0.08} />
        ))}
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-14 flex flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted/70">
          scroll
        </span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-accent"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.div>
    </Section>
  )
}

function StatTile({
  label,
  value,
  suffix,
  delay,
}: {
  label: string
  value: number
  suffix: string
  delay: number
}) {
  const { ref, value: n } = useCountUp(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -14 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="glass group relative overflow-hidden rounded-xl px-4 py-5 text-center"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-500 group-hover:bg-accent/[0.06]" />
      <div className="relative font-display text-[clamp(1.7rem,4vw,2.4rem)] font-black leading-none text-ink">
        <span ref={ref}>{n.toLocaleString()}</span>
        <span className="neon">{suffix}</span>
      </div>
      <div className="relative mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
    </motion.div>
  )
}
