import { useId } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { CAPABILITIES, type Capability } from '@/data/expertise'
import { CAPABILITY_HOOKS, HOME_BLOCKS } from '@/data/home'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { BlockFooterAction, BlockHeader } from './BlockHeader'
import { EASE } from './shared'

const COPY = HOME_BLOCKS.capabilities
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
const TITLE = COPY.title.replace('{count}', WORDS[CAPABILITIES.length] ?? String(CAPABILITIES.length))

/** First clause of a capability's body, used when no hand-written hook exists. */
function hookFor(cap: Capability) {
  return CAPABILITY_HOOKS[cap.title] ?? `${cap.body.split(/\s[—–-]\s|[.:;]/)[0].trim()}.`
}

/** "What I do": the six capabilities from expertise.ts as one compact strip. */
export function CapabilityStrip() {
  const { setSection } = useTheme()
  const headingId = useId()
  const action = { label: COPY.action, onClick: () => setSection('expertise') }

  return (
    <section aria-labelledby={headingId}>
      <BlockHeader
        index={1}
        eyebrow={COPY.eyebrow}
        title={TITLE}
        subtitle={COPY.subtitle}
        headingId={headingId}
        action={action}
      />

      <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {CAPABILITIES.map((cap, i) => (
          <CapabilityCell
            key={cap.title}
            cap={cap}
            index={i}
            total={CAPABILITIES.length}
            onOpen={action.onClick}
          />
        ))}
      </ul>

      <BlockFooterAction action={action} />
    </section>
  )
}

function CapabilityCell({
  cap,
  index,
  total,
  onOpen,
}: {
  cap: Capability
  index: number
  total: number
  onOpen: () => void
}) {
  const Icon = cap.icon
  const still = useReducedMotion()
  const n = (v: number) => String(v).padStart(2, '0')

  return (
    <motion.li
      initial={still ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.65, delay: 0.05 + (index % 6) * 0.06, ease: EASE }}
      className="min-w-0"
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'group relative flex h-full w-full items-start gap-3.5 overflow-hidden rounded-xl border border-accent/20 p-3.5 text-left sm:flex-col sm:gap-0 sm:p-5',
          'transition-[transform,border-color,box-shadow,background-color] duration-500 ease-out',
          'hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.16)_inset,0_0_38px_-12px_rgb(var(--accent)/0.65)]',
          'focus-visible:-translate-y-1 focus-visible:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-deep',
        )}
        style={{
          background:
            'linear-gradient(160deg, rgb(var(--surface) / 0.82), rgb(var(--deep) / 0.74) 70%), radial-gradient(120% 80% at 0% 0%, rgb(var(--accent) / 0.1), transparent 60%)',
        }}
      >
        {/* decor: hairline, sweep, hover wash */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[320%] group-focus-visible:translate-x-[320%]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-500 group-hover:bg-accent/[0.05]"
        />

        <span className="relative flex w-auto shrink-0 items-start justify-between sm:w-full">
          <span className="grid h-10 w-10 place-items-center rounded-xl border sm:h-11 sm:w-11 border-accent/35 bg-accent/10 text-accent shadow-glow-sm transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 group-focus-visible:scale-110">
            <Icon aria-hidden className="h-5 w-5" />
          </span>
          {/* index turns into an arrow on hover */}
          <span aria-hidden className="relative hidden h-6 w-10 sm:block">
            <span className="absolute right-0 top-1 font-mono text-[10px] tracking-[0.16em] text-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-0 group-focus-visible:opacity-0">
              {n(index + 1)}/{n(total)}
            </span>
            <ArrowUpRight className="absolute right-0 top-0.5 h-4 w-4 translate-y-1 text-accent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100" />
          </span>
        </span>

        <span className="relative flex min-w-0 flex-1 flex-col sm:mt-4 sm:w-full">
          <span className="flex items-start justify-between gap-3">
            <span className="font-display text-[14.5px] font-bold leading-snug tracking-wide text-ink transition-colors duration-300 group-hover:text-accent3">
              {cap.title}
            </span>
            <ArrowUpRight aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:hidden" />
          </span>
          <span className="mt-1 text-[14px] leading-snug text-muted sm:mt-2">{hookFor(cap)}</span>
          {/* phones keep to title + hook; the tool names start at sm */}
          <span className="hidden sm:mt-auto sm:block sm:pt-4">
            {/* two lines reserved at xl, where the narrow cells wrap, so every divider lines up */}
            <span className="block border-t border-accent/15 pt-2.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-muted/90 transition-colors duration-300 group-hover:text-accent xl:min-h-[calc(3.25em+0.625rem)]">
              {cap.tags.join(' · ')}
            </span>
          </span>
          <span className="sr-only"> (opens Expertise)</span>
        </span>
      </button>
    </motion.li>
  )
}
