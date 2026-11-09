import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HoloModalProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  icon?: LucideIcon
  /** right-aligned status chip in the header */
  badge?: string
  children: ReactNode
  /** pinned below the scrollable body (e.g. prev/next navigation) */
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
  /** reading-progress bar tied to the body's scroll position */
  progress?: boolean
  /** when this changes the body scrolls back to the top (paging between items) */
  contentKey?: string | number
  bodyClassName?: string
}

const WIDTH = {
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Holographic dialog: portals to <body>, flips in on a 3D hinge, traps focus,
 * closes on Escape / backdrop click, locks page scroll and restores focus to
 * whatever opened it.
 */
export function HoloModal(props: HoloModalProps) {
  return createPortal(
    <AnimatePresence>{props.open && <ModalPanel key="holo-modal" {...props} />}</AnimatePresence>,
    document.body,
  )
}

function ModalPanel({
  onClose,
  title,
  eyebrow,
  icon: Icon,
  badge,
  children,
  footer,
  size = 'lg',
  progress = false,
  contentKey,
  bodyClassName,
}: HoloModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()

  const { scrollYProgress } = useScroll({ container: bodyRef })
  const bar = useSpring(scrollYProgress, { stiffness: 220, damping: 30, mass: 0.3 })

  // focus in, trap Tab, close on Escape, restore focus on unmount
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus?.({ preventScroll: true })
    }
  }, [])

  // lock page scroll without the layout jumping by the scrollbar width
  useEffect(() => {
    const { body } = document
    const gap = window.innerWidth - document.documentElement.clientWidth
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`
    return () => {
      body.style.overflow = prev.overflow
      body.style.paddingRight = prev.paddingRight
    }
  }, [])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [contentKey])

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-2 sm:items-center sm:p-6">
      {/* backdrop */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-deep/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={() => closeRef.current()}
        style={{
          backgroundImage:
            'radial-gradient(60rem 40rem at 50% 30%, rgb(var(--accent) / 0.14), transparent 70%)',
        }}
      />

      <div className="relative w-full" style={{ perspective: 1600 }}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          initial={{ opacity: 0, y: 56, rotateX: 16, scale: 0.94, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 32, rotateX: -10, scale: 0.96, filter: 'blur(8px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'glass-strong relative mx-auto flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-clip rounded-2xl shadow-glow-lg outline-none sm:max-h-[88vh]',
            WIDTH[size],
          )}
        >
          {/* decor: scanlines, hairline, corner brackets, opening sweep */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgb(var(--ink)) 0 1px, transparent 1px 4px)',
            }}
          />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          <Brackets />
          {/* a full-size layer slid by transform (compositor only; reduced motion skips it) */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            initial={{ y: '-10%', opacity: 0 }}
            animate={{ y: '110%', opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.1 }}
          >
            <span className="absolute inset-x-0 top-0 h-16 -translate-y-1/2 bg-gradient-to-b from-transparent via-accent/25 to-transparent" />
          </motion.span>

          {progress && (
            <motion.span
              aria-hidden
              className="absolute inset-x-0 top-0 z-20 h-[2px] origin-left bg-gradient-to-r from-accent via-accent2 to-accent3 shadow-glow-sm"
              style={{ scaleX: bar }}
            />
          )}

          {/* header */}
          <div className="relative flex items-center gap-3 border-b border-accent/15 px-4 py-3.5 sm:px-6 sm:py-4">
            {Icon && (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-glow-sm">
                <Icon className="h-[18px] w-[18px]" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              {eyebrow && (
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
                  {eyebrow}
                </p>
              )}
              <h2
                id={titleId}
                className="line-clamp-2 font-display text-[17px] font-bold leading-tight tracking-wide text-ink sm:truncate sm:text-xl"
              >
                {title}
              </h2>
            </div>
            {badge && (
              <span className="hidden shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent sm:inline-block">
                {badge}
              </span>
            )}
            <button
              type="button"
              onClick={() => closeRef.current()}
              aria-label="Close dialog"
              className="group grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/5 text-muted transition-all duration-300 hover:border-accent hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm focus-visible:border-accent focus-visible:text-ink"
            >
              <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>

          {/* body */}
          <div
            ref={bodyRef}
            className={cn(
              'holo-scroll relative flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6',
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer && (
            <div className="relative border-t border-accent/15 px-4 py-3 sm:px-6">{footer}</div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Brackets() {
  const base = 'pointer-events-none absolute h-4 w-4 border-accent/70'
  return (
    <>
      <span aria-hidden className={cn(base, 'left-2 top-2 border-l border-t')} />
      <span aria-hidden className={cn(base, 'right-2 top-2 border-r border-t')} />
      <span aria-hidden className={cn(base, 'bottom-2 left-2 border-b border-l')} />
      <span aria-hidden className={cn(base, 'bottom-2 right-2 border-b border-r')} />
    </>
  )
}
