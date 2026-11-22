import type { Project } from '@/data/projects'
import { cn } from '@/lib/utils'
import { ProjectIllustration } from '../Illustrations'
import { CARD_BLANK, CARD_FACE } from './assets'

/** card face size in stage px (the centre card of the reference: 716–977 × 555–772) */
export const REF_CARD_W = 261
export const REF_CARD_H = 217

/**
 * Landscape glass card of the reference render. The face is the render's own
 * card (glass, rim, 3D art and arrow button) un-warped to a flat texture with
 * its text removed; title, blurb and tags are live text laid where the
 * render's were. Studies the render never showed get a blank face plus their
 * drawn illustration. Interaction lives in the carousel slot that wraps it.
 */
export function RefCard({ project, focused, hover, live }: { project: Project; focused: boolean; hover: boolean; live: boolean }) {
  const lit = focused || hover
  const face = CARD_FACE[project.id]
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[15px] font-ui transition-[box-shadow] duration-500"
      style={{
        boxShadow: lit
          ? '0 0 12px rgb(var(--accent) / 0.7), 0 0 34px rgb(var(--accent) / 0.32), 0 24px 50px -20px rgb(0 0 0 / 0.95)'
          : '0 0 9px rgb(var(--accent) / 0.38), 0 0 22px rgb(var(--accent) / 0.14), 0 24px 50px -20px rgb(0 0 0 / 0.95)',
      }}
    >
      <img
        aria-hidden
        alt=""
        src={face ?? CARD_BLANK}
        width={REF_CARD_W}
        height={REF_CARD_H}
        draggable={false}
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      />
      {!face && (
        <ProjectIllustration
          kind={project.kind}
          hover={hover || (focused && live)}
          className="absolute -left-[24px] -top-[14px] h-[112px] w-[210px] drop-shadow-[0_0_10px_rgb(var(--accent)/0.55)]"
        />
      )}

      {/* additive light only, so the photoreal face is never painted over */}
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ mixBlendMode: 'screen' }}>
        {/* focus / hover: the rim lights up */}
        <span
          className="absolute inset-0 rounded-[15px] transition-opacity duration-500"
          style={{ boxShadow: 'inset 0 0 0 1.5px rgb(120 235 255 / 0.85), inset 0 0 18px rgb(60 210 245 / 0.35)', opacity: lit ? 1 : 0 }}
        />
        {/* the arrow button glows */}
        <span
          className="absolute right-[14px] top-[16px] h-[36px] w-[36px] rounded-[10px] transition-opacity duration-300"
          style={{ boxShadow: '0 0 14px rgb(70 225 255 / 0.9), inset 0 0 10px rgb(70 225 255 / 0.6)', opacity: hover ? 1 : 0 }}
        />
        {/* light sweeps across the glass */}
        <span
          className={cn(
            'absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent transition-transform duration-1000 ease-out',
            hover ? 'translate-x-[320%]' : 'translate-x-0',
          )}
        />
      </span>

      {/* title and blurb flow together: a one-line title pulls its blurb up instead of leaving a gap */}
      <div className="absolute left-[19px] right-[8px] top-[80px]">
        <h3 className="mr-[16px] line-clamp-2 text-balance text-[19.5px] font-semibold leading-[23px] text-ink [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
          {project.title}
        </h3>
        <p className="mt-[2px] line-clamp-2 text-[14.8px] leading-[19.5px] text-[rgb(206_220_228)]">
          {/* a one-line float narrows only the first line, so blurbs break like the render's
              ("Analyze and reconstruct a / private web API.") while the second line keeps full width */}
          <span aria-hidden className="float-right h-[19.5px] w-[47px]" />
          {project.short}
        </p>
      </div>
      <div className="absolute bottom-[15px] left-[17px] right-[12px] flex gap-[8px] overflow-hidden">
        {project.tags.map((t) => (
          <span
            key={t}
            className={cn(
              'shrink-0 rounded-[8px] border px-[11px] py-[3px] text-[13.5px] leading-[18px] text-ink/95 transition-colors duration-300',
              lit ? 'border-accent/45 bg-accent/[0.09]' : 'border-white/[0.16] bg-white/[0.05]',
            )}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
