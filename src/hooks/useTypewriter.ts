import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Options {
  typeSpeed?: number
  deleteSpeed?: number
  holdTime?: number
  loop?: boolean
}

interface Cursor {
  /** index into `words` (wraps) */
  word: number
  /** characters of the current word on screen */
  len: number
  deleting: boolean
  /** first tick hasn't happened yet (short lead-in) */
  idle: boolean
}

const START: Cursor = { word: 0, len: 0, deleting: false, idle: true }

/**
 * Cycles through phrases, typing and deleting one character at a time.
 *
 * A small state machine: every render schedules exactly one timer for the
 * next step, and the effect cleanup cancels it. (Scheduling inside a state
 * updater — the old approach — runs twice under StrictMode, so timers
 * multiplied and flooded the main thread.)
 */
export function useTypewriter(words: string[], opts: Options = {}) {
  const { typeSpeed = 58, deleteSpeed = 28, holdTime = 1700, loop = true } = opts
  const reduced = useReducedMotion()
  const [cur, setCur] = useState<Cursor>(START)
  const [done, setDone] = useState(false)
  // content key, so an inline array literal doesn't restart the cycle every render
  const key = words.join('␟')

  // a new phrase list starts over
  useEffect(() => {
    setCur(START)
    setDone(false)
  }, [key])

  useEffect(() => {
    if (reduced || done || words.length === 0) return

    const word = words[cur.word % words.length]
    let next: Cursor
    let delay: number

    if (cur.idle) {
      next = { ...cur, idle: false }
      delay = 420
    } else if (!cur.deleting) {
      if (cur.len < word.length) {
        next = { ...cur, len: cur.len + 1 }
        delay = typeSpeed + Math.random() * 42
      } else if (!loop && cur.word === words.length - 1) {
        setDone(true)
        return
      } else {
        next = { ...cur, deleting: true }
        delay = holdTime
      }
    } else if (cur.len > 0) {
      next = { ...cur, len: cur.len - 1 }
      delay = deleteSpeed
    } else {
      next = { word: cur.word + 1, len: 0, deleting: false, idle: false }
      delay = 260
    }

    const timer = setTimeout(() => setCur(next), delay)
    return () => clearTimeout(timer)
    // `words` is read through `key` (same content => same cycle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, done, key, typeSpeed, deleteSpeed, holdTime, loop, reduced])

  const text = reduced
    ? (words[0] ?? '')
    : (words[cur.word % Math.max(1, words.length)] ?? '').slice(0, cur.len)

  return { text, done }
}
