import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, MapPin, Send, ShieldCheck, TerminalSquare } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { HoloButton } from '@/components/ui/HoloButton'
import { Chip } from '@/components/ui/Chip'
import { Terminal } from '@/components/ui/Terminal'
import { LazyMount } from '@/components/ui/LazyMount'
import { HeroStats } from '@/components/home/HeroStats'
import { ScrollCue } from '@/components/home/ScrollCue'
import { RoleLine } from '@/components/home/RoleLine'
import { useStory, type StoryModule } from '@/components/home/useStory'
import {
  BLOCK_MIN_HEIGHT,
  EASE,
  HOME_BLOCK_IDS,
  useBreakpoint,
  type HomeBlock,
} from '@/components/home/shared'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTheme } from '@/theme/ThemeProvider'
import { PROFILE } from '@/data/profile'
import { AVAILABILITY } from '@/data/contact'
import { HERO, HERO_SESSION } from '@/data/home'
import { cn } from '@/lib/utils'

/** Story blocks below the hero, in page order. Each mounts lazily (see LazyMount). */
const BLOCKS: { key: HomeBlock; render: (m: StoryModule) => ReactNode }[] = [
  { key: 'capabilities', render: (m) => <m.CapabilityStrip /> },
  { key: 'work', render: (m) => <m.SelectedWork /> },
  { key: 'writeups', render: (m) => <m.LatestWriteups /> },
  { key: 'toolchain', render: (m) => <m.Toolchain /> },
  { key: 'engage', render: (m) => <m.EngageBand /> },
]

export function Home() {
  const story = useStory()
  const bp = useBreakpoint()

  return (
    <Section id="home">
      <Hero />
      <HeroStats />
      <ScrollCue target={HOME_BLOCK_IDS.capabilities} />

      {/* the story: what I do → proof → writing → tools → engage */}
      <div className="mt-16 flex flex-col gap-24 sm:mt-20 sm:gap-28 lg:gap-32">
        {BLOCKS.map((b, i) => {
          const minHeight = BLOCK_MIN_HEIGHT[b.key][bp]
          return (
            <LazyMount
              key={b.key}
              id={HOME_BLOCK_IDS[b.key]}
              minHeight={minHeight}
              delay={500 + i * 350}
              margin="0px 0px 240px 0px"
            >
              {story ? b.render(story) : <div aria-hidden style={{ minHeight }} />}
            </LazyMount>
          )
        })}
      </div>
    </Section>
  )
}

function Hero() {
  const { setSection } = useTheme()
  const still = useReducedMotion()
  const open = PROFILE.available
  // park the hero's CSS loops (panel float, LED ping, cursors) once it is scrolled away
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)

  return (
    <div
      ref={ref}
      data-fx-paused={!inView}
      className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
    >
      {/* ── left: the pitch ───────────────────────────────────────── */}
      <div className="relative z-10 flex min-w-0 flex-col items-start gap-6">
        <motion.div
          initial={still ? false : { opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
            <span aria-hidden className="relative flex h-1.5 w-1.5">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping',
                  open ? 'bg-emerald-400' : 'bg-amber-400',
                )}
              />
              <span
                className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', open ? 'bg-emerald-400' : 'bg-amber-400')}
              />
            </span>
            {open ? AVAILABILITY.status : AVAILABILITY.bookedStatus}
          </span>
          <Chip icon={MapPin} size="xs">
            {PROFILE.location}
          </Chip>
        </motion.div>

        <div className="w-full min-w-0 space-y-2">
          <motion.p
            aria-hidden
            initial={still ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            className="font-mono text-[12px] uppercase tracking-[0.34em] text-muted"
          >
            {'>'} {HERO.prompt}
          </motion.p>

          <motion.h1
            initial={still ? false : { opacity: 0, y: 26, filter: 'blur(14px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.95, delay: 0.14, ease: EASE }}
            className="font-display text-[clamp(2.6rem,7vw,5.2rem)] font-black uppercase leading-[0.92] tracking-tight"
          >
            <span className="text-gradient">{PROFILE.name}</span>
            <span className="sr-only">, {PROFILE.role}</span>
          </motion.h1>

          <RoleLine />
        </div>

        <motion.p
          initial={still ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.34, ease: EASE }}
          className="max-w-xl text-balance text-[15.5px] leading-relaxed text-muted"
        >
          {PROFILE.tagline}
        </motion.p>

        <motion.div
          initial={still ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.42, ease: EASE }}
          className="flex w-full flex-col gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center"
        >
          <HoloButton size="lg" iconRight={ArrowUpRight} onClick={() => setSection('projects')} className="w-full min-[420px]:w-auto">
            {HERO.ctaPrimary}
          </HoloButton>
          <HoloButton
            size="lg"
            variant="outline"
            icon={Send}
            onClick={() => setSection('contact')}
            className="w-full min-[420px]:w-auto"
          >
            {HERO.ctaSecondary}
          </HoloButton>
        </motion.div>

        <motion.ul
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          aria-label="Specialisms"
          className="flex flex-wrap gap-1.5"
        >
          {HERO.chips.map((t) => (
            <li key={t}>
              <Chip size="xs">{t}</Chip>
            </li>
          ))}
        </motion.ul>
      </div>

      {/* ── right: live triage terminal ──────────────────────────── */}
      <motion.div
        initial={still ? false : { opacity: 0, x: 48, rotateY: -16 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 1, delay: 0.25, ease: EASE }}
        className="relative z-10 min-w-0"
      >
        <HoloPanel
          title={HERO.terminal.title}
          icon={TerminalSquare}
          badge={HERO.terminal.badge}
          from="center"
          tilt={7}
          float
        >
          {/* the animated log is decorative; screen readers get the static transcript */}
          <div aria-hidden>
            <Terminal lines={HERO_SESSION} height="h-[15rem]" />
          </div>
          <div className="sr-only">
            <p>{HERO.terminal.srLabel}:</p>
            <ul>
              {HERO_SESSION.map((l) => (
                <li key={l.text}>{l.text}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck aria-hidden className="h-3 w-3 text-accent" />
              {HERO.terminal.footLeft}
            </span>
            <span>{HERO.terminal.footRight}</span>
          </div>
        </HoloPanel>
      </motion.div>
    </div>
  )
}
