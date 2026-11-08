import { ArrowRight } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import type { Project } from '@/data/projects'
import { cn } from '@/lib/utils'
import { ProjectIllustration } from './Illustrations'

interface Props {
  project: Project
  /** centre card of the carousel */
  focused: boolean
  /** pointer hover or keyboard focus */
  hover: boolean
  /** allow the centre card's illustration to keep animating */
  live: boolean
  /** rendered card width in px: copy scales with it */
  width: number
}

const fit = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Glass project card face (interaction lives in the carousel slot that wraps it). */
export function ProjectCard({ project, focused, hover, live, width }: Props) {
  const lit = focused || hover
  const title = fit(width * 0.08, 15.5, 21.5)
  const body = fit(width * 0.06, 12.5, 15)
  const roomy = width >= 236
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-500',
        focused ? 'border-accent/85' : hover ? 'border-accent/60' : 'border-accent/30',
      )}
      style={{
        background:
          'linear-gradient(165deg, rgb(var(--surface) / 0.94) 0%, rgb(var(--deep) / 0.96) 62%), radial-gradient(130% 70% at 50% 0%, rgb(var(--accent) / 0.16), transparent 60%)',
        boxShadow: focused
          ? '0 0 0 1px rgb(var(--accent) / 0.35) inset, 0 0 34px -2px rgb(var(--accent) / 0.65), 0 0 90px -20px rgb(var(--accent) / 0.55), 0 30px 60px -24px rgb(0 0 0 / 0.95)'
          : hover
            ? '0 0 0 1px rgb(var(--accent) / 0.22) inset, 0 0 30px -6px rgb(var(--accent) / 0.55), 0 30px 60px -24px rgb(0 0 0 / 0.95)'
            : '0 0 0 1px rgb(var(--accent) / 0.08) inset, 0 0 22px -10px rgb(var(--accent) / 0.45), 0 26px 50px -24px rgb(0 0 0 / 0.95)',
      }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)' }}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent transition-opacity duration-500',
          lit ? 'opacity-100' : 'opacity-50',
        )}
      />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-full overflow-hidden rounded-2xl">
        <span
          className={cn(
            'absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-1000 ease-out',
            hover ? 'translate-x-[320%]' : 'translate-x-0',
          )}
        />
      </span>
      <CardBrackets lit={lit} />

      <div className="relative min-h-0 flex-1">
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            lit ? 'opacity-100' : 'opacity-60',
          )}
          style={{ background: 'radial-gradient(60% 70% at 40% 60%, rgb(var(--accent) / 0.28), transparent 70%)' }}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-grid opacity-40"
          style={{
            backgroundSize: '18px 18px',
            maskImage: 'linear-gradient(to top, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
          }}
        />
        <ProjectIllustration
          kind={project.kind}
          hover={hover || (focused && live)}
          className="absolute left-0 top-2 h-[calc(100%-0.25rem)] w-[88%] drop-shadow-[0_0_10px_rgb(var(--accent)/0.45)]"
        />
      </div>

      {/* arrow affordance (the slot's stretched button is the real control) */}
      <span
        aria-hidden
        className={cn(
          'absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border transition-all duration-300',
          lit
            ? 'border-accent bg-accent/25 text-ink shadow-glow-sm'
            : 'border-accent/45 bg-deep/50 text-accent',
        )}
      >
        <ArrowRight className={cn('h-4 w-4 transition-transform duration-300', hover && 'translate-x-0.5')} />
      </span>

      <div className="relative flex shrink-0 flex-col px-4 pb-3.5">
        <h3
          className="line-clamp-2 font-sans font-bold leading-[1.08] tracking-[0.01em] text-ink"
          style={{ fontSize: title, minHeight: title * 1.08 * 2 }}
        >
          {project.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 leading-snug text-muted" style={{ fontSize: body }}>
          {project.short}
        </p>
        <div className="mt-2.5 flex flex-nowrap gap-1.5 overflow-hidden">
          {project.tags.map((t) => (
            <Chip
              key={t}
              size="xs"
              active={focused}
              className={cn('shrink-0 normal-case', roomy ? 'px-2.5 py-1 text-[10.5px] tracking-[0.04em]' : 'tracking-[0.02em]')}
            >
              {t}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}

function CardBrackets({ lit }: { lit: boolean }) {
  const base = cn(
    'pointer-events-none absolute border-accent transition-all duration-500',
    lit ? 'h-4 w-4 opacity-100' : 'h-3 w-3 opacity-60',
  )
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
