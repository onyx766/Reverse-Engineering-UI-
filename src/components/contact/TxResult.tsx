import type { ReactNode, Ref } from 'react'
import { motion } from 'framer-motion'
import {
  Copy,
  MailOpen,
  PenLine,
  RotateCcw,
  ServerCrash,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CONTACT, OWNER_TZ } from '@/data/contact'
import type { Brief } from './lib'
import { EASE } from './fields'

const ACTION =
  'group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 font-display text-[11px] font-bold uppercase tracking-[0.16em] transition-[color,background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5'
const PRIMARY = 'border-accent/60 bg-accent/15 text-ink hover:border-accent hover:bg-accent/25 hover:shadow-glow'
const SECONDARY =
  'border-accent/30 bg-transparent text-accent hover:border-accent hover:bg-accent/10 hover:text-ink hover:shadow-glow-sm'

function Inner({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      <Icon
        aria-hidden
        className="relative h-4 w-4 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
      />
      <span className="relative">{children}</span>
    </>
  )
}

function Action({
  icon,
  children,
  onClick,
  href,
  primary,
}: {
  icon: LucideIcon
  children: ReactNode
  onClick?: () => void
  href?: string
  primary?: boolean
}) {
  const cls = cn(ACTION, primary ? PRIMARY : SECONDARY)
  if (href) {
    return (
      <a href={href} className={cls}>
        <Inner icon={icon}>{children}</Inner>
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Inner icon={icon}>{children}</Inner>
    </button>
  )
}

const enter = {
  initial: { opacity: 0, scale: 0.97, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
  transition: { duration: 0.6, ease: EASE },
}

export function TxSuccess({
  brief,
  mode,
  mailto,
  onReset,
  onCopyBrief,
  headingRef,
}: {
  brief: Brief
  mode: 'mailto' | 'endpoint'
  mailto: string
  onReset: () => void
  onCopyBrief: () => void
  headingRef: Ref<HTMLHeadingElement>
}) {
  const reduced = useReducedMotion()
  const first = brief.name.split(/\s+/)[0]
  const rows: [string, string][] = [
    ['ref', brief.ref],
    ['from', `${brief.name} <${brief.email}>`],
    ...(brief.company ? ([['org', brief.company]] as [string, string][]) : []),
    ['scope', brief.engagement.join(', ')],
    ['timeline', brief.timeline],
    [
      'payload',
      `${brief.bytes.toLocaleString('en-US')} B · ${brief.digest.algo} ${brief.digest.hex.slice(0, 12)}…`,
    ],
  ]

  return (
    <motion.div {...enter} className="flex flex-1 flex-col items-center justify-center gap-6 py-2 text-center">
      <div className="relative grid h-24 w-24 place-items-center">
        {!reduced && (
          <>
            <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full border border-accent/60" />
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse-ring rounded-full border border-accent/40 [animation-delay:1.4s]"
            />
            <span
              aria-hidden
              className="absolute -inset-1.5 animate-spin-slow rounded-full border border-dashed border-accent/35"
            />
          </>
        )}
        <motion.span
          initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 18, delay: 0.1 }}
          className="relative grid h-16 w-16 place-items-center rounded-2xl border border-accent bg-accent/20 shadow-glow-lg"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-8 w-8">
            <motion.path
              d="M5 12.5 10 17.5 19 7"
              fill="none"
              className="stroke-ink"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            />
          </svg>
        </motion.span>
      </div>

      <div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-accent">
          {mode === 'mailto' ? 'Handoff complete' : 'Transmission complete'}
        </p>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-display text-[22px] font-black uppercase tracking-wide text-gradient outline-none sm:text-[26px]"
        >
          {mode === 'mailto' ? 'Mail client opened' : 'Message received'}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-balance text-[15px] leading-relaxed text-muted">
          {mode === 'mailto' ? (
            <>
              Thanks, {first}. Your mail client was opened with the brief pre-filled. Press send there to
              deliver it; nothing is sent from this page.
            </>
          ) : (
            <>
              Thanks, {first}. Your brief is in the queue. Typical response time is{' '}
              <span className="text-ink">{CONTACT.responseTime}</span> ({CONTACT.responseNote},{' '}
              {OWNER_TZ.label}).
            </>
          )}
        </p>
      </div>

      <motion.dl
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-accent/25 bg-deep/55 px-4 py-2 text-left font-mono text-[11px]"
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        {rows.map(([k, v]) => (
          <motion.div
            key={k}
            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex gap-3 border-b border-accent/10 py-1.5 last:border-0"
          >
            <dt className="w-[4.6rem] shrink-0 uppercase tracking-[0.14em] text-muted">{k}</dt>
            <dd className="min-w-0 flex-1 break-words text-ink/90">{v}</dd>
          </motion.div>
        ))}
      </motion.dl>

      {mode === 'mailto' && (
        <p className="-mt-2 max-w-md font-mono text-[10.5px] leading-relaxed text-muted/80">
          Nothing opened? Use the button below, or copy the brief and paste it into a new email.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Action icon={RotateCcw} onClick={onReset} primary>
          Send another
        </Action>
        {mode === 'mailto' && (
          <>
            <Action icon={MailOpen} href={mailto}>
              Open mail again
            </Action>
            <Action icon={Copy} onClick={onCopyBrief}>
              Copy brief
            </Action>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function TxError({
  reason,
  mailto,
  onRetry,
  onEdit,
  headingRef,
}: {
  reason: string
  mailto: string
  onRetry: () => void
  onEdit: () => void
  headingRef: Ref<HTMLHeadingElement>
}) {
  return (
    <motion.div {...enter} className="flex flex-1 flex-col items-center justify-center gap-6 py-2 text-center">
      <div className="relative grid h-20 w-20 place-items-center">
        <span aria-hidden className="absolute inset-0 animate-flicker rounded-2xl border border-rose-400/50 bg-rose-400/10" />
        <ServerCrash aria-hidden className="relative h-8 w-8 text-rose-300" />
      </div>
      <div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-rose-300">NACK · delivery failed</p>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-display text-[22px] font-black uppercase tracking-wide text-ink outline-none sm:text-[26px]"
        >
          Transmission failed
        </h3>
        <p className="mx-auto mt-3 max-w-md text-balance text-[15px] leading-relaxed text-muted">
          Nothing was lost: your message is still here and saved as a draft in this browser.
        </p>
      </div>
      <p className="w-full max-w-md rounded-xl border border-rose-400/30 bg-rose-400/[0.06] px-4 py-3 text-left font-mono text-[11px] leading-relaxed text-rose-200/90">
        <span className="text-rose-300">error</span> {reason}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Action icon={RotateCcw} onClick={onRetry} primary>
          Retry
        </Action>
        <Action icon={PenLine} onClick={onEdit}>
          Edit message
        </Action>
        <Action icon={MailOpen} href={mailto}>
          Email instead
        </Action>
      </div>
    </motion.div>
  )
}
