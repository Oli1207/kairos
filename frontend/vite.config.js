import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png', 'push-sw.js'],
      manifest: {
        name: 'Kairos — tenir ma saison',
        short_name: 'Kairos',
        description: 'Mes rendez-vous avec Dieu, mon corps, mes etudes et mon service.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#e8ebe6',
        theme_color: '#17120e',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'SOS envie', url: '/corps?onglet=sucre&sos=1', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Noter une idee', url: '/etudes?onglet=contenu&idee=1', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        // Reception des notifications push (fichier autonome dans public/).
        importScripts: ['/push-sw.js'],
        runtimeCaching: [],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\/]node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/.test(id)) return 'react-vendor';
          if (/[\/]node_modules[\/]@supabase[\/]/.test(id)) return 'supabase';
          if (/[\/]node_modules[\/]lucide-react[\/]/.test(id)) return 'icons';
          return 'vendor';
        },
      },
    },
  },
});
