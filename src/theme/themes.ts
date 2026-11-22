import type { CSSProperties } from 'react'

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

// One palette everywhere: the reference render's neon cyan on near-black.
export const THEMES: Record<SectionId, Theme> = {
  home: {
    id: 'home',
    label: 'Home',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
  },
  expertise: {
    id: 'expertise',
    label: 'Expertise',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
  },
  tools: {
    id: 'tools',
    label: 'Tools',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
  },
  writeups: {
    id: 'writeups',
    label: 'Write-ups',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
  },
  about: {
    id: 'about',
    label: 'About',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    accent: '40 226 246',
    accent2: '14 165 233',
    accent3: '165 243 252',
    surface: '9 22 31',
    deep: '4 8 12',
    ink: '238 245 248',
    muted: '160 178 190',
    gl: { accent: '#28e2f6', accent2: '#0ea5e9', accent3: '#a5f3fc', fog: '#04080c' },
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

/** CSS custom-property names of the seven palette slots. */
const SLOTS = [
  ['accent', 'accent'],
  ['accent-2', 'accent2'],
  ['accent-3', 'accent3'],
  ['surface', 'surface'],
  ['deep', 'deep'],
  ['ink', 'ink'],
  ['muted', 'muted'],
] as const

/**
 * Snaps the :root palette (per-channel custom properties; index.css builds
 * the "R G B" triplets from them). Changing a custom property on :root
 * re-styles every element in the document, so the app calls this only when
 * the page is nearly empty: on first render, and at the swap between the
 * outgoing and the incoming section. The visible morph runs on the small
 * `.palette-morph` scopes instead (see morphVars).
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  for (const [name, key] of SLOTS) {
    const [r, g, b] = theme[key].split(' ')
    root.style.setProperty(`--${name}-r`, r)
    root.style.setProperty(`--${name}-g`, g)
    root.style.setProperty(`--${name}-b`, b)
  }
  markTheme(theme)
}

/** Section id on <html data-theme> and the browser UI colour; no style cost. */
export function markTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme.id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.gl.fog)
}

const PALETTE_CACHE = new Map<SectionId, CSSProperties>()
const MORPH_CACHE = new Map<SectionId, CSSProperties>()

/**
 * The palette as fixed "R G B" custom properties, for an element that must
 * not follow :root: a section wrapper carries its own section's colours, so
 * the outgoing section keeps them while it fades. Cached per theme, so the
 * style object is referentially stable.
 */
export function paletteVars(theme: Theme): CSSProperties {
  let vars = PALETTE_CACHE.get(theme.id)
  if (!vars) {
    vars = Object.fromEntries(SLOTS.map(([name, key]) => [`--${name}`, theme[key]])) as CSSProperties
    PALETTE_CACHE.set(theme.id, vars)
  }
  return vars
}

/**
 * Channel values for a `.palette-morph` element (background, navbar, cursor):
 * the class rebuilds the triplets from these registered channels and
 * transitions them, so when the theme changes, only that element's subtree
 * is re-styled per frame while the palette morphs.
 */
export function morphVars(theme: Theme): CSSProperties {
  let vars = MORPH_CACHE.get(theme.id)
  if (!vars) {
    const entries: [string, string][] = []
    for (const [name, key] of SLOTS) {
      const [r, g, b] = theme[key].split(' ')
      entries.push([`--${name}-r`, r], [`--${name}-g`, g], [`--${name}-b`, b])
    }
    vars = Object.fromEntries(entries) as CSSProperties
    MORPH_CACHE.set(theme.id, vars)
  }
  return vars
}
