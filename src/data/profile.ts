export const PROFILE = {
  handle: 'Nox',
  name: 'Nox',
  role: 'Reverse Engineer & Systems Developer',
  location: 'Remote · UTC+1',
  available: true,
  email: 'contact@nox.re',
  tagline:
    'Eight years taking software apart — binaries, protocols, file formats — and writing down exactly how every piece works.',
  roles: [
    'Reverse Engineer',
    'Binary Analyst',
    'Protocol Archaeologist',
    'Systems Developer',
    'Tooling Author',
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/', handle: '@nox' },
    { label: 'X', href: 'https://x.com/', handle: '@nox_re' },
    { label: 'Mail', href: 'mailto:contact@nox.re', handle: 'contact@nox.re' },
  ],
}

export const STATS = [
  { label: 'Years Reversing', value: 8, suffix: '+' },
  { label: 'Binaries Analysed', value: 420, suffix: '+' },
  { label: 'Protocols Mapped', value: 37, suffix: '' },
  { label: 'Tools Published', value: 14, suffix: '' },
]

/** Fake-but-plausible boot log for the hero terminal. */
export const BOOT_LINES: { text: string; tone?: 'ok' | 'warn' | 'dim' }[] = [
  { text: '$ nox --init --target ./subject.bin', tone: 'dim' },
  { text: 'loading PE headers ................ ok', tone: 'ok' },
  { text: 'sections: .text .rdata .data .rsrc', tone: 'dim' },
  { text: 'entry point  -> 0x00401000', tone: 'ok' },
  { text: 'detect packer -> none', tone: 'ok' },
  { text: 'xrefs resolved: 12,847', tone: 'ok' },
  { text: 'anti-debug checks: 3 located', tone: 'warn' },
  { text: 'building control-flow graph ...... ok', tone: 'ok' },
  { text: 'ready. 8 years of this and it still rules.', tone: 'dim' },
]
