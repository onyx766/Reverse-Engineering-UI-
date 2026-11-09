import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { HoloLogo } from '@/components/ui/HoloLogo'
import { cn } from '@/lib/utils'
import { PROJECTS_COPY } from '@/data/projects'

/**
 * "Explore My Portfolio" call to action built as a glowing emitter disc: a
 * light beam rises from its centre, rings rotate and pulse, and hovering
 * intensifies the beam and lifts the label.
 */
export function ExplorePedestal({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <motion.div
      className={cn('relative flex justify-center', className)}
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`${PROJECTS_COPY.pedestal}: jump to the case study index`}
        className="group relative h-[112px] w-[min(540px,92vw)] outline-none"
      >
        <span aria-hidden className="pointer-events-none absolute bottom-[44px] left-1/2 h-[150px] w-[150px] -translate-x-1/2 origin-bottom transition-transform duration-700 ease-out group-hover:scale-y-[1.3] group-focus-visible:scale-y-[1.3]">
          <span
            className="absolute inset-0 opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(40% 100% at 50% 100%, rgb(var(--accent) / 0.7), transparent 75%)',
              animation: 'pj-beam 3.4s ease-in-out infinite',
            }}
          />
          <span
            className="absolute bottom-0 left-1/2 h-full w-[70px] -translate-x-1/2 opacity-80 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: 'linear-gradient(to top, rgb(var(--accent-3) / 0.75), rgb(var(--accent) / 0.22) 55%, transparent)',
              clipPath: 'polygon(28% 100%, 72% 100%, 100% 0, 0 0)',
            }}
          />
          {/* the bright core starts above the label so it never reads as a stray glyph between the words */}
          <span className="absolute bottom-[22px] left-1/2 h-[calc(100%-22px)] w-[3px] -translate-x-1/2 bg-gradient-to-t from-ink via-accent3/80 to-transparent shadow-[0_0_12px_rgb(var(--accent-3))]" />
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute bottom-6 h-1 w-1 rounded-full bg-accent3 shadow-glow-sm"
              style={{ left: `${38 + i * 8}%`, animation: `pj-rise ${2.4 + i * 0.5}s ease-out ${i * 0.7}s infinite` }}
            />
          ))}
        </span>

        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[86px]">
          <span
            className="absolute inset-0 rounded-[50%] border border-accent/45 transition-[border-color,box-shadow] duration-500 group-hover:border-accent group-focus-visible:border-accent"
            style={{
              background:
                'radial-gradient(60% 70% at 50% 40%, rgb(var(--accent) / 0.22), rgb(var(--surface) / 0.9) 60%, rgb(var(--deep) / 0.95))',
              boxShadow:
                '0 0 0 1px rgb(var(--accent) / 0.12) inset, 0 -6px 30px -10px rgb(var(--accent) / 0.6) inset, 0 0 40px -8px rgb(var(--accent) / 0.55), 0 22px 40px -18px rgb(0 0 0 / 0.95)',
            }}
          />
          <span className="absolute inset-x-0 -bottom-1 mx-auto h-[70%] w-[94%] rounded-[50%] border-b-2 border-accent/50 blur-[1px]" />
          <span className="absolute inset-x-[9%] inset-y-[14%] rounded-[50%] border border-accent/30 transition-colors duration-500 group-hover:border-accent/60" />
          <span className="absolute inset-x-[20%] inset-y-[26%] rounded-[50%] border border-accent2/30" />
          {/* rotating dashed ring (a circle squashed into the disc's perspective) */}
          <span className="absolute inset-x-[14%] top-1/2 aspect-square [transform:translateY(-50%)_scaleY(0.17)]">
            <span
              className="absolute inset-0 rounded-full border-2 border-dashed border-accent/45 transition-colors duration-500 group-hover:border-accent/80"
              style={{ animation: 'pj-spin 18s linear infinite' }}
            />
          </span>
          <span className="absolute inset-x-[24%] top-1/2 aspect-square [transform:translateY(-50%)_scaleY(0.2)]">
            <span className="absolute inset-0 rounded-full border border-accent/70" style={{ animation: 'pj-ring 3s ease-out infinite' }} />
          </span>
          <span className="absolute bottom-[6px] left-[16%] h-[3px] w-[13%] rounded-full bg-accent3/80 blur-[2px]" />
          <span className="absolute bottom-[6px] right-[16%] h-[3px] w-[13%] rounded-full bg-accent3/80 blur-[2px]" />
          <span className="absolute -inset-1.5 rounded-[50%] border-2 border-accent opacity-0 transition-opacity group-focus-visible:opacity-100" />
        </span>

        <span className="absolute inset-x-0 bottom-[30px] flex items-center justify-center gap-3 transition-transform duration-500 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
          <HoloLogo size={30} />
          <span className="font-display text-[15px] font-bold tracking-[0.06em] text-ink transition-[text-shadow] duration-500 group-hover:[text-shadow:0_0_14px_rgb(var(--accent)/0.9)] sm:text-[17px]">
            {PROJECTS_COPY.pedestal}
          </span>
          <ChevronDown aria-hidden className="h-4 w-4 text-accent transition-transform duration-500 group-hover:translate-y-0.5" />
        </span>
      </button>
    </motion.div>
  )
}
