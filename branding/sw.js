// Minimal service worker: existence makes the PWA installable on Android Chrome
// (enables the beforeinstallprompt event). No offline caching — the game streams assets.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
