import { motion } from 'framer-motion'
import { FileLock2, MapPin, ShieldCheck, Timer } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Chip } from '@/components/ui/Chip'
import { ToastProvider } from '@/components/contact/Toast'
import { ContactForm } from '@/components/contact/ContactForm'
import { ChannelTiles } from '@/components/contact/ChannelTiles'
import { Availability } from '@/components/contact/Availability'
import { EngagementSteps } from '@/components/contact/EngagementSteps'
import { HandshakePanel, RulesPanel } from '@/components/contact/Handshake'
import { AVAILABILITY, CONTACT } from '@/data/contact'
import { PROFILE } from '@/data/profile'

const chip = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export function Contact() {
  return (
    <ToastProvider>
      <Section id="contact">
        <SectionHeading
          eyebrow="Open For Work"
          title="Get In Touch"
          subtitle="Got a binary, protocol or file format that needs taking apart? Send a brief over the secure channel. Every engagement starts with a clear scope and written authorisation."
          className="mx-auto"
        />

        <motion.ul
          aria-label="Engagement status"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
        >
          <motion.li variants={chip}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-emerald-300">
              <span aria-hidden className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {PROFILE.available ? AVAILABILITY.status : 'Fully booked'}
            </span>
          </motion.li>
          <motion.li variants={chip}>
            <Chip icon={MapPin} size="xs">
              {PROFILE.location}
            </Chip>
          </motion.li>
          <motion.li variants={chip}>
            <Chip icon={Timer} size="xs">
              Replies {CONTACT.responseTime}
            </Chip>
          </motion.li>
          <motion.li variants={chip}>
            <Chip icon={FileLock2} size="xs">
              NDA-ready
            </Chip>
          </motion.li>
          <motion.li variants={chip}>
            <Chip icon={ShieldCheck} size="xs">
              Authorised work only
            </Chip>
          </motion.li>
        </motion.ul>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-7">
          <ContactForm />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <div className="md:col-span-2 lg:col-span-1">
              <ChannelTiles />
            </div>
            <Availability />
            <EngagementSteps />
          </div>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:mt-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-7">
          <HandshakePanel />
          <RulesPanel />
        </div>
      </Section>
    </ToastProvider>
  )
}
