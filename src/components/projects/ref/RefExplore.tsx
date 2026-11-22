import { PROJECTS_COPY } from '@/data/projects'

/**
 * "Explore My Portfolio" is part of the plate (the render's own disc and
 * label); this is the live control laid over it. Hover and focus add light
 * on top (screen blend), so the photoreal disc is never painted over.
 */
export function RefExplore({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${PROJECTS_COPY.pedestal}: jump to the case study index`}
      className="group absolute left-[604px] top-[796px] h-[92px] w-[478px] rounded-[50%] outline-none"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[50%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          mixBlendMode: 'screen',
          background: 'radial-gradient(55% 60% at 50% 45%, rgb(60 200 240 / 0.4), rgb(40 180 230 / 0.12) 60%, transparent 75%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[6%] bottom-[10%] h-[34%] rounded-[50%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ mixBlendMode: 'screen', boxShadow: '0 6px 18px -2px rgb(80 230 255 / 0.9)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-[50%] border-2 border-accent3/0 transition-colors group-focus-visible:border-accent3/80"
      />
    </button>
  )
}
