import type { TermLine } from '@/components/ui/Terminal'
import type { Exchange } from '@/components/widgets/ProtocolFlow'
import { PROFILE } from './profile'

export type EngagementId = 'binary' | 'protocol' | 'format' | 'tooling' | 'reimpl' | 'other'
export type TimelineId = 'asap' | '2-4w' | '1-3m' | 'flexible'
export type ChannelId = 'email' | 'github' | 'x' | 'pgp'

export interface ContactConfig {
  /**
   * HTTPS endpoint that accepts the brief as a JSON POST. Leave empty and the
   * form opens the visitor's mail client with a pre-filled message instead.
   */
  endpoint: string
  /** the POST is aborted after this many milliseconds */
  timeoutMs: number
  /** subject prefix for the mailto fallback */
  subject: string
  /** localStorage key for the unsent draft */
  draftKey: string
  limits: {
    nameMin: number
    nameMax: number
    emailMax: number
    companyMax: number
    messageMin: number
    messageMax: number
  }
  responseTime: string
  responseNote: string
  /** working hours in the owner's timezone; days use Date#getDay numbering (0 = Sunday) */
  hours: { start: number; end: number; days: number[] }
  /** the next start slot shown in the availability panel is this many weeks out */
  bookingLeadWeeks: number
  bookingNote: string
}

export const CONTACT: ContactConfig = {
  endpoint: '',
  timeoutMs: 15000,
  subject: 'Engagement enquiry',
  draftKey: 'nox:contact-draft:v1',
  limits: {
    nameMin: 2,
    nameMax: 80,
    emailMax: 254,
    companyMax: 120,
    messageMin: 30,
    messageMax: 2000,
  },
  responseTime: '< 24h',
  responseNote: 'Mon–Fri, usually the same day',
  hours: { start: 9, end: 18, days: [1, 2, 3, 4, 5] },
  bookingLeadWeeks: 2,
  bookingNote:
    'Fixed-scope assessments or monthly retainers. A mutual NDA is signed before any samples, firmware or captures change hands.',
}

/** Parses "UTC+1", "UTC-5:30", "UTC+05:45" out of a free-form location string. */
function parseUtcOffset(location: string) {
  const m = /UTC\s*([+\-−])\s*(\d{1,2})(?::?(\d{2}))?/.exec(location)
  if (!m) return { label: 'UTC', minutes: 0 }
  const sign = m[1] === '+' ? 1 : -1
  const minutes = sign * (Number(m[2]) * 60 + Number(m[3] ?? 0))
  const label = `UTC${sign > 0 ? '+' : '−'}${Number(m[2])}${m[3] ? `:${m[3]}` : ''}`
  return { label, minutes }
}

/** Owner timezone, derived from PROFILE.location so there is one place to edit it. */
export const OWNER_TZ = parseUtcOffset(PROFILE.location)

export interface EngagementType {
  id: EngagementId
  label: string
  hint: string
}

export const ENGAGEMENT_TYPES: EngagementType[] = [
  {
    id: 'binary',
    label: 'Binary analysis',
    hint: 'PE / ELF / Mach-O executables, firmware images, packed or obfuscated code.',
  },
  {
    id: 'protocol',
    label: 'Protocol reversing',
    hint: 'Undocumented network, USB or IPC protocols: capture, decode, document, reimplement.',
  },
  {
    id: 'format',
    label: 'File format',
    hint: 'Proprietary file, save and container formats: structure maps, parsers, round-trip writers.',
  },
  {
    id: 'tooling',
    label: 'Tooling / automation',
    hint: 'IDA, Ghidra and Binary Ninja plugins, Frida scripts, fuzzing and patch-diffing pipelines.',
  },
  {
    id: 'reimpl',
    label: 'Reimplementation',
    hint: 'Clean-room reimplementation of legacy components that must match the original behaviour.',
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Interoperability work, research on your own products, team training. Describe it below.',
  },
]

export interface TimelineOption {
  id: TimelineId
  label: string
  hint: string
}

export const TIMELINES: TimelineOption[] = [
  { id: 'asap', label: 'ASAP', hint: 'Start within a week' },
  { id: '2-4w', label: '2–4 weeks', hint: 'Start this month' },
  { id: '1-3m', label: '1–3 months', hint: 'Planning ahead' },
  { id: 'flexible', label: 'Flexible', hint: 'No fixed date' },
]

export const FORM_COPY = {
  namePlaceholder: 'Ada Lovelace',
  emailPlaceholder: 'you@company.com',
  companyPlaceholder: 'Company, lab or team',
  messagePlaceholder:
    'What is the target (device, binary, protocol or file format), what do you need to learn or build, and who owns it? Versions, hashes and deadlines help.',
  /** inserted by the "brief template" button; the caret lands after the first colon */
  template: [
    'Target: ',
    'Version / SHA-256: ',
    'Goal: ',
    'Deliverable (report / parser / PoC / tool): ',
    'Authorisation (owner / written permission): ',
    'Deadline: ',
  ].join('\n'),
  consent: 'I own the target or I am authorised to have it analysed',
  consentNote:
    'I only work on software, devices and data you own or have written permission to analyse.',
}

export interface Channel {
  id: ChannelId
  label: string
  handle: string
  note: string
  /** opened as a link; for copy channels it becomes the secondary action */
  href?: string
  hrefLabel?: string
  /** copied to the clipboard when the tile is clicked */
  copy?: string
  copyLabel?: string
}

export const PGP = {
  fingerprint: '4F1C 8A2E 9B07 D3E5 61A4  0C9F 7E28 B5D1 3A6C 92F0',
  algorithm: 'Ed25519',
  created: '2019-02-14',
}

const pgpShortId = PGP.fingerprint.replace(/\s+/g, '').slice(-8)
const social = (label: string) =>
  PROFILE.socials.find((s) => s.label.toLowerCase() === label.toLowerCase())

export const CHANNELS: Channel[] = [
  {
    id: 'email',
    label: 'Email',
    handle: PROFILE.email,
    note: 'Click to copy',
    href: `mailto:${PROFILE.email}`,
    hrefLabel: `Compose an email to ${PROFILE.email}`,
    copy: PROFILE.email,
    copyLabel: 'Email address',
  },
  {
    id: 'github',
    label: 'GitHub',
    handle: social('GitHub')?.handle ?? '@nox',
    note: 'Parsers, plugins & scripts',
    href: social('GitHub')?.href ?? 'https://github.com/',
  },
  {
    id: 'x',
    label: 'X',
    handle: social('X')?.handle ?? '@nox_re',
    note: 'Notes from the bench',
    href: social('X')?.href ?? 'https://x.com/',
  },
  {
    id: 'pgp',
    label: 'PGP key',
    handle: `0x${pgpShortId}`,
    note: `${PGP.algorithm} · copy fingerprint`,
    copy: PGP.fingerprint,
    copyLabel: 'PGP fingerprint',
  },
]

export const AVAILABILITY = {
  status: 'Accepting new engagements',
  detail: 'Two project slots open this quarter',
}

export interface EngagementStep {
  id: string
  title: string
  /** short label for the step rail */
  short: string
  duration: string
  body: string
  deliverable: string
}

export const ENGAGEMENT_STEPS: EngagementStep[] = [
  {
    id: 'intro',
    title: 'Intro call',
    short: 'Intro call',
    duration: '30 min · free',
    body: 'We walk through the target, what “done” looks like and any hard deadlines. You leave with a straight answer on feasibility.',
    deliverable: 'Feasibility + rough estimate',
  },
  {
    id: 'scope',
    title: 'Scope & authorisation',
    short: 'Scope & auth',
    duration: '1–2 days',
    body: 'A written statement of work, proof that you own or may analyse the target, and an NDA if you need one. Nothing is touched before it is signed.',
    deliverable: 'Signed SOW + authorisation',
  },
  {
    id: 'analysis',
    title: 'Analysis',
    short: 'Analysis',
    duration: '1–6 weeks',
    body: 'Static and dynamic work in an isolated lab, with a short written progress note every week and findings shared as they land.',
    deliverable: 'Weekly progress notes',
  },
  {
    id: 'handoff',
    title: 'Report & handoff',
    short: 'Handoff',
    duration: '2–3 days',
    body: 'A technical report, annotated IDA / Ghidra databases, working parsers or PoC code, and a walkthrough call with your team.',
    deliverable: 'Report, databases, code',
  },
]

export interface Rule {
  id: 'auth' | 'nda' | 'lab' | 'disclosure' | 'ip'
  title: string
  body: string
}

export const RULES: Rule[] = [
  {
    id: 'auth',
    title: 'Written authorisation first',
    body: 'Proof that you own the target or hold the owner’s written permission, before a single byte is analysed.',
  },
  {
    id: 'nda',
    title: 'NDA on request',
    body: 'Mutual NDA signed before any samples, firmware dumps or packet captures change hands.',
  },
  {
    id: 'lab',
    title: 'Isolated lab',
    body: 'Snapshot-reverted VMs on a segregated network. Samples are never uploaded to public scanners or sandboxes.',
  },
  {
    id: 'disclosure',
    title: 'Coordinated disclosure',
    body: 'Flaws in third-party components go to the vendor first, on a timeline we agree in writing.',
  },
  {
    id: 'ip',
    title: 'Your IP stays yours',
    body: 'Reports, databases, parsers and PoCs belong to you; my working copies are wiped on request.',
  },
]

/** Typed out by the handshake terminal: a Noise XX key exchange, message sizes with empty payloads. */
export const HANDSHAKE_LINES: TermLine[] = [
  { text: '$ nox --open-channel --pattern XX', tone: 'dim' },
  { text: '[*] Noise_XX_25519_ChaChaPoly_BLAKE2s', tone: 'dim' },
  { text: '[*] ephemeral X25519 keypair ......... ok', tone: 'ok' },
  { text: '[!] msg 1 is unencrypted, payload empty', tone: 'warn' },
  { text: '-> e                            32 B', tone: 'ok' },
  { text: '<- e, ee, s, es                 96 B', tone: 'ok' },
  { text: '[*] responder static key pinned ..... ok', tone: 'ok' },
  { text: '-> s, se                        64 B', tone: 'ok' },
  { text: '[*] Split() -> 2 CipherStates, n = 0', tone: 'dim' },
  { text: '[*] h = 9f2c41d7e08a…a7306ce4', tone: 'dim' },
  { text: '[+] channel established', tone: 'ok' },
  { text: '[+] mutual auth · forward secrecy', tone: 'ok' },
  { text: 'nox> listening. say hello.', tone: 'dim' },
]

/** The same three handshake messages as a client/responder ladder. */
export const HANDSHAKE_FLOW: Exchange[] = [
  { label: 'e · 32 B', dir: 'up', tone: 'info' },
  { label: 'e, ee, s, es · 96 B', dir: 'down', tone: 'info' },
  { label: 's, se · 64 B', dir: 'up', tone: 'info' },
  { label: 'transport · encrypted', dir: 'down', tone: 'ok' },
]

export const HANDSHAKE_SPECS = [
  { label: 'DH', value: 'X25519' },
  { label: 'Cipher', value: 'ChaCha20-Poly1305' },
  { label: 'Hash', value: 'BLAKE2s' },
  { label: 'Auth', value: 'Mutual' },
]
