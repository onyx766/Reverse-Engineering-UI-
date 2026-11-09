import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AtSign,
  Binary,
  Building2,
  FileCode2,
  LockKeyhole,
  MessageSquareText,
  Network,
  Repeat,
  Save,
  Send,
  Trash2,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  CONTACT,
  ENGAGEMENT_TYPES,
  FORM_COPY,
  TIMELINES,
  type EngagementId,
} from '@/data/contact'
import { PROFILE } from '@/data/profile'
import {
  EMPTY_FORM,
  FIELD_LABEL,
  FIELD_ORDER,
  briefBody,
  briefSubject,
  buildMailto,
  clearDraft,
  composeBrief,
  copyText,
  deliveryMode,
  endpointHost,
  hhmm,
  isBlank,
  loadDraft,
  openExternal,
  postBrief,
  saveDraft,
  validate,
  type Brief,
  type FieldKey,
  type FormValues,
} from './lib'
import { ChipGroup, ConsentField, EASE, MessageField, SegmentGroup, TextField } from './fields'
import { Transmission, type Delivery } from './Transmission'
import { TxError, TxSuccess } from './TxResult'
import { useToast } from './Toast'

const TYPE_ICONS: Record<EngagementId, LucideIcon> = {
  binary: Binary,
  protocol: Network,
  format: FileCode2,
  tooling: Wrench,
  reimpl: Repeat,
  other: MessageSquareText,
}

const TYPE_OPTIONS = ENGAGEMENT_TYPES.map((t) => ({
  id: t.id,
  label: t.label,
  icon: TYPE_ICONS[t.id] ?? MessageSquareText,
}))

type Phase = 'form' | 'sending' | 'success' | 'error'

const fid = (k: FieldKey) => `cf-${k}`
/** the submit shortcut as the visitor's keyboard labels it */
const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    ? '⌘'
    : 'Ctrl'
const snapshot = (v: FormValues) => JSON.stringify({ ...v, consent: false })
const EMPTY_SNAPSHOT = snapshot(EMPTY_FORM)

/**
 * "Secure Channel": the enquiry form. Validates on blur and on submit, keeps
 * an unsent draft in localStorage, then plays the transmission sequence and
 * delivers by JSON POST (CONTACT.endpoint) or a pre-filled mailto: link.
 */
export function ContactForm() {
  const reduced = useReducedMotion()
  const toast = useToast()

  const [initialDraft] = useState(loadDraft)
  const [values, setValues] = useState<FormValues>(() => initialDraft?.values ?? EMPTY_FORM)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [savedAt, setSavedAt] = useState<number | null>(initialDraft?.savedAt ?? null)
  const [restored, setRestored] = useState(!!initialDraft)
  const [lastType, setLastType] = useState<EngagementId | null>(null)
  const [announce, setAnnounce] = useState('')

  const [phase, setPhase] = useState<Phase>('form')
  const [brief, setBrief] = useState<Brief | null>(null)
  const [delivery, setDelivery] = useState<Delivery>('pending')
  const [failure, setFailure] = useState('')
  const [ackDetail, setAckDetail] = useState<string>()
  const [attempt, setAttempt] = useState(0)

  const formRef = useRef<HTMLFormElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastSaved = useRef(initialDraft ? snapshot(initialDraft.values) : EMPTY_SNAPSHOT)
  const pendingFocus = useRef<FieldKey | null>(null)
  const caret = useRef<number | null>(null)
  const busy = useRef(false)

  const errors = useMemo(() => validate(values), [values])
  const show = (k: FieldKey) => (touched[k] || submitted ? errors[k] : undefined)
  const ok = (k: 'name' | 'email' | 'company') =>
    !!(touched[k] || submitted) && !errors[k] && values[k].trim().length > 0

  // debounced autosave; consent is never stored
  useEffect(() => {
    if (phase !== 'form') return
    const snap = snapshot(values)
    if (snap === lastSaved.current) return
    const id = window.setTimeout(() => {
      lastSaved.current = snap
      if (isBlank(values)) {
        clearDraft()
        setSavedAt(null)
      } else {
        const at = saveDraft(values)
        if (at) setSavedAt(at)
      }
    }, 600)
    return () => window.clearTimeout(id)
  }, [values, phase])

  useEffect(() => () => abortRef.current?.abort(), [])

  // focus the first invalid field once its error message is in the DOM
  useEffect(() => {
    const k = pendingFocus.current
    if (!k) return
    pendingFocus.current = null
    const form = formRef.current
    if (!form) return
    const wrap = form.querySelector<HTMLElement>(`[data-field="${fid(k)}"]`)
    const el = wrap?.querySelector<HTMLElement>('input, textarea')
    el?.focus({ preventScroll: true })
    // framer restores window scroll after measuring the errors' height:auto on the
    // next frame, which would cancel a smooth scroll started now
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        wrap?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }),
      ),
    )
    if (reduced) return
    FIELD_ORDER.filter((f) => errors[f]).forEach((f) => {
      form.querySelector<HTMLElement>(`[data-field="${fid(f)}"]`)?.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-7px)' },
          { transform: 'translateX(6px)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(2px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 420, easing: 'ease-out' },
      )
    })
    // keyed on submitCount only: once per failed submit, never per keystroke
  }, [submitCount])

  useEffect(() => {
    if (phase === 'success' || phase === 'error') headingRef.current?.focus({ preventScroll: true })
    if (phase === 'form') return
    // keep the active phase on screen: the progress bar near the bottom edge while
    // sending (where the button was), the result centred below the fixed navbar
    let id = window.requestAnimationFrame(() => {
      id = window.requestAnimationFrame(() => {
        const el = stageRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const top = 96
        const bottom = window.innerHeight - 20
        const dy =
          phase === 'sending' ? r.bottom - bottom : (r.top + r.bottom) / 2 - (top + bottom) / 2
        if (Math.abs(dy) > 12) window.scrollBy({ top: dy, behavior: reduced ? 'auto' : 'smooth' })
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [phase, reduced])

  useEffect(() => {
    if (caret.current === null) return
    const at = caret.current
    caret.current = null
    const el = messageRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(at, at)
  }, [values.message])

  const update = <K extends FieldKey>(k: K, v: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }))
    setRestored(false)
  }
  const touch = (k: FieldKey) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

  const toggleType = (id: EngagementId) => {
    const on = values.types.includes(id)
    setLastType(on ? null : id)
    setValues((prev) => ({
      ...prev,
      types: prev.types.includes(id) ? prev.types.filter((x) => x !== id) : [...prev.types, id],
    }))
    setRestored(false)
  }

  const insertTemplate = () => {
    caret.current = FORM_COPY.template.indexOf(':') + 2
    update('message', FORM_COPY.template)
  }

  const discard = (e: MouseEvent<HTMLButtonElement>) => {
    const prev = values
    setValues(EMPTY_FORM)
    setTouched({})
    setSubmitted(false)
    setLastType(null)
    setRestored(false)
    clearDraft()
    lastSaved.current = EMPTY_SNAPSHOT
    setSavedAt(null)
    toast({
      title: 'Draft discarded',
      body: 'The saved copy was removed from this browser.',
      action: {
        label: 'Undo',
        onClick: (ev) => {
          setValues(prev)
          // keyboard users return to the form, not to <body>
          if (ev.detail === 0) submitRef.current?.focus()
        },
      },
    })
    // the discard button leaves with the draft: hand keyboard focus to its neighbour,
    // the submit button, so nothing scrolls and focus never falls back to <body>
    if (e.detail === 0) submitRef.current?.focus({ preventScroll: true })
  }

  const send = async (b: Brief) => {
    abortRef.current?.abort()
    setAckDetail(undefined)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timer = window.setTimeout(() => ctrl.abort(), CONTACT.timeoutMs)
    try {
      const status = await postBrief(b, ctrl.signal)
      if (abortRef.current !== ctrl) return
      setAckDetail(status)
      setDelivery('ok')
    } catch (err) {
      if (abortRef.current !== ctrl) return
      setFailure(err instanceof Error ? err.message : 'Unknown error.')
      setDelivery('fail')
    } finally {
      window.clearTimeout(timer)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (phase !== 'form' || busy.current) return
    setSubmitted(true)
    const bad = FIELD_ORDER.filter((k) => errors[k])
    if (bad.length) {
      setAnnounce(
        `${bad.length === 1 ? '1 field needs' : `${bad.length} fields need`} attention: ${bad
          .map((k) => FIELD_LABEL[k])
          .join(', ')}.`,
      )
      pendingFocus.current = bad[0]
      setSubmitCount((c) => c + 1)
      return
    }

    busy.current = true
    setAnnounce('')
    const b = await composeBrief(values)
    busy.current = false
    setBrief(b)

    // bots fill the hidden field; they get a success screen and nothing is sent
    if (honeypot.current?.value) {
      setPhase('success')
      return
    }

    lastSaved.current = snapshot(values)
    const at = saveDraft(values)
    if (at) setSavedAt(at)
    setFailure('')
    setDelivery(deliveryMode === 'mailto' ? 'ok' : 'pending')
    setPhase('sending')
    if (deliveryMode === 'endpoint') void send(b)
  }

  const onTxDone = (result: 'ok' | 'fail') => {
    if (result === 'fail') {
      setPhase('error')
      return
    }
    if (deliveryMode === 'mailto' && brief) openExternal(buildMailto(brief))
    clearDraft()
    lastSaved.current = EMPTY_SNAPSHOT
    setSavedAt(null)
    setPhase('success')
  }

  const backToForm = (fresh: boolean) => {
    if (fresh) {
      setValues(EMPTY_FORM)
      setTouched({})
      setSubmitted(false)
      setLastType(null)
      setBrief(null)
    }
    setRestored(false)
    setFailure('')
    setDelivery('pending')
    setPhase('form')
    pendingFocus.current = null
    window.requestAnimationFrame(() =>
      (fresh ? nameRef.current : messageRef.current)?.focus({ preventScroll: true }),
    )
  }

  const retry = () => {
    if (!brief) return
    setFailure('')
    setDelivery('pending')
    setAttempt((a) => a + 1)
    setPhase('sending')
    void send(brief)
  }

  const copyBrief = async () => {
    if (!brief) return
    const okCopy = await copyText(
      `To: ${PROFILE.email}\r\nSubject: ${briefSubject(brief)}\r\n\r\n${briefBody(brief)}`,
    )
    toast(
      okCopy
        ? { title: 'Brief copied', body: `Paste it into an email to ${PROFILE.email}` }
        : { tone: 'warn', title: 'Clipboard blocked', body: 'Your browser refused clipboard access.' },
    )
  }

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      const form = formRef.current
      if (!form) return
      if (typeof form.requestSubmit === 'function') form.requestSubmit()
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }
  }

  const hintType =
    lastType && values.types.includes(lastType) ? lastType : values.types[values.types.length - 1]
  const hint = ENGAGEMENT_TYPES.find((t) => t.id === hintType)
  // one word, like the other panels' badges, so the title never truncates on 360 px phones
  const badge = phase === 'form' ? 'Open' : phase === 'sending' ? 'TX' : phase === 'success' ? 'ACK' : 'NACK'
  const draftStatus =
    restored && savedAt
      ? `Unsent draft restored · ${hhmm(savedAt)}`
      : savedAt
        ? `Draft saved in this browser · ${hhmm(savedAt)}`
        : 'Drafts autosave in this browser only'
  const mailto = brief ? buildMailto(brief) : `mailto:${PROFILE.email}`

  return (
    <HoloPanel
      title="Secure Channel"
      icon={LockKeyhole}
      badge={badge}
      from="left"
      tilt={1.5}
      className="h-full"
      bodyClassName="flex flex-col lg:min-h-[calc(100%-58px)]"
    >
      <div ref={stageRef} className="relative flex flex-1 flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.3 } }}
              transition={{ duration: 0.55, ease: EASE }}
              className="flex flex-1 flex-col"
            >
              <form
                ref={formRef}
                noValidate
                onSubmit={onSubmit}
                onKeyDown={onKeyDown}
                aria-label="Project enquiry"
                className="flex flex-1 flex-col gap-5"
              >
                {/* honeypot: invisible to people, irresistible to form bots; password
                    managers are told to leave it alone so real visitors never trip it */}
                <input
                  ref={honeypot}
                  type="text"
                  name="hp_trap"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  data-1p-ignore
                  data-lpignore="true"
                  data-bwignore
                  data-form-type="other"
                  className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    id={fid('name')}
                    label="Name"
                    icon={User}
                    value={values.name}
                    onChange={(v) => update('name', v)}
                    onBlur={() => touch('name')}
                    error={show('name')}
                    ok={ok('name')}
                    autoComplete="name"
                    placeholder={FORM_COPY.namePlaceholder}
                    maxLength={CONTACT.limits.nameMax}
                    inputRef={nameRef}
                  />
                  <TextField
                    id={fid('email')}
                    type="email"
                    label="Email"
                    icon={AtSign}
                    value={values.email}
                    onChange={(v) => update('email', v)}
                    onBlur={() => touch('email')}
                    error={show('email')}
                    ok={ok('email')}
                    autoComplete="email"
                    placeholder={FORM_COPY.emailPlaceholder}
                    maxLength={CONTACT.limits.emailMax}
                  />
                </div>

                <TextField
                  id={fid('company')}
                  label="Company / org"
                  icon={Building2}
                  optional
                  value={values.company}
                  onChange={(v) => update('company', v)}
                  onBlur={() => touch('company')}
                  error={show('company')}
                  ok={ok('company')}
                  autoComplete="organization"
                  placeholder={FORM_COPY.companyPlaceholder}
                  maxLength={CONTACT.limits.companyMax}
                />

                <ChipGroup
                  id={fid('types')}
                  legend="Engagement type"
                  options={TYPE_OPTIONS}
                  value={values.types}
                  onToggle={toggleType}
                  onBlur={() => touch('types')}
                  error={show('types')}
                  hint={
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={hint?.id ?? 'none'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22 }}
                        className="flex items-start gap-1.5 font-mono text-[11px] leading-snug text-muted"
                      >
                        <span aria-hidden className="text-accent">
                          ›
                        </span>
                        {hint ? (
                          <span>
                            <span className="text-ink/90">{hint.label}:</span> {hint.hint}
                          </span>
                        ) : (
                          <span>Select all that apply.</span>
                        )}
                      </motion.p>
                    </AnimatePresence>
                  }
                />

                <SegmentGroup
                  id={fid('timeline')}
                  legend="Timeline"
                  options={TIMELINES}
                  value={values.timeline}
                  onChange={(v) => update('timeline', v)}
                  onBlur={() => touch('timeline')}
                  error={show('timeline')}
                  reduced={reduced}
                />

                <MessageField
                  id={fid('message')}
                  value={values.message}
                  onChange={(v) => update('message', v)}
                  onBlur={() => touch('message')}
                  error={show('message')}
                  max={CONTACT.limits.messageMax}
                  placeholder={FORM_COPY.messagePlaceholder}
                  onTemplate={insertTemplate}
                  textareaRef={messageRef}
                />

                <ConsentField
                  id={fid('consent')}
                  checked={values.consent}
                  onChange={(v) => update('consent', v)}
                  onBlur={() => touch('consent')}
                  error={show('consent')}
                  label={FORM_COPY.consent}
                  note={FORM_COPY.consentNote}
                />

                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3">
                    <span className="inline-flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      <Save aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={draftStatus}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.22 }}
                          className="truncate"
                        >
                          {draftStatus}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    {!isBlank(values) && (
                      <button
                        type="button"
                        onClick={discard}
                        className="group/discard -mr-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2
                          aria-hidden
                          className="h-3.5 w-3.5 transition-transform duration-300 group-hover/discard:-rotate-12"
                        />
                        Discard draft
                      </button>
                    )}
                  </div>

                  <button
                    ref={submitRef}
                    type="submit"
                    className="group relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-accent/60 bg-accent/15 font-display text-[12.5px] font-bold uppercase tracking-[0.2em] text-ink transition-[background-color,border-color,box-shadow,transform] duration-300 hover:border-accent hover:bg-accent/25 hover:shadow-glow active:scale-[0.99]"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-center scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100"
                    />
                    <span className="relative flex items-center gap-2.5">
                      <Send
                        aria-hidden
                        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1"
                      />
                      Transmit message
                    </span>
                    <kbd
                      aria-hidden
                      className="absolute right-4 hidden rounded border border-accent/30 bg-deep/40 px-1.5 py-0.5 font-mono text-[9.5px] font-normal tracking-[0.08em] text-muted sm:inline-block"
                    >
                      {MOD_KEY} ↵
                    </kbd>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {phase === 'sending' && brief && (
            <motion.div key={`tx-${attempt}`} className="flex flex-1 flex-col">
              <Transmission
                brief={brief}
                mode={deliveryMode}
                host={deliveryMode === 'endpoint' ? endpointHost() : 'mail client'}
                delivery={delivery}
                detail={delivery === 'fail' ? failure : ackDetail}
                onDone={onTxDone}
              />
            </motion.div>
          )}

          {phase === 'success' && brief && (
            <motion.div key="ok" className="flex flex-1 flex-col">
              <TxSuccess
                brief={brief}
                mode={deliveryMode}
                mailto={mailto}
                onReset={() => backToForm(true)}
                onCopyBrief={copyBrief}
                headingRef={headingRef}
              />
            </motion.div>
          )}

          {phase === 'error' && brief && (
            <motion.div key="err" className="flex flex-1 flex-col">
              <TxError
                reason={failure}
                mailto={mailto}
                onRetry={retry}
                onEdit={() => backToForm(false)}
                headingRef={headingRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="sr-only" aria-live="assertive">
        {announce}
      </p>
    </HoloPanel>
  )
}
