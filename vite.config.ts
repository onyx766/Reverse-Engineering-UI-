import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { relayBrief, type RelayEnv } from './server/sendBrief'

/**
 * Serves POST /api/contact during `npm run dev` / `npm run preview`, mirroring
 * the Vercel function in api/contact.ts. Reads RESEND_API_KEY from .env.local.
 */
function contactRelay(env: RelayEnv): Plugin {
  // block body on purpose: a function returned from configureServer runs as a post-hook
  const mount = (server: { middlewares: { use: (p: string, h: (req: any, res: any) => void) => unknown } }): void => {
    server.middlewares.use('/api/contact', (req, res) => {
      const reply = (status: number, body: unknown) => {
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      }
      if (req.method !== 'POST') return reply(405, { ok: false, error: 'Method not allowed.' })
      let raw = ''
      req.on('data', (c: Buffer) => {
        raw += c
        if (raw.length > 64_000) req.destroy()
      })
      req.on('end', async () => {
        let body: unknown = null
        try {
          body = JSON.parse(raw)
        } catch {
          /* relayBrief answers 400 */
        }
        const r = await relayBrief(body, env)
        reply(r.status, r.body)
      })
    })
  }
  return { name: 'contact-relay', configureServer: mount, configurePreviewServer: mount }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), contactRelay(loadEnv(mode, process.cwd(), ''))],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // `host: true` binds IPv4 + IPv6 — on Windows a default bind can end up
  // IPv6-only, which makes http://localhost:5173 refuse the connection.
  server: { host: true, port: 5173, strictPort: true, open: false },
  build: {
    target: 'es2020',
    // the three chunk (~815 KB, ~219 KB gzip) is inherently large and only ever
    // loaded lazily behind the first paint; warn about anything bigger than it
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // only HoloCore (lazy) uses these; drei was replaced by small local pieces
          three: ['three', '@react-three/fiber'],
          motion: ['framer-motion'],
        },
      },
    },
  },
}))
