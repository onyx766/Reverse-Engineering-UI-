import {
  CONTACT,
  ENGAGEMENT_TYPES,
  FORM_COPY,
  TIMELINES,
  type EngagementId,
  type TimelineId,
} from '@/data/contact'
import { PROFILE } from '@/data/profile'

export interface FormValues {
  name: string
  email: string
  company: string
  types: EngagementId[]
  timeline: TimelineId | ''
  message: string
  consent: boolean
}

export type FieldKey = keyof FormValues
export type FormErrors = Partial<Record<FieldKey, string>>

/** DOM order — the first invalid field in this list receives focus on submit. */
export const FIELD_ORDER: FieldKey[] = [
  'name',
  'email',
  'company',
  'types',
  'timeline',
  'message',
  'consent',
]

export const FIELD_LABEL: Record<FieldKey, string> = {
  name: 'Name',
  email: 'Email',
  company: 'Company',
  types: 'Engagement type',
  timeline: 'Timeline',
  message: 'Message',
  consent: 'Authorisation',
}

export const EMPTY_FORM: FormValues = {
  name: '',
  email: '',
  company: '',
  types: [],
  timeline: '',
  message: '',
  consent: false,
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/
const L = CONTACT.limits

export function validate(v: FormValues): FormErrors {
  const e: FormErrors = {}
  const name = v.name.trim()
  if (!name) e.name = 'Tell me who you are.'
  else if (name.length < L.nameMin) e.name = `At least ${L.nameMin} characters, please.`
  else if (name.length > L.nameMax) e.name = `Keep it under ${L.nameMax} characters.`

  const email = v.email.trim()
  if (!email) e.email = 'I need an address to reply to.'
  else if (email.length > L.emailMax || !EMAIL_RE.test(email))
    e.email = 'That doesn’t look like an email address.'

  if (v.company.trim().length > L.companyMax)
    e.company = `Keep it under ${L.companyMax} characters.`

  if (v.types.length === 0) e.types = 'Pick at least one engagement type.'
  if (!v.timeline) e.timeline = 'Pick a rough timeline.'

  const len = v.message.trim().length
  if (len === 0) e.message = 'Describe the target and what you need.'
  else if (len < L.messageMin)
    e.message = `A little more detail, please: at least ${L.messageMin} characters (${len} so far).`
  else if (v.message.length > L.messageMax)
    e.message = `Trim it to ${L.messageMax.toLocaleString()} characters.`

  if (!v.consent)
    e.consent = 'Analysis is only possible on targets you own or are authorised to have analysed.'
  return e
}

export function isBlank(v: FormValues) {
  return (
    !v.name.trim() &&
    !v.email.trim() &&
    !v.company.trim() &&
    v.types.length === 0 &&
    !v.timeline &&
    !v.message.trim()
  )
}

/* ── draft persistence ───────────────────────────────────────────── */

export interface Draft {
  values: FormValues
  savedAt: number
}

const TYPE_IDS = new Set<string>(ENGAGEMENT_TYPES.map((t) => t.id))
const TIMELINE_IDS = new Set<string>(TIMELINES.map((t) => t.id))
const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '')

/** Consent is deliberately never persisted: it is re-confirmed for every message. */
export function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(CONTACT.draftKey)
    if (!raw) return null
    const d = JSON.parse(raw) as Record<string, unknown>
    const types = Array.isArray(d.types)
      ? (d.types.filter((t) => typeof t === 'string' && TYPE_IDS.has(t)) as EngagementId[])
      : []
    const timeline =
      typeof d.timeline === 'string' && TIMELINE_IDS.has(d.timeline)
        ? (d.timeline as TimelineId)
        : ''
    const values: FormValues = {
      name: str(d.name, L.nameMax),
      email: str(d.email, L.emailMax),
      company: str(d.company, L.companyMax),
      types,
      timeline,
      message: str(d.message, L.messageMax),
      consent: false,
    }
    if (isBlank(values)) return null
    return { values, savedAt: typeof d.savedAt === 'number' ? d.savedAt : Date.now() }
  } catch {
    return null
  }
}

export function saveDraft(v: FormValues): number | null {
  try {
    const savedAt = Date.now()
    const { consent: _omit, ...rest } = v
    void _omit
    window.localStorage.setItem(CONTACT.draftKey, JSON.stringify({ ...rest, savedAt }))
    return savedAt
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(CONTACT.draftKey)
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

/* ── brief ───────────────────────────────────────────────────────── */

export interface Digest {
  algo: 'sha256' | 'fnv1a32'
  hex: string
}

export interface Brief {
  ref: string
  name: string
  email: string
  company: string
  engagement: string[]
  timeline: string
  message: string
  bytes: number
  digest: Digest
  sentAt: string
}

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')

/** SHA-256 via WebCrypto; plain-HTTP origins have no crypto.subtle, so fall back to FNV-1a. */
export async function digest(text: string): Promise<Digest> {
  const data = new TextEncoder().encode(text)
  try {
    if (globalThis.crypto?.subtle) {
      return { algo: 'sha256', hex: toHex(await crypto.subtle.digest('SHA-256', data)) }
    }
  } catch {
    /* fall through */
  }
  let h = 0x811c9dc5
  for (const b of data) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return { algo: 'fnv1a32', hex: h.toString(16).padStart(8, '0') }
}

export async function composeBrief(v: FormValues): Promise<Brief> {
  const message = v.message.trim()
  const d = await digest(message)
  return {
    ref: `ONYX-${d.hex.slice(0, 8).toUpperCase()}`,
    name: v.name.trim(),
    email: v.email.trim(),
    company: v.company.trim(),
    engagement: ENGAGEMENT_TYPES.filter((t) => v.types.includes(t.id)).map((t) => t.label),
    timeline: TIMELINES.find((t) => t.id === v.timeline)?.label ?? '',
    message,
    bytes: new TextEncoder().encode(message).length,
    digest: d,
    sentAt: new Date().toISOString(),
  }
}

export function briefSubject(b: Brief) {
  return `${CONTACT.subject}: ${b.engagement.join(' + ')} — ${b.name}`
}

/** Plain-text body; CRLF line breaks as RFC 6068 asks for in mailto bodies. */
export function briefBody(b: Brief) {
  const rule = '-'.repeat(40)
  const lines = [
    `Name:          ${b.name}`,
    `Email:         ${b.email}`,
    ...(b.company ? [`Organisation:  ${b.company}`] : []),
    `Engagement:    ${b.engagement.join(', ')}`,
    `Timeline:      ${b.timeline}`,
    `Authorisation: ${FORM_COPY.consentRecord}`,
    '',
    rule,
    b.message,
    rule,
    `ref ${b.ref} · ${b.digest.algo} ${b.digest.hex.slice(0, 16)}…`,
  ]
  return lines.join('\n').replace(/\r?\n/g, '\r\n')
}

export function buildMailto(b: Brief) {
  return `mailto:${PROFILE.email}?subject=${encodeURIComponent(briefSubject(b))}&body=${encodeURIComponent(briefBody(b))}`
}

export const deliveryMode: 'endpoint' | 'mailto' = CONTACT.endpoint ? 'endpoint' : 'mailto'

export function endpointHost() {
  try {
    return new URL(CONTACT.endpoint, window.location.href).host
  } catch {
    return 'server'
  }
}

/** "https://api.example.com/brief" for the transmission log (query string dropped). */
export function endpointLabel() {
  try {
    const u = new URL(CONTACT.endpoint, window.location.href)
    return `${u.origin}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return CONTACT.endpoint
  }
}

export class DeliveryError extends Error {}

/** POSTs the brief as JSON and returns the status line; throws a DeliveryError with a readable reason. */
export async function postBrief(b: Brief, signal: AbortSignal): Promise<string> {
  let res: Response
  try {
    res = await fetch(CONTACT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ref: b.ref,
        name: b.name,
        email: b.email,
        company: b.company || null,
        engagement: b.engagement,
        timeline: b.timeline,
        message: b.message,
        consent: true,
        digest: b.digest,
        sentAt: b.sentAt,
        page: window.location.href,
      }),
      signal,
    })
  } catch (err) {
    if (signal.aborted)
      throw new DeliveryError(`No answer after ${Math.round(CONTACT.timeoutMs / 1000)} s — the request timed out.`)
    throw new DeliveryError(
      err instanceof Error && err.message
        ? `Couldn’t reach ${endpointHost()} (${err.message}).`
        : `Couldn’t reach ${endpointHost()}.`,
    )
  }
  const status = `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`
  if (!res.ok) throw new DeliveryError(`${endpointHost()} answered ${status}.`)
  return `${status} from ${endpointHost()}`
}

/** Opens an external URL (mailto:) from script; returns false if the browser refused. */
export function openExternal(url: string) {
  try {
    const a = document.createElement('a')
    a.href = url
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    return true
  } catch {
    return false
  }
}

/** Clipboard API first, then the legacy execCommand path for older/insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* permission denied or unfocused document — try the fallback */
  }
  const active = document.activeElement as HTMLElement | null
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.setAttribute('aria-hidden', 'true')
    Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', opacity: '0', pointerEvents: 'none' })
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  } finally {
    active?.focus?.({ preventScroll: true })
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

/** CRC-32 (IEEE 802.3, reflected 0xEDB88320), the same checksum zlib and Ethernet use. */
export function crc32(bytes: Uint8Array) {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** "14:02" in the visitor's locale-independent 24h form. */
export const hhmm = (ms: number) => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
