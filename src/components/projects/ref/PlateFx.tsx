import { memo } from 'react'
import type { ShardId } from '@/data/projects'
import { quadMatrix, type Quad } from './quad'

/*
 * Light that lives on top of the photoreal plate: everything is additive
 * (mix-blend-mode: screen), so it only ever brightens the render and never
 * paints over it. All loops are compositor-friendly (opacity / transform /
 * dash offset on tiny elements) and stop when the stage is off-screen.
 */

const CSS = `
@keyframes rfx-pulse { 0%,100% { opacity: .18; } 50% { opacity: .5; } }
@keyframes rfx-blink { 0%,100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.25); } }
@keyframes rfx-rise { 0% { transform: translate3d(0,0,0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate3d(0,-150px,0); opacity: 0; } }
@keyframes rfx-ring { to { stroke-dashoffset: -1400; } }
@keyframes rfx-hot { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes rfx-beam { 0%,100% { opacity: .35; } 40% { opacity: .9; } 60% { opacity: .55; } }
@keyframes rfx-scan { from { transform: translate3d(0,-60px,0); } to { transform: translate3d(0,330px,0); } }
`

const NODES: [number, number][] = [
  [745, 147],
  [968, 170],
  [655, 230],
  [1032, 335],
  [681, 396],
]

/** the baked readouts, so the one relevant to the focused study can glow */
const SHARD_QUADS: Record<ShardId, Quad> = {
  disasm: [[366, 151], [628, 200], [627, 352], [367, 334]],
  hex: [[325, 348], [577, 362], [576, 470], [326, 473]],
  cfg: [[1011, 128], [1212, 122], [1210, 270], [1011, 276]],
  http: [[1092, 266], [1322, 259], [1321, 410], [1092, 411]],
  wave: [[1087, 418], [1316, 418], [1316, 466], [1087, 466]],
}

const RING = { cx: 840, cy: 332, rx: 220, ry: 57 }

export const PlateFx = memo(function PlateFx({ live, hot }: { live: boolean; hot: ShardId[] }) {
  const lit = hot.length === 1 ? hot[0] : null
  const run = (anim: string) => (live ? anim : 'none')
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ mixBlendMode: 'screen' }}>
      <style>{CSS}</style>

      {/* the core breathes */}
      <div
        className="absolute rounded-full"
        style={{
          left: 700,
          top: 170,
          width: 280,
          height: 260,
          background: 'radial-gradient(closest-side, rgb(90 230 255 / 0.55), rgb(40 200 240 / 0.18) 55%, transparent)',
          animation: run('rfx-pulse 3.2s ease-in-out infinite'),
          opacity: 0.3,
        }}
      />
      {/* a scan plane drifting down through the cluster */}
      <div className="absolute overflow-hidden" style={{ left: 712, top: 130, width: 256, height: 320, clipPath: 'polygon(50% 0, 100% 22%, 100% 78%, 50% 100%, 0 78%, 0 22%)' }}>
        <div
          className="absolute inset-x-0 h-[46px]"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgb(120 240 255 / 0.28), transparent)',
            animation: run('rfx-scan 4.6s linear infinite'),
            opacity: live ? 1 : 0,
          }}
        />
      </div>

      {/* a spark running round the orbit ring */}
      {live && (
        <svg className="absolute inset-0 overflow-visible" width="1672" height="941" viewBox="0 0 1672 941" style={{ willChange: 'transform' }}>
          <ellipse
            cx={RING.cx}
            cy={RING.cy}
            rx={RING.rx}
            ry={RING.ry}
            fill="none"
            stroke="rgb(210 252 255)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="34 1366"
            style={{ animation: 'rfx-ring 5s linear infinite', filter: 'drop-shadow(0 0 4px rgb(60 220 255))' }}
          />
        </svg>
      )}

      {/* red signal nodes blink */}
      {NODES.map(([x, y], i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: x - 14,
            top: y - 14,
            width: 28,
            height: 28,
            background: 'radial-gradient(closest-side, rgb(255 120 100 / 0.95), rgb(255 40 40 / 0.35) 50%, transparent)',
            animation: run(`rfx-blink ${2 + i * 0.37}s ease-in-out ${-i * 0.6}s infinite`),
            opacity: 0.5,
          }}
        />
      ))}

      {/* motes rising off the emitter */}
      {live &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="absolute h-[3px] w-[3px] rounded-full bg-[rgb(200_250_255)]"
            style={{
              left: 790 + i * 19,
              top: 440,
              boxShadow: '0 0 6px rgb(80 230 255)',
              animation: `rfx-rise ${2.6 + (i % 3) * 0.7}s ease-out ${i * 0.55}s infinite`,
            }}
          />
        ))}

      {/* the beam between the explore pedestal and the centre card flickers */}
      <div
        className="absolute"
        style={{
          left: 806,
          top: 772,
          width: 72,
          height: 40,
          background: 'radial-gradient(60% 100% at 50% 100%, rgb(150 245 255 / 0.65), transparent)',
          animation: run('rfx-beam 2.8s ease-in-out infinite'),
          opacity: 0.5,
        }}
      />

      {/* the readout that belongs to the focused study glows */}
      {(Object.keys(SHARD_QUADS) as ShardId[]).map((id) => (
        <div
          key={id}
          className="absolute left-0 top-0 transition-opacity duration-700"
          style={{ width: 100, height: 100, transformOrigin: '0 0', transform: quadMatrix(100, 100, SHARD_QUADS[id]), opacity: lit === id ? 1 : 0 }}
        >
          <span
            className="absolute -inset-[2px] rounded-[6px]"
            style={{
              boxShadow: 'inset 0 0 0 2px rgb(120 240 255 / 0.9), inset 0 0 14px rgb(60 220 255 / 0.6), 0 0 16px rgb(60 220 255 / 0.65)',
              animation: lit === id ? run('rfx-hot 2.2s ease-in-out infinite') : 'none',
            }}
          />
        </div>
      ))}
    </div>
  )
})
