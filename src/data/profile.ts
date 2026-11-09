export const PROFILE = {
  handle: 'Nox',
  name: 'Nox',
  role: 'Reverse Engineer & Systems Developer',
  // OWNER: real base / timezone (the footer clock and the contact page parse the "UTC+N" part)
  location: 'Remote · UTC+1',
  available: true,
  // OWNER: real contact address (also hard-coded in the <noscript> card of index.html)
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
  // OWNER: real profile URLs and handles (the hrefs below are bare site roots)
  socials: [
    { label: 'GitHub', href: 'https://github.com/', handle: '@nox' },
    { label: 'X', href: 'https://x.com/', handle: '@nox_re' },
    { label: 'Mail', href: 'mailto:contact@nox.re', handle: 'contact@nox.re' },
  ],
}

/**
 * The site's one PGP key: the About badge, its verify console and the Contact
 * PGP tile all read it. (Kept here, not in about.ts, so the entry bundle that
 * Home and Contact share doesn't pull in the whole About data file.)
 */
export const PGP_KEY = {
  // OWNER: placeholder key. Paste your published key's algorithm and 40-hex v4
  // fingerprint (gpg --fingerprint you@domain), grouped the way gpg prints it.
  algo: 'ed25519',
  fingerprint: '7E3A 91C4 0B52 D8F1 6A2E  4C90 B7D3 1F85 E06A 29CB',
}

/** One availability wording everywhere (Home, Contact, the About badge, the footer); PROFILE.available picks the line. */
export const AVAILABILITY_STATUS = {
  open: 'Accepting new engagements',
  booked: 'Fully booked',
} as const

export const STATS = [
  { label: 'Years Reversing', value: 8, suffix: '+' },
  { label: 'Binaries Analysed', value: 420, suffix: '+' },
  { label: 'Protocols Mapped', value: 37, suffix: '' },
  { label: 'Tools Published', value: 14, suffix: '' },
]
