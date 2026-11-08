import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { HoloPanel } from '@/components/ui/HoloPanel'
import { Construction } from 'lucide-react'

/** Temporary stand-in for sections that land in later steps. */
export function Placeholder({
  eyebrow,
  title,
  subtitle,
  step,
}: {
  eyebrow: string
  title: string
  subtitle: string
  step: string
}) {
  return (
    <Section>
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} className="mx-auto" />
      <div className="mx-auto mt-14 max-w-md">
        <HoloPanel title="Under construction" icon={Construction} badge={step} from="bottom" float>
          <p className="font-mono text-[11.5px] leading-relaxed text-muted">
            This section is scheduled for <span className="neon">{step}</span> of the build.
          </p>
        </HoloPanel>
      </div>
    </Section>
  )
}
