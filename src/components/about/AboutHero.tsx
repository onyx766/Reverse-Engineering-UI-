import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, FileText, Fingerprint, Mail, MapPin } from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { HoloButton } from '@/components/ui/HoloButton'
import { Chip } from '@/components/ui/Chip'
import { useTheme } from '@/theme/ThemeProvider'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PROFILE } from '@/data/profile'
import {
  ABOUT_COPY,
  BADGE_LOG,
  BIO,
  BIO_FILE,
  ID_CARD,
  QUICK_FACTS,
  type QuickFact,
} from '@/data/about'
import { cn } from '@/lib/utils'
import { IdCard } from './IdCard'
import { VerifyConsole } from './VerifyConsole'
import { EASE, GLOW_HOVER, SWEEP, entrance } from './fx'

const BIO_BYTES = new TextEncoder().encode(BIO.map((p) => p.replace(/\*\*/g, '')).join('\n\n')).length

export function AboutHero() {
  const { setSection } = useTheme()
  const reduced = useReducedMotion()
  const copy = ABOUT_COPY.hero

  return (
    <div className="grid items-start gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:gap-x-16">
      {/* ── heading ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-start lg:col-start-2 lg:row-start-1">
        <motion.div
          initial={entrance(reduced, { opacity: 0, x: -24 })}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {copy.eyebrow}
          </span>
          <Chip icon={MapPin} size="xs">
            {PROFILE.location}
          </Chip>
        </motion.div>

        <motion.p
          initial={entrance(reduced, { opacity: 0, y: 14 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
          className="mt-6 font-mono text-[12px] uppercase tracking-[0.3em] text-muted"
        >
          <span className="text-accent">{'>'}</span> {copy.command}
        </motion.p>

        <motion.h1
          initial={entrance(reduced, { opacity: 0, y: 26, filter: 'blur(14px)' })}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.95, delay: 0.14, ease: EASE }}
          className="mt-2 font-display text-[clamp(2.5rem,6.2vw,4.6rem)] font-black uppercase leading-[0.92] tracking-tight"
        >
          <span className="text-gradient">{copy.title}</span>
        </motion.h1>

        <motion.p
          initial={entrance(reduced, { opacity: 0, y: 18 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.26, ease: EASE }}
          className="mt-4 max-w-xl text-balance text-[18px] font-medium leading-snug text-ink/85"
        >
          {copy.lead}
        </motion.p>
      </div>

      {/* ── ID card ─────────────────────────────────────────────────── */}
      <div className="relative lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start lg:pt-4">
        <IdCard data={ID_CARD} />
        <div className="mx-auto mt-8 hidden w-full max-w-[440px] lg:block">
          <HoloPanel title="badge.verify" icon={Fingerprint} badge="gpg 2.4" from="left" tilt={5} delay={0.35}>
            <VerifyConsole lines={BADGE_LOG} />
          </HoloPanel>
        </div>
      </div>

      {/* ── bio, facts, CTAs ────────────────────────────────────────── */}
      <div className="relative z-10 min-w-0 lg:col-start-2 lg:row-start-2">
        <HoloPanel
          title={BIO_FILE}
          icon={FileText}
          badge={`${BIO.length} ¶ · ${BIO_BYTES.toLocaleString()} B`}
          from="right"
          tilt={3}
          delay={0.2}
        >
          <div className="space-y-4">
            {BIO.map((p, i) => (
              <div key={i} className="grid grid-cols-[1.6rem_minmax(0,1fr)] gap-x-3">
                <span aria-hidden className="select-none pt-[3px] font-mono text-[10.5px] text-accent/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[16px] leading-relaxed text-muted">
                  <Rich text={p} delay={0.5 + i * 0.25} reduced={reduced} />
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-accent/15 pt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted/80">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-1.5 animate-blink bg-accent" aria-hidden />
              read-only
            </span>
            <span>utf-8 · lf · markdown</span>
          </div>
        </HoloPanel>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {QUICK_FACTS.map((f, i) => (
            <FactTile key={f.label} fact={f} index={i} reduced={reduced} />
          ))}
        </ul>

        <motion.div
          initial={entrance(reduced, { opacity: 0, y: 18 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="mt-7 flex flex-wrap items-center gap-3"
        >
          <HoloButton size="lg" iconRight={ArrowUpRight} onClick={() => setSection('projects')}>
            View projects
          </HoloButton>
          <HoloButton size="lg" variant="outline" icon={Mail} onClick={() => setSection('contact')}>
            Get in touch
          </HoloButton>
        </motion.div>
      </div>
    </div>
  )
}

/** Renders **phrase** as a highlighted span with a marker stroke that draws in (or is simply there, with reduced motion). */
function Rich({ text, delay, reduced }: { text: string; delay: number; reduced: boolean }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <motion.strong
            key={i}
            className="bg-no-repeat font-semibold text-ink"
            style={{
              backgroundImage: 'linear-gradient(transparent 60%, rgb(var(--accent) / 0.3) 60%)',
              backgroundPosition: '0 100%',
              backgroundSize: reduced ? '100% 100%' : undefined,
            }}
            initial={reduced ? undefined : { backgroundSize: '0% 100%' }}
            whileInView={reduced ? undefined : { backgroundSize: '100% 100%' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
          >
            {part.slice(2, -2)}
          </motion.strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function FactTile({ fact, index, reduced }: { fact: QuickFact; index: number; reduced: boolean }) {
  const Icon = fact.icon
  return (
    <motion.li
      initial={entrance(reduced, { opacity: 0, y: 22, filter: 'blur(8px)' })}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: 0.15 + index * 0.08, ease: EASE }}
      whileHover={reduced ? undefined : { y: -5 }}
      className={cn('glass group relative overflow-hidden rounded-xl p-3.5', GLOW_HOVER)}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span aria-hidden className={SWEEP} />
      <div className="relative flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/35 bg-accent/10 text-accent transition-all duration-500 group-hover:rotate-[8deg] group-hover:scale-110 group-hover:border-accent group-hover:shadow-glow-sm"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
            {fact.label}
            {fact.live && (
              <span className="inline-flex items-center gap-1 rounded border border-accent/40 bg-accent/10 px-1 py-px text-[8px] tracking-[0.16em] text-accent">
                <span className="h-1 w-1 animate-pulse rounded-full bg-accent" aria-hidden />
                live
              </span>
            )}
          </p>
          <p className="mt-1 text-[14.5px] font-semibold leading-snug text-ink">
            <Phrases text={fact.value} />
          </p>
        </div>
      </div>
    </motion.li>
  )
}

/**
 * "A · B · C" wraps at the dots while each piece fits, so a narrow phone never
 * splits "ARM Cortex-M" or "x86-64" at the hyphen (the UI font has no
 * non-breaking hyphen). Same rule as the stat notes.
 */
function Phrases({ text }: { text: string }) {
  const parts = text.split(' · ')
  if (parts.length < 2) return <>{text}</>
  return (
    <>
      {parts.map((phrase, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          <span className="inline-block">{phrase}</span>
        </Fragment>
      ))}
    </>
  )
}
