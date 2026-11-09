import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { LazyMount } from '@/components/ui/LazyMount'
import { AboutHero } from '@/components/about/AboutHero'
import { CareerTimeline } from '@/components/about/CareerTimeline'
import { WorkProcess } from '@/components/about/WorkProcess'
import { Principles } from '@/components/about/Principles'
import { FunStats } from '@/components/about/FunStats'
import { EASE, entrance } from '@/components/about/fx'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ABOUT_COPY, CAREER, CAREER_NOW, FUN_STATS, PRINCIPLES, PROCESS } from '@/data/about'
import { WRITEUPS } from '@/data/writeups'

/** the first career chapter: "since 2018", "2018 → 2026" */
const SINCE = CAREER[0]?.start ?? CAREER_NOW

/** fills "{writeups}" in the stat notes, so the public count always matches the Write-ups section */
const STAT_VARS = { writeups: WRITEUPS.length }

/*
 * Everything below the hero mounts lazily (LazyMount), so a section switch only
 * pays for the first screen. Each block reserves roughly its real height per
 * breakpoint through --reserve, keeping the page length steady until it mounts.
 */
const LAZY = { delay: 700, margin: '0px 0px 420px 0px' }

/**
 * A soft deep-colour halo behind a centred heading. The background hologram is
 * pinned to the middle of the viewport, so every centred heading scrolls right
 * across it; the halo keeps the muted subtitle readable over its bright core.
 * No negative z-index: that would drop it behind the fixed hologram.
 */
function HeadingHalo({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-y-10 inset-x-0 mx-auto max-w-3xl bg-[radial-gradient(closest-side,rgb(var(--deep)/0.66),rgb(var(--deep)/0.32)_62%,transparent)]"
      />
      {children}
    </div>
  )
}

export function About() {
  const reduced = useReducedMotion()
  return (
    <Section id="about">
      <AboutHero />

      <div className="mt-28 sm:mt-36">
        <HeadingHalo>
          <SectionHeading
            eyebrow={ABOUT_COPY.timeline.eyebrow}
            title={ABOUT_COPY.timeline.title}
            subtitle={ABOUT_COPY.timeline.subtitle}
            className="mx-auto"
          />
        </HeadingHalo>
        <LazyMount
          {...LAZY}
          minHeight="var(--reserve)"
          className="mt-14 [--reserve:2150px] sm:mt-16 sm:[--reserve:1550px] md:[--reserve:1470px] lg:[--reserve:1880px] xl:[--reserve:1560px]"
        >
          <CareerTimeline entries={CAREER} />
        </LazyMount>
      </div>

      <div className="mt-28 sm:mt-36">
        <HeadingHalo>
          <SectionHeading
            eyebrow={ABOUT_COPY.process.eyebrow}
            title={ABOUT_COPY.process.title}
            subtitle={ABOUT_COPY.process.subtitle}
            className="mx-auto"
          />
        </HeadingHalo>
        <LazyMount
          {...LAZY}
          delay={LAZY.delay + 300}
          minHeight="var(--reserve)"
          className="mt-12 [--reserve:1850px] sm:mt-14 sm:[--reserve:1440px] md:[--reserve:1190px] lg:[--reserve:1150px] xl:[--reserve:370px]"
        >
          <WorkProcess steps={PROCESS} />
        </LazyMount>
      </div>

      <LazyMount
        {...LAZY}
        delay={LAZY.delay + 600}
        minHeight="var(--reserve)"
        className="mt-20 [--reserve:1700px] sm:mt-28 sm:[--reserve:1110px] md:[--reserve:1070px] lg:[--reserve:700px] xl:[--reserve:650px]"
      >
        <Principles
          items={PRINCIPLES}
          eyebrow={ABOUT_COPY.principles.eyebrow}
          title={ABOUT_COPY.principles.title}
          since={SINCE}
        />

        <section aria-labelledby="about-stats" className="mt-16 sm:mt-20">
          <motion.div
            initial={entrance(reduced, { opacity: 0, y: 18, filter: 'blur(8px)' })}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
                {ABOUT_COPY.stats.eyebrow}
              </p>
              <h2
                id="about-stats"
                className="mt-1 font-display text-[19px] font-black uppercase tracking-wide text-ink sm:text-[22px]"
              >
                {ABOUT_COPY.stats.title}
              </h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {SINCE} → {CAREER_NOW} · {ABOUT_COPY.stats.note}
            </p>
          </motion.div>
          <FunStats stats={FUN_STATS} vars={STAT_VARS} className="mt-5" />
        </section>
      </LazyMount>
    </Section>
  )
}
