import type { LucideIcon } from 'lucide-react'
import {
  BookMarked,
  Briefcase,
  Bug,
  Building2,
  Code2,
  Coffee,
  Cpu,
  Crosshair,
  FileSignature,
  FileText,
  Flag,
  FlaskConical,
  Lightbulb,
  Microchip,
  Network,
  Package,
  PackageCheck,
  Radio,
  Repeat2,
  Scale,
  ScanSearch,
  ShieldCheck,
  Trophy,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import { PROFILE, STATS } from './profile'

/* ── copy for the section headings ─────────────────────────────────── */

export const ABOUT_COPY = {
  hero: {
    eyebrow: 'Operator profile',
    command: 'whoami --verbose',
    title: 'About Nox',
    lead: 'The person you call when the only documentation left is the binary itself.',
  },
  timeline: {
    eyebrow: 'Career log · 2018 → 2026',
    title: 'Eight Years, Six Chapters',
    subtitle:
      'From CTF crackmes and a malware triage queue to leading a tooling team and running my own practice. Every chapter built on the one before it.',
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
  },
}

/* ── holographic ID card ───────────────────────────────────────────── */

export interface IdField {
  label: string
  value: string
  /** renders a pulsing status LED next to the value */
  live?: boolean
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
  issuer: 'NOX · RE LAB',
  docType: 'Operator access badge',
  clearance: 'Class IV',
  name: PROFILE.name,
  role: PROFILE.role,
  fields: [
    { label: 'Specialisation', value: 'Binary & protocol RE' },
    { label: 'Experience', value: '8 yrs' },
    { label: 'Base', value: PROFILE.location },
    { label: 'Status', value: PROFILE.available ? 'Available' : 'Booked', live: PROFILE.available },
  ],
  serial: 'NX-0847',
  issued: '2018.03',
  manifesto:
    'Every binary is a stack of decisions someone else compiled. I read them back: patiently, legally, and with notes good enough that nobody has to do it twice.',
  signature: 'Nox',
  pgp: {
    algo: 'ed25519',
    // placeholder: replace with the fingerprint of your published key
    fingerprint: '7E3A 91C4 0B52 D8F1 6A2E 4C90 B7D3 1F85 E06A 29CB',
  },
  authorised: {
    title: 'Authorised work only',
    body: 'Every engagement starts with written permission from the system owner, an agreed scope and a disclosure plan. No licence bypasses, no DRM circumvention, no access I was not given.',
  },
}

/* ── bio ───────────────────────────────────────────────────────────── */

export const BIO_FILE = '~/nox/about.md'

/** First-person paragraphs. Wrap a phrase in **double asterisks** to highlight it. */
export const BIO: string[] = [
  "I'm Nox, a reverse engineer. For eight years I've been the person teams call when the only documentation left is **the binary itself**: a stripped x86-64 service, an ARM firmware image, or a wire protocol nobody ever wrote down.",
  'Most of my work is **interoperability and security review**: recovering file formats and protocols so legacy systems can be replaced, auditing firmware update paths, and finding memory-safety bugs before someone less friendly does. I live in IDA Pro and Ghidra, trace with Frida and WinDbg, and emulate with Unicorn when hardware is scarce.',
  'Every engagement is **scoped and authorised in writing**, and ends with something you keep: a written spec, an annotated database, reproducible scripts and test vectors. Anything I do twice gets automated, which is where my open-source tools came from.',
]

export interface QuickFact {
  label: string
  value: string
  icon: LucideIcon
  /** marks the fact as live / in progress */
  live?: boolean
}

export const QUICK_FACTS: QuickFact[] = [
  { label: 'Focus', value: 'Binary & protocol RE, firmware security', icon: Crosshair },
  { label: 'Platforms', value: 'Windows x64 · Linux / ELF · ARM Cortex-M · Android', icon: Cpu },
  { label: 'Languages', value: 'C · C++ · Python · Rust · x86-64 & ARM asm', icon: Code2 },
  {
    label: 'Currently',
    value: 'Writing a Ghidra loader for a proprietary firmware container',
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
    role: 'CTF player & malware triage analyst',
    org: 'Security operations centre',
    orgIcon: Users,
    icon: Flag,
    summary:
      'Weekend CTFs, weeknight triage queue: unpacking commodity loaders, writing YARA rules and learning to read x86 faster than the sandbox report.',
    highlights: ['x86 · PE32', 'YARA', 'Unpacking', 'x64dbg', 'Crackmes'],
  },
  {
    start: 2019,
    end: 2021,
    role: 'Binary analyst → vulnerability researcher',
    org: 'Security consultancy',
    orgIcon: Building2,
    icon: Bug,
    summary:
      'Patch-diffed Windows services, triaged fuzzer crashes to root cause and reported memory-safety bugs through coordinated disclosure.',
    highlights: ['BinDiff', 'WinDbg + TTD', 'WinAFL', 'Heap triage', 'CVD'],
  },
  {
    start: 2021,
    end: 2022,
    role: 'Protocol & interoperability engineer',
    org: 'Systems integrator',
    orgIcon: Building2,
    icon: Network,
    summary:
      'Mapped undocumented binary protocols between legacy controllers and their management software, then specified clean-room clients that replaced them.',
    highlights: ['Wireshark Lua', 'Scapy', 'Kaitai Struct', 'CRC & framing', 'Clean-room spec'],
  },
  {
    start: 2022,
    end: 2024,
    role: 'Firmware & IoT security researcher',
    org: 'Product security team',
    orgIcon: Users,
    icon: Microchip,
    summary:
      'Dumped flash over SWD and UART, unpacked SquashFS images and audited bootloaders and OTA update paths under emulation.',
    highlights: ['UART · SWD', 'binwalk', 'Ghidra', 'QEMU · Unicorn', 'Secure boot'],
  },
  {
    start: 2024,
    end: 2025,
    role: 'Reverse engineering tooling lead',
    org: 'Security consultancy · R&D',
    orgIcon: Building2,
    icon: Wrench,
    summary:
      'Led a four-person team building the shared analysis pipeline: headless Ghidra jobs, IDAPython plug-ins and a Frida tracing harness used on every engagement.',
    highlights: ['Ghidra headless', 'IDAPython', 'Frida', 'CI pipelines', 'Mentoring'],
  },
  {
    start: 2025,
    end: null,
    role: 'Independent reverse engineering consultant',
    org: 'Independent',
    orgIcon: User,
    icon: Briefcase,
    summary:
      'Authorised engagements for vendors and integrators: interoperability, firmware audits, legacy format recovery and hands-on training for in-house teams.',
    highlights: ['Interop', 'Firmware audits', 'Format recovery', 'Training'],
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
  { kind: 'count', label: 'CTF top-10 finishes', value: 31, note: 'rev & pwn categories', icon: Trophy },
  { kind: 'count', label: 'Write-ups published', value: 42, note: 'teardowns & tooling notes', icon: FileText },
  {
    kind: 'count',
    label: 'Open-source tools',
    value: toolsPublished,
    note: 'loaders, parsers, Frida scripts',
    icon: Package,
  },
  {
    kind: 'count',
    label: 'Coordinated disclosures',
    value: 19,
    note: 'every one fixed before publication',
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
