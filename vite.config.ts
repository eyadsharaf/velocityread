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
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
      ],
      manifest: {
        name: 'VelocityRead',
        short_name: 'VelocityRead',
        description: 'RSVP speed reader',
        start_url: '/velocityread/',
        scope: '/velocityread/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
          { src: '/velocityread/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/velocityread/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/velocityread/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,png,svg,woff2,woff}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/velocityread/index.html',
      },
    }),
  ],
})
