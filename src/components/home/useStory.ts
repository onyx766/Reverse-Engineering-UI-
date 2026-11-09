import { startTransition, useEffect, useState } from 'react'

export type StoryModule = typeof import('./story')

let cached: StoryModule | null = null
let pending: Promise<StoryModule> | null = null

/** Loads the story chunk once; later calls share the same promise. */
export function loadStory(): Promise<StoryModule> {
  pending ??= import('./story').then((m) => (cached = m))
  // a failed fetch (offline, deploy swap) may be retried on the next mount
  pending.catch(() => {
    pending = null
  })
  return pending
}

/**
 * The story module, handed out only after the hero has had its moment: a
 * short settle delay plus an idle slot, cut short by the visitor's first
 * scroll. Even when the chunk is cached, a fresh Home mount waits, so a
 * section switch never pays for the story in the same frames as the hero.
 */
export function useStory(settleMs = 450): StoryModule | null {
  const [mod, setMod] = useState<StoryModule | null>(null)

  useEffect(() => {
    let alive = true
    let idle = 0
    let timer = 0

    const deliver = () => {
      cleanup()
      const apply = (m: StoryModule) => {
        if (alive) startTransition(() => setMod(m))
      }
      if (cached) apply(cached)
      else loadStory().then(apply, () => {})
    }

    // the app's own scroll-to-top on a section switch lands at 0; only a real scroll counts
    const onScroll = () => {
      if (window.scrollY > 40) deliver()
    }

    function cleanup() {
      window.clearTimeout(timer)
      if (idle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle)
      window.removeEventListener('scroll', onScroll)
    }

    timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(deliver, { timeout: 700 })
      else deliver()
    }, settleMs)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      alive = false
      cleanup()
    }
  }, [settleMs])

  return mod
}
