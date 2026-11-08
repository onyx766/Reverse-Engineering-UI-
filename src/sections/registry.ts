import { lazy, type ComponentType } from 'react'
import type { SectionId } from '@/theme/themes'
import { Home } from './Home'

type Loader = () => Promise<{ default: ComponentType }>

/** Home ships in the entry chunk; every other section is split out. */
const LOADERS: Record<Exclude<SectionId, 'home'>, Loader> = {
  expertise: () => import('./Expertise').then((m) => ({ default: m.Expertise })),
  projects: () => import('./Projects').then((m) => ({ default: m.Projects })),
  tools: () => import('./Tools').then((m) => ({ default: m.Tools })),
  writeups: () => import('./Writeups').then((m) => ({ default: m.Writeups })),
  about: () => import('./About').then((m) => ({ default: m.About })),
  contact: () => import('./Contact').then((m) => ({ default: m.Contact })),
}

export const SECTIONS: Record<SectionId, ComponentType> = {
  home: Home,
  expertise: lazy(LOADERS.expertise),
  projects: lazy(LOADERS.projects),
  tools: lazy(LOADERS.tools),
  writeups: lazy(LOADERS.writeups),
  about: lazy(LOADERS.about),
  contact: lazy(LOADERS.contact),
}

/** Warms a section's chunk (module cache makes repeat calls free). */
export function preloadSection(id: SectionId) {
  if (id === 'home') return
  LOADERS[id]().catch(() => {})
}
