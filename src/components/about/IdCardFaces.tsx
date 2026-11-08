import { useId, type ReactNode } from 'react'
import { motion, useMotionTemplate, useTransform, type MotionValue } from 'framer-motion'
import { Fingerprint, Quote, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IdCardData } from '@/data/about'
import { HoloAvatar } from './HoloAvatar'
import { Barcode } from './Barcode'

const SECURITY_PRINT =
  'repeating-linear-gradient(135deg, rgb(var(--accent) / 0.05) 0 1px, transparent 1px 7px), repeating-linear-gradient(45deg, rgb(var(--accent-2) / 0.035) 0 1px, transparent 1px 9px)'

const FOIL =
  'linear-gradient(115deg, transparent 18%, rgb(var(--accent-3) / 0.7) 32%, rgb(var(--accent-2) / 0.6) 40%, rgb(var(--ink) / 0.75) 48%, rgb(var(--accent) / 0.6) 56%, rgb(var(--accent-3) / 0.65) 64%, transparent 80%)'

const REST_SHADOW =
  '0 0 0 1px rgb(var(--accent) / 0.12) inset, 0 1px 0 rgb(255 255 255 / 0.1) inset, 0 40px 80px -36px rgb(0 0 0 / 0.95), 0 0 42px -14px rgb(var(--accent) / 0.55)'
const HOVER_SHADOW =
  '0 0 0 1px rgb(var(--accent) / 0.3) inset, 0 1px 0 rgb(255 255 255 / 0.14) inset, 0 50px 90px -34px rgb(0 0 0 / 0.95), 0 0 70px -10px rgb(var(--accent) / 0.75)'

export interface FaceMotion {
  /** pointer position across the card in % */
  gx: MotionValue<number>
  gy: MotionValue<number>
  /** fake-parallax offsets (px) for raised content */
  px: MotionValue<number>
  py: MotionValue<number>
  hovered: boolean
  /** idle loops allowed (in view, motion not reduced) */
  live: boolean
  reduced: boolean
}

/**
 * One side of the card. Each face is a flat composite so the foil and glare
 * can blend over its content; depth comes from the tilt and from raised
 * content drifting toward the pointer.
 */
export function Face({
  children,
  back = false,
  showing,
  visibility,
  motion: m,
}: {
  children: ReactNode
  back?: boolean
  /** this side is the one facing the viewer */
  showing: boolean
  visibility: MotionValue<string>
  motion: FaceMotion
}) {
  const glare = useMotionTemplate`radial-gradient(circle at ${m.gx}% ${m.gy}%, rgb(var(--ink) / 0.16), transparent 42%)`
  const foilPos = useMotionTemplate`${m.gx}% ${m.gy}%`
  const sparkleMask = useMotionTemplate`radial-gradient(circle at ${m.gx}% ${m.gy}%, black 0%, transparent 55%)`

  return (
    <motion.div
      className="relative overflow-hidden rounded-[22px] border border-accent/45 transition-[box-shadow,border-color] duration-500 [grid-area:1/1]"
      style={{
        visibility,
        rotateY: back ? 180 : 0,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background:
          'linear-gradient(158deg, rgb(var(--surface)) 0%, rgb(var(--deep)) 58%, rgb(var(--surface)) 100%)',
        boxShadow: m.hovered ? HOVER_SHADOW : REST_SHADOW,
        borderColor: m.hovered ? 'rgb(var(--accent) / 0.75)' : undefined,
      }}
    >
      {/* security print + scanlines */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: SECURITY_PRINT }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)' }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />

      <div className="relative flex h-full flex-col">{children}</div>

      {/* holographic foil: streaks of palette colour that slide with the pointer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: FOIL,
          backgroundSize: '240% 240%',
          backgroundPosition: foilPos,
          mixBlendMode: 'color-dodge',
          opacity: m.hovered ? 0.36 : 0.14,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgb(var(--accent-3) / 0.22) 0 1px, transparent 1px 3px)',
          WebkitMaskImage: sparkleMask,
          maskImage: sparkleMask,
          mixBlendMode: 'screen',
          opacity: m.hovered ? 0.9 : 0,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ background: glare, opacity: m.hovered ? 1 : 0 }}
      />

      {/* idle sheen */}
      {m.live && !m.hovered && showing && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-y-1/4 left-0 w-1/3"
          style={{
            rotate: 18,
            background: 'linear-gradient(90deg, transparent, rgb(var(--ink) / 0.1), transparent)',
          }}
          initial={{ x: '-170%' }}
          animate={{ x: ['-170%', '420%'] }}
          transition={{ duration: 1.9, repeat: Infinity, repeatDelay: 5.5, ease: 'easeInOut', delay: back ? 0 : 1.6 }}
        />
      )}

      <Brackets hovered={m.hovered} />
    </motion.div>
  )
}

export function CardFront({ data, motion: m }: { data: IdCardData; motion: FaceMotion }) {
  const bx = useTransform(m.px, (v) => v * -0.6)
  const by = useTransform(m.py, (v) => v * -0.6)

  return (
    <div className="flex h-full flex-col px-5 pb-5 pt-3.5">
      <span
        aria-hidden
        className="mx-auto h-[7px] w-14 shrink-0 rounded-full border border-accent/30 bg-deep shadow-[inset_0_1px_3px_rgb(0_0_0/0.9)]"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <MiniMark />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[11.5px] font-bold tracking-[0.24em] text-ink">
              {data.issuer}
            </p>
            <p className="truncate font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted">
              {data.docType}
            </p>
          </div>
        </div>
        <ChipGlyph />
      </div>
      <span aria-hidden className="mt-3 h-px w-full hairline" />

      <div className="relative mt-3 flex items-center justify-center">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute h-[210px] w-[210px] opacity-40"
          style={{ x: bx, y: by }}
        >
          <Rosette spinning={m.live} />
        </motion.div>
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 rotate-180 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.3em] text-muted/70 [writing-mode:vertical-rl]"
        >
          {data.clearance}
        </span>
        <span
          aria-hidden
          className="absolute right-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.3em] text-muted/70 [writing-mode:vertical-rl]"
        >
          ISS {data.issued}
        </span>
        <motion.div style={{ x: m.px, y: m.py }} className="relative">
          <HoloAvatar active={m.live} reduced={m.reduced} className="h-[148px] w-[148px]" />
        </motion.div>
        <Seal className="absolute bottom-0 right-3 h-[54px] w-[54px]" spinning={m.live} />
      </div>

      <div className="mt-2.5 text-center">
        <p className="pl-[0.34em] font-display text-[30px] font-black uppercase leading-none tracking-[0.34em]">
          <span className="text-gradient">{data.name}</span>
        </p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">{data.role}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-accent/25 bg-accent/20">
        {data.fields.map((f) => (
          <div key={f.label} className={cn('bg-deep/90 px-3 py-2', f.wide && 'col-span-2')}>
            <dt className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted">{f.label}</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold leading-tight text-ink">
              {f.live && <Led />}
              <span className="truncate">{f.value}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto pt-4">
        <Barcode value={data.serial} scanning={m.hovered && m.live} className="h-9 w-full" />
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
          <span>
            SN <span className="text-ink">{data.serial}</span>
          </span>
          <span>Code 39</span>
        </div>
      </div>
    </div>
  )
}

export function CardBack({ data }: { data: IdCardData }) {
  const groups = data.pgp.fingerprint.split(/\s+/)
  const half = Math.ceil(groups.length / 2)

  return (
    <div className="flex h-full flex-col">
      {/* magnetic stripe */}
      <div
        aria-hidden
        className="relative mt-6 h-11 w-full shrink-0 overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgb(0 0 0 / 0.75), rgb(var(--deep)) 45%, rgb(0 0 0 / 0.85))',
        }}
      >
        <span className="absolute inset-x-0 top-1/2 h-px bg-ink/10" />
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4">
        <div aria-hidden className="pointer-events-none absolute -right-16 top-10 h-56 w-56 opacity-25">
          <Rosette spinning={false} />
        </div>

        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
          <span>Side B · Manifesto</span>
          <span className="text-ink/80">{data.serial}</span>
        </div>

        <figure className="relative mt-4">
          <Quote aria-hidden className="h-6 w-6 text-accent" />
          <blockquote className="mt-2 text-balance text-[16.5px] font-medium leading-snug text-ink">
            {data.manifesto}
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-2">
            <span aria-hidden className="h-px w-6 bg-accent/70" />
            <span className="font-display text-[12px] font-bold uppercase tracking-[0.24em] text-accent">
              {data.signature}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              signed {data.issued}
            </span>
          </figcaption>
        </figure>

        <div className="relative mt-5">
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            <Fingerprint aria-hidden className="h-3 w-3 text-accent" />
            PGP fingerprint · {data.pgp.algo}
          </p>
          <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed tracking-[0.05em] text-ink/90">
            {groups.slice(0, half).join(' ')}
            <br />
            {groups.slice(half).join(' ')}
          </p>
        </div>

        <div className="relative mt-auto pt-4">
          <div className="rounded-xl border border-accent/35 bg-accent/10 p-3">
            <p className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
              <ShieldCheck aria-hidden className="h-4 w-4 text-accent" />
              {data.authorised.title}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{data.authorised.body}</p>
          </div>
          <div
            aria-hidden
            className="mt-3 overflow-hidden whitespace-nowrap rounded border border-accent/25 bg-accent/[0.06] px-2 py-1 font-mono text-[7.5px] uppercase tracking-[0.3em] text-accent/70"
          >
            {'void if tampered · authorised scope only · '.repeat(4)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Led() {
  return (
    <span aria-hidden className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.9)]" />
    </span>
  )
}

function Brackets({ hovered }: { hovered: boolean }) {
  const base = cn(
    'pointer-events-none absolute border-accent/70 transition-all duration-500',
    hovered ? 'h-5 w-5 border-accent' : 'h-3.5 w-3.5',
  )
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}

function MiniMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
      <polygon
        points="12,1.5 21.1,6.75 21.1,17.25 12,22.5 2.9,17.25 2.9,6.75"
        fill="rgb(var(--accent) / 0.12)"
        stroke="rgb(var(--accent))"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 16 V8 L15.4 16 V8"
        fill="none"
        stroke="rgb(var(--accent-3))"
        strokeWidth="1.8"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}

function ChipGlyph() {
  const fill = `chip-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 36 28" className="h-7 w-9 shrink-0" aria-hidden>
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent-3) / 0.95)" />
          <stop offset="50%" stopColor="rgb(var(--accent) / 0.75)" />
          <stop offset="100%" stopColor="rgb(var(--accent-2) / 0.85)" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="34.5"
        height="26.5"
        rx="5"
        fill={`url(#${fill})`}
        stroke="rgb(var(--accent-3) / 0.8)"
        strokeWidth="1"
      />
      <path
        d="M0.75 9.5 H12 M0.75 18.5 H12 M24 9.5 H35.25 M24 18.5 H35.25 M12 0.75 V27.25 M24 0.75 V27.25 M12 14 H24"
        fill="none"
        stroke="rgb(var(--deep) / 0.7)"
        strokeWidth="1"
      />
    </svg>
  )
}

/** Guilloche rosette, the fine-line security print found on real ID documents. */
function Rosette({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="-100 -100 200 200" className={cn('h-full w-full', spinning && 'animate-spin-slow')} aria-hidden>
      <g fill="none" stroke="rgb(var(--accent) / 0.55)" strokeWidth="0.45">
        {Array.from({ length: 24 }, (_, i) => (
          <ellipse key={i} rx="94" ry="32" transform={`rotate(${i * 7.5})`} />
        ))}
      </g>
      <g fill="none" stroke="rgb(var(--accent-2) / 0.4)" strokeWidth="0.35">
        {Array.from({ length: 18 }, (_, i) => (
          <ellipse key={i} rx="62" ry="40" transform={`rotate(${i * 10})`} />
        ))}
      </g>
    </svg>
  )
}

function Seal({ className, spinning }: { className?: string; spinning: boolean }) {
  const uid = useId().replace(/:/g, '')
  const ring = `seal-ring-${uid}`
  const fill = `seal-fill-${uid}`
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <path id={ring} d="M32 32 m-23 0 a23 23 0 1 1 46 0 a23 23 0 1 1 -46 0" />
        <radialGradient id={fill} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgb(var(--accent-3) / 0.55)" />
          <stop offset="55%" stopColor="rgb(var(--accent) / 0.28)" />
          <stop offset="100%" stopColor="rgb(var(--accent-2) / 0.4)" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${fill})`} stroke="rgb(var(--accent-3) / 0.75)" strokeWidth="1" />
      <circle cx="32" cy="32" r="17" fill="rgb(var(--deep) / 0.75)" stroke="rgb(var(--accent) / 0.8)" strokeWidth="0.9" />
      <g className={cn(spinning && 'animate-spin-slow')} style={{ transformOrigin: '32px 32px' }}>
        <text className="fill-ink font-mono" style={{ fontSize: 6, letterSpacing: '0.08em' }}>
          <textPath href={`#${ring}`} textLength="144" lengthAdjust="spacing">
            VERIFIED · AUTHORISED · RE LAB ·
          </textPath>
        </text>
      </g>
      <path
        d="M25.5 32.5 l4.5 4.5 l8.5 -9"
        fill="none"
        stroke="rgb(var(--accent-3))"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
