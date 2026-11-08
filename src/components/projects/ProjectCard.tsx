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
  compact?: boolean
}

/** Glass project card face (interaction lives in the carousel slot that wraps it). */
export function ProjectCard({ project, focused, hover, compact }: Props) {
  const lit = focused || hover
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
      {/* glass decor */}
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

      {/* illustration */}
      <div className={cn('relative shrink-0', compact ? 'h-[40%]' : 'h-[43%]')}>
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
          hover={lit}
          className="absolute left-1 top-3 h-[calc(100%-0.5rem)] w-[78%] drop-shadow-[0_0_10px_rgb(var(--accent)/0.45)]"
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

      {/* copy */}
      <div className={cn('relative flex min-h-0 flex-1 flex-col', compact ? 'px-4 pb-4' : 'px-4 pb-3.5')}>
        <h3
          className={cn(
            'line-clamp-2 font-sans font-bold leading-[1.08] tracking-[0.01em] text-ink transition-colors duration-300',
            compact ? 'text-[20px]' : 'text-[clamp(17px,1.32vw,22px)]',
          )}
        >
          {project.title}
        </h3>
        <p
          className={cn(
            'mt-1.5 line-clamp-2 leading-snug text-muted',
            compact ? 'text-[14px]' : 'text-[clamp(12.5px,0.94vw,15px)]',
          )}
        >
          {project.short}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2.5">
          {project.tags.map((t) => (
            <Chip key={t} size="xs" active={focused} className="normal-case tracking-[0.06em]">
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
