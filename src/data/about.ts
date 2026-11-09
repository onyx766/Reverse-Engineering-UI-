import type { LucideIcon } from 'lucide-react'
import {
  BookMarked,
  Bug,
  Building2,
  Code2,
  Coffee,
  Cpu,
  Crosshair,
  FileSignature,
  FileText,
  FlaskConical,
  Lightbulb,
  Network,
  Package,
  PackageCheck,
  Radio,
  Repeat2,
  Scale,
  ScanSearch,
  ShieldCheck,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react'
import type { TermLine } from '@/components/ui/Terminal'
import { AVAILABILITY_STATUS, PGP_KEY, PROFILE, STATS } from './profile'

/* ── copy for the section headings ─────────────────────────────────── */

export const ABOUT_COPY = {
  hero: {
    eyebrow: 'Operator profile',
    command: 'whoami --verbose',
    title: 'About Onyx',
    lead: 'The person you call when the only documentation left is the binary itself.',
  },
  timeline: {
    // short on purpose: the shared heading tracks its eyebrow in from 0.5em while
    // it fades in, and anything longer wraps for a moment on a 360px phone
    eyebrow: 'Career log',
    title: 'Eight Years, Four Chapters',
    subtitle:
      'From backend and systems work, through automation and API analysis, to leading reverse-engineering and automation projects. Every chapter built on the one before it.',
  },
  process: {
    eyebrow: 'Methodology',
    title: 'How I Work',
    subtitle:
      'The same five phases on every engagement, whether the target is a 2 KB bootloader or a 40 MB Windows service.',
  },
  principles: {
    eyebrow: 'Operating principles',
    title: 'Non-negotiables',
  },
  stats: {
    eyebrow: 'Telemetry',
    title: 'By the Numbers',
    /** shown after the career span, e.g. "2018 → 2026 · self-reported" */
    note: 'self-reported',
  },
}

/** "Years Reversing" from the shared hero stats, so every "8 years" on the site agrees. */
const yearsReversing = STATS.find((s) => /year/i.test(s.label))?.value ?? 8

/* ── holographic ID card ───────────────────────────────────────────── */

export interface IdField {
  label: string
  value: string
  /** renders a pulsing status LED next to the value */
  live?: boolean
  /** spans the full width of the field grid */
  wide?: boolean
}

export interface IdCardData {
  issuer: string
  docType: string
  clearance: string
  name: string
  role: string
  fields: IdField[]
  /** encoded as a real Code 39 barcode: keep to A–Z, 0–9 and "-" */
  serial: string
  issued: string
  manifesto: string
  signature: string
  pgp: { algo: string; fingerprint: string }
  authorised: { title: string; body: string }
}

export const ID_CARD: IdCardData = {
  issuer: 'ONYX · RE LAB',
  docType: 'Operator access badge',
  clearance: 'Class IV',
  name: PROFILE.name,
  role: PROFILE.role,
  fields: [
    { label: 'Specialisation', value: 'Reverse & automation engineering', wide: true },
    { label: 'Experience', value: `${yearsReversing} yrs` },
    { label: 'Base', value: PROFILE.location },
    {
      label: 'Status',
      value: PROFILE.available ? AVAILABILITY_STATUS.open : AVAILABILITY_STATUS.booked,
      live: PROFILE.available,
      wide: true,
    },
  ],
  serial: 'NX-0847',
  issued: '2018.03',
  manifesto:
    'Every binary is a stack of decisions someone else compiled. I read them back: patiently, legally, and with notes good enough that nobody has to do it twice.',
  signature: 'Onyx',
  // OWNER: the key itself lives in PGP_KEY (src/data/profile.ts), shared with Contact
  pgp: PGP_KEY,
  authorised: {
    title: 'Authorised work only',
    body: 'Every engagement starts with written permission from the system owner, an agreed scope and a disclosure plan. No licence bypasses, no DRM circumvention, no access I was not given.',
  },
}

/**
 * Typed into the verification console under the badge (desktop). The console
 * word-wraps, so file names carry no hyphen to split on in the narrow column.
 */
export const BADGE_LOG: TermLine[] = [
  { text: '$ gpg --verify badge.json.sig badge.json', tone: 'dim' },
  { text: 'gpg: Signature made Mon 02 Nov 2026 09:14:22 CET', tone: 'dim' },
  { text: `gpg:                using EDDSA key ${ID_CARD.pgp.fingerprint.replace(/\s+/g, '')}`, tone: 'dim' },
  { text: `gpg: Good signature from "${PROFILE.name} <${PROFILE.email}>" [ultimate]`, tone: 'ok' },
  { text: '$ jq -r .scope badge.json', tone: 'dim' },
  { text: 'authorised engagements only · written scope required', tone: 'warn' },
]

/* ── bio ───────────────────────────────────────────────────────────── */

export const BIO_FILE = '~/onyx/about.md'

/** First-person paragraphs. Wrap a phrase in **double asterisks** to highlight it. */
export const BIO: string[] = [
  "I'm Onyx, a reverse engineer and automation engineer. For eight years I've been the person teams call when the only documentation left is **the application itself**: a desktop binary, a web platform, an undocumented API or a network protocol nobody ever wrote down.",
  'My work is **analysis and automation**: static and dynamic analysis of binaries, auth flows and wire protocols, then Python and C++ tooling, compatible integrations and AIO / ACO / ATC automation built from what I learn. I also build Discord and Whop apps. I live in Ghidra and IDA, debug with x64dbg and GDB, trace with Frida and capture with Wireshark and Burp Suite.',
  'Every engagement is **scoped and authorised**, and ends with something you keep: a technical spec, diagrams, reproducible test cases and working tools. Anything I do twice gets automated.',
]

export interface QuickFact {
  label: string
  value: string
  icon: LucideIcon
  /** marks the fact as live / in progress */
  live?: boolean
}

export const QUICK_FACTS: QuickFact[] = [
  { label: 'Focus', value: 'Reverse engineering, API & protocol analysis, automation', icon: Crosshair },
  { label: 'Platforms', value: 'Windows · Linux · Networking · Docker', icon: Cpu },
  { label: 'Languages', value: 'Python · C · C++ · JavaScript / TypeScript · Node.js', icon: Code2 },
  {
    label: 'Currently',
    value: 'Building compatible integrations and tooling from authorised analysis',
    icon: Radio,
    live: true,
  },
]

/* ── career timeline ───────────────────────────────────────────────── */

export interface CareerEntry {
  start: number
  /** null = present */
  end: number | null
  role: string
  /** generic organisation type only, never a company name */
  org: string
  orgIcon: LucideIcon
  icon: LucideIcon
  summary: string
  highlights: string[]
}

export const CAREER: CareerEntry[] = [
  {
    start: 2018,
    end: 2019,
    role: 'Junior Software / Systems Engineer',
    org: 'Engineering team',
    orgIcon: Users,
    icon: Code2,
    summary:
      'Started with backend work, debugging and systems programming: Python and C/C++ utilities, Linux internals, and scripts for repetitive engineering and testing workflows. Learned assembly, debugging and binary formats along the way.',
    highlights: ['Python', 'C / C++', 'Linux', 'Assembly basics', 'Static analysis'],
  },
  {
    start: 2019,
    end: 2021,
    role: 'Software Engineer — Automation & Analysis',
    org: 'Product & integrations team',
    orgIcon: Building2,
    icon: Repeat2,
    summary:
      'Built browser and API automation in Python and JavaScript, inspected HTTP traffic for integration work, and debugged third-party systems with undocumented behaviour. Shipped API clients, data-processing tools and workflow automation.',
    highlights: ['Browser automation', 'REST · WebSockets', 'Auth flows', 'API clients', 'Backend services'],
  },
  {
    start: 2021,
    end: 2024,
    role: 'Reverse Engineer / Systems Engineer',
    org: 'Engineering team',
    orgIcon: Users,
    icon: Network,
    summary:
      'Analysed desktop and web applications, HTTP/WebSocket APIs and custom network protocols. Did static and dynamic binary analysis, built Python and C++ debugging utilities, and wrote parsers and converters for proprietary file formats where authorised.',
    highlights: ['Binary analysis', 'HTTP · WebSocket', 'Custom protocols', 'File formats', 'Tech write-ups'],
  },
  {
    start: 2024,
    end: null,
    role: 'Senior Reverse Engineer / Automation Engineer',
    org: 'Engineering team · Lead',
    orgIcon: Building2,
    icon: Wrench,
    summary:
      'Lead reverse-engineering and automation work across desktop apps, web platforms, APIs and networked systems. Document findings as specs, diagrams and reproducible test cases, build compatible integrations from authorised analysis, and mentor engineers on repeatable workflows.',
    highlights: ['Ghidra · IDA', 'x64dbg · GDB', 'Frida', 'Wireshark', 'Mentoring'],
  },
]

/** the year the "present" entry is drawn up to */
export const CAREER_NOW = 2026

/* ── how I work ────────────────────────────────────────────────────── */

export interface ProcessStep {
  title: string
  icon: LucideIcon
  summary: string
  details: string[]
  /** what the client holds at the end of the phase */
  artefact: string
}

export const PROCESS: ProcessStep[] = [
  {
    title: 'Scope & authorise',
    icon: FileSignature,
    summary:
      'Nothing gets opened until the owner has signed off on the scope, data handling and how findings will be disclosed.',
    details: [
      'Written authorisation from the asset owner',
      'Rules of engagement & data handling',
      'Isolated lab: snapshot VMs, no prod keys',
      'SHA-256 every sample on intake',
    ],
    artefact: 'Signed scope · lab baseline',
  },
  {
    title: 'Observe',
    icon: ScanSearch,
    summary:
      'Watch it run before reading it: process, file and network behaviour first, then structure: headers, imports, strings, entropy.',
    details: [
      'Procmon, strace & ETW traces',
      'Packet captures: Wireshark, mitmproxy',
      'PE / ELF headers, imports, entropy',
      'Frida hooks on crypto & I/O APIs',
    ],
    artefact: 'Traces · captures · triage notes',
  },
  {
    title: 'Hypothesise',
    icon: Lightbulb,
    summary:
      'Turn observations into explicit, falsifiable claims, and log each one next to the database it came from.',
    details: [
      '"0x00: magic, 0x04: u16le length, CRC-16 tail"',
      'Rename & retype as I go in IDA / Ghidra',
      'Rank claims by how cheap they are to disprove',
      'Dated hypotheses log in the repo',
    ],
    artefact: 'Annotated database · hypotheses log',
  },
  {
    title: 'Verify',
    icon: FlaskConical,
    summary:
      'Prove every claim: emulate, patch, fuzz or re-implement it until the output matches the original byte for byte.',
    details: [
      'Emulate routines in Unicorn / Qiling',
      'Differential tests against the original',
      'Conditional breakpoints & TTD replay',
      'Golden test vectors in CI',
    ],
    artefact: 'Repro scripts · test vectors',
  },
  {
    title: 'Document & hand off',
    icon: PackageCheck,
    summary:
      'Deliver everything the next engineer needs to carry on without me, then walk them through it.',
    details: [
      'Spec with offsets & field tables',
      'Annotated database + type library',
      'Parser or client, with tests',
      'Recorded walkthrough & Q&A',
    ],
    artefact: 'Spec · tooling · walkthrough',
  },
]

/* ── principles ────────────────────────────────────────────────────── */

export interface Principle {
  title: string
  icon: LucideIcon
  body: string
  /** one-line motto rendered as code */
  code: string
}

export const PRINCIPLES: Principle[] = [
  {
    title: 'Reproducible',
    icon: Repeat2,
    body: 'Same input, same bytes, same result. Every finding ships with the sample hash, tool versions and a script that re-derives it.',
    code: '$ ./repro.sh --sha256 9f3c…e1a0',
  },
  {
    title: 'Documented',
    icon: BookMarked,
    body: "If it isn't written down, it didn't happen: offsets, field tables and the reasoning that got me there.",
    code: '// +0x18  u16le  len (excl. header)',
  },
  {
    title: 'Legal & scoped',
    icon: Scale,
    body: 'Written authorisation, a defined scope and a disclosure plan before the first byte. No exceptions, no grey areas.',
    code: 'assert engagement.authorised',
  },
  {
    title: 'Tool-builder mindset',
    icon: Wrench,
    body: 'Do it twice, automate it the third time. Loaders, parsers and scripts outlive the engagement that needed them.',
    code: 'if seen_twice: automate()',
  },
]

/* ── stats ─────────────────────────────────────────────────────────── */

export type FunStat =
  | {
      kind: 'count'
      label: string
      value: number
      suffix?: string
      /** "{writeups}" is filled in with the number of public write-ups (src/data/writeups.ts) */
      note: string
      icon: LucideIcon
    }
  | {
      kind: 'ratio'
      label: string
      left: number
      right: number
      note: string
      icon: LucideIcon
      rightIcon: LucideIcon
    }

const toolsPublished = STATS.find((s) => /tool/i.test(s.label))?.value ?? 14

export const FUN_STATS: FunStat[] = [
  {
    kind: 'count',
    label: 'CTF top-10 finishes',
    // OWNER: your real count (team placings in events where you played rev / pwn)
    value: 31,
    note: 'team placings · I play rev & pwn',
    icon: Trophy,
  },
  {
    kind: 'count',
    label: 'Technical reports',
    // OWNER: your real count of delivered reports, client and internal. The public
    // write-up count in the note fills itself in from src/data/writeups.ts.
    value: 42,
    // " " keeps the count on the same line as the words it counts
    note: 'private, under NDA · {writeups} public write-ups',
    icon: FileText,
  },
  {
    kind: 'count',
    label: 'Open-source tools',
    value: toolsPublished,
    note: 'loaders, dissectors, emulation harnesses',
    icon: Package,
  },
  {
    kind: 'count',
    label: 'Coordinated disclosures',
    // OWNER: your real count
    value: 19,
    note: 'vendor first, on an agreed timeline',
    icon: ShieldCheck,
  },
  {
    kind: 'ratio',
    label: 'Coffee : crash ratio',
    left: 1,
    right: 46,
    note: 'one cup per 46 fuzzer crashes triaged',
    icon: Coffee,
    rightIcon: Bug,
  },
]
