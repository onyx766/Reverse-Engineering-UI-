import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
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
})
