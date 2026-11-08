import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Options {
  typeSpeed?: number
  deleteSpeed?: number
  holdTime?: number
  loop?: boolean
}

/** Cycles through phrases, typing and deleting one character at a time. */
export function useTypewriter(words: string[], opts: Options = {}) {
  const { typeSpeed = 58, deleteSpeed = 28, holdTime = 1700, loop = true } = opts
  const reduced = useReducedMotion()
  const [text, setText] = useState(reduced ? (words[0] ?? '') : '')
  const [done, setDone] = useState(false)
  const idx = useRef(0)
  const deleting = useRef(false)

  useEffect(() => {
    if (reduced || words.length === 0) {
      setText(words[0] ?? '')
      return
    }

    let timer: ReturnType<typeof setTimeout>

    const step = () => {
      const word = words[idx.current % words.length]
      setText((prev) => {
        if (!deleting.current) {
          const next = word.slice(0, prev.length + 1)
          if (next === word) {
            if (!loop && idx.current === words.length - 1) {
              setDone(true)
              return next
            }
            deleting.current = true
            timer = setTimeout(step, holdTime)
            return next
          }
          timer = setTimeout(step, typeSpeed + Math.random() * 42)
          return next
        }
        const next = word.slice(0, Math.max(0, prev.length - 1))
        if (next === '') {
          deleting.current = false
          idx.current += 1
        }
        timer = setTimeout(step, next === '' ? 260 : deleteSpeed)
        return next
      })
    }

    timer = setTimeout(step, 420)
    return () => clearTimeout(timer)
  }, [words, typeSpeed, deleteSpeed, holdTime, loop, reduced])

  return { text, done }
}
