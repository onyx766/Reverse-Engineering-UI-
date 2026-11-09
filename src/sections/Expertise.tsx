import { useEffect, useId, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Binary,
  Bug,
  FileCode2,
  GitBranch,
  KeyRound,
  Layers,
  ListTree,
  Network,
  Pause,
  Play,
  type LucideIcon,
} from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { Chip } from '@/components/ui/Chip'
import { LazyMount } from '@/components/ui/LazyMount'
import { Disassembly } from '@/components/widgets/Disassembly'
import { CfgGraph } from '@/components/widgets/CfgGraph'
import { HexDump } from '@/components/widgets/HexDump'
import { ProtocolFlow } from '@/components/widgets/ProtocolFlow'
import { DebuggerView } from '@/components/widgets/DebuggerView'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import {
  CAPABILITIES,
  CASE_FILE,
  CFG_BLOCKS,
  CFG_EDGES,
  CFG_VIEWBOX,
  DISASM,
  EXCHANGES,
  FUNCTION_INFO,
  HEX,
  HEX_DECODED,
  HEX_FIELDS,
  HEX_LABELS,
  PANELS,
  PLATFORMS,
  PROTOCOL_TAGS,
  REGS,
  SECTION_COPY,
  SIGNER,
  TRACE,
  type Capability,
  type Platform,
  type PlatformGroup,
} from '@/data/expertise'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** HoloPanel header height (h-8 icon + py-3 + 1px rule): lets a panel body fill a stretched grid row. */
const PANEL_BODY_FILL = 'lg:flex lg:min-h-[calc(100%-57px)] lg:flex-col'

export function Expertise() {
  const roomy = useMinWidth(420)
  const sm = useMinWidth(640)
  const lg = useMinWidth(1024)
  const xl = useMinWidth(1280)
  // placeholder heights a little under the measured ones; LazyMount drops them once the
  // content mounts, so a short estimate never leaves dead space behind
  const capsMinH = xl ? 920 : lg ? 1000 : sm ? 1250 : 2200

  return (
    <Section id="expertise">
      {/* soft vignette: the background hologram stays visible but never runs through the copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-[27rem] max-w-4xl bg-[radial-gradient(closest-side,rgb(var(--deep)/0.72),rgb(var(--deep)/0.35)_55%,transparent)] sm:top-28"
      />

      <SectionHeading
        eyebrow={SECTION_COPY.eyebrow}
        title={SECTION_COPY.title}
        subtitle={SECTION_COPY.subtitle}
        className="mx-auto"
      />

      <CaseBrief />

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
        <HoloPanel
          title={PANELS.binary.title}
          icon={Binary}
          badge={roomy ? PANELS.binary.badge : undefined}
          from="left"
          delay={0.04}
          tilt={4}
          className="min-w-0 lg:col-span-12 xl:col-span-7"
        >
          <BinaryAnalysis />
        </HoloPanel>

        <HoloPanel
          title={PANELS.protocol.title}
          icon={Network}
          badge={roomy ? PANELS.protocol.badge : undefined}
          from="right"
          delay={0.1}
          tilt={5}
          className="min-w-0 lg:col-span-6 xl:col-span-5"
        >
          <ProtocolFlow
            exchanges={EXCHANGES}
            client={PANELS.protocol.client}
            server={PANELS.protocol.server}
          />
          <SignerSnippet />
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-accent/15 pt-3">
            {PROTOCOL_TAGS.map((t) => (
              <Chip key={t} size="xs">
                {t}
              </Chip>
            ))}
          </div>
        </HoloPanel>

        {/* row 2 is below the fold at every size: it mounts in its own render after the first view */}
        <LazyMount minHeight={420} className="min-w-0 lg:col-span-6 xl:col-span-5">
          <HoloPanel
            title={PANELS.debugger.title}
            icon={Bug}
            badge={roomy ? PANELS.debugger.badge : undefined}
            from="left"
            delay={0.06}
            tilt={5}
            className="h-full"
            bodyClassName={PANEL_BODY_FILL}
          >
            <DebuggerView regs={REGS} trace={TRACE} fill />
          </HoloPanel>
        </LazyMount>

        <LazyMount minHeight={450} className="min-w-0 lg:col-span-12 xl:col-span-7">
          <HoloPanel
            title={PANELS.format.title}
            icon={FileCode2}
            badge={roomy ? PANELS.format.badge : undefined}
            from="right"
            delay={0.12}
            tilt={4}
            className="h-full"
          >
            <HexDump rows={HEX} fields={HEX_FIELDS} labels={HEX_LABELS} decoded={HEX_DECODED} structure />
          </HoloPanel>
        </LazyMount>
      </div>

      {/* far below the fold: mounts at idle once the switch has settled, or as you scroll near it */}
      <LazyMount minHeight={capsMinH} margin="300px 0px" className="mt-16 sm:mt-20">
        <SubHeading title={SECTION_COPY.capabilities.title} meta={SECTION_COPY.capabilities.meta} />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <CapabilityCard key={c.title} cap={c} index={i} total={CAPABILITIES.length} />
          ))}
        </div>

        <PlatformStrip />
      </LazyMount>
    </Section>
  )
}

/** Viewport-width check that is right on the first render (panel badges, lazy placeholders). */
function useMinWidth(px: number) {
  const query = `(min-width: ${px}px)`
  const [ok, setOk] = useState(() => typeof window === 'undefined' || window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setOk(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return ok
}

function CaseBrief() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
      className="glass relative mx-auto mt-9 flex max-w-5xl flex-col gap-2.5 overflow-hidden rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-accent/[0.08] to-transparent"
        style={{ animationDuration: '7s' }}
      />
      <span className="relative inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent sm:self-center">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        {CASE_FILE.id}
      </span>
      <p className="relative text-pretty text-[14px] leading-snug text-muted">
        <span className="font-semibold text-ink">{CASE_FILE.title}</span> {CASE_FILE.summary}
      </p>
    </motion.div>
  )
}

/** Listing and graph share hover state, like IDA's synchronised text and graph views. */
function BinaryAnalysis() {
  const [graphBlock, setGraphBlock] = useState<string | null>(null)
  const [rowAddr, setRowAddr] = useState<string | null>(null)
  const highlight = useMemo(
    () => (graphBlock ? DISASM.filter((i) => i.block === graphBlock).map((i) => i.addr) : undefined),
    [graphBlock],
  )
  const rowBlock = rowAddr ? (DISASM.find((i) => i.addr === rowAddr)?.block ?? null) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-0">
        <div className="min-w-0 md:pr-5">
          <PaneLabel icon={ListTree} text={PANELS.binary.listing} hint="jumps are clickable" />
          <Disassembly
            code={DISASM}
            highlight={highlight}
            onFocusAddr={setRowAddr}
            label="rfft_check disassembly"
          />
        </div>
        <div className="min-w-0 border-t border-accent/15 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <PaneLabel icon={GitBranch} text={PANELS.binary.graph} hint="select a block" narrow />
          <CfgGraph
            blocks={CFG_BLOCKS}
            edges={CFG_EDGES}
            viewBox={CFG_VIEWBOX}
            active={rowBlock}
            onActiveChange={setGraphBlock}
            legend
            className="mx-auto max-w-[330px]"
          />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-accent/15 pt-3 font-mono text-[10px] sm:grid-cols-3">
        {FUNCTION_INFO.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: EASE }}
            className="min-w-0"
          >
            <dt className="text-[9px] uppercase tracking-[0.16em] text-muted/60">{f.label}</dt>
            <dd className="truncate text-ink/90">{f.value}</dd>
          </motion.div>
        ))}
      </dl>
    </div>
  )
}

function PaneLabel({
  icon: Icon,
  text,
  hint,
  narrow = false,
}: {
  icon: LucideIcon
  text: string
  hint: string
  /** the pane is squeezed at xl, so the hint only returns once there is room */
  narrow?: boolean
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
      <Icon className="h-3 w-3 shrink-0 text-accent" />
      <span className="truncate">{text}</span>
      <span
        className={cn(
          'ml-auto hidden shrink-0 normal-case tracking-normal text-muted/55 sm:inline',
          // the graph pane sits beside the listing (and is squeezed) at md and again at xl
          narrow && 'md:hidden lg:inline xl:hidden min-[1400px]:inline',
        )}
      >
        {hint}
      </span>
    </div>
  )
}

const PY_TOKEN = /(#.*$|f?"(?:[^"\\]|\\.)*"|\b(?:def|return|import|from)\b|\b\d+\b|[A-Za-z_][\w.]*(?=\())/g

function highlightPy(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of line.matchAll(PY_TOKEN)) {
    const at = m.index ?? 0
    const t = m[0]
    if (at > last) out.push(line.slice(last, at))
    const cls = t.startsWith('#')
      ? 'italic text-muted/70'
      : t.startsWith('"') || t.startsWith('f"')
        ? 'text-accent3'
        : /^(def|return|import|from)$/.test(t)
          ? 'text-accent2'
          : /^\d/.test(t)
            ? 'text-accent3'
            : 'text-accent'
    out.push(
      <span key={at} className={cls}>
        {t}
      </span>,
    )
    last = at + t.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

function SignerSnippet() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
      className="group/code relative mt-4 overflow-hidden rounded-lg border border-accent/20 bg-deep/60 transition-colors duration-300 hover:border-accent/45"
    >
      <div className="flex items-center gap-2 border-b border-accent/15 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
        <KeyRound className="h-3 w-3 shrink-0 text-accent transition-transform duration-300 group-hover/code:-rotate-12" />
        <span className="shrink-0">{SIGNER.title}</span>
        <span className="ml-auto truncate normal-case tracking-normal text-muted/60">{SIGNER.source}</span>
      </div>
      <pre
        tabIndex={0}
        aria-label="Recovered request-signing routine, Python"
        className="holo-scroll overflow-x-auto px-2.5 py-2 font-mono text-[10px] leading-[1.65] text-ink/90 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent/60 sm:px-3 sm:text-[10.5px]"
      >
        <code>
          {SIGNER.lines.map((l, i) => (
            <span key={i} className="block min-h-[1.65em] whitespace-pre">
              {highlightPy(l)}
            </span>
          ))}
        </code>
      </pre>
    </motion.div>
  )
}

function SubHeading({ title, meta }: { title: string; meta: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE }}
      className="flex items-center gap-3"
    >
      <span aria-hidden className="h-2 w-2 shrink-0 rotate-45 border border-accent bg-accent/30 shadow-glow-sm" />
      <h3 className="shrink-0 font-display text-[13px] font-bold uppercase tracking-[0.28em] text-ink">
        {title}
      </h3>
      <span aria-hidden className="h-px min-w-6 flex-1 bg-gradient-to-r from-accent/50 via-accent/15 to-transparent" />
      <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:inline">
        {meta}
      </span>
    </motion.div>
  )
}

function CapabilityCard({ cap, index, total }: { cap: Capability; index: number; total: number }) {
  const reduced = useReducedMotion()
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const spring = { stiffness: 240, damping: 22, mass: 0.5 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring)
  const glare = useTransform(
    [gx, gy],
    ([x, y]: number[]) =>
      `radial-gradient(20rem 15rem at ${x}% ${y}%, rgb(var(--accent) / 0.2), transparent 62%)`,
  )

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduced || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    mx.set(px - 0.5)
    my.set(py - 0.5)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
    gx.set(50)
    gy.set(50)
  }

  const Icon = cap.icon
  const n = (v: number) => String(v).padStart(2, '0')
  const bracket =
    'pointer-events-none absolute h-3 w-3 border-accent/60 transition-all duration-500 group-hover/cap:h-4 group-hover/cap:w-4 group-hover/cap:border-accent'

  return (
    <motion.article
      initial={{ opacity: 0, y: 34, rotateX: -12, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, delay: (index % 3) * 0.08, ease: EASE }}
      style={{ transformPerspective: 1000 }}
      className="group/cap relative h-full"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-xl bg-accent/25 opacity-0 blur-2xl transition-opacity duration-500 group-hover/cap:opacity-100"
      />
      {/* focusable so keyboard users get the same deliverables reveal as a hover */}
      <motion.div
        ref={cardRef}
        tabIndex={0}
        role="group"
        aria-labelledby={titleId}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileHover={reduced ? undefined : { y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        className="glass relative flex h-full flex-col overflow-hidden rounded-xl p-5 group-hover/cap:border-accent/60"
      >
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/cap:opacity-100"
            style={{ background: glare }}
          />
        )}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-1000 ease-out group-hover/cap:translate-x-full"
        />
        <span aria-hidden className={cn(bracket, 'left-2 top-2 border-l border-t')} />
        <span aria-hidden className={cn(bracket, 'right-2 top-2 border-r border-t')} />
        <span aria-hidden className={cn(bracket, 'bottom-2 left-2 border-b border-l')} />
        <span aria-hidden className={cn(bracket, 'bottom-2 right-2 border-b border-r')} />

        <div className="relative flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-accent shadow-glow-sm transition-transform duration-500 group-hover/cap:-rotate-6 group-hover/cap:scale-110">
            <Icon className="h-5 w-5" />
          </span>
          <span className="pt-1 font-mono text-[10px] tracking-[0.16em] text-muted transition-colors duration-300 group-hover/cap:text-accent">
            {n(index + 1)} / {n(total)}
          </span>
        </div>

        <h4 id={titleId} className="relative mt-4 font-display text-[15px] font-bold tracking-wide text-ink">
          {cap.title}
        </h4>
        <p className="relative mt-2 text-[14px] leading-relaxed text-muted">{cap.body}</p>
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {cap.tags.map((t) => (
            <Chip key={t} size="xs">
              {t}
            </Chip>
          ))}
        </div>

        <div className="relative mt-auto pt-4">
          <div className="grid border-t border-accent/15 pt-3 font-mono text-[10.5px] leading-relaxed">
            <p
              aria-hidden
              className="flex items-center gap-2 text-muted/60 transition-[opacity,transform] duration-500 [grid-area:1/1] group-focus-within/cap:-translate-y-1 group-focus-within/cap:opacity-0 group-hover/cap:-translate-y-1 group-hover/cap:opacity-0 [@media(hover:none)]:hidden"
            >
              <span className="text-accent/70">▸</span>
              typical deliverables
              <span className="inline-block h-3 w-1.5 animate-blink bg-accent/60" />
            </p>
            <p className="opacity-0 transition-[opacity,clip-path] duration-700 [clip-path:inset(0_100%_0_0)] [grid-area:1/1] group-focus-within/cap:opacity-100 group-focus-within/cap:[clip-path:inset(0_0_0_0)] group-hover/cap:opacity-100 group-hover/cap:[clip-path:inset(0_0_0_0)] [@media(hover:none)]:opacity-100 [@media(hover:none)]:[clip-path:inset(0_0_0_0)]">
              <span className="text-accent">▸ deliverables · </span>
              <span className="text-ink/85">{cap.deliverables}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.article>
  )
}

function PlatformStrip() {
  const reduced = useReducedMotion()
  const [halted, setHalted] = useState(false)
  const headingId = useId()
  const bracket = 'pointer-events-none absolute h-3.5 w-3.5 border-accent/70'

  return (
    <motion.section
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: 34, rotateX: -10, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, ease: EASE }}
      style={{ transformPerspective: 1200 }}
      className="glass relative mt-8 overflow-hidden rounded-2xl py-4 sm:mt-10 sm:py-5"
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span aria-hidden className={cn(bracket, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(bracket, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(bracket, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(bracket, 'bottom-2 right-2 border-b border-r')} />

      <div className="relative flex items-center gap-3 px-4 sm:px-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/35 bg-accent/10 text-accent shadow-glow-sm">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 id={headingId} className="font-display text-[15px] font-bold tracking-wide text-ink">
            {SECTION_COPY.platforms.title}
          </h3>
          <p className="hidden font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted sm:block">
            {SECTION_COPY.platforms.subtitle}
          </p>
        </div>
        {!reduced && (
          <button
            type="button"
            onClick={() => setHalted((h) => !h)}
            aria-label={halted ? 'Resume the platform ticker' : 'Pause the platform ticker'}
            title={halted ? 'Resume' : 'Pause'}
            className="group ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/[0.06] text-muted transition-all duration-300 hover:border-accent/70 hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm active:scale-95"
          >
            {halted ? (
              <Play className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <Pause className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            )}
          </button>
        )}
      </div>

      <div className="relative mt-3 flex flex-col gap-1 sm:mt-4">
        {PLATFORMS.map((g, i) => (
          <MarqueeRow key={g.id} group={g} reverse={i % 2 === 1} halted={halted} />
        ))}
      </div>
    </motion.section>
  )
}

/** Compositor-driven ticker; hovering a row eases its playback rate to zero instead of snapping. */
function MarqueeRow({
  group,
  reverse,
  halted,
}: {
  group: PlatformGroup
  reverse: boolean
  halted: boolean
}) {
  const viewRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const anim = useRef<Animation | null>(null)
  const inView = useInView(viewRef)
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const stopped = hovered || halted || !inView

  useEffect(() => {
    const el = trackRef.current
    if (!el || reduced || typeof el.animate !== 'function') return
    const a = el.animate(
      [{ transform: 'translate3d(0, 0, 0)' }, { transform: 'translate3d(-50%, 0, 0)' }],
      { duration: 9000 * group.items.length, iterations: Infinity, direction: reverse ? 'reverse' : 'normal' },
    )
    anim.current = a
    return () => {
      a.cancel()
      anim.current = null
    }
  }, [reduced, reverse, group.items.length])

  useEffect(() => {
    const a = anim.current
    if (!a) return
    const from = a.playbackRate
    const to = stopped ? 0 : 1
    if (from === to) return
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 500)
      a.playbackRate = from + (to - from) * (1 - (1 - p) ** 3)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stopped, reduced])

  const copies = reduced ? 1 : 4

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="shrink-0 px-4 font-mono text-[9.5px] uppercase tracking-[0.2em] text-accent sm:w-36 sm:pl-6 sm:pr-0">
        {group.label}
      </span>
      <div
        ref={viewRef}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className={cn(
          'relative min-w-0 flex-1',
          !reduced &&
            'overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]',
        )}
      >
        <ul
          ref={trackRef}
          className={cn('flex py-2', reduced ? 'flex-wrap gap-y-2 px-4 sm:px-0' : 'w-max')}
          aria-label={group.label}
        >
          {Array.from({ length: copies }, (_, c) =>
            group.items.map((p) => <PlatformChip key={`${c}-${p.name}`} p={p} hidden={c > 0} />),
          )}
        </ul>
      </div>
    </div>
  )
}

function PlatformChip({ p, hidden }: { p: Platform; hidden: boolean }) {
  const Icon = p.icon
  return (
    <li aria-hidden={hidden || undefined} className="group/chip mr-3 shrink-0">
      <div className="relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-accent/25 bg-surface/70 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/15 hover:shadow-glow-sm">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover/chip:translate-x-full"
        />
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-deep/60 text-accent transition-transform duration-500 group-hover/chip:-rotate-6 group-hover/chip:scale-110">
          <Icon className="h-4 w-4" />
        </span>
        <span className="relative flex flex-col leading-tight">
          <span className="whitespace-nowrap font-display text-[12.5px] font-bold tracking-wide text-ink">
            {p.name}
          </span>
          <span className="whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover/chip:text-accent3">
            {p.detail}
          </span>
        </span>
      </div>
    </li>
  )
}
