/**
 * Per-section theme engine.
 * Every nav destination owns a distinct palette; switching sections
 * re-tints the entire UI (background, panels, nav, 3D core, glows).
 * Colors are stored as "R G B" triplets so Tailwind can do `rgb(var(--accent) / alpha)`.
 */

export type SectionId =
  | 'home'
  | 'expertise'
  | 'projects'
  | 'tools'
  | 'writeups'
  | 'about'
  | 'contact'

export interface Theme {
  id: SectionId
  label: string
  /** primary accent */
  accent: string
  /** secondary accent (gradient partner) */
  accent2: string
  /** tertiary accent (sparks / highlights) */
  accent3: string
  /** panel surface tint */
  surface: string
  /** page background base */
  deep: string
  /** body text */
  ink: string
  /** secondary text */
  muted: string
  /** hex versions for WebGL / canvas */
  gl: { accent: string; accent2: string; accent3: string; fog: string }
}

export const THEMES: Record<SectionId, Theme> = {
  home: {
    id: 'home',
    label: 'Home',
    accent: '34 211 238', // cyan
    accent2: '45 212 191', // teal
    accent3: '125 211 252',
    surface: '8 20 28',
    deep: '3 8 13',
    ink: '226 243 248',
    muted: '129 163 177',
    gl: { accent: '#22d3ee', accent2: '#2dd4bf', accent3: '#7dd3fc', fog: '#03080d' },
  },
  expertise: {
    id: 'expertise',
    label: 'Expertise',
    accent: '168 85 247', // violet
    accent2: '217 70 239', // fuchsia
    accent3: '196 181 253',
    surface: '21 11 32',
    deep: '9 4 16',
    ink: '240 232 252',
    muted: '163 143 189',
    gl: { accent: '#a855f7', accent2: '#d946ef', accent3: '#c4b5fd', fog: '#090410' },
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    accent: '59 130 246', // blue (matches the reference render)
    accent2: '14 165 233',
    accent3: '147 197 253',
    surface: '10 18 36',
    deep: '3 7 20',
    ink: '226 238 255',
    muted: '134 157 194',
    gl: { accent: '#3b82f6', accent2: '#0ea5e9', accent3: '#93c5fd', fog: '#030714' },
  },
  tools: {
    id: 'tools',
    label: 'Tools',
    accent: '16 185 129', // emerald
    accent2: '132 204 22', // lime
    accent3: '110 231 183',
    surface: '7 26 22',
    deep: '2 12 10',
    ink: '222 250 240',
    muted: '123 170 155',
    gl: { accent: '#10b981', accent2: '#84cc16', accent3: '#6ee7b7', fog: '#020c0a' },
  },
  writeups: {
    id: 'writeups',
    label: 'Write-ups',
    accent: '245 158 11', // amber
    accent2: '249 115 22', // orange
    accent3: '253 224 71',
    surface: '31 20 6',
    deep: '14 8 2',
    ink: '255 243 224',
    muted: '188 155 112',
    gl: { accent: '#f59e0b', accent2: '#f97316', accent3: '#fde047', fog: '#0e0802' },
  },
  about: {
    id: 'about',
    label: 'About',
    accent: '244 63 94', // rose
    accent2: '236 72 153', // pink
    accent3: '253 164 175',
    surface: '31 10 18',
    deep: '14 3 8',
    ink: '255 233 238',
    muted: '192 140 155',
    gl: { accent: '#f43f5e', accent2: '#ec4899', accent3: '#fda4af', fog: '#0e0308' },
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    accent: '99 102 241', // indigo
    accent2: '139 92 246',
    accent3: '165 180 252',
    surface: '14 14 36',
    deep: '5 5 18',
    ink: '229 231 255',
    muted: '143 146 190',
    gl: { accent: '#6366f1', accent2: '#8b5cf6', accent3: '#a5b4fc', fog: '#050512' },
  },
}

export const SECTION_ORDER: SectionId[] = [
  'home',
  'expertise',
  'projects',
  'tools',
  'writeups',
  'about',
  'contact',
]

/** Nav items rendered in the header (contact is a standalone button). */
export const NAV_ITEMS: SectionId[] = [
  'home',
  'expertise',
  'projects',
  'tools',
  'writeups',
  'about',
]

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-2', theme.accent2)
  root.style.setProperty('--accent-3', theme.accent3)
  root.style.setProperty('--surface', theme.surface)
  root.style.setProperty('--deep', theme.deep)
  root.style.setProperty('--ink', theme.ink)
  root.style.setProperty('--muted', theme.muted)
  root.dataset.theme = theme.id
}
