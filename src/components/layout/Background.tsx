import { motion } from 'framer-motion'
import { useTheme } from '@/theme/ThemeProvider'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ParticleField } from './ParticleField'
import { seeded } from '@/lib/utils'

const rand = seeded(90210)
const BARS = Array.from({ length: 14 }, () => ({
  top: rand() * 90,
  left: rand() * 100,
  w: 40 + rand() * 180,
  h: rand() > 0.55 ? 3 : 2,
  delay: rand() * 6,
  dur: 4 + rand() * 6,
  vertical: rand() > 0.7,
  op: 0.12 + rand() * 0.3,
}))

/**
 * The environment the whole portfolio floats inside.
 * Seven stacked layers, every one of them tinted by the active section theme:
 * wash → aurora → neon strips → grid floor → grid ceiling → particles → scanlines/vignette/noise.
 */
export function Background() {
  const { section } = useTheme()
  const { x, y } = useMousePosition(0.08)
  const reduced = useReducedMotion()

  const px = reduced ? 0 : x
  const py = reduced ? 0 : y

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 1 — base wash */}
      <div
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background: `radial-gradient(95rem 62rem at 50% -12%, rgb(var(--accent) / 0.20), transparent 62%),
                       radial-gradient(62rem 44rem at 6% 106%, rgb(var(--accent-2) / 0.16), transparent 62%),
                       radial-gradient(54rem 42rem at 96% 64%, rgb(var(--accent-3) / 0.10), transparent 62%),
                       rgb(var(--deep))`,
        }}
      />

      {/* 2 — drifting aurora blobs */}
      <motion.div
        className="absolute inset-0"
        style={{ x: px * -26, y: py * -18 }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      >
        <Blob className="left-[6%] top-[12%] h-[34rem] w-[34rem]" delay={0} />
        <Blob className="right-[4%] top-[28%] h-[28rem] w-[28rem]" delay={2.4} alt />
        <Blob className="bottom-[6%] left-[32%] h-[30rem] w-[30rem]" delay={4.1} />
      </motion.div>

      {/* 3 — distant neon strips (the server-room glow in the reference) */}
      <motion.div className="absolute inset-0" style={{ x: px * -12, y: py * -8 }}>
        {BARS.map((b, i) => (
          <motion.span
            key={`${section}-${i}`}
            className="absolute rounded-full"
            style={{
              top: `${b.top}%`,
              left: `${b.left}%`,
              width: b.vertical ? b.h : b.w,
              height: b.vertical ? b.w : b.h,
              background: `linear-gradient(${b.vertical ? '180deg' : '90deg'}, transparent, rgb(var(--accent) / ${b.op}), transparent)`,
              boxShadow: `0 0 12px rgb(var(--accent) / ${b.op * 0.8})`,
            }}
            animate={reduced ? undefined : { opacity: [0.25, 1, 0.45, 0.9, 0.3] }}
            transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* 4 — perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[58vh]"
        style={{ perspective: '520px', perspectiveOrigin: `${50 + px * 6}% 0%` }}
      >
        <div
          className="absolute inset-x-[-60%] bottom-[-18%] top-0 origin-bottom bg-grid transition-[background-image] duration-700"
          style={{
            transform: `rotateX(74deg) translateY(${py * 10}px)`,
            backgroundSize: '68px 68px',
            animation: reduced ? undefined : 'gridScroll 9s linear infinite',
            maskImage: 'linear-gradient(to top, black 8%, transparent 78%)',
            WebkitMaskImage: 'linear-gradient(to top, black 8%, transparent 78%)',
          }}
        />
        {/* horizon bloom */}
        <div
          className="absolute inset-x-0 top-0 h-28 transition-[background] duration-700"
          style={{
            background:
              'radial-gradient(60% 100% at 50% 100%, rgb(var(--accent) / 0.26), transparent 70%)',
          }}
        />
      </div>

      {/* 5 — grid ceiling */}
      <div className="absolute inset-x-0 top-0 h-[34vh]" style={{ perspective: '620px' }}>
        <div
          className="absolute inset-x-[-50%] bottom-0 top-[-14%] origin-top bg-grid opacity-60 transition-[background-image] duration-700"
          style={{
            transform: `rotateX(-72deg) translateY(${py * -8}px)`,
            backgroundSize: '84px 84px',
            maskImage: 'linear-gradient(to bottom, black 2%, transparent 72%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 2%, transparent 72%)',
          }}
        />
      </div>

      {/* 6 — particle motes */}
      <div className="absolute inset-0">
        <ParticleField />
      </div>

      {/* 7 — CRT scanlines, sweeping beam, noise, vignette */}
      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(var(--ink)) 0px, rgb(var(--ink)) 1px, transparent 1px, transparent 3px)',
        }}
      />
      {!reduced && (
        <div
          className="absolute inset-x-0 h-24 animate-scanline opacity-20"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgb(var(--accent) / 0.35), transparent)',
          }}
        />
      )}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 100% at 50% 40%, transparent 42%, rgb(var(--deep) / 0.75) 100%)',
        }}
      />
    </div>
  )
}

function Blob({
  className,
  delay,
  alt,
}: {
  className?: string
  delay: number
  alt?: boolean
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={`absolute rounded-full blur-[110px] transition-[background] duration-700 ${className}`}
      style={{
        background: alt
          ? 'radial-gradient(circle, rgb(var(--accent-2) / 0.34), transparent 68%)'
          : 'radial-gradient(circle, rgb(var(--accent) / 0.30), transparent 68%)',
      }}
      animate={
        reduced
          ? undefined
          : { scale: [1, 1.16, 0.95, 1], x: [0, 34, -22, 0], y: [0, -28, 18, 0] }
      }
      transition={{ duration: 18, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
