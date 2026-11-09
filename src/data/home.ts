import type { TermLine } from '@/components/ui/Terminal'

/**
 * Copy for the Home section: the hero and the story blocks below it.
 *
 * Facts (projects, write-ups, tools, capabilities, availability) are read
 * from their own data files at render time, so this file only holds wording
 * that is specific to Home. Keep it free of heavy imports: the hero ships in
 * the entry chunk and imports this module.
 */

export const HERO = {
  prompt: 'whoami',
  ctaPrimary: 'Explore portfolio',
  ctaSecondary: 'Hire me',
  /** quick-read specialisms under the call-to-action buttons */
  chips: ['x86-64', 'ARM64', 'PE / ELF', 'Firmware', 'Protocols', 'Emulation'],
  terminal: {
    title: 'onyx@workstation',
    badge: 'triage',
    footLeft: 'sandboxed vm',
    footRight: 'pid 4821 · 0 crashes',
    /** read to screen readers instead of the animated log */
    srLabel: 'Example first-pass triage of an authorised Windows binary',
  },
  scrollCue: 'scroll',
  scrollCueLabel: 'Scroll to what I do',
}

/**
 * First-pass triage of a 32-bit Windows service, typed out in the hero.
 * Every value is internally consistent: default 32-bit image base, an entry
 * point inside .text, a high-entropy resource, and the same rolling-XOR
 * string decoder and anti-debug trio covered in the write-ups and case
 * studies. Lines stay under ~36 characters so they fit a 360 px phone.
 */
export const HERO_SESSION: TermLine[] = [
  { text: '$ onyx triage ./subject.exe', tone: 'dim' },
  { text: 'PE32 · i386 · 5 sections ..... ok', tone: 'ok' },
  { text: 'base 0x00400000  entry 0x004014C0', tone: 'ok' },
  { text: 'imports  KERNEL32 ADVAPI32 WS2_32', tone: 'dim' },
  { text: '.rsrc entropy 7.94 → packed blob?', tone: 'warn' },
  { text: 'strings  212 behind a rolling XOR', tone: 'warn' },
  { text: 'anti-debug  3 checks (PEB, rdtsc)', tone: 'warn' },
  { text: 'cfg  1,316 funcs · 12,847 xrefs ok', tone: 'ok' },
  { text: '# scope: authorised · NDA on file', tone: 'dim' },
]

/** One short line under each hero stat, keyed by the STATS label in profile.ts. */
export const STAT_NOTES: Record<string, string> = {
  'Years Reversing': 'since 2018',
  'Binaries Analysed': 'PE · ELF · firmware',
  'Protocols Mapped': 'each with a client',
  'Tools Published': 'loaders & plugins',
}

/** Case studies featured on Home, in display order (ids from projects.ts). */
export const FEATURED_PROJECT_IDS = ['binary-case-study', 'protocol-analyzer', 'file-format']

/** How many of the newest write-ups Home shows. */
export const LATEST_WRITEUP_COUNT = 3

/**
 * One-line summaries for the capability strip, keyed by capability title in
 * expertise.ts. A capability without an entry falls back to the first clause
 * of its own body text.
 */
export const CAPABILITY_HOOKS: Record<string, string> = {
  'Static Analysis': 'Stripped x86-64, ARM64 and MIPS binaries, decompiled, typed and annotated.',
  'Dynamic Analysis': 'Tracing and hooking straight through anti-debug, anti-VM and integrity checks.',
  'Protocol Reversing': 'Proprietary wire formats captured, decoded, replayed and reimplemented.',
  'File Format Reconstruction': 'Undocumented containers mapped field by field, checksums included.',
  'Firmware & Embedded': 'Flash dumps unpacked, rebased and emulated so the code runs off-device.',
  'Tooling & Automation': 'One-off teardowns turned into tested pipelines other engineers can run.',
}

export const HOME_BLOCKS = {
  capabilities: {
    eyebrow: 'What I do',
    /** {count} is spelled out from the number of capabilities in expertise.ts */
    title: '{count} disciplines, one workflow',
    subtitle:
      'Read it statically, watch it run, map its wire format and file layout, then turn what I learned into tooling.',
    action: 'All expertise',
  },
  work: {
    eyebrow: 'Selected work',
    title: 'Binaries, protocols, file formats',
    subtitle:
      'Three authorised engagements, each taken from the first byte to a delivered, tested result.',
    action: 'All case studies',
    cardAction: 'Read the case study',
  },
  writeups: {
    eyebrow: 'Latest write-ups',
    title: 'Notes from the bench',
    subtitle:
      'Long-form teardowns with the exact commands and code, written so another engineer can reproduce every step.',
    action: 'All write-ups',
    latest: 'Latest',
  },
  toolchain: {
    eyebrow: 'Toolchain',
    title: 'The lab, loaded',
    /** {tools} and {groups} are filled in from tools.ts */
    subtitle:
      '{tools} tools across {groups} disciplines, from IDA Pro and WinDbg to Frida, Kaitai and a Lua dissector for every protocol I map.',
    action: 'Open the toolkit',
    rows: ['Analysis & runtime', 'Wire, formats & code'],
    recent: 'Last 30 days',
    pause: 'Pause the toolchain ticker',
    resume: 'Resume the toolchain ticker',
  },
  engage: {
    eyebrow: 'Work with me',
    title: 'Got a binary nobody can explain?',
    /** {response} is CONTACT.responseTime from contact.ts, spelled out ("24 hours") */
    body:
      'Tell me what the target is, what you need to learn and who owns it. I reply within {response}, the intro call gets you a straight answer on feasibility, and nothing is touched before the scope is signed.',
    primary: 'Start an engagement',
    /** primary button and start-date note while PROFILE.available is false */
    primaryBooked: 'Join the waitlist',
    bookedNote: 'waitlist open',
    secondary: 'Email me',
    facts: {
      response: 'Response',
      intro: 'Intro call',
      start: 'Next start',
      timezone: 'Timezone',
    },
  },
}
