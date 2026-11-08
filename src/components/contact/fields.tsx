import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShieldCheck, TriangleAlert, WandSparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const INPUT_BASE =
  'w-full rounded-xl border bg-deep/55 text-base text-ink outline-none placeholder:text-muted/45 transition-[border-color,background-color,box-shadow] duration-300 focus-visible:outline-none'

const inputTone = (invalid: boolean) =>
  invalid
    ? 'border-rose-400/60 hover:border-rose-400/80 focus:border-rose-400 focus:bg-deep/75 focus:shadow-[0_0_0_3px_rgb(251_113_133/0.16),0_0_26px_-8px_rgb(251_113_133/0.7)]'
    : 'border-accent/25 hover:border-accent/50 hover:bg-deep/65 focus:border-accent/80 focus:bg-deep/75 focus:shadow-[0_0_0_3px_rgb(var(--accent)/0.16),0_0_28px_-8px_rgb(var(--accent)/0.75)]'

const PEER_FOCUS =
  'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent'

const LABEL_TEXT = 'font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted'

const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

function Required() {
  return (
    <span aria-hidden className="text-accent">
      *
    </span>
  )
}

function Optional() {
  return <span className="text-[9.5px] tracking-[0.14em] text-muted/60">optional</span>
}

/** Accent hairline that grows under the control while it has focus. */
function FocusLine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-5 -bottom-px h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-focus-within/field:scale-x-100"
    />
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key="err"
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.26, ease: EASE }}
          className="overflow-hidden"
        >
          <span className="flex items-start gap-1.5 pt-1.5 font-mono text-[11px] leading-snug text-rose-300">
            <TriangleAlert aria-hidden className="mt-px h-3 w-3 shrink-0" />
            {message}
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}

function Legend({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <legend className={cn(LABEL_TEXT, 'mb-2 flex w-full items-center justify-between gap-2 p-0')}>
      <span className="flex items-center gap-1.5">
        {children}
        {!optional && <Required />}
      </span>
      {optional && <Optional />}
    </legend>
  )
}

/* ── text input ──────────────────────────────────────────────────── */

export interface TextFieldProps {
  id: string
  label: string
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  error?: string
  ok?: boolean
  optional?: boolean
  type?: 'text' | 'email'
  autoComplete?: string
  placeholder?: string
  maxLength?: number
  inputRef?: Ref<HTMLInputElement>
}

export function TextField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  onBlur,
  error,
  ok,
  optional,
  type = 'text',
  autoComplete,
  placeholder,
  maxLength,
  inputRef,
}: TextFieldProps) {
  const errId = `${id}-error`
  return (
    <div data-field={id} className="group/field min-w-0">
      <label htmlFor={id} className={cn(LABEL_TEXT, 'mb-2 flex items-center justify-between gap-2')}>
        <span className="flex items-center gap-1.5">
          {label}
          {!optional && <Required />}
        </span>
        {optional && <Optional />}
      </label>
      <div className="relative">
        <Icon
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-[color,transform] duration-300 group-focus-within/field:scale-110',
            error ? 'text-rose-300/80' : 'text-muted group-focus-within/field:text-accent',
          )}
        />
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          required={!optional}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(error && errId)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          spellCheck={type === 'text' && !autoComplete?.includes('name')}
          className={cn(INPUT_BASE, inputTone(!!error), 'h-12 pl-10 pr-10')}
        />
        <FocusLine />
        <AnimatePresence>
          {ok && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, scale: 0.4, rotate: -40 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="pointer-events-none absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <FieldError id={errId} message={error} />
    </div>
  )
}

/* ── message ─────────────────────────────────────────────────────── */

export interface MessageFieldProps {
  id: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  error?: string
  max: number
  placeholder?: string
  onTemplate: () => void
  textareaRef?: Ref<HTMLTextAreaElement>
}

export function MessageField({
  id,
  value,
  onChange,
  onBlur,
  error,
  max,
  placeholder,
  onTemplate,
  textareaRef,
}: MessageFieldProps) {
  const errId = `${id}-error`
  const countId = `${id}-count`
  const len = value.length
  const tone = len >= max ? 'rose' : len >= max * 0.85 ? 'amber' : 'accent'

  return (
    <div data-field={id} className="group/field">
      <div className="mb-2 flex min-h-10 items-center justify-between gap-2">
        <label htmlFor={id} className={cn(LABEL_TEXT, 'flex items-center gap-1.5')}>
          Message
          <Required />
        </label>
        <AnimatePresence initial={false}>
          {!value.trim() && (
            <motion.button
              key="tpl"
              type="button"
              onClick={onTemplate}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="group/tpl relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-lg border border-accent/30 bg-accent/[0.06] px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-accent transition-[color,background-color,border-color,box-shadow] duration-300 hover:border-accent hover:bg-accent/15 hover:text-ink hover:shadow-glow-sm"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover/tpl:translate-x-full"
              />
              <WandSparkles
                aria-hidden
                className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover/tpl:-rotate-12 group-hover/tpl:scale-110"
              />
              <span className="relative">Brief template</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          name={id}
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          maxLength={max}
          required
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(countId, error && errId)}
          className={cn(
            INPUT_BASE,
            inputTone(!!error),
            'holo-scroll block min-h-[152px] resize-y px-3.5 py-3 leading-relaxed',
          )}
        />
        <FocusLine />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div aria-hidden className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-accent/10">
          <span
            className={cn(
              'absolute inset-0 origin-left rounded-full transition-[transform,background-color] duration-300',
              tone === 'rose' ? 'bg-rose-400' : tone === 'amber' ? 'bg-amber-400' : 'bg-gradient-to-r from-accent to-accent2',
            )}
            style={{ transform: `scaleX(${Math.min(1, len / max)})` }}
          />
        </div>
        <span
          id={countId}
          className={cn(
            'shrink-0 font-mono text-[10.5px] tabular-nums transition-colors duration-300',
            tone === 'rose' ? 'text-rose-300' : tone === 'amber' ? 'text-amber-300' : 'text-muted',
          )}
        >
          {len.toLocaleString('en-US')} / {max.toLocaleString('en-US')}
          <span className="sr-only"> characters</span>
        </span>
      </div>
      <FieldError id={errId} message={error} />
    </div>
  )
}

/* ── multi-select chips (checkboxes) ─────────────────────────────── */

export interface ChipOption<T extends string> {
  id: T
  label: string
  icon: LucideIcon
}

export function ChipGroup<T extends string>({
  id,
  legend,
  options,
  value,
  onToggle,
  onBlur,
  error,
  hint,
}: {
  id: string
  legend: string
  options: ChipOption<T>[]
  value: T[]
  onToggle: (id: T) => void
  onBlur: () => void
  error?: string
  hint?: ReactNode
}) {
  const errId = `${id}-error`
  const hintId = `${id}-hint`
  return (
    <fieldset
      data-field={id}
      aria-describedby={describedBy(hint ? hintId : undefined, error && errId)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onBlur()
      }}
      className="min-w-0"
    >
      <Legend>{legend}</Legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.id)
          return (
            <label key={o.id} className="group/chip relative cursor-pointer select-none">
              <input
                type="checkbox"
                name={id}
                value={o.id}
                checked={on}
                onChange={() => onToggle(o.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onToggle(o.id)
                  }
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(error && errId)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'relative flex min-h-10 items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-all duration-300',
                  PEER_FOCUS,
                  on
                    ? 'border-accent/75 bg-accent/20 text-ink shadow-glow-sm'
                    : error
                      ? 'border-rose-400/40 bg-rose-400/[0.04] text-muted group-hover/chip:border-rose-300/70 group-hover/chip:text-ink'
                      : 'border-accent/25 bg-accent/[0.05] text-muted group-hover/chip:-translate-y-0.5 group-hover/chip:border-accent/60 group-hover/chip:bg-accent/15 group-hover/chip:text-ink',
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover/chip:translate-x-full"
                />
                <o.icon
                  aria-hidden
                  className={cn(
                    'relative h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover/chip:scale-110',
                    on && 'text-accent',
                  )}
                />
                <span className="relative">{o.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    'relative grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] border transition-all duration-300',
                    on ? 'border-accent bg-accent text-deep' : 'border-accent/35',
                  )}
                >
                  {on && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {hint && (
        <div id={hintId} className="mt-2">
          {hint}
        </div>
      )}
      <FieldError id={errId} message={error} />
    </fieldset>
  )
}

/* ── single-select segments (radios) ─────────────────────────────── */

export interface SegmentOption<T extends string> {
  id: T
  label: string
  hint: string
}

export function SegmentGroup<T extends string>({
  id,
  legend,
  options,
  value,
  onChange,
  onBlur,
  error,
  reduced,
}: {
  id: string
  legend: string
  options: SegmentOption<T>[]
  value: T | ''
  onChange: (id: T) => void
  onBlur: () => void
  error?: string
  reduced: boolean
}) {
  const errId = `${id}-error`
  return (
    <fieldset
      data-field={id}
      aria-describedby={describedBy(error && errId)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onBlur()
      }}
      className="min-w-0"
    >
      <Legend>{legend}</Legend>
      <div
        className={cn(
          'grid grid-cols-2 gap-1 rounded-xl border bg-deep/50 p-1 transition-colors duration-300 sm:grid-cols-4',
          error ? 'border-rose-400/45' : 'border-accent/20 hover:border-accent/35',
        )}
      >
        {options.map((o) => {
          const on = value === o.id
          return (
            <label key={o.id} className="group/seg relative cursor-pointer select-none">
              <input
                type="radio"
                name={id}
                value={o.id}
                checked={on}
                onChange={() => onChange(o.id)}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(error && errId)}
                className="peer sr-only"
              />
              {on && (
                <motion.span
                  aria-hidden
                  layoutId={`${id}-pill`}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-lg border border-accent/70 bg-accent/20 shadow-glow-sm"
                />
              )}
              <span
                className={cn(
                  'relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center transition-colors duration-300',
                  PEER_FOCUS,
                  on ? 'text-ink' : 'text-muted group-hover/seg:bg-accent/10 group-hover/seg:text-ink',
                )}
              >
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
                  {o.label}
                </span>
                <span
                  className={cn(
                    'text-[12px] leading-none transition-colors duration-300',
                    on ? 'text-accent' : 'text-muted/70',
                  )}
                >
                  {o.hint}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      <FieldError id={errId} message={error} />
    </fieldset>
  )
}

/* ── consent ─────────────────────────────────────────────────────── */

export function ConsentField({
  id,
  checked,
  onChange,
  onBlur,
  error,
  label,
  note,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  onBlur: () => void
  error?: string
  label: string
  note: string
}) {
  const errId = `${id}-error`
  const noteId = `${id}-note`
  return (
    <div data-field={id}>
      <label
        htmlFor={id}
        className={cn(
          'group/consent relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3.5 transition-[border-color,background-color,box-shadow] duration-300',
          checked
            ? 'border-accent/55 bg-accent/[0.09] shadow-[0_0_30px_-14px_rgb(var(--accent)/0.9)]'
            : error
              ? 'border-rose-400/45 bg-rose-400/[0.04] hover:border-rose-300/70'
              : 'border-accent/20 bg-accent/[0.03] hover:border-accent/50 hover:bg-accent/[0.07]',
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(noteId, error && errId)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            'relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all duration-300',
            PEER_FOCUS,
            checked
              ? 'border-accent bg-accent/30 shadow-glow-sm'
              : error
                ? 'border-rose-400/60 bg-deep/60'
                : 'border-accent/45 bg-deep/60 group-hover/consent:border-accent',
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
            <motion.path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              fill="none"
              className="stroke-ink"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-ink">
            {label}
            <span aria-hidden className="ml-1 text-accent">
              *
            </span>
          </span>
          <span id={noteId} className="mt-1 block text-[13px] leading-snug text-muted">
            {note}
          </span>
        </span>
        <ShieldCheck
          aria-hidden
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 transition-all duration-500',
            checked ? 'scale-100 text-accent opacity-100' : 'scale-50 text-muted opacity-0',
          )}
        />
      </label>
      <FieldError id={errId} message={error} />
    </div>
  )
}
