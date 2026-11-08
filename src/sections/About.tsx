import { motion } from 'framer-motion'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { AboutHero } from '@/components/about/AboutHero'
import { CareerTimeline } from '@/components/about/CareerTimeline'
import { WorkProcess } from '@/components/about/WorkProcess'
import { Principles } from '@/components/about/Principles'
import { FunStats } from '@/components/about/FunStats'
import { EASE } from '@/components/about/fx'
import { ABOUT_COPY, CAREER, FUN_STATS, PRINCIPLES, PROCESS } from '@/data/about'

export function About() {
  return (
    <Section id="about">
      <AboutHero />

      <div className="mt-28 sm:mt-36">
        <SectionHeading
          eyebrow={ABOUT_COPY.timeline.eyebrow}
          title={ABOUT_COPY.timeline.title}
          subtitle={ABOUT_COPY.timeline.subtitle}
          className="mx-auto"
        />
        <CareerTimeline entries={CAREER} className="mt-14 sm:mt-16" />
      </div>

      <div className="mt-28 sm:mt-36">
        <SectionHeading
          eyebrow={ABOUT_COPY.process.eyebrow}
          title={ABOUT_COPY.process.title}
          subtitle={ABOUT_COPY.process.subtitle}
          className="mx-auto"
        />
        <WorkProcess steps={PROCESS} className="mt-12 sm:mt-14" />
      </div>

      <Principles
        items={PRINCIPLES}
        eyebrow={ABOUT_COPY.principles.eyebrow}
        title={ABOUT_COPY.principles.title}
        className="mt-20 sm:mt-28"
      />

      <section aria-labelledby="about-stats" className="mt-16 sm:mt-20">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
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
            2018 → 2026 · self-reported
          </p>
        </motion.div>
        <FunStats stats={FUN_STATS} className="mt-5" />
      </section>
    </Section>
  )
}
