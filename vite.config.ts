import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Served from the custom domain root (public/CNAME), not /lazy-yoga/.
  base: '/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Lazy Yoga',
        short_name: 'Lazy Yoga',
        lang: 'ru',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: 'app-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pose icons are globbed: the set is replaced independently of this config.
        globPatterns: ['**/*.{js,css,html}', 'icons/*.svg', 'audio/manifest.json'],
      },
    }),
  ],
})
