/**
 * Copy for the global experience layer (boot intro, section-switch HUD,
 * footer). Edit freely — every component reads its text from here.
 */

import { AVAILABILITY_STATUS } from './profile'

export interface BootLine {
  /** short verb column, like a loader's log facility */
  tag: string
  text: string
  status: 'ok' | 'go'
}

export const BOOT = {
  title: 'NOX',
  subtitle: '// reverse engineering lab',
  hint: 'click or press any key to skip',
  hud: {
    topLeft: 'nox/lab · build 2026.11',
    topRight: 'session 0x7F3A9C',
    bottomLeft: 'image base 0x00400000',
    bottomRight: 'authorised targets only',
  },
  log: [
    { tag: 'mount', text: 'modules /lab/{core,ui,gl,fx}', status: 'ok' },
    { tag: 'ldsym', text: 'nox.pdb · 12,847 symbols resolved', status: 'ok' },
    { tag: 'map', text: '.text @ 0x00401000 · r-x', status: 'ok' },
    { tag: 'gl', text: 'calibrating hologram · 7 palettes', status: 'ok' },
    { tag: 'scope', text: 'authorised engagements · NDA on', status: 'ok' },
    { tag: 'entry', text: 'jmp 0x00401000 · welcome to the lab', status: 'go' },
  ] satisfies BootLine[],
}

/**
 * The first 136 bytes of a real PE32 image: the MZ header, the MS-DOS stub
 * that prints "This program cannot be run in DOS mode.", then the "PE\0\0"
 * signature, Machine 0x014C (i386) and NumberOfSections 5, the same subject
 * the hero terminal triages. e_lfanew (offset 0x3C) is 0x80 because there is
 * no Rich header (GNU ld layout), so the signature really does sit at 0x80.
 * Used as the glyph trail behind the section-switch scan beam.
 */
export const PE_HEADER_BYTES = [
  '4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00',
  'B8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00',
  '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00',
  '00 00 00 00 00 00 00 00 00 00 00 00 80 00 00 00',
  '0E 1F BA 0E 00 B4 09 CD 21 B8 01 4C CD 21 54 68',
  '69 73 20 70 72 6F 67 72 61 6D 20 63 61 6E 6E 6F',
  '74 20 62 65 20 72 75 6E 20 69 6E 20 44 4F 53 20',
  '6D 6F 64 65 2E 0D 0D 0A 24 00 00 00 00 00 00 00',
  '50 45 00 00 4C 01 05 00',
].join(' ')

export const ROUTE_HUD = {
  /** prefix of the corner label shown while switching sections */
  label: '// routing ->',
  /** each section gets a fake code address, base + index * 0x1000 */
  base: 0x00401000,
}

export const FOOTER = {
  eyebrow: 'Reverse engineering lab',
  tagline: 'Binaries, protocols and file formats — taken apart, documented and rebuilt.',
  availability: AVAILABILITY_STATUS.open,
  build: '2026.11',
  copyright: '© 2026 Nox',
  notice: 'Authorised research only · every engagement scoped in writing',
  shortcutHint: 'press 1–7 to jump',
  telemetry: 'lab telemetry',
}
