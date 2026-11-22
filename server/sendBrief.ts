/**
 * Server-side relay for the contact form: validates the brief the browser
 * POSTs and forwards it to Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Runs only on the server (the Vercel function in api/contact.ts and the Vite
 * dev middleware in vite.config.ts), so RESEND_API_KEY never reaches the browser.
 *
 * Env:
 *   RESEND_API_KEY  required, the re_… key
 *   CONTACT_TO      inbox that receives briefs (default below)
 *   CONTACT_FROM    sender; must be on a domain verified in Resend. Until you
 *                   verify one, Resend only allows onboarding@resend.dev, and
 *                   only to the address the Resend account was created with.
 */

export interface RelayEnv {
  RESEND_API_KEY?: string
  CONTACT_TO?: string
  CONTACT_FROM?: string
}

export interface RelayResult {
  status: number
  body: { ok: boolean; id?: string; error?: string }
}

const DEFAULT_TO = 'onyxdev88@gmail.com'
const DEFAULT_FROM = 'Onyx Portfolio <onboarding@resend.dev>'

// same bounds as CONTACT.limits in src/data/contact.ts
const LIMITS = { name: [2, 80], email: [3, 254], company: [0, 120], message: [30, 2000] } as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const within = (s: string, [min, max]: readonly [number, number]) => s.length >= min && s.length <= max
/** keeps header-bound values on one line */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ')

const fail = (status: number, error: string): RelayResult => ({ status, body: { ok: false, error } })

export async function relayBrief(input: unknown, env: RelayEnv): Promise<RelayResult> {
  if (!env.RESEND_API_KEY) return fail(500, 'Mail relay is not configured.')
  if (!input || typeof input !== 'object') return fail(400, 'Expected a JSON body.')

  const b = input as Record<string, unknown>
  const name = oneLine(str(b.name))
  const email = oneLine(str(b.email))
  const company = oneLine(str(b.company))
  const message = str(b.message)
  const timeline = oneLine(str(b.timeline))
  const ref = oneLine(str(b.ref)).slice(0, 32)
  const engagement = Array.isArray(b.engagement)
    ? b.engagement.filter((e): e is string => typeof e === 'string').map((e) => oneLine(e).slice(0, 60)).slice(0, 10)
    : []

  if (!within(name, LIMITS.name)) return fail(422, 'Name is missing or too long.')
  if (!within(email, LIMITS.email) || !EMAIL_RE.test(email)) return fail(422, 'Email address looks invalid.')
  if (!within(company, LIMITS.company)) return fail(422, 'Organisation is too long.')
  if (!within(message, LIMITS.message)) return fail(422, 'Message must be 30–2000 characters.')
  if (b.consent !== true) return fail(422, 'Authorisation was not confirmed.')

  const rule = '-'.repeat(40)
  const text = [
    `Name:          ${name}`,
    `Email:         ${email}`,
    ...(company ? [`Organisation:  ${company}`] : []),
    `Engagement:    ${engagement.join(', ') || '—'}`,
    `Timeline:      ${timeline || '—'}`,
    'Authorisation: confirmed by sender',
    '',
    rule,
    message,
    rule,
    ref ? `ref ${ref}` : '',
  ].join('\n')

  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAULT_FROM,
        to: [env.CONTACT_TO || DEFAULT_TO],
        reply_to: email,
        subject: `Engagement enquiry: ${engagement.join(' + ') || 'general'} — ${name}`,
        text,
      }),
    })
  } catch {
    return fail(502, 'Mail relay unreachable.')
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!res.ok) {
    // log the provider's reason server-side, keep the client message generic
    console.error('[contact] Resend rejected the brief:', res.status, data.message)
    return fail(502, 'Mail relay rejected the message.')
  }
  return { status: 200, body: { ok: true, id: data.id } }
}
