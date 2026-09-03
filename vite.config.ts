import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['pwa/apple-touch-icon.png'],
            devOptions: {
                enabled: true,
                type: 'module',
            },
            manifest: {
                name: 'Sobreka',
                short_name: 'Sobreka',
                description: 'Sobrecarga progressiva, registrada de verdade.',
                theme_color: '#1B1E22',
                background_color: '#1B1E22',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                lang: 'pt-BR',
                icons: [
                    {src: 'pwa/pwa-64x64.png', sizes: '64x64', type: 'image/png'},
                    {src: 'pwa/pwa-192x192.png', sizes: '192x192', type: 'image/png'},
                    {src: 'pwa/pwa-512x512.png', sizes: '512x512', type: 'image/png'},
                    {src: 'pwa/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
                ],
            },
            workbox: {
                navigateFallback: '/index.html',
                globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {cacheName: 'google-fonts-stylesheets'},
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-webfonts',
                            expiration: {maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365},
                            cacheableResponse: {statuses: [0, 200]},
                        },
                    },
                ],
            },
        }),
    ],
});
