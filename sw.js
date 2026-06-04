// Simple service worker for PWA support
const CACHE_NAME = 'axta-tools-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './beam-editor/',
  './Sat-Tracker/',
  './html-controls/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});