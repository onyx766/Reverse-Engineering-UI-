import {
  Binary,
  Braces,
  Bug,
  FileSearch,
  Layers,
  Network,
  Syringe,
  type LucideIcon,
} from 'lucide-react'
import {
  TOOLS,
  TOOL_CATEGORIES,
  type Tool,
  type ToolCategory,
  type ToolCategoryId,
} from '@/data/tools'

export type CategoryFilter = ToolCategoryId | 'all'

export const EASE = [0.22, 1, 0.36, 1] as const

export const CATEGORY_ICON: Record<ToolCategoryId, LucideIcon> = {
  disasm: Binary,
  debug: Bug,
  instr: Syringe,
  net: Network,
  formats: FileSearch,
  lang: Braces,
  platform: Layers,
}

export const CATEGORY_BY_ID = Object.fromEntries(
  TOOL_CATEGORIES.map((c) => [c.id, c]),
) as Record<ToolCategoryId, ToolCategory>

export const TOOL_BY_ID: Record<string, Tool> = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

export const CATEGORY_COUNT = TOOLS.reduce(
  (acc, t) => {
    acc[t.category] += 1
    return acc
  },
  Object.fromEntries(TOOL_CATEGORIES.map((c) => [c.id, 0])) as Record<ToolCategoryId, number>,
)

export function toolsFor(filter: CategoryFilter) {
  return filter === 'all' ? TOOLS : TOOLS.filter((t) => t.category === filter)
}

/** Scrolls a block into view below the fixed navbar. */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = el.getBoundingClientRect().top + window.scrollY - 112
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
}
