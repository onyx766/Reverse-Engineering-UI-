import { useCallback, useMemo, useState } from 'react'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { LazyMount } from '@/components/ui/LazyMount'
import { OrbitalToolkit } from '@/components/tools/OrbitalToolkit'
import { LoadoutPanel } from '@/components/tools/LoadoutPanel'
import { TimeInToolPanel } from '@/components/tools/TimeInToolPanel'
import { ToolArsenal } from '@/components/tools/ToolArsenal'
import { SkillRadar } from '@/components/tools/SkillRadar'
import { WorkflowTerminal } from '@/components/tools/WorkflowTerminal'
import { LabTopology } from '@/components/tools/LabTopology'
import { ToolDetailModal } from '@/components/tools/ToolDetailModal'
import { SubHeading } from '@/components/tools/SubHeading'
import { TOOL_BY_ID, reserve, scrollToId, toolsFor, type CategoryFilter } from '@/components/tools/meta'
import { TOOLS, type ToolCategoryId } from '@/data/tools'

export function Tools() {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [hoverCat, setHoverCat] = useState<ToolCategoryId | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const highlight = hoverCat ?? (filter === 'all' ? null : filter)
  const openTool = openId ? (TOOL_BY_ID[openId] ?? null) : null

  // page through the filtered grid when the tool is in it, otherwise through everything
  const modalList = useMemo(() => {
    const filtered = toolsFor(filter)
    return openId && filtered.some((t) => t.id === openId) ? filtered : TOOLS
  }, [filter, openId])

  const filterFromLoadout = useCallback((f: CategoryFilter) => {
    setFilter(f)
    scrollToId('tools-arsenal')
  }, [])

  const closeModal = useCallback(() => setOpenId(null), [])

  return (
    <Section id="tools">
      <SectionHeading
        eyebrow="Daily Driver"
        title="Tools & Environment"
        subtitle="The disassemblers, debuggers, tracers and runtimes I live inside every day — and the isolated lab they run in."
        className="mx-auto"
      />

      <div className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:mt-12 xl:grid-cols-[16rem_minmax(0,1fr)_16rem] xl:items-center xl:gap-5 xl:[perspective:1800px]">
        <div className="min-w-0 sm:col-span-2 xl:order-2 xl:col-span-1">
          <OrbitalToolkit highlight={highlight} external={preview} onOpen={setOpenId} />
        </div>
        {/* phones get the same filters as chips right above the arsenal, so the index would only add scroll */}
        <div className="min-w-0 max-sm:hidden xl:order-1 xl:[transform:rotateY(9deg)]">
          <LoadoutPanel filter={filter} onFilter={filterFromLoadout} onHighlight={setHoverCat} />
        </div>
        <div className="min-w-0 xl:order-3 xl:[transform:rotateY(-9deg)]">
          <TimeInToolPanel onPreview={setPreview} onOpen={setOpenId} />
        </div>
      </div>

      <div className="mt-20 sm:mt-24">
        <ToolArsenal filter={filter} onFilter={setFilter} onOpen={setOpenId} />
      </div>

      <div className="mt-20 sm:mt-24">
        <SubHeading
          index="03"
          title="Range & Routine"
          kicker="How deep each skill goes — and what a working session looks like"
        />
        <LazyMount minHeight={reserve('routine')} margin="300px 0px" delay={1600} className="mt-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-7">
            <SkillRadar />
            <WorkflowTerminal />
          </div>
        </LazyMount>
      </div>

      <div className="mt-20 sm:mt-24">
        <SubHeading index="04" title="The Lab" kicker="Isolated by design — nothing leaves without a reason" />
        <LazyMount minHeight={reserve('lab')} margin="300px 0px" delay={2200} className="mt-6">
          <LabTopology />
        </LazyMount>
      </div>

      <ToolDetailModal tool={openTool} list={modalList} onClose={closeModal} onNavigate={setOpenId} />
    </Section>
  )
}
