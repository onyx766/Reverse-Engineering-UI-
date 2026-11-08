import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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
  action?: { label: string; onClick: () => void }
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

/**
 * Section-scoped toasts. The stack is portalled to <body> because the page
 * wrapper's filter/perspective would otherwise trap `position: fixed`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id))
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
  }, [])

  const push = useCallback<Push>(
    (input) => {
      const id = ++seq.current
      setItems((list) => [...list.slice(-2), { ...input, id }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), input.duration ?? (input.action ? 5200 : 2800)),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
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
          <motion.div
            key={t.id}
            layout={!reduced}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.94, rotateX: -18 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 700 }}
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
                <span className="mt-0.5 block truncate font-mono text-[11px] text-muted">{t.body}</span>
              )}
            </span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
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
            {!reduced && (
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-accent via-accent2 to-accent3"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (t.duration ?? (t.action ? 5200 : 2800)) / 1000, ease: 'linear' }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
