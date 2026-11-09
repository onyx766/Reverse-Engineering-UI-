import type { SectionId } from '@/theme/themes'

/**
 * A one-shot "open this item" hand-off between sections: Home sets it right
 * before switching, and the target section reads it on mount to open the
 * exact case study or article the visitor clicked.
 *
 * Reading is split into peek (safe in a useState initializer, which
 * StrictMode may call twice) and clear (in an effect after mount).
 */
let pending: { section: SectionId; id: string; at: number } | null = null

/** intents older than this are stale (the switch failed or was abandoned) */
const TTL_MS = 8000

export function setIntent(section: SectionId, id: string) {
  pending = { section, id, at: performance.now() }
}

export function peekIntent(section: SectionId): string | null {
  if (!pending || pending.section !== section) return null
  if (performance.now() - pending.at > TTL_MS) {
    pending = null
    return null
  }
  return pending.id
}

export function clearIntent(section: SectionId) {
  if (pending?.section === section) pending = null
}
