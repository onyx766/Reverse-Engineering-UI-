/**
 * Vercel serverless function: POST /api/contact
 * Set RESEND_API_KEY (and optionally CONTACT_TO / CONTACT_FROM) in the Vercel
 * project's Environment Variables. See server/sendBrief.ts.
 */
import { relayBrief } from '../server/sendBrief'

interface Req {
  method?: string
  body?: unknown
}
interface Res {
  status(code: number): Res
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, error: 'Method not allowed.' })
    return
  }
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }
  const result = await relayBrief(body, process.env)
  res.status(result.status).json(result.body)
}
