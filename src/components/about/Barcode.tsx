import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Code 39: nine elements per symbol (bar, space, bar, …); "1" marks a wide element. */
const CODE39: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000', '4': '000110001',
  '5': '100110000', '6': '001110000', '7': '000100101', '8': '100100100', '9': '001100100',
  A: '100001001', B: '001001001', C: '101001000', D: '000011001', E: '100011000',
  F: '001011000', G: '000001101', H: '100001100', I: '001001100', J: '000011100',
  K: '100000011', L: '001000011', M: '101000010', N: '000010011', O: '100010010',
  P: '001010010', Q: '000000111', R: '100000110', S: '001000110', T: '000010110',
  U: '110000001', V: '011000001', W: '111000000', X: '010010001', Y: '110010000',
  Z: '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', $: '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
}

const WIDE = 2.5
const QUIET = 10

function code39(value: string) {
  const text = `*${value.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g, '')}*`
  const bars: { x: number; w: number }[] = []
  let x = QUIET
  for (const ch of text) {
    const pattern = CODE39[ch]
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === '1' ? WIDE : 1
      if (i % 2 === 0) bars.push({ x, w })
      x += w
    }
    x += 1
  }
  return { bars, width: x - 1 + QUIET }
}

/** A real, decodable Code 39 symbol with an optional sweeping scanner laser. */
export function Barcode({
  value,
  scanning = false,
  className,
}: {
  value: string
  scanning?: boolean
  className?: string
}) {
  const { bars, width } = useMemo(() => code39(value), [value])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <svg
        viewBox={`0 0 ${width} 32`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="block h-full w-full text-ink/80"
        aria-hidden
      >
        {bars.map((b) => (
          <rect key={b.x} x={b.x} y={0} width={b.w} height={32} fill="currentColor" />
        ))}
      </svg>
      {scanning && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ x: '-50%' }}
          animate={{ x: ['-50%', '50%', '-50%'] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-accent3 shadow-glow" />
          <span className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
        </motion.div>
      )}
    </div>
  )
}
