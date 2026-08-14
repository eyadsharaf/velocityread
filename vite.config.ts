import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/velocityread/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'VelocityRead',
        short_name: 'VelocityRead',
        description: 'RSVP speed reader — EPUB / PDF / TXT / MD',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
      import { defineConfig } fromjsimport react frng,woff2,woff}'],
   import tailwindcss fToCacheInBytes: 6 * 1import { VitePWA } frovigateFallback: 'index
export default defineConfig({
  base: '
    base: '/veloc',
  },
})
