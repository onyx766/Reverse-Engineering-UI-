export const PROFILE = {
  handle: 'Onyx',
  name: 'Onyx',
  role: 'Reverse Engineer | Automation Engineer & AIO, ACO & ATC | Discord & Whop App Developer',
  // OWNER: real base / timezone (the footer clock and the contact page parse the "UTC+N" part)
  location: 'Remote · UTC+1',
  available: true,
  // OWNER: real contact address (also hard-coded in the <noscript> card of index.html)
  email: 'ryanma02228@gmail.com',
  tagline:
    'Eight years taking software apart and automating what’s left — reverse engineering, AIO / ACO / ATC bots, and Discord & Whop apps.',
  roles: [
    'Reverse Engineer',
    'Automation Engineer',
    'AIO Developer',
    'ACO & ATC Specialist',
    'Discord App Developer',
    'Whop App Developer',
  ],
  // OWNER: real profile URLs and handles (the hrefs below are bare site roots)
  socials: [
    { label: 'GitHub', href: 'https://github.com/onyx766', handle: '@onyx766' },
    { label: 'Telegram', href: 'https://t.me/onyxdev766', handle: '@onyxdev766' },
    { label: 'Mail', href: 'mailto:ryanma02228@gmail.com', handle: 'ryanma02228@gmail.com' },
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
