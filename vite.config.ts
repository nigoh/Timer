import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      // 開発サーバー用 CSP
      // Vite HMR は WebSocket + inline script を使うため script-src に
      // 'unsafe-inline' / 'unsafe-eval' が必要。本番は index.html の
      // <meta http-equiv> により上書きされる。
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        // Vite HMR WebSocket + GitHub API + AI API
        [
          "connect-src 'self'",
          'ws://localhost:*',
          'http://localhost:*',
          'https://api.github.com',
          'https://api.anthropic.com',
          'https://api.openai.com',
        ].join(' '),
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
