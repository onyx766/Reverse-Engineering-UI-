import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Isometric holo-cube mark. Lines orbit inside the shell on hover. */
export function HoloLogo({ className, size = 42 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn('shrink-0 overflow-visible', className)}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <defs>
        <linearGradient id="logoEdge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent-3))" />
          <stop offset="55%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
        <filter id="logoGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer rounded hex shell */}
      <motion.path
        d="M32 4 55 17.5v29L32 60 9 46.5v-29z"
        stroke="url(#logoEdge)"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="rgb(var(--accent) / 0.08)"
        filter="url(#logoGlow)"
        variants={{
          rest: { rotate: 0, scale: 1 },
          hover: { rotate: 180, scale: 1.06 },
        }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '32px 32px' }}
      />

      {/* inner cube faces */}
      <motion.g
        stroke="url(#logoEdge)"
        strokeWidth="1.9"
        strokeLinejoin="round"
        variants={{ rest: { rotate: 0 }, hover: { rotate: -180 } }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '32px 32px' }}
      >
        <path d="M32 17 45 24.5v15L32 47 19 39.5v-15z" fill="rgb(var(--accent) / 0.2)" />
        <path d="M32 17v15l13 7.5M32 32l-13 7.5" opacity="0.85" />
      </motion.g>

      {/* core spark */}
      <motion.circle
        cx="32"
        cy="32"
        r="3.4"
        fill="rgb(var(--accent-3))"
        filter="url(#logoGlow)"
        animate={{ opacity: [0.55, 1, 0.55], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '32px 32px' }}
      />
    </motion.svg>
  )
}
