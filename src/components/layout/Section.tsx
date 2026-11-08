import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Common stage wrapper: perspective context + consistent rhythm. */
export function Section({
  id,
  children,
  className,
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'scene relative mx-auto w-full max-w-[1400px] px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40',
        className,
      )}
    >
      {children}
    </section>
  )
}
