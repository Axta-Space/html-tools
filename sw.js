// Service worker for PWA support.
// Strategy: network-first for navigations/HTML so tool updates land immediately,
// with a cache fallback for offline use. Other requests are cache-first.
const CACHE_NAME = 'axta-tools-v2';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './beam-editor/',
  './Sat-Tracker/',
  './html-controls/'
];

// Pre-cache the shell, tolerating individual failures (one bad URL must not
// abort the whole install). Activate immediately.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

// Purge caches from previous versions, then take control of open pages.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // Network-first: prefer fresh HTML, fall back to cache when offline.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // Cache-first for everything else (icons, manifest, etc.).
  event.respondWith(caches.match(req).then(res => res || fetch(req)));
});
