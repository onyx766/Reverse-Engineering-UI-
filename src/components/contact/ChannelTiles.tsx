import { useEffect, useRef, useState, type ComponentType, type PointerEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, Check, Copy, Github, KeyRound, Mail, Send } from 'lucide-react'
import { CHANNELS, type Channel, type ChannelId } from '@/data/contact'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { copyText } from './lib'
import { useToast } from './Toast'
import { EASE } from './fields'

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const ICONS: Record<ChannelId, ComponentType<{ className?: string }>> = {
  email: Mail,
  github: Github,
  x: XLogo,
  pgp: KeyRound,
}

export function ChannelTiles() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-2">
      {CHANNELS.map((c, i) => (
        <Tile key={c.id} channel={c} index={i} />
      ))}
    </div>
  )
}

function Tile({ channel: c, index }: { channel: Channel; index: number }) {
  const reduced = useReducedMotion()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const Icon = ICONS[c.id]

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spring = { stiffness: 260, damping: 22, mass: 0.4 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), spring)
  const glare = useTransform(
    [mx, my],
    ([x, y]: number[]) =>
      `radial-gradient(18rem 12rem at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgb(var(--accent) / 0.24), transparent 62%)`,
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const copy = async () => {
    if (!c.copy) return
    const ok = await copyText(c.copy)
    if (ok) {
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    }
    toast(
      ok
        ? { title: `${c.copyLabel ?? c.label} copied`, body: c.copy }
        : { tone: 'warn', title: 'Clipboard blocked', body: `Copy it manually: ${c.copy}` },
    )
  }

  const Corner = 'pointer-events-none absolute h-2.5 w-2.5 border-accent/60 transition-all duration-500 group-hover:h-3.5 group-hover:w-3.5 group-hover:border-accent'

  const body = (
    <>
      <span
        className={cn(
          'relative grid h-11 w-11 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-accent shadow-glow-sm transition-all duration-500',
          'group-hover:-rotate-6 group-hover:scale-110 group-hover:border-accent group-hover:bg-accent/20 group-focus-within:border-accent',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-4 block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        {c.label}
      </span>
      <span
        className={cn(
          'mt-1 block font-mono text-[13px] font-semibold tracking-wide text-ink sm:text-[14px]',
          // the 64-bit key ID balances onto two lines on narrow tiles instead of losing digits
          c.id === 'pgp' ? 'text-balance' : 'truncate',
        )}
      >
        {c.handle}
      </span>
      <span className="mt-2 flex min-h-[16px] items-start gap-1.5 font-mono text-[10px] leading-[1.45] text-muted/90">
        {copied ? (
          <>
            <Check aria-hidden className="mt-px h-3 w-3 shrink-0 text-emerald-300" strokeWidth={3} />
            <span className="text-emerald-300">Copied to clipboard</span>
          </>
        ) : (
          <span className="line-clamp-2">{c.note}</span>
        )}
      </span>
    </>
  )

  const primaryCls = 'relative block h-full w-full rounded-xl p-4 text-left focus-visible:-outline-offset-2'

  return (
    <motion.div
      // reduced motion: a plain fade (MotionConfig skips transforms, but not blur)
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: 34, rotateY: -16, filter: 'blur(8px)' }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={reduced ? { duration: 0.4 } : { duration: 0.75, delay: 0.08 + index * 0.08, ease: EASE }}
      style={{ transformPerspective: 1100 }}
      className="h-full"
    >
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileHover={reduced ? undefined : { y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        className="group relative h-full"
      >
        <div
          className={cn(
            'glass relative h-full overflow-hidden rounded-xl transition-[border-color,box-shadow] duration-500',
            'group-hover:border-accent/60 group-hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.18)_inset,0_28px_60px_-26px_rgb(0_0_0/0.95),0_0_46px_-10px_rgb(var(--accent)/0.65)]',
            'group-focus-within:border-accent/70',
          )}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          {!reduced && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: glare }}
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[420%]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition-colors duration-500 group-hover:bg-accent/30"
          />
          <span aria-hidden className={cn(Corner, 'bottom-2 left-2 border-b border-l')} />
          <span aria-hidden className={cn(Corner, 'bottom-2 right-2 border-b border-r')} />

          {c.copy ? (
            <button
              type="button"
              onClick={copy}
              aria-label={`Copy ${c.copyLabel ?? c.label}: ${c.copy}`}
              className={primaryCls}
            >
              {body}
              {!c.href && (
                <Copy
                  aria-hidden
                  className="absolute right-4 top-4 h-4 w-4 text-muted transition-all duration-300 group-hover:scale-110 group-hover:text-accent"
                />
              )}
            </button>
          ) : (
            <a
              href={c.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${c.label} ${c.handle} (opens in a new tab)`}
              className={primaryCls}
            >
              {body}
              <ArrowUpRight
                aria-hidden
                className="absolute right-4 top-4 h-4 w-4 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </a>
          )}

          {c.copy && c.href && (
            <a
              href={c.href}
              aria-label={c.hrefLabel ?? `Open ${c.label}`}
              className="group/send absolute right-2.5 top-2.5 z-10 grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-deep/60 text-muted transition-all duration-300 hover:border-accent hover:bg-accent/20 hover:text-ink hover:shadow-glow-sm"
            >
              <Send
                aria-hidden
                className="h-4 w-4 transition-transform duration-300 group-hover/send:-translate-y-0.5 group-hover/send:translate-x-0.5"
              />
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
