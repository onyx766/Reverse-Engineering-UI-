import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface ToastInput {
  title: string
  body?: string
  tone?: 'ok' | 'warn'
  action?: { label: string; onClick: (e: MouseEvent) => void }
  duration?: number
}

interface ToastItem extends ToastInput {
  id: number
}

type Push = (t: ToastInput) => void

const Ctx = createContext<Push>(() => {})

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(Ctx)
}

/** default lifetimes: long enough to read the body, longer when there is an action to reach */
const lifetime = (t: ToastInput) => t.duration ?? (t.action ? 6500 : 3200)

/**
 * Section-scoped toasts. The stack is portalled to <body> because the page
 * wrapper's filter/perspective would otherwise trap `position: fixed`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback<Push>((input) => {
    const id = ++seq.current
    setItems((list) => [...list.slice(-2), { ...input, id }])
  }, [])

  return (
    <Ctx.Provider value={push}>
      {children}
      {createPortal(<ToastStack items={items} onDismiss={dismiss} />, document.body)}
    </Ctx.Provider>
  )
}

function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  const reduced = useReducedMotion()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2.5 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <ToastCard key={t.id} toast={t} reduced={reduced} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * One toast. Its countdown bar is a WAAPI animation that doubles as the timer,
 * so hovering it with a mouse or moving focus into it pauses both together
 * (WCAG 2.2.1); Escape dismisses it.
 */
function ToastCard({
  toast: t,
  reduced,
  onDismiss,
}: {
  toast: ToastItem
  reduced: boolean
  onDismiss: (id: number) => void
}) {
  const barRef = useRef<HTMLSpanElement>(null)
  const anim = useRef<Animation | null>(null)
  const holds = useRef({ hover: false, focus: false })
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  useEffect(() => {
    const life = lifetime(t)
    const el = barRef.current
    if (!el || typeof el.animate !== 'function') {
      const id = setTimeout(() => dismissRef.current(t.id), life)
      return () => clearTimeout(id)
    }
    const a = el.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
      duration: life,
      easing: 'linear',
      fill: 'forwards',
    })
    a.onfinish = () => dismissRef.current(t.id)
    anim.current = a
    return () => {
      a.onfinish = null
      a.cancel()
    }
    // runs once: a toast's content and lifetime never change after it is pushed
  }, [])

  const sync = () => {
    const a = anim.current
    if (!a) return
    if (holds.current.hover || holds.current.focus) a.pause()
    else if (a.playState === 'paused') a.play()
  }
  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    holds.current.hover = true
    sync()
  }
  const onPointerLeave = () => {
    holds.current.hover = false
    sync()
  }
  const onFocus = () => {
    holds.current.focus = true
    sync()
  }
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    holds.current.focus = false
    sync()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onDismiss(t.id)
  }

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.94, rotateX: -18 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 700 }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="glass-strong pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl py-3 pl-3.5 pr-2 shadow-glow"
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span
        aria-hidden
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg border',
          t.tone === 'warn'
            ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
            : 'border-accent/50 bg-accent/15 text-accent shadow-glow-sm',
        )}
      >
        {t.tone === 'warn' ? <TriangleAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[12.5px] font-bold uppercase tracking-[0.12em] text-ink">
          {t.title}
        </span>
        {t.body && (
          <span className="mt-0.5 line-clamp-3 break-words font-mono text-[11px] leading-snug text-muted">
            {t.body}
          </span>
        )}
      </span>
      {t.action && (
        <button
          type="button"
          onClick={(e) => {
            t.action?.onClick(e)
            onDismiss(t.id)
          }}
          className="h-10 shrink-0 rounded-lg border border-accent/40 bg-accent/10 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent transition-colors duration-300 hover:border-accent hover:bg-accent/20 hover:text-ink"
        >
          {t.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className="group grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-300 hover:bg-accent/10 hover:text-ink"
      >
        <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
      </button>
      <span
        ref={barRef}
        aria-hidden
        className={cn(
          'absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-accent via-accent2 to-accent3',
          reduced && 'opacity-0',
        )}
      />
    </motion.div>
  )
}
