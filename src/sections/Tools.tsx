import { useState } from 'react'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { OrbitalToolkit } from '@/components/tools/OrbitalToolkit'
import { LoadoutPanel } from '@/components/tools/LoadoutPanel'
import { TimeInToolPanel } from '@/components/tools/TimeInToolPanel'
import type { CategoryFilter } from '@/components/tools/meta'
import type { ToolCategoryId } from '@/data/tools'

export function Tools() {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [hoverCat, setHoverCat] = useState<ToolCategoryId | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [, setOpenId] = useState<string | null>(null)

  const highlight = hoverCat ?? (filter === 'all' ? null : filter)

  return (
    <Section id="tools">
      <SectionHeading
        eyebrow="Daily Driver"
        title="Tools & Environment"
        subtitle="The disassemblers, debuggers, tracers and runtimes I live inside every day — and the isolated lab they run in."
        className="mx-auto"
      />

      <div className="relative mt-10 grid gap-6 md:grid-cols-2 xl:mt-12 xl:grid-cols-[17rem_minmax(0,1fr)_17rem] xl:items-center xl:gap-5 xl:[perspective:1800px]">
        <div className="md:col-span-2 xl:order-2 xl:col-span-1">
          <OrbitalToolkit highlight={highlight} external={preview} onOpen={setOpenId} />
        </div>
        <div className="xl:order-1 xl:[transform:rotateY(9deg)]">
          <LoadoutPanel filter={filter} onFilter={setFilter} onHighlight={setHoverCat} />
        </div>
        <div className="xl:order-3 xl:[transform:rotateY(-9deg)]">
          <TimeInToolPanel onPreview={setPreview} onOpen={setOpenId} />
        </div>
      </div>
    </Section>
  )
}
